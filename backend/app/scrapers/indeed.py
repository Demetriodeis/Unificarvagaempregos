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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}


class IndeedScraper(BaseScraper):
    name = "Indeed"
    color = "#2557A7"

    async def search(self, keyword: str, location: str = "") -> List[Job]:
        query = f"q={quote_plus(keyword)}"
        if location:
            query += f"&l={quote_plus(location)}"

        url = f"https://br.indeed.com/empregos?{query}"

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                return []

        soup = BeautifulSoup(resp.text, "lxml")
        jobs: List[Job] = []

        # Indeed uses multiple class patterns depending on A/B tests
        cards = (
            soup.select("[class*='job_seen_beacon']")
            or soup.select(".jobsearch-SerpJobCard")
            or soup.select("[data-jk]")
        )

        for card in cards[:20]:
            title_el = card.select_one("h2.jobTitle a, .jobTitle a, h2 a")
            company_el = card.select_one("[class*='companyName'], .company, [data-testid='company-name']")
            location_el = card.select_one("[class*='companyLocation'], .location, [data-testid='text-location']")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            company = company_el.get_text(strip=True) if company_el else "Empresa não informada"
            loc = location_el.get_text(strip=True) if location_el else (location or "Brasil")

            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = f"https://br.indeed.com{href}"

            job_id = hashlib.md5(f"{title}{company}".encode()).hexdigest()[:12]
            jobs.append(
                Job(
                    id=f"indeed-{job_id}",
                    title=title,
                    company=company,
                    location=loc,
                    source=self.name,
                    source_color=self.color,
                    url=href or url,
                )
            )

        return jobs
