from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.application import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate
from app.database import get_db
from app.workers.tasks import send_acknowledgement_email_task

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/", response_model=ApplicationResponse, status_code=201)
def create_application(application: ApplicationCreate):
    """
    Submit a new job application.
    Triggers: Acknowledgement email in background.
    """
    db = get_db()
    
    # Insert candidate/application
    result = db.table("candidates").insert({
        "job_id": application.job_id,
        "full_name": application.full_name,
        "email": application.email,
        "phone": application.phone,
        "resume_url": application.resume_url,
        "status": "Applied",
        "is_verified": False  # TODO: Implement verification logic
    }).execute()
    
    candidate_data = result.data[0]
    
    # Trigger background task: Send acknowledgement email
    send_acknowledgement_email_task.delay(candidate_data['id'])
    
    return candidate_data


@router.get("/", response_model=List[ApplicationResponse])
def list_applications(job_id: Optional[int] = Query(None)):
    """
    List applications. Optional filter by job_id.
    """
    db = get_db()
    
    query = db.table("candidates").select("*")
    
    if job_id:
        query = query.eq("job_id", job_id)
    
    result = query.execute()
    return result.data


@router.post("/{application_id}/status")
def update_application_status(application_id: int, status_update: ApplicationStatusUpdate):
    """
    Update application status (shortlist/reject/hire).
    """
    db = get_db()
    
    # Map friendly status to internal status
    status_mapping = {
        "shortlist": "ATS Screening",
        "reject": "Rejected",
        "hire": "Hired"
    }
    
    new_status = status_mapping.get(status_update.status.lower())
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = db.table("candidates").update({
        "status": new_status
    }).eq("id", application_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        "message": f"Application status updated to {new_status}",
        "application_id": application_id,
        "new_status": new_status
    }