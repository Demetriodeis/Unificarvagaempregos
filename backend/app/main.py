import asyncio
import time
from typing import List, Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from cachetools import TTLCache

from .models import Job, SearchResponse, SourceInfo
from .scrapers.gupy import GupyScraper
from .scrapers.remotive import RemotiveScraper
from .scrapers.vagas import VagasScraper
from .scrapers.indeed import IndeedScraper
from .scrapers.trampos import TramposScraper

app = FastAPI(
    title="Unificar Vagas de Empregos",
    description="API que agrega vagas de emprego de múltiplas plataformas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRAPERS = {
    "gupy": GupyScraper(),
    "remotive": RemotiveScraper(),
    "vagas": VagasScraper(),
    "indeed": IndeedScraper(),
    "trampos": TramposScraper(),
}

# Cache results for 10 minutes to avoid hammering external sites
_cache: TTLCache = TTLCache(maxsize=256, ttl=600)


def _cache_key(keyword: str, location: str, sources: str) -> str:
    return f"{keyword.lower()}|{location.lower()}|{sources}"


@app.get("/api/jobs", response_model=SearchResponse)
async def search_jobs(
    keyword: str = Query(..., min_length=1, description="Termo de busca"),
    location: str = Query("", description="Cidade ou estado"),
    sources: Optional[str] = Query(None, description="Fontes separadas por vírgula"),
    job_type: Optional[str] = Query(None, description="Tipo: Remoto, Híbrido, Presencial"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
):
    sources_str = sources or "all"
    cache_key = _cache_key(keyword, location, sources_str)

    if cache_key in _cache:
        cached = _cache[cache_key]
        all_jobs: List[Job] = cached["jobs"]
        errors: List[str] = cached["errors"]
        active_names: List[str] = cached["active_names"]
    else:
        if sources:
            source_ids = [s.strip().lower() for s in sources.split(",")]
            active = {k: v for k, v in SCRAPERS.items() if k in source_ids}
        else:
            active = SCRAPERS

        tasks = [scraper.search(keyword, location) for scraper in active.values()]
        active_names = list(active.keys())
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_jobs = []
        errors = []
        for name, result in zip(active_names, results):
            if isinstance(result, Exception):
                errors.append(name)
            else:
                all_jobs.extend(result)

        _cache[cache_key] = {"jobs": all_jobs, "errors": errors, "active_names": active_names}

    # Filter by job type
    filtered = all_jobs
    if job_type:
        filtered = [j for j in filtered if j.job_type and job_type.lower() in j.job_type.lower()]

    # Deduplicate by title + company
    seen: set = set()
    unique: List[Job] = []
    for job in filtered:
        key = f"{job.title.lower().strip()}|{job.company.lower().strip()}"
        if key not in seen:
            seen.add(key)
            unique.append(job)

    total = len(unique)
    start = (page - 1) * limit
    paginated = unique[start : start + limit]

    return SearchResponse(
        jobs=paginated,
        total=total,
        sources_searched=active_names,
        sources_with_errors=errors,
    )


@app.get("/api/sources", response_model=List[SourceInfo])
async def get_sources():
    return [
        SourceInfo(id=sid, name=scraper.name, color=scraper.color)
        for sid, scraper in SCRAPERS.items()
    ]


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}
