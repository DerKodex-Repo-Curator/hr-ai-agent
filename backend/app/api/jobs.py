import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Any, Dict, List

from app.database import get_db
from app.models.db_models import Job, Application
from app.models.job import JobCreate, JobResponse, JobCloseRequest
from app.workers.tasks import generate_questionnaire_task

from datetime import datetime, time, timedelta
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, BackgroundTasks
import requests

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

AGENT_API_KEY = os.getenv("AGENT_API_KEY")
JD_NORMALIZE_ENDPOINT = "/jd/normalize"  # Base URL for the agent API
JD_NORMALIZE_URL = f"{AGENT_API_KEY}{JD_NORMALIZE_ENDPOINT}"

class JobCreate(BaseModel):
    title: str
    department: str
    location: str = "Abu Dhabi, UAE"
    target_shortlist: int = 5
    closing_date: str
    daily_start_time: str = "09:00"
    daily_end_time: str = "17:00"
    interview_duration: int = 60
    requirements: str
    description: str

class JobResponse(BaseModel):
    id: int
    role_title: str
    department: str
    location: str
    description: str
    status: str
    target_shortlist_count: int
    closing_date: datetime
    created_at: datetime
    jd_summary: Optional[Dict[str, Any]] = None
    pipeline: Dict[str, int] = {
        "applied": 0,
        "ats_screening": 0,
        "ai_interview": 0,
        "selected": 0,
        "rejected": 0
    }
    
    class Config:
        from_attributes = True

def call_jd_normalize_api(job_data: Dict[str, str]) -> Dict[str, Any]:
    """
    Call external API to normalize job description and get summary
    Uses the same API key for authentication
    """
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {AGENT_API_KEY}",
            "X-API-Key": AGENT_API_KEY  # Alternative header if needed
        }
        
        payload = {
            "job_title": job_data["job_title"],
            "location": job_data["location"],
            "job_description": job_data["job_description"],
            "requirements": job_data["requirements"]
        }
        
        print(f"Calling JD normalize API: {JD_NORMALIZE_URL}")
        
        response = requests.post(
            JD_NORMALIZE_URL,
            headers=headers,
            json=payload,
            timeout=300
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling JD normalize API: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        
        # Return a structured error response
        return {
            "error": True,
            "message": f"API call failed: {str(e)}",
            "summary": {
                "title": job_data["job_title"],
                "location": job_data["location"],
                "extracted_skills": [],
                "experience_level": "Not specified",
                "salary_range": "Not specified",
                "work_type": "Not specified"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Unexpected error in JD normalize API call: {str(e)}")
        return {
            "error": True,
            "message": str(e),
            "summary": {
                "title": job_data["job_title"],
                "location": job_data["location"],
                "extracted_skills": [],
                "experience_level": "Not specified",
                "salary_range": "Not specified",
                "work_type": "Not specified"
            },
            "timestamp": datetime.now().isoformat()
        }

def update_jd_summary(db: Session, job_id: int, jd_summary: Dict[str, Any]):
    """
    Update the job record with the JD summary from external API
    """
    try:
        # Get the job from database
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            print(f"Job with ID {job_id} not found")
            return
        
        # Update the jd_summary field
        job.jd_summary = jd_summary
        db.commit()
        print(f"Successfully updated jd_summary for job ID {job_id}")
        
    except Exception as e:
        db.rollback()
        print(f"Error updating jd_summary for job ID {job_id}: {str(e)}")

def process_jd_summary_background(job_id: int, job_data: Dict[str, str]):
    """
    Background task to:
    1. Call external API for JD normalization
    2. Update the job record with the summary
    """
    from app.database import SessionLocal
    
    # Create a new database session for the background task
    db = SessionLocal()
    try:
        print(f"Starting JD summary background task for job ID {job_id}")
        
        # Call external API
        jd_summary = call_jd_normalize_api(job_data)
        
        # Update the job record with the summary
        update_jd_summary(db, job_id, jd_summary)
        
        print(f"Completed JD summary background task for job ID {job_id}")
        
    except Exception as e:
        print(f"Error in background task for job ID {job_id}: {str(e)}")
    finally:
        db.close()

@router.post("", response_model=JobResponse, status_code=201)
def create_job(job_in: JobCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Create a new job posting and trigger background tasks for JD normalization
    """
    # Validate API key is present
    if not AGENT_API_KEY:
        print("WARNING: AGENT_API_KEY environment variable is not set")
    
    # Parse closing date string to datetime
    try:
        closing_date = datetime.strptime(job_in.closing_date, "%Y-%m-%d")
    except ValueError:
        closing_date = datetime.now() + timedelta(days=30)
    
    # Create the Job object
    new_job = Job(
        role_title=job_in.title,
        department=job_in.department,
        location=job_in.location,
        description=job_in.description,
        requirements=job_in.requirements,
        target_shortlist_count=job_in.target_shortlist,
        closing_date=closing_date,
        status="active",
        jd_summary=None  # Will be populated by background task
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Prepare data for JD normalization API
    jd_api_data = {
        "job_title": job_in.title,
        "location": job_in.location,
        "job_description": job_in.description,
        "requirements": job_in.requirements
    }
    
    # Add background task for JD normalization/summary generation
    background_tasks.add_task(
        process_jd_summary_background,
        job_id=new_job.id,
        job_data=jd_api_data
    )
    
    # Prepare response
    response_data = {
        "id": new_job.id,
        "role_title": new_job.role_title,
        "department": new_job.department,
        "location": new_job.location,
        "description": new_job.description,
        "status": new_job.status,
        "target_shortlist_count": new_job.target_shortlist_count,
        "closing_date": new_job.closing_date,
        "created_at": new_job.created_at,
        "jd_summary": new_job.jd_summary,
        "pipeline": {
            "applied": 0,
            "ats_screening": 0,
            "ai_interview": 0,
            "selected": 0,
            "rejected": 0
        }
    }
    
    return response_data

@router.get("", response_model=List[JobResponse])
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