import httpx
from typing import List

from ..models import Job
from .base import BaseScraper


class RemotiveScraper(BaseScraper):
    name = "Remotive"
    color = "#6C5CE7"

    async def search(self, keyword: str, location: str = "") -> List[Job]:
        params = {"search": keyword, "limit": 20}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://remotive.com/api/remote-jobs",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        jobs: List[Job] = []
        for item in data.get("jobs", []):
            candidate_location = item.get("candidate_required_location") or "Remoto / Global"

            jobs.append(
                Job(
                    id=f"remotive-{item.get('id', '')}",
                    title=item.get("title") or "Sem título",
                    company=item.get("company_name") or "Empresa não informada",
                    location=candidate_location,
                    source=self.name,
                    source_color=self.color,
                    url=item.get("url") or "",
                    job_type="Remoto",
                    remote=True,
                    posted_date=item.get("publication_date") or "",
                    description=item.get("category") or "",
                )
            )
        return jobs
