from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, List
from datetime import datetime

class JobCreate(BaseModel):
    role_title: str
    department: str
    location: str = "Abu Dhabi, UAE"
    description: str
    target_shortlist_count: int = 10
    closing_date: Optional[datetime] = None

class JobResponse(BaseModel):
    id: int
    role_title: str
    department: str
    location: str
    description: str
    status: str
    target_shortlist_count: int
    closing_date: Optional[datetime]
    ai_questionnaire: List[dict] = []
    jd_summary: Optional[Dict[str, Any]] = None
    created_at: datetime

class JobCloseRequest(BaseModel):
    """Request body for closing a job"""
    override_shortlist_count: Optional[int] = None