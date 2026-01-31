from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class AgentRunCreate(BaseModel):
    action_name: str
    entity_type: str  # "job", "application", "candidate"
    entity_id: int
    input_json: Optional[dict] = None
    output_json: Optional[dict] = None
    status: str = "pending"  # pending, success, failed
    error: Optional[str] = None

class AgentRunResponse(BaseModel):
    id: int
    action_name: str
    entity_type: str
    entity_id: int
    input_json: Optional[dict]
    output_json: Optional[dict]
    status: str
    error: Optional[str]
    created_at: datetime