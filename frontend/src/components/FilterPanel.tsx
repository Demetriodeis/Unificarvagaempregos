import { Source } from "../types/job";
import { SlidersHorizontal } from "lucide-react";

const JOB_TYPES = ["Remoto", "Híbrido", "Presencial"];

interface Props {
  sources: Source[];
  selectedSources: string[];
  onSourcesChange: (v: string[]) => void;
  jobType: string;
  onJobTypeChange: (v: string) => void;
}

export default function FilterPanel({
  sources,
  selectedSources,
  onSourcesChange,
  jobType,
  onJobTypeChange,
}: Props) {
  function toggleSource(id: string) {
    if (selectedSources.includes(id)) {
      onSourcesChange(selectedSources.filter((s) => s !== id));
    } else {
      onSourcesChange([...selectedSources, id]);
    }
  }

  return (
    <aside className="lg:w-60 shrink-0">
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 sticky top-4">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-700 text-sm">Filtros</span>
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Plataformas
          </p>
          <div className="space-y-2">
            {sources.map((s) => (
              <label key={s.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(s.id)}
                  onChange={() => toggleSource(s.id)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Tipo de Vaga
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="jobType"
                value=""
                checked={jobType === ""}
                onChange={() => onJobTypeChange("")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                Todos
              </span>
            </label>
            {JOB_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="jobType"
                  value={t}
                  checked={jobType === t}
                  onChange={() => onJobTypeChange(t)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {t}
                </span>
              </label>
            ))}
          </div>
        </div>

        {(selectedSources.length > 0 || jobType) && (
          <button
            onClick={() => {
              onSourcesChange([]);
              onJobTypeChange("");
            }}
            className="mt-5 w-full text-xs text-slate-500 hover:text-red-500 underline transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </aside>
  );
}
