import { MapPin, Building2, ExternalLink, Wifi, Clock } from "lucide-react";
import { Job } from "../types/job";

interface Props {
  job: Job;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function JobCard({ job }: Props) {
  const dateLabel = formatDate(job.posted_date ?? "");

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-base leading-snug"
          >
            {job.title}
          </a>
          <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-sm">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>

        <span
          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: job.source_color }}
        >
          {job.source}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {job.location}
        </span>

        {job.remote && (
          <span className="flex items-center gap-1 text-violet-600 font-medium">
            <Wifi className="w-3.5 h-3.5" />
            Remoto
          </span>
        )}

        {job.job_type && !job.remote && (
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
            {job.job_type}
          </span>
        )}

        {dateLabel && (
          <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
            <Clock className="w-3 h-3" />
            {dateLabel}
          </span>
        )}
      </div>

      {job.description && (
        <p className="mt-2.5 text-sm text-slate-500 line-clamp-2">{job.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        {job.salary && (
          <span className="text-sm font-semibold text-emerald-600">{job.salary}</span>
        )}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Ver vaga
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  );
}
