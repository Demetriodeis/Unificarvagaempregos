import hashlib
import httpx
from bs4 import BeautifulSoup
from typing import List
from urllib.parse import quote_plus

from ..models import Job
from .base import BaseScraper

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
}


class TramposScraper(BaseScraper):
    name = "Trampos.co"
    color = "#00CEC9"

    async def search(self, keyword: str, location: str = "") -> List[Job]:
        url = f"https://trampos.co/oportunidades?terms={quote_plus(keyword)}"

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                return []

        soup = BeautifulSoup(resp.text, "lxml")
        jobs: List[Job] = []

        items = (
            soup.select(".opportunity")
            or soup.select("[class*='opportunity']")
            or soup.select("article")
            or soup.select(".job-item")
        )

        for item in items[:20]:
            title_el = item.select_one("h2, h3, [class*='title'], [class*='name']")
            company_el = item.select_one("[class*='company'], [class*='empresa'], .client")
            location_el = item.select_one("[class*='location'], [class*='local'], [class*='cidade']")
            link_el = item.select_one("a[href]")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            company = company_el.get_text(strip=True) if company_el else "Empresa não informada"
            loc = location_el.get_text(strip=True) if location_el else (location or "Brasil")

            href = link_el.get("href", "") if link_el else ""
            if href and not href.startswith("http"):
                href = f"https://trampos.co{href}"

            job_id = hashlib.md5(f"{title}{company}".encode()).hexdigest()[:12]
            jobs.append(
                Job(
                    id=f"trampos-{job_id}",
                    title=title,
                    company=company,
                    location=loc,
                    source=self.name,
                    source_color=self.color,
                    url=href or url,
                )
            )

        return jobs
