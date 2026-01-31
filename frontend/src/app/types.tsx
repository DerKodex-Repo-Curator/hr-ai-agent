// --- TYPES ---

export type CandidateStatus =
  | "Applied"
  | "ATS Screening"
  | "AI Interview"
  | "Selected"
  | "Rejected";

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
  resume_url?: string;
  job_id: string;
  status: CandidateStatus;
  ats_score: number;
  interview_score?: number;
  ats_reasons?: string[];
  reject_reason?: string;
  profile?: CandidateProfile;
}

export interface Interview {
  id?: string;
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  scheduled_time: string;
  duration?: number;
  status: string;
  type?: string;
}

export interface JobPipeline {
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
  status: "active" | "closed";
  closing_date?: string;
  daily_start_time?: string;
  daily_end_time?: string;
  interview_duration?: number;
  target_shortlist?: number;
  pipeline?: JobPipeline;
}
