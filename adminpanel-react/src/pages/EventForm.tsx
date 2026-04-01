import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  FileText,
  Clock,
  HelpCircle,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import {
  fetchEvent,
  createEvent,
  updateEvent,
  fetchSections,
  fetchKeyMoments,
  fetchQuizQuestions,
  uploadMedia,
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

const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPuzzleImage, setUploadingPuzzleImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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
    video_url: "",
    puzzle_image_url: "",
    gallery_images: [],
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

  const galleryImages = form.gallery_images ?? [];

  const uploadAndSetField = async (
    file: File,
    field: "image_url" | "video_url" | "puzzle_image_url",
    setUploading: (value: boolean) => void,
    label: string
  ) => {
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const uploaded = await uploadMedia(file);
      setField(field, uploaded.url as TimelineEvent[typeof field]);
      setSuccess(`${label} uploaded successfully.`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred while uploading."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadAndSetField(file, "image_url", setUploadingImage, "Image");
    event.target.value = "";
  };

  const handleVideoUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadAndSetField(file, "video_url", setUploadingVideo, "Video");
    event.target.value = "";
  };

  const handlePuzzleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadAndSetField(
      file,
      "puzzle_image_url",
      setUploadingPuzzleImage,
      "Puzzle image"
    );
    event.target.value = "";
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    setError("");
    setSuccess("");

    try {
      const uploaded = await Promise.all(files.map((file) => uploadMedia(file)));
      setField("gallery_images", [
        ...galleryImages,
        ...uploaded.map((item) => item.url),
      ]);
      setSuccess(
        `${uploaded.length} gallery image${uploaded.length > 1 ? "s" : ""} uploaded successfully.`
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred while uploading."
      );
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  };

  const updateGalleryImage = (index: number, value: string) => {
    const next = [...galleryImages];
    next[index] = value;
    setField("gallery_images", next);
  };

  const removeGalleryImage = (index: number) => {
    setField(
      "gallery_images",
      galleryImages.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const addGalleryImageField = () => {
    setField("gallery_images", [...galleryImages, ""]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.year || !form.title) {
      setError("Year and title are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        gallery_images: galleryImages.filter((image) => image.trim().length > 0),
      };

      if (isEdit) {
        await updateEvent({ ...payload, id: Number(id) } as TimelineEvent & {
          id: number;
        });
        setSuccess("Event updated successfully!");
      } else {
        const result = await createEvent(payload);
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

                <div className="grid grid-cols-2 gap-4 mb-4">
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

              <div className="grid grid-cols-2 gap-4 mb-4">
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

              <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        Main Image Upload
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload a local image and use the returned URL automatically.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium cursor-pointer hover:border-cyan-300">
                      <Upload size={14} />
                      {uploadingImage ? "Uploading..." : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="Event preview"
                      className="h-40 w-full rounded-lg object-cover border border-slate-200 bg-slate-100"
                    />
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        Video Upload
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload an MP4 or WebM file and use the returned URL automatically.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium cursor-pointer hover:border-cyan-300">
                      <Upload size={14} />
                      {uploadingVideo ? "Uploading..." : "Upload video"}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {form.video_url && (
                    <video
                      src={form.video_url}
                      controls
                      className="h-40 w-full rounded-lg border border-slate-200 bg-black"
                    />
                  )}
                </div>
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

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Video URL
                </label>
                <input
                  type="text"
                  value={form.video_url ?? ""}
                  onChange={(e) => setField("video_url", e.target.value)}
                  placeholder="/uploads/videos/... or https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              {form.game_type === "puzzle" && (
                <>
                  <div className="mb-4 rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Puzzle Image Upload
                        </label>
                        <p className="text-xs text-slate-500 mt-1">
                          Upload the image used by the puzzle minigame.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium cursor-pointer hover:border-cyan-300">
                        <Upload size={14} />
                        {uploadingPuzzleImage ? "Uploading..." : "Upload puzzle image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePuzzleImageUpload}
                          disabled={uploadingPuzzleImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {form.puzzle_image_url && (
                      <img
                        src={form.puzzle_image_url}
                        alt="Puzzle preview"
                        className="h-40 w-full rounded-lg object-cover border border-slate-200 bg-slate-100"
                      />
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Puzzle Image URL
                    </label>
                    <input
                      type="text"
                      value={form.puzzle_image_url ?? ""}
                      onChange={(e) => setField("puzzle_image_url", e.target.value)}
                      placeholder="/uploads/images/... or https://..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Gallery Images
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload images or add direct links for the event gallery.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium cursor-pointer hover:border-cyan-300">
                      <Upload size={14} />
                      {uploadingGallery ? "Uploading..." : "Upload images"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={addGalleryImageField}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 text-sm font-medium hover:bg-cyan-100"
                    >
                      <Plus size={14} /> Add URL
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {galleryImages.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      No gallery images added yet.
                    </div>
                  )}

                  {galleryImages.map((image, index) => (
                    <div
                      key={`${index}-${image}`}
                      className="rounded-lg border border-slate-200 p-3 bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="text"
                          value={image}
                          onChange={(e) => updateGalleryImage(index, e.target.value)}
                          placeholder="/uploads/images/... or https://..."
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {image && (
                        <img
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="mt-3 h-32 w-full rounded-lg object-cover border border-slate-200 bg-slate-100"
                        />
                      )}
                    </div>
                  ))}
                </div>
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
