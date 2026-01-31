from app.workers.celery_app import celery_app
from app.database import get_db
from app.utils.agent_logger import AgentLogger
import json

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


@celery_app.task(name="run_ats_scoring")
def run_ats_scoring_task(job_id: int):
    """
    Background task: Run ATS scoring when job is closed
    """
    run_id = AgentLogger.log_run(
        action_name="ats_scoring",
        entity_type="job",
        entity_id=job_id,
        status="pending"
    )
    
    try:
        db = get_db()
        
        # Fetch job details
        job = db.table("jobs").select("*").eq("id", job_id).execute()
        job_data = job.data[0]
        target_count = job_data['target_shortlist_count']
        
        # Fetch all candidates for this job
        candidates = db.table("candidates").select("*").eq("job_id", job_id).eq("status", "Applied").execute()
        
        # TODO: Implement actual ATS scoring logic using LLM
        # For now, assign random scores for demonstration
        import random
        scored_candidates = []
        
        for candidate in candidates.data:
            score = random.randint(60, 95)
            
            # Update candidate with ATS score
            db.table("candidates").update({
                "ats_score": score,
                "ats_analysis_summary": f"Candidate scored {score}% match"
            }).eq("id", candidate['id']).execute()
            
            scored_candidates.append({"id": candidate['id'], "score": score})
        
        # Sort by score and shortlist top N
        scored_candidates.sort(key=lambda x: x['score'], reverse=True)
        shortlisted_ids = [c['id'] for c in scored_candidates[:target_count]]
        rejected_ids = [c['id'] for c in scored_candidates[target_count:]]
        
        # Update statuses
        if shortlisted_ids:
            db.table("candidates").update({"status": "ATS Screening"}).in_("id", shortlisted_ids).execute()
        
        if rejected_ids:
            db.table("candidates").update({"status": "Rejected"}).in_("id", rejected_ids).execute()
        
        # Log agent activity
        db.table("agent_logs").insert({
            "candidate_id": None,
            "agent_name": "ATS Agent",
            "action_taken": "Completed ATS scoring",
            "details": f"Shortlisted {len(shortlisted_ids)} candidates, Rejected {len(rejected_ids)}",
            "log_level": "success"
        }).execute()
        
        AgentLogger.update_run(run_id, "success", {
            "shortlisted": len(shortlisted_ids),
            "rejected": len(rejected_ids)
        })
        
        # Trigger email tasks for shortlisted candidates
        for candidate_id in shortlisted_ids:
            send_shortlist_email_task.delay(candidate_id)
        
        # Trigger rejection emails
        for candidate_id in rejected_ids:
            send_rejection_email_task.delay(candidate_id)
        
    except Exception as e:
        AgentLogger.update_run(run_id, "failed", error=str(e))
        raise


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