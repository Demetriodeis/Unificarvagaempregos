export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  source_color: string;
  url: string;
  description?: string;
  job_type?: string;
  salary?: string;
  posted_date?: string;
  remote: boolean;
}

export interface SearchResponse {
  jobs: Job[];
  total: number;
  sources_searched: string[];
  sources_with_errors: string[];
}

export interface Source {
  id: string;
  name: string;
  color: string;
}

export interface SearchFilters {
  keyword: string;
  location: string;
  sources: string[];
  jobType: string;
  page: number;
}
