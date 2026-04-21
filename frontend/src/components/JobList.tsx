import { AlertCircle, Loader2, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { Job } from "../types/job";
import JobCard from "./JobCard";

interface Props {
  jobs: Job[];
  total: number;
  loading: boolean;
  error: string | null;
  sourcesWithErrors: string[];
  page: number;
  onPageChange: (p: number) => void;
}

const LIMIT = 20;

export default function JobList({
  jobs,
  total,
  loading,
  error,
  sourcesWithErrors,
  page,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(total / LIMIT);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm">Buscando vagas em todas as plataformas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600 font-medium">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <SearchX className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500 font-medium">Nenhuma vaga encontrada</p>
        <p className="text-slate-400 text-sm">Tente outros termos ou remova os filtros</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{total}</span> vagas encontradas
        </p>
        {sourcesWithErrors.length > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Erro em: {sourcesWithErrors.join(", ")}
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p < 1 || p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
