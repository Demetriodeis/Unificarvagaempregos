from abc import ABC, abstractmethod
from typing import List
from ..models import Job


class BaseScraper(ABC):
    name: str
    color: str

    @abstractmethod
    async def search(self, keyword: str, location: str = "") -> List[Job]:
        pass
