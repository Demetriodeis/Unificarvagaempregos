import hashlib
import httpx
from typing import List

from ..models import Job
from .base import BaseScraper

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}


class GupyScraper(BaseScraper):
    name = "Gupy"
    color = "#00B8A9"

    async def search(self, keyword: str, location: str = "") -> List[Job]:
        params: dict = {"jobName": keyword, "limit": 20, "offset": 0}
        if location:
            params["cityName"] = location

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://portal.api.gupy.io/api/job",
                params=params,
                headers=HEADERS,
            )
            resp.raise_for_status()
            data = resp.json()

        jobs: List[Job] = []
        for item in data.get("data", []):
            city = item.get("city") or ""
            state = item.get("state") or ""
            loc = ", ".join(filter(None, [city, state])) or "Brasil"

            workplace = (item.get("workplaceType") or "").lower()
            if workplace == "remote":
                job_type, remote = "Remoto", True
            elif workplace == "hybrid":
                job_type, remote = "Híbrido", False
            else:
                job_type, remote = "Presencial", False

            company_info = item.get("company") or {}
            raw_id = str(item.get("id") or hashlib.md5(str(item).encode()).hexdigest())

            jobs.append(
                Job(
                    id=f"gupy-{raw_id}",
                    title=item.get("name") or "Sem título",
                    company=company_info.get("name") or "Empresa não informada",
                    location=loc,
                    source=self.name,
                    source_color=self.color,
                    url=item.get("jobUrl") or "",
                    job_type=job_type,
                    remote=remote,
                    posted_date=item.get("publishedDate") or "",
                )
            )
        return jobs
