from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.database import get_db
from app.models.db_models import Job, Application
from app.models.job import JobCreate, JobResponse, JobCloseRequest
from app.workers.tasks import generate_questionnaire_task

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/job/{job_id}")
async def get_job_applicants(job_id: int, db: Session = Depends(get_db)):
    # Order by ATS score descending so the best candidates are at the top
    results = db.query(Application).filter(Application.job_id == job_id).order_by(Application.ats_score.desc()).all()
    
    formatted_candidates = []
    for app in results:
        formatted_candidates.append({
            "id": str(app.id),
            "name": app.full_name,
            "email": app.email,
            "phone": app.phone,
            "status": app.status,
            "resume_url": app.resume_url,
            "ats_score": app.ats_score or 0,
            "interview_score": app.interview_score,
            "ats_reasons": app.ats_reasons,
            "scheduled_interview_time": app.scheduled_interview_time.isoformat() if app.scheduled_interview_time else None,
            "updates": app.updates or [],
            "profile": {
                "experience": app.total_experience_years,
                "skills": (app.skills or "").split(",") if app.skills else [],
                "location": "Remote",
                "summary": app.summary
            }
        })
    return formatted_candidates

@router.post("/", response_model=JobResponse, status_code=201)
def create_job(job_in: JobCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Create a new job posting using SQLAlchemy.
    """
    # Create the Job object
    new_job = Job(
        role_title=job_in.role_title,
        department=job_in.department,
        location=job_in.location,
        description=job_in.description,
        target_shortlist_count=job_in.target_shortlist_count,
        closing_date=job_in.closing_date,
        status="Open"
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Trigger background task
    generate_questionnaire_task.delay(new_job.id)
    
    return new_job

@router.get("/", response_model=List[JobResponse])
def list_jobs(status: str = None, db: Session = Depends(get_db)):
    """
    List all jobs with SQLAlchemy query filtering.
    """
    query = db.query(Job)
    
    if status:
        query = query.filter(Job.status == status)
    
    return query.order_by(desc(Job.id)).all()

@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    """
    Get specific job details.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/{job_id}/close")
def close_job(job_id: int, request: JobCloseRequest, db: Session = Depends(get_db)):
    """
    Close job and trigger the Agentic scoring task.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.status = "Closed"
    db.commit()
    
    return {
        "message": "Job closed. AI Agent scoring started.",
        "job_id": job_id
    }