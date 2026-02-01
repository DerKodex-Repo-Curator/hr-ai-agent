from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    role_title = Column(String, nullable=False)
    department = Column(String)
    location = Column(String)
    description = Column(Text)
    target_shortlist_count = Column(Integer, default=5)
    status = Column(String, default="Open") # Open, Closed
    closing_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to link jobs to applications
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    education = Column(String)
    skills = Column(String)
    total_experience_years = Column(String)
    summary = Column(String)
    github_url = Column(String)
    linkedin_url = Column(String)
    resume_url = Column(String)
    status = Column(String, default="In Orbit")
    progress = Column(Integer, default=25)
    
    # --- ADD THESE COLUMNS ---
    ats_score = Column(Integer, default=0)
    interview_score = Column(Integer) # The missing piece!
    ats_reasons = Column(JSON, default=list) 
    # -------------------------

    proposed_slots = Column(JSON, default=list) 
    scheduled_interview_time = Column(DateTime(timezone=True))
    updates = Column(JSON, default=list) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("Job", back_populates="applications")