import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Landmark,
  Wheat,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Gamepad2,
} from "lucide-react";
import { fetchAllEvents, deleteEvent } from "../api";
import type { TimelineEvent, CategoryFilter } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  museum: "Museum",
  landbouw: "Agriculture",
  maatschappelijk: "Society",
};

const CATEGORY_COLORS: Record<string, string> = {
  museum: "bg-amber-100 text-amber-800",
  landbouw: "bg-emerald-100 text-emerald-800",
  maatschappelijk: "bg-sky-100 text-sky-800",
};

export default function EventList() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllEvents();
      setEvents(data);
    } catch {
      /* empty */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered =
    filter === "all" ? events : events.filter((e) => e.category === filter);

  const stats = {
    total: events.length,
    active: events.filter((e) => e.is_active).length,
    museum: events.filter((e) => e.category === "museum").length,
    landbouw: events.filter((e) => e.category === "landbouw").length,
    maatschappelijk: events.filter((e) => e.category === "maatschappelijk")
      .length,
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    await deleteEvent(deleteId);
    setDeleteId(null);
    load();
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          value={stats.total}
          label="Total Events"
          color="border-blue-500"
          icon={<BarChart3 size={18} className="text-blue-500" />}
        />
        <StatCard
          value={stats.active}
          label="Active"
          color="border-emerald-500"
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
        />
        <StatCard
          value={stats.museum}
          label="Museum"
          color="border-amber-500"
          icon={<Landmark size={18} className="text-amber-500" />}
        />
        <StatCard
          value={stats.landbouw}
          label="Agriculture"
          color="border-emerald-500"
          icon={<Wheat size={18} className="text-emerald-500" />}
        />
        <StatCard
          value={stats.maatschappelijk}
          label="Society"
          color="border-sky-500"
          icon={<Users size={18} className="text-sky-500" />}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "museum", "landbouw", "maatschappelijk"] as const).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === cat
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "all"
                ? "All"
                : CATEGORY_LABELS[cat] ?? cat}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">
            Events ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="mb-4">No events found</p>
            <Link
              to="/event/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-700 text-white text-sm font-medium hover:bg-cyan-800 transition-colors"
            >
              + Add first event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {ev.year}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{ev.title}</div>
                      {ev.description && (
                        <div className="text-sm text-slate-400 truncate max-w-xs mt-0.5">
                          {ev.description.slice(0, 80)}
                          {ev.description.length > 80 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[ev.category] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {CATEGORY_LABELS[ev.category] ?? ev.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ev.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ev.game_type !== "none" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Gamepad2 size={12} />{" "}
                          {ev.game_type.charAt(0).toUpperCase() +
                            ev.game_type.slice(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/event/${ev.id}`}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 inline-flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(ev.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 inline-flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-lg font-semibold mb-2">Delete Event?</h3>
            <p className="text-slate-500 text-sm mb-6">
              This will soft-delete the event. It can be restored later.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-5 border border-slate-200 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
