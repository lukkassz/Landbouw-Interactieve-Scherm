import type { QuizQuestion } from "../types";
import { Plus, Trash2, GripVertical, CheckCircle2 } from "lucide-react";

interface Props {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

const EMPTY_QUESTION: QuizQuestion = {
  question: "",
  image_url: "",
  correct_answer: "",
  option_1: "",
  option_2: "",
  option_3: "",
  option_4: "",
  difficulty: "easy",
};

export default function QuizEditor({ questions, onChange }: Props) {
  const add = () => onChange([...questions, { ...EMPTY_QUESTION }]);

  const remove = (i: number) =>
    onChange(questions.filter((_, idx) => idx !== i));

  const update = (i: number, field: keyof QuizQuestion, value: string) => {
    const copy = [...questions];
    (copy[i] as Record<string, unknown>)[field] = value;
    onChange(copy);
  };

  const setCorrect = (qIdx: number, optionNum: number) => {
    const q = questions[qIdx];
    const optionValue =
      [q.option_1, q.option_2, q.option_3, q.option_4][optionNum - 1] ?? "";
    update(qIdx, "correct_answer", optionValue);
  };

  return (
    <div>
      {questions.map((q, i) => (
        <div
          key={i}
          className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <GripVertical size={14} />
              <span className="text-xs font-medium uppercase">
                Question {i + 1}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={q.difficulty}
                onChange={(e) => update(i, "difficulty", e.target.value)}
                className="text-xs px-2 py-1 border border-slate-200 rounded-md focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="hard">Hard</option>
              </select>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Question"
            value={q.question}
            onChange={(e) => update(i, "question", e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />

          <div className="grid grid-cols-2 gap-2">
            {([1, 2, 3, 4] as const).map((n) => {
              const key = `option_${n}` as keyof QuizQuestion;
              const val = (q[key] as string) || "";
              const isCorrect = q.correct_answer === val && val !== "";
              return (
                <div key={n} className="relative">
                  <input
                    type="text"
                    placeholder={`Option ${n}${n === 4 ? " (optional)" : ""}`}
                    value={val}
                    onChange={(e) => update(i, key, e.target.value)}
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setCorrect(i, n)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${
                      isCorrect
                        ? "text-emerald-500"
                        : "text-slate-300 hover:text-emerald-400"
                    }`}
                    title="Mark as correct answer"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
      >
        <Plus size={14} /> Add Question
      </button>
    </div>
  );
}
