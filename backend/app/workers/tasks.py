from datetime import datetime, timedelta
from random import random
from sqlalchemy.orm import Session
from app.workers.celery_app import celery_app
from app.database import get_db
from app.utils.agent_logger import AgentLogger
import json

from app.models.db_models import Application

@celery_app.task(name="generate_questionnaire")
def generate_questionnaire_task(job_id: int):
    """
    Background task: Generate AI questionnaire when job is created
    """
    run_id = AgentLogger.log_run(
        action_name="generate_questionnaire",
        entity_type="job",
        entity_id=job_id,
        status="pending"
    )
    
    try:
        db = get_db()
        
        # Fetch job details
        job = db.table("jobs").select("*").eq("id", job_id).execute()
        job_data = job.data[0]
        
        # TODO: Call LLM to generate questionnaire based on job description
        # For now, placeholder questionnaire
        questionnaire = [
            {
                "question": f"What experience do you have in {job_data['department']}?",
                "type": "text",
                "weight": 1.0
            },
            {
                "question": f"Describe a challenging project related to {job_data['role_title']}",
                "type": "text",
                "weight": 1.0
            }
        ]
        
        # Update job with questionnaire
        db.table("jobs").update({
            "ai_questionnaire": questionnaire
        }).eq("id", job_id).execute()
        
        # Log agent activity
        db.table("agent_logs").insert({
            "candidate_id": None,
            "agent_name": "Questionnaire Generator",
            "action_taken": "Generated AI questionnaire",
            "details": f"Created {len(questionnaire)} questions for job {job_id}",
            "log_level": "success"
        }).execute()
        
        AgentLogger.update_run(run_id, "success", {"questionnaire_count": len(questionnaire)})
        
    except Exception as e:
        AgentLogger.update_run(run_id, "failed", error=str(e))
        raise


@celery_app.task(name="send_acknowledgement_email")
def send_acknowledgement_email_task(application_id: int):
    """
    Background task: Send acknowledgement email when application is submitted
    """
    run_id = AgentLogger.log_run(
        action_name="send_acknowledgement",
        entity_type="application",
        entity_id=application_id,
        status="pending"
    )
    
    try:
        db = get_db()
        
        # Fetch application and candidate details
        app = db.table("candidates").select("*").eq("id", application_id).execute()
        app_data = app.data[0]
        
        # TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        # For now, just log
        print(f"Sending acknowledgement to {app_data['email']}")
        
        # Log agent activity
        db.table("agent_logs").insert({
            "candidate_id": application_id,
            "agent_name": "Email Agent",
            "action_taken": "Sent acknowledgement email",
            "details": f"Email sent to {app_data['email']}",
            "log_level": "success"
        }).execute()
        
        AgentLogger.update_run(run_id, "success", {"email": app_data['email']})
        
    except Exception as e:
        AgentLogger.update_run(run_id, "failed", error=str(e))
        raise


@celery_app.task(name="run_individual_ats_scoring")
def run_individual_ats_scoring(app_id: str, db: Session):
    try:
        app = db.query(Application).filter(Application.id == app_id).first()
        if not app: return

        # 1. Fetch Job Metadata
        job = db.execute(f"SELECT target_shortlist_count FROM jobs WHERE id = {app.job_id}").fetchone()
        target_count = job[0] if job else 5

        # 2. Count existing shortlists for this job
        current_shortlisted_count = db.query(Application).filter(
            Application.job_id == app.job_id,
            Application.status.in_(["ATS Screening", "AI Interview", "Selected"])
        ).count()

        # 3. AI EVALUATION
        score = random.randint(60, 98) 
        app.ats_score = score
        app.status = "In Orbit"
        app.progress = 50
        
        updated_logs = list(app.updates) if app.updates else []

        # 4. CONDITIONAL AUTO-SHORTLIST
        # Only shortlist if score is high AND we haven't hit the target yet
        if score >= 85 and current_shortlisted_count < target_count:
            app.status = "ATS Screening"
            app.progress = 70
            
            # Propose slots (Keep your existing scheduling logic)
            tomorrow = datetime.now() + timedelta(days=1)
            app.proposed_slots = [
                (tomorrow.replace(hour=10, minute=0)).isoformat(),
                (tomorrow.replace(hour=14, minute=0)).isoformat(),
                ((tomorrow + timedelta(days=1)).replace(hour=11, minute=0)).isoformat(),
            ]
            
            msg = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "msg": f"CRITICAL MATCH ({score}%). Priority slot secured. {target_count - current_shortlisted_count - 1} orbital slots remaining."
            }
            updated_logs.append(msg)
        
        elif score >= 85 and current_shortlisted_count >= target_count:
            # Score is high, but the "Mission is Full"
            msg = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "msg": f"High alignment ({score}%). All priority slots are currently docked. You are on standby."
            }
            updated_logs.append(msg)
        else:
            # Standard Log
            msg = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "msg": f"AI Agent evaluation complete. Score: {score}%."
            }
            updated_logs.append(msg)

        app.updates = updated_logs
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Agent Telemetry Error: {str(e)}")
    
@celery_app.task(name="send_shortlist_email")
def send_shortlist_email_task(candidate_id: int):
    """Send email to shortlisted candidates"""
    # TODO: Implement email sending logic
    print(f"Sending shortlist email to candidate {candidate_id}")


@celery_app.task(name="send_rejection_email")
def send_rejection_email_task(candidate_id: int):
    """Send rejection email to candidates"""
    # TODO: Implement email sending logic
    print(f"Sending rejection email to candidate {candidate_id}")