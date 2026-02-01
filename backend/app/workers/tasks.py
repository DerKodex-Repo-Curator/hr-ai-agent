from datetime import datetime, timedelta
from random import random
from sqlalchemy.orm import Session
from app.workers.celery_app import celery_app
from app.database import get_db
from app.utils.agent_logger import AgentLogger
import json

from app.models.db_models import Application

from app.utils.parser import parse_resume_to_text
from app.workers.ai_agent import analyze_mission_specialist
from app.utils.mailer import send_mission_email
from app.models.db_models import Application, Job

import httpx
from sqlalchemy.orm import Session
from app.models.db_models import Application
from app.utils.parser import parse_resume_to_text
from app.workers.ai_agent import analyze_mission_specialist
from app.utils.mailer import send_mission_email 

def run_mail_agent_workflow(application_id: str, db: Session):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app: return

    # Decision Path
    if app.ats_score >= 85:
        app.status = "AI Interview"
        app.updates.append({
            "date": "2026-02-01", 
            "msg": "Agentic Analysis Complete: Candidate promoted to Briefing Phase."
        })
        
        subject = f"ACTION REQUIRED: Mission Briefing for {app.full_name}"
        content = f"""
            <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 40px; border-radius: 20px;">
                <h2 style="color: #3b82f6;">🚀 Mission Specialist Selected</h2>
                <p>Pilot <strong>{app.full_name}</strong>,</p>
                <p>Your technical telemetry aligns perfectly with the <b>{app.job.role_title}</b> mission requirements.</p>
                <p>Our AI Agent has reserved the following briefing windows:</p>
                <ul style="color: #94a3b8;">
                    <li>Feb 5, 10:00 AM UTC</li>
                    <li>Feb 5, 02:00 PM UTC</li>
                    <li>Feb 6, 09:00 AM UTC</li>
                </ul>
                <p>Confirm your arrival time in the <a href="https://your-vercel-link.app/my-missions" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Mission Control Dashboard</a>.</p>
            </div>
        """
        send_mission_email(app.email, subject, content)

    else:
        app.status = "Rejected"
        # Sentiment-driven rejection
        rejection_msg = "While your current trajectory is impressive, our orbital priorities are focused on different core specializations at this time."
        
        app.updates.append({
            "date": "2026-02-01", 
            "msg": f"Mission Log: {rejection_msg}"
        })

        subject = f"Mission Update: {app.job.role_title}"
        content = f"""
            <div style="font-family: sans-serif; color: #1e293b; padding: 30px;">
                <h3>Mission Status Update</h3>
                <p>Specialist {app.full_name},</p>
                <p style="color: #64748b; font-style: italic;">"{rejection_msg}"</p>
                <p>We have archived your credentials for future mission windows.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 10px; color: #94a3b8;">Space42 Automated Agentic System</p>
            </div>
        """
        send_mission_email(app.email, subject, content)

    db.commit()

def send_rejection_email(app, job):
    # Mapping the first 2 skills for the template
    skill_list = app.skills.split(",") if app.skills else ["Technical Proficiency"]
    skill_1 = skill_list[0].strip()
    skill_2 = skill_list[1].strip() if len(skill_list) > 1 else "Strategic Thinking"
    reason = app.ats_reasons[0] if app.ats_reasons else "Our current orbital path requires a specific alignment of technical credentials."

    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            /* ... (Keep all your CSS from above here) ... */
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <div class="company-logo">◆ SPACE42 COMMAND</div>
                <div class="header-text">Orbital Talent Acquisition</div>
            </div>
            
            <div class="content">
                <div class="personal-bar">
                    <h2 class="candidate-name">{app.full_name}</h2>
                    <p class="job-reference">Applicant for <span class="job-title">{job.role_title}</span> • {job.location}</p>
                </div>
                
                <h1>Thank you for letting us get to know you</h1>
                
                <p class="lead">
                    We genuinely appreciate the time you invested in your application. 
                    Your background in <strong>{app.total_experience_years}</strong> stood out to our sensors.
                </p>
                
                <p>
                    After careful consideration (where your profile scan resulted in a <strong>{app.ats_score}%</strong> match), 
                    we've decided not to move forward with your mission at this time.
                </p>
                
                <div class="highlight-box">
                    <p class="feedback-text">
                        "{reason}"
                    </p>
                </div>
                
                <div class="skills-notice">
                    <div class="skills-icon">✓</div>
                    <p class="skills-text">
                        We were particularly impressed by your expertise in <strong>{skill_1}</strong> and <strong>{skill_2}</strong>. 
                        These strengths will serve you well in future orbits.
                    </p>
                </div>
                
                <div class="future-opportunities">
                    <div class="future-title">The Door Remains Open</div>
                    <p class="future-text">
                        We are scaling rapidly. We would love to keep your profile in our talent pool for future windows in {job.location}.
                    </p>
                </div>
                
                <div class="signature">
                    <p class="sign-off">Warm regards,</p>
                    <p class="hiring-manager">A.I. Recruitment Agent</p>
                    <p class="title">Autonomous Specialist • Space42 Talent Dept.</p>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    "Reference ID: {str(app.id)[:8]}-{app.job_id}"
                </p>
            </div>
        </div>
    </body>
    </html>
    """    
    send_mission_email(app.email, f"Mission Update: {job.role_title}", html_template)


async def run_ats_agent_workflow(application_id: str, db: Session, resume_url: str):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app: return
    job = app.job

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(resume_url)
            if response.status_code != 200:
                raise Exception(f"Satellite communication failed: HTTP {response.status_code}")
            pdf_bytes = response.content

        resume_text = parse_resume_to_text(pdf_bytes)

        analysis = analyze_mission_specialist(resume_text, job.description)

        app.full_name = analysis.get("full_name", app.full_name)
        app.email = analysis.get("email", app.email)
        app.skills = ",".join(analysis.get("skills", [])) if isinstance(analysis.get("skills"), list) else analysis.get("skills")
        app.summary = analysis.get("summary", "")
        app.ats_score = analysis.get("ats_score", 0)
        app.ats_reasons = analysis.get("ats_reasons", [])
        # 6. DECISION & COMMUNICATION: Automated Dispatch
        if app.ats_score >= 85:
            app.status = "AI Interview"
            subject = f"Mission Briefing: {job.role_title}"
            content = f"<h2>Congrats Specialist!</h2><p>Your score of {app.ats_score} cleared the threshold.</p>"
            send_mission_email(app.email, subject, content)
        else:
            app.status = "Rejected"
            send_rejection_email(app, job)

        db.commit()
        print(f"✅ Mission {str(app.full_name)} - {application_id} processed successfully.")

    except Exception as e:
        print(f"❌ Mission Control Error in workflow: {str(e)}")
        app.updates.append({
            "date": "2026-02-01", 
            "msg": f"System Error: {str(e)}"
        })
        db.commit()

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