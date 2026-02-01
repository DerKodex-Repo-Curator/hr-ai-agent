from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Any

class ApplicationCreate(BaseModel):
    user_id: str
    job_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    total_experience_years: Optional[str] = None
    summary: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: UUID  # Change str to UUID
    user_id: UUID # Change str to UUID
    job_id: int
    full_name: str
    email: str
    status: str
    progress: int
    updates: List[dict]
    
    model_config = ConfigDict(from_attributes=True)

class ApplicationInDashboard(BaseModel):
    id: Any
    full_name: str
    email: str
    status: str
    progress: int
    total_experience_years: Optional[str]
    skills: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True