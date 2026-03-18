import type { EventSection } from "../types";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Props {
  sections: EventSection[];
  onChange: (sections: EventSection[]) => void;
}

export default function SectionEditor({ sections, onChange }: Props) {
  const add = () => {
    onChange([
      ...sections,
      { section_title: "", section_content: "", section_order: sections.length },
    ]);
  };

  const remove = (i: number) => {
    onChange(sections.filter((_, idx) => idx !== i));
  };

  const update = (i: number, field: keyof EventSection, value: string | number) => {
    const copy = [...sections];
    (copy[i] as Record<string, unknown>)[field] = value;
    onChange(copy);
  };

  return (
    <div>
      {sections.map((s, i) => (
        <div
          key={i}
          className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <GripVertical size={14} />
              <span className="text-xs font-medium uppercase">
                Section {i + 1}
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
          <input
            type="text"
            placeholder="Section title"
            value={s.section_title}
            onChange={(e) => update(i, "section_title", e.target.value)}
            className="w-full mb-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
          <textarea
            placeholder="Section content…"
            value={s.section_content}
            onChange={(e) => update(i, "section_content", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
      >
        <Plus size={14} /> Add Section
      </button>
    </div>
  );
}
