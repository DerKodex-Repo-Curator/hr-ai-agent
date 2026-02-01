from uuid import UUID
from app.workers.tasks import run_individual_ats_scoring
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from datetime import datetime, timedelta

from app.models.application import ApplicationCreate, ApplicationInDashboard, ApplicationResponse
from app.database import get_db
from app.models.db_models import Application
from app.auth import get_current_user 
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/apply", response_model=ApplicationResponse)
async def create_application(
    payload: ApplicationCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user = Depends(get_current_user) 
):
    try:
        new_app = Application(
            user_id=user.id, 
            job_id=payload.job_id,
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            education=payload.education,
            skills=payload.skills,
            total_experience_years=payload.total_experience_years,
            summary=payload.summary,
            github_url=payload.github_url,
            linkedin_url=payload.linkedin_url,
            resume_url=payload.resume_url,
            status="In Orbit",
            progress=30,
            updates=[{
                "date": datetime.now().strftime("%Y-%m-%d"),
                "msg": "Satellite successfully entered orbit. AI Agent scan initiated."
            }]
        )

        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        # 2. Trigger AI Agent Task
        background_tasks.add_task(run_individual_ats_scoring, str(new_app.id))

        return new_app

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Mission launch failed: {str(e)}")
    

@router.get("/my-missions")
async def get_my_missions(
    db: Session = Depends(get_db),
    user = Depends(get_current_user) 
):
    missions = db.query(Application)\
        .options(joinedload(Application.job))\
        .filter(Application.user_id == user.id)\
        .order_by(Application.progress.desc())\
        .all()
    
    formatted_missions = []
    for app in missions:
        mission_data = {
            "id": str(app.id),
            "job_id": app.job_id,
            "role_title": app.job.role_title if app.job else "Unknown Role",
            "department": app.job.department if app.job else "N/A",
            "job_location": app.job.location if app.job else "Remote",
            "status": app.status,
            "progress": app.progress,
            "full_name": app.full_name,
            "created_at": app.created_at.isoformat(),
            "updates": app.updates,
            "proposed_slots": app.proposed_slots,
            "scheduled_interview_time": app.scheduled_interview_time.isoformat() if app.scheduled_interview_time else None,
        }
        formatted_missions.append(mission_data)
        
    return formatted_missions

@router.get("/{app_id}/logs")
async def get_mission_logs(
    app_id: str, 
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Verify the mission belongs to the user
    mission = db.query(Application).filter(
        Application.id == app_id, 
        Application.user_id == user.id
    ).first()
    
    if not mission:
        raise HTTPException(status_code=404, detail="Mission telemetry not found.")
        
    return {
        "id": mission.id,
        "role": mission.job.role_title if mission.job else "Unknown Specialist",
        "logs": mission.updates or []
    }
    
@router.post("/{app_id}/confirm-slot")
async def confirm_mission_slot(app_id: str, payload: dict, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    selected_time = payload.get("selected_time")
    
    app.scheduled_interview_time = selected_time
    app.status = "AI Interview"
    app.progress = 85
    
    readable_time = datetime.fromisoformat(selected_time).strftime("%b %d at %I:%M %p")
    
    # Use copy and re-assign to ensure SQLAlchemy detects the JSON change
    new_updates = list(app.updates)
    new_updates.append({
        "date": datetime.now().strftime("%Y-%m-%d"),
        "msg": f"Orbital Docking confirmed for {readable_time}. Prepare for AI Interview."
    })
    app.updates = new_updates
    
    db.commit()
    return {"status": "Locked", "time": readable_time}

@router.patch("/{app_id}/status")
async def update_application_status(app_id: str, update_data: dict, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Mission not found")

    old_status = app.status
    new_status = update_data.get("status")

    app.status = new_status
    db.commit()

    # AUTO-PROMOTION LOGIC
    if old_status == "ATS Screening" and new_status == "Rejected":
        next_best = db.query(Application).filter(
            Application.job_id == app.job_id,
            Application.status == "In Orbit",
            Application.ats_score >= 85
        ).order_by(Application.ats_score.desc()).first()

        if next_best:
            next_best.status = "ATS Screening"
            next_best.progress = 70
            
            tomorrow = datetime.now() + timedelta(days=1)
            next_best.proposed_slots = [
                (tomorrow.replace(hour=10, minute=0)).isoformat(),
                (tomorrow.replace(hour=14, minute=0)).isoformat()
            ]
            
            # Update logs using the list reassignment strategy
            promo_logs = list(next_best.updates)
            promo_logs.append({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "msg": "A mission slot has opened! You have been promoted from Standby to Priority Screening. Select a briefing window."
            })
            next_best.updates = promo_logs
            
            db.commit()
            print(f"Agent Action: Auto-promoted {next_best.id}")

    return {"status": "success"}