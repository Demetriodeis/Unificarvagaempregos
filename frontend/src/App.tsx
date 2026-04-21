import { useState, useCallback } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import FilterPanel from "./components/FilterPanel";
import JobList from "./components/JobList";
import { useJobs } from "./hooks/useJobs";
import { Briefcase, Zap, Filter } from "lucide-react";

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [jobType, setJobType] = useState("");
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const { jobs, total, loading, error, sourcesWithErrors, sources } = useJobs({
    keyword,
    location,
    sources: selectedSources,
    jobType,
    page,
    enabled: hasSearched,
  });

  const handleSearch = useCallback((kw: string, loc: string) => {
    setKeyword(kw);
    setLocation(loc);
    setPage(1);
    setHasSearched(true);
  }, []);

  function handleSourcesChange(v: string[]) {
    setSelectedSources(v);
    setPage(1);
  }

  function handleJobTypeChange(v: string) {
    setJobType(v);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {!hasSearched && (
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Encontre sua próxima vaga
            </h2>
            <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto">
              Buscamos vagas em tempo real nas principais plataformas de emprego do Brasil
            </p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">Múltiplas fontes</h3>
                <p className="text-sm text-slate-500">Gupy, Indeed, Vagas.com.br, Remotive e mais</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">Busca simultânea</h3>
                <p className="text-sm text-slate-500">Todas as plataformas pesquisadas ao mesmo tempo</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Filter className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">Filtros inteligentes</h3>
                <p className="text-sm text-slate-500">Filtre por fonte, tipo (remoto, híbrido, presencial)</p>
              </div>
            </div>

            {sources.length > 0 && (
              <div className="mt-10 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-slate-400 mr-1">Fontes disponíveis:</span>
                {sources.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {hasSearched && (
          <div className="mt-6 flex flex-col lg:flex-row gap-6">
            <FilterPanel
              sources={sources}
              selectedSources={selectedSources}
              onSourcesChange={handleSourcesChange}
              jobType={jobType}
              onJobTypeChange={handleJobTypeChange}
            />
            <div className="flex-1 min-w-0">
              <JobList
                jobs={jobs}
                total={total}
                loading={loading}
                error={error}
                sourcesWithErrors={sourcesWithErrors}
                page={page}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-200 py-6 text-center text-sm text-slate-400">
        Unificar Vagas &mdash; Agregador de empregos para o mercado brasileiro
      </footer>
    </div>
  );
}
