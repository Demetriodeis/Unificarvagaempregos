from pydantic import BaseModel
from typing import Optional, List


class Job(BaseModel):
    id: str
    title: str
    company: str
    location: str
    source: str
    source_color: str
    url: str
    description: Optional[str] = None
    job_type: Optional[str] = None
    salary: Optional[str] = None
    posted_date: Optional[str] = None
    remote: bool = False


class SearchResponse(BaseModel):
    jobs: List[Job]
    total: int
    sources_searched: List[str]
    sources_with_errors: List[str]


class SourceInfo(BaseModel):
    id: str
    name: str
    color: str
