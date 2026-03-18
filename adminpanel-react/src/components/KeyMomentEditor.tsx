import type { KeyMoment } from "../types";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Props {
  moments: KeyMoment[];
  onChange: (moments: KeyMoment[]) => void;
}

export default function KeyMomentEditor({ moments, onChange }: Props) {
  const add = () => {
    onChange([
      ...moments,
      { year: new Date().getFullYear(), title: "", short_description: "", display_order: moments.length },
    ]);
  };

  const remove = (i: number) => {
    onChange(moments.filter((_, idx) => idx !== i));
  };

  const update = (i: number, field: keyof KeyMoment, value: string | number) => {
    const copy = [...moments];
    (copy[i] as Record<string, unknown>)[field] = value;
    onChange(copy);
  };

  return (
    <div>
      {moments.map((m, i) => (
        <div
          key={i}
          className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <GripVertical size={14} />
              <span className="text-xs font-medium uppercase">
                Moment {i + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="number"
              placeholder="Year"
              value={m.year || ""}
              onChange={(e) => update(i, "year", parseInt(e.target.value) || 0)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Title"
              value={m.title}
              onChange={(e) => update(i, "title", e.target.value)}
              className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>
          <input
            type="text"
            placeholder="Short description (optional)"
            value={m.short_description}
            onChange={(e) => update(i, "short_description", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
      >
        <Plus size={14} /> Add Moment
      </button>
    </div>
  );
}
