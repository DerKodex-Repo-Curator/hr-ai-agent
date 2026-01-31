from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.models.job import JobCreate, JobResponse, JobCloseRequest
from app.database import get_db
from app.workers.tasks import generate_questionnaire_task, run_ats_scoring_task

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse, status_code=201)
def create_job(job: JobCreate, background_tasks: BackgroundTasks):
    """
    Create a new job posting.
    Triggers: Questionnaire generation in background.
    """
    db = get_db()
    
    # Insert job
    result = db.table("jobs").insert({
        "role_title": job.role_title,
        "department": job.department,
        "location": job.location,
        "description": job.description,
        "target_shortlist_count": job.target_shortlist_count,
        "closing_date": job.closing_date.isoformat() if job.closing_date else None,
        "status": "Open"
    }).execute()
    
    job_data = result.data[0]
    
    # Trigger background task: Generate questionnaire
    generate_questionnaire_task.delay(job_data['id'])
    
    return job_data


@router.get("/", response_model=List[JobResponse])
def list_jobs(status: str = None):
    """
    List all jobs. Optional filter by status.
    """
    db = get_db()
    
    query = db.table("jobs").select("*")
    
    if status:
        query = query.eq("status", status)
    
    result = query.execute()
    return result.data


@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(job_id: int):
    """
    Get details of a specific job.
    """
    db = get_db()
    
    result = db.table("jobs").select("*").eq("id", job_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return result.data[0]


@router.post("/{job_id}/close")
def close_job(job_id: int, request: JobCloseRequest):
    """
    Close a job posting.
    Triggers: ATS scoring, shortlisting, and email notifications.
    """
    db = get_db()
    
    # Update job status
    result = db.table("jobs").update({
        "status": "Closed"
    }).eq("id", job_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Trigger background task: Run ATS scoring
    run_ats_scoring_task.delay(job_id)
    
    return {
        "message": "Job closed successfully. ATS scoring and candidate notifications in progress.",
        "job_id": job_id
    }