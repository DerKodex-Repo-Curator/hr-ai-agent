// src/app/hr-dashboard/utils/types.ts
export type JobStatus = "active" | "closed";
export type CandidateStatus = "Applied" | "ATS Screening" | "AI Interview" | "Selected" | "Rejected";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";
export type View = "jobs" | "interviews" | "create-job" | "job-detail" | "candidates" | "close-job-action" | "reject-action";

export interface PipelineStats {
    applied: number;
    ats_screening: number;
    ai_interview: number;
    selected: number;
    rejected: number;
}

export interface Job {
    id: string;
    title: string;
    location: string;
    status: JobStatus;
    closing_date?: string;
    target_shortlist?: number;
    daily_start_time?: string;
    daily_end_time?: string;
    interview_duration?: number;
    created_at?: string;
    pipeline: PipelineStats;
}

export interface CandidateProfile {
    experience?: string;
    skills?: string[];
    location?: string;
}

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone?: string;
    job_id: string;
    status: CandidateStatus;
    ats_score?: number;
    interview_score?: number;
    reject_reason?: string;
    resume_url?: string;
    profile?: CandidateProfile;
    ats_reasons?: string[];
}

export interface Interview {
    id: string;
    candidate_id: string;
    candidate_name: string;
    job_title: string;
    scheduled_time: string;
    duration: number;
    status: InterviewStatus;
    type: string;
}

export interface CreateJobData {
    title: string;
    location: string;
    target_shortlist: number;
    closing_date: string;
    daily_start_time: string;
    daily_end_time: string;
    interview_duration: number;
}

export interface ActionContext {
    job?: Job;
    candidate?: Candidate;
}