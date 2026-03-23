import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, FileText, Clock, HelpCircle } from "lucide-react";
import {
  fetchEvent,
  createEvent,
  updateEvent,
  fetchSections,
  fetchKeyMoments,
  fetchQuizQuestions,
} from "../api";
import type {
  TimelineEvent,
  EventSection,
  KeyMoment,
  QuizQuestion,
} from "../types";
import SectionEditor from "../components/SectionEditor";
import KeyMomentEditor from "../components/KeyMomentEditor";
import QuizEditor from "../components/QuizEditor";

type Tab = "basic" | "sections" | "moments" | "quiz";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "basic", label: "Basic Info", icon: <FileText size={14} /> },
  { key: "sections", label: "Sections", icon: <FileText size={14} /> },
  { key: "moments", label: "Key Moments", icon: <Clock size={14} /> },
  { key: "quiz", label: "Quiz", icon: <HelpCircle size={14} /> },
];

const GAME_TYPES = [
  { value: "none", label: "None", emoji: "—" },
  { value: "puzzle", label: "Puzzle", emoji: "🧩" },
  { value: "memory", label: "Memory", emoji: "🃏" },
  { value: "quiz", label: "Quiz", emoji: "❓" },
  { value: "harvest", label: "Harvest", emoji: "🌾" },
];

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id !== undefined;

  const [tab, setTab] = useState<Tab>("basic");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState<Partial<TimelineEvent>>({
    year: "",
    title: "",
    subtitle: "",
    scrubber_label: "",
    infobox_title: "",
    infobox_subtitle: "",
    icon_name: "none",
    description: "",
    historical_context: "",
    category: "museum",
    is_active: true,
    game_type: "none",
    has_key_moments: false,
    image_url: "",
    sort_order: 0,
  });

  const [sections, setSections] = useState<EventSection[]>([]);
  const [moments, setMoments] = useState<KeyMoment[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Load data
  useEffect(() => {
    if (!isEdit) return;
    const eventId = Number(id);

    fetchEvent(eventId).then((ev) => setForm(ev));
    fetchSections(eventId).then(setSections);
    fetchKeyMoments(eventId).then(setMoments);
    fetchQuizQuestions(eventId).then(setQuestions);
  }, [id, isEdit]);

  const setField = <K extends keyof TimelineEvent>(
    key: K,
    value: TimelineEvent[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.year || !form.title) {
      setError("Year and title are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (isEdit) {
        await updateEvent({ ...form, id: Number(id) } as TimelineEvent & {
          id: number;
        });
        setSuccess("Event updated successfully!");
      } else {
        const result = await createEvent(form);
        setSuccess("Event created!");
        // Navigate to edit mode
        navigate(`/event/${result.id}`, { replace: true });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred while saving."
      );
    }

    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back + Title */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold">
          {isEdit ? "Edit Event" : "New Event"}
        </h1>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
        {TABS.map((t) => {
          // Hide quiz tab if game type isn't quiz
          if (t.key === "quiz" && form.game_type !== "quiz") return null;
          // Hide moments tab if has_key_moments is off
          if (t.key === "moments" && !form.has_key_moments) return null;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── TAB: Basic Info ─────────────────────── */}
        {tab === "basic" && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Event Details
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.year ?? ""}
                    onChange={(e) => setField("year", e.target.value)}
                    placeholder="1925 or 1930-1956"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category ?? "museum"}
                    onChange={(e) =>
                      setField("category", e.target.value as TimelineEvent["category"])
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="museum">Museum</option>
                    <option value="landbouw">Agriculture</option>
                    <option value="maatschappelijk">Society</option>
                  </select>
                </div>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title ?? ""}
                      onChange={(e) => setField("title", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Subtitle (Italic part)
                    </label>
                    <input
                      type="text"
                      value={form.subtitle ?? ""}
                      onChange={(e) => setField("subtitle", e.target.value)}
                      placeholder="e.g. The Core Transformation"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Scrubber Label
                    </label>
                    <input
                      type="text"
                      value={form.scrubber_label ?? ""}
                      onChange={(e) => setField("scrubber_label", e.target.value)}
                      placeholder="e.g. MECHANIZED"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Scrubber Icon
                    </label>
                    <select
                      value={form.icon_name ?? "none"}
                      onChange={(e) => setField("icon_name", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    >
                      <option value="none">None</option>
                      <option value="gear">Gear (Zębatka)</option>
                      <option value="tractor">Tractor (Traktor)</option>
                      <option value="factory">Factory (Fabryka)</option>
                      <option value="sun">Sun (Słońce)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Infobox Title
                    </label>
                    <input
                      type="text"
                      value={form.infobox_title ?? ""}
                      onChange={(e) => setField("infobox_title", e.target.value)}
                      placeholder="e.g. Engine Spec 1925"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Infobox Subtitle
                    </label>
                    <input
                      type="text"
                      value={form.infobox_subtitle ?? ""}
                      onChange={(e) => setField("infobox_subtitle", e.target.value)}
                      placeholder="e.g. 20 HP • KEROSENE FUEL"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Historical Context
                </label>
                <textarea
                  value={form.historical_context ?? ""}
                  onChange={(e) =>
                    setField("historical_context", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Image URL
                </label>
                <input
                  type="text"
                  value={form.image_url ?? ""}
                  onChange={(e) => setField("image_url", e.target.value)}
                  placeholder="https://…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order ?? 0}
                    onChange={(e) =>
                      setField("sort_order", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-200 w-full">
                    <input
                      type="checkbox"
                      checked={form.is_active ?? true}
                      onChange={(e) => setField("is_active", e.target.checked)}
                      className="w-4 h-4 accent-cyan-600"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Game Type */}
            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Game Type
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {GAME_TYPES.map((g) => (
                  <label
                    key={g.value}
                    className={`relative cursor-pointer text-center p-4 rounded-lg border-2 transition-all ${
                      form.game_type === g.value
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="game_type"
                      value={g.value}
                      checked={form.game_type === g.value}
                      onChange={(e) =>
                        setField(
                          "game_type",
                          e.target.value as TimelineEvent["game_type"]
                        )
                      }
                      className="sr-only"
                    />
                    <div className="text-xl mb-1">{g.emoji}</div>
                    <div className="text-xs font-semibold">{g.label}</div>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none mt-4 px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={form.has_key_moments ?? false}
                  onChange={(e) =>
                    setField("has_key_moments", e.target.checked)
                  }
                  className="w-4 h-4 accent-cyan-600"
                />
                <span className="text-sm font-medium">
                  Enable Key Moments tab
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ── TAB: Sections ──────────────────────── */}
        {tab === "sections" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Content Sections
            </h2>
            <SectionEditor sections={sections} onChange={setSections} />
          </div>
        )}

        {/* ── TAB: Key Moments ───────────────────── */}
        {tab === "moments" && form.has_key_moments && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Key Moments
            </h2>
            <KeyMomentEditor moments={moments} onChange={setMoments} />
          </div>
        )}

        {/* ── TAB: Quiz ──────────────────────────── */}
        {tab === "quiz" && form.game_type === "quiz" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Quiz Questions
            </h2>
            <QuizEditor questions={questions} onChange={setQuestions} />
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end mt-6 pb-12">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-700 text-white font-medium hover:bg-cyan-800 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? "Saving…" : isEdit ? "Update Event" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
