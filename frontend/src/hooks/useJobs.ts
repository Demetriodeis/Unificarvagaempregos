import { useState, useEffect, useRef } from "react";
import { Job, Source, SearchFilters } from "../types/job";

const API_BASE = "/api";

interface UseJobsResult {
  jobs: Job[];
  total: number;
  loading: boolean;
  error: string | null;
  sourcesWithErrors: string[];
  sources: Source[];
}

export function useJobs(filters: SearchFilters & { enabled: boolean }): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourcesWithErrors, setSourcesWithErrors] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Load available sources once on mount
  useEffect(() => {
    fetch(`${API_BASE}/sources`)
      .then((r) => r.json())
      .then(setSources)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.enabled || !filters.keyword.trim()) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const params = new URLSearchParams({
      keyword: filters.keyword,
      location: filters.location,
      page: String(filters.page),
      limit: "20",
    });
    if (filters.sources.length > 0) {
      params.set("sources", filters.sources.join(","));
    }
    if (filters.jobType) {
      params.set("job_type", filters.jobType);
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/jobs?${params}`, { signal: abortRef.current.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Erro ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((data) => {
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
        setSourcesWithErrors(data.sources_with_errors ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("Erro ao buscar vagas. Verifique se o servidor está rodando.");
        setLoading(false);
      });
  }, [filters.keyword, filters.location, filters.sources, filters.jobType, filters.page, filters.enabled]);

  return { jobs, total, loading, error, sourcesWithErrors, sources };
}
