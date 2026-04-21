import hashlib
import httpx
from bs4 import BeautifulSoup
from typing import List

from ..models import Job
from .base import BaseScraper

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class VagasScraper(BaseScraper):
    name = "Vagas.com.br"
    color = "#E17055"

    async def search(self, keyword: str, location: str = "") -> List[Job]:
        slug = keyword.replace(" ", "-").lower()
        url = f"https://www.vagas.com.br/vagas-de-{slug}"

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                return []

        soup = BeautifulSoup(resp.text, "lxml")
        jobs: List[Job] = []

        # Try multiple CSS selector patterns used by vagas.com.br
        selectors = [
            "li.job",
            ".vagaInfo",
            "article.vaga",
            "[class*='vaga-item']",
            ".jobs-list li",
        ]
        items = []
        for sel in selectors:
            items = soup.select(sel)
            if items:
                break

        for item in items[:20]:
            title_el = item.select_one(
                "h2, h3, .cargo, [class*='cargo'], [class*='title'], [class*='titulo']"
            )
            company_el = item.select_one(
                ".empresa, [class*='empresa'], [class*='company']"
            )
            location_el = item.select_one(
                ".localidade, [class*='local'], [class*='cidade'], [class*='location']"
            )
            link_el = item.select_one("a[href]")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            company = company_el.get_text(strip=True) if company_el else "Empresa não informada"
            loc = location_el.get_text(strip=True) if location_el else (location or "Brasil")

            href = link_el.get("href", "") if link_el else ""
            if href and not href.startswith("http"):
                href = f"https://www.vagas.com.br{href}"

            job_id = hashlib.md5(f"{title}{company}".encode()).hexdigest()[:12]
            jobs.append(
                Job(
                    id=f"vagas-{job_id}",
                    title=title,
                    company=company,
                    location=loc,
                    source=self.name,
                    source_color=self.color,
                    url=href or url,
                )
            )

        return jobs
