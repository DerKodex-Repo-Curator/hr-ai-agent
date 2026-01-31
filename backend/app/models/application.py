from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    job_id: int
    full_name: str
    email: EmailStr
    phone: str
    resume_url: str

class ApplicationStatusUpdate(BaseModel):
    status: str  # "shortlist", "reject", "hire"
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    full_name: str
    email: str
    phone: str
    resume_url: str
    is_verified: bool
    status: str
    ats_score: Optional[int]
    ats_analysis_summary: Optional[str]
    interview_score: Optional[int]
    interview_summary: Optional[str]
    created_at: datetime