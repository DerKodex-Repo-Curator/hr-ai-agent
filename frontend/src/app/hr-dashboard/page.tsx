"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Briefcase,
    Activity,
    ChevronRight,
    Plus,
    Eye,
    X,
    Trash2,
    ArrowRight,
    UserCheck,
    Star,
    Calendar,
    FileText,
    Phone,
    Link as LinkIcon,
    AlertCircle,
} from "lucide-react";

// --- TYPES ---
type JobStatus = "active" | "closed";
type CandidateStatus = "Applied" | "ATS Screening" | "AI Interview" | "Selected" | "Rejected";
type InterviewStatus = "scheduled" | "completed" | "cancelled";

interface PipelineStats {
    applied: number;
    ats_screening: number;
    ai_interview: number;
    selected: number;
    rejected: number;
}

interface Job {
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

interface CandidateProfile {
    experience?: string;
    skills?: string[];
    location?: string;
}

interface Candidate {
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

interface Interview {
    id: string;
    candidate_id: string;
    candidate_name: string;
    job_title: string;
    scheduled_time: string;
    duration: number;
    status: InterviewStatus;
    type: string;
}

interface CreateJobData {
    title: string;
    location: string;
    target_shortlist: number;
    closing_date: string;
    daily_start_time: string;
    daily_end_time: string;
    interview_duration: number;
}

type View = "jobs" | "interviews" | "create-job" | "job-detail" | "candidates" | "close-job-action" | "reject-action";

interface ActionContext {
    job?: Job;
    candidate?: Candidate;
}

// --- CONFIGURATION ---
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hr-ai-agent-backend-1lrx.onrender.com';

// --- UTILITY: API WRAPPER ---
const api = {
    async get<T>(endpoint: string): Promise<T> {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return await res.json();
    },
    async post<T>(endpoint: string, data: any): Promise<T> {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to post to ${endpoint}`);
        return await res.json();
    },
    async patch<T>(endpoint: string, data: any): Promise<T> {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to patch ${endpoint}`);
        return await res.json();
    },
};

// --- SCHEDULING ALGORITHM ---
const findNextAvailableSlot = (job: Job, existingInterviews: Interview[]): string | null => {
    let date = new Date();
    date.setDate(date.getDate() + 1); // Start looking from tomorrow
    date.setSeconds(0);
    date.setMilliseconds(0);

    const [startH, startM] = (job.daily_start_time || "09:00")
        .split(":")
        .map(Number);
    const [endH, endM] = (job.daily_end_time || "17:00").split(":").map(Number);
    const duration = parseInt(job.interview_duration?.toString() || "60");

    // Safety limit: Check next 30 days
    for (let i = 0; i < 30; i++) {
        // Skip weekends
        if (date.getDay() === 0) {
            date.setDate(date.getDate() + 1);
            continue;
        }
        if (date.getDay() === 6) {
            date.setDate(date.getDate() + 2);
            continue;
        }

        // Define search window for this day
        let currentSlot = new Date(date);
        currentSlot.setHours(startH, startM, 0, 0);

        let dayEnd = new Date(date);
        dayEnd.setHours(endH, endM, 0, 0);

        // Try to fit slots in this day
        while (currentSlot.getTime() + duration * 60000 <= dayEnd.getTime()) {
            // Check collision with existing interviews
            const isTaken = existingInterviews.some((int) => {
                const intTime = new Date(int.scheduled_time).getTime();
                // Simple collision: if starts at same time (For robust apps, check ranges)
                return Math.abs(intTime - currentSlot.getTime()) < 60000;
            });

            if (!isTaken) {
                return currentSlot.toISOString();
            }

            // Move to next slot
            currentSlot = new Date(currentSlot.getTime() + duration * 60000);
        }

        // Move to next day
        date.setDate(date.getDate() + 1);
    }
    return null; // No slot found
};

export default function HRDashboard() {
    const [currentView, setCurrentView] = useState<View>("jobs");
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [actionContext, setActionContext] = useState<ActionContext | null>(null);

    // App State - Start Empty
    const [jobs, setJobs] = useState<Job[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    // --- API DATA FETCHING ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [jobsData, candidatesData, interviewsData] = await Promise.all([
                    api.get<Job[]>("/jobs"),
                    api.get<Candidate[]>("/candidates"),
                    api.get<Interview[]>("/interviews"),
                ])

                setJobs(jobsData || []);
                setCandidates(candidatesData || []);
                setInterviews(interviewsData || []);
            } catch (err) {
                console.error("Data loading failed:", err);
                setJobs([]);
                setCandidates([]);
                setInterviews([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- STATS SYNC ---
    useEffect(() => {
        if (jobs.length > 0) {
            setJobs((prev) =>
                prev.map((job) => {
                    const jobCandidates = candidates.filter((c) => c.job_id === job.id);
                    return {
                        ...job,
                        pipeline: {
                            applied: jobCandidates.filter((c) => c.status === "Applied").length,
                            ats_screening: jobCandidates.filter((c) => c.status === "ATS Screening").length,
                            ai_interview: jobCandidates.filter((c) => c.status === "AI Interview").length,
                            selected: jobCandidates.filter((c) => c.status === "Selected").length,
                            rejected: jobCandidates.filter((c) => c.status === "Rejected").length,
                        },
                    };
                })
            );
        }
    }, [candidates.length]);

    // --- ACTIONS ---

    const handleCreateJob = async (newJobData: CreateJobData) => {
        try {
            const createdJob = await api.post<Job>("/jobs", {
                ...newJobData,
                status: "active" as JobStatus,
                created_at: new Date().toISOString(),
                pipeline: {
                    applied: 0,
                    ats_screening: 0,
                    ai_interview: 0,
                    selected: 0,
                    rejected: 0,
                },
            });
            setJobs((prev) => [createdJob, ...prev]);
            setCurrentView("jobs");
        } catch (err) {
            console.error(err);
            alert("Failed to create job (API error).");
        }
    };

    const handleUpdateStatus = async (candidateId: string, newStatus: CandidateStatus, reason: string | null = null) => {
        try {
            // Optimistic Update
            setCandidates((prev) =>
                prev.map((c) =>
                    c.id === candidateId
                        ? {
                            ...c,
                            status: newStatus,
                            ...(reason && { reject_reason: reason }),
                        }
                        : c
                )
            );

            await api.patch(`/candidates/${candidateId}`, {
                status: newStatus,
                reject_reason: reason,
            });

            const candidate = candidates.find((c) => c.id === candidateId);
            const job = jobs.find((j) => j.id === candidate?.job_id);

            // Trigger Auto-Scheduling for Final Round / AI Interview
            if (newStatus === "AI Interview" && job && candidate) {
                await scheduleFinalInterview(candidate, job);
            }

            if (["Selected", "AI Interview", "Rejected"].includes(newStatus))
                setSelectedCandidate(null);
            if (newStatus === "Rejected") {
                setCurrentView("candidates");
                setActionContext(null);
            }
        } catch (err) {
            console.error(err);
            alert("Update failed.");
        }
    };

    const scheduleFinalInterview = async (candidate: Candidate, job: Job) => {
        const slot = findNextAvailableSlot(job, interviews);

        if (!slot) {
            alert("Could not find an available time slot within the next 30 days!");
            return;
        }

        const newInterview: Interview = {
            id: Date.now().toString(), // Temporary ID
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            job_title: job.title,
            scheduled_time: slot,
            duration: job.interview_duration || 60,
            status: "scheduled",
            type: "Final Round",
        };

        try {
            const createdInterview = await api.post<Interview>("/interviews", newInterview);
            setInterviews((prev) => [...prev, createdInterview]);
            alert(
                `Auto-Scheduled Interview for ${candidate.name}\nDate: ${new Date(
                    slot
                ).toLocaleString()}`
            );
        } catch (err) {
            console.error("Scheduling failed", err);
        }
    };

    const handleCloseAndShortlist = async (
        jobId: string,
        selectedIds: string[],
        generatedInterviews: Interview[]
    ) => {
        try {
            await Promise.all([
                api.patch(`/jobs/${jobId}`, { status: "closed" }),
                ...selectedIds.map((id) =>
                    api.patch(`/candidates/${id}`, { status: "Selected" })
                ),
                ...generatedInterviews.map((int) => api.post("/interviews", int)),
            ]);

            setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j))
            );
            setInterviews((prev) => [...prev, ...generatedInterviews]);
            setCandidates((prev) =>
                prev.map((c) => {
                    if (c.job_id !== jobId) return c;
                    if (selectedIds.includes(c.id)) return { ...c, status: "Selected" };
                    if (c.status === "Applied") return { ...c, status: "Rejected" };
                    return c;
                })
            );
            setActionContext(null);
            setCurrentView("jobs");
        } catch (err) {
            console.error(err);
        }
    };

    const getJobCandidates = (jobId: string) =>
        candidates.filter((c) => c.job_id === jobId);

    if (loading)
        return (
            <div className="loading-screen">
                <Activity className="animate-spin" size={32} /> Loading HR Data...
            </div>
        );

    return (
        <div className="dashboard-container">
            <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap");
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        :root {
          --bg-primary: #0a0e17;
          --bg-secondary: #111827;
          --accent-primary: #00d9ff;
          --accent-secondary: #7c3aed;
          --accent-success: #10b981;
          --accent-warning: #f59e0b;
          --accent-danger: #ef4444;
          --text-primary: #f9fafb;
          --text-secondary: #9ca3af;
          --border: #1f2937;
        }
        body {
          font-family: "Outfit", sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            #0a0e17 0%,
            #111827 50%,
            #1a2234 100%
          );
          padding-bottom: 2rem;
        }
        .loading-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          color: white;
          gap: 1rem;
        }
        .header {
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .content {
          max-width: 1600px;
          margin: 0 auto;
          padding: 2rem;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.2s;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-primary {
          background: linear-gradient(
            135deg,
            var(--accent-primary),
            var(--accent-secondary)
          );
          color: white;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .btn-danger {
          background: var(--accent-danger);
          color: white;
        }
        .btn-success {
          background: var(--accent-success);
          color: white;
        }
        .job-card {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 1rem;
        }
        .job-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-5px);
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .badge-Applied {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        .badge-ATS-Screening {
          background: rgba(0, 217, 255, 0.2);
          color: var(--accent-primary);
        }
        .badge-AI-Interview {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-warning);
        }
        .badge-Selected {
          background: rgba(16, 185, 129, 0.2);
          color: var(--accent-success);
        }
        .badge-Rejected {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-danger);
        }
        .candidates-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(17, 24, 39, 0.6);
          border-radius: 12px;
          overflow: hidden;
          margin-top: 1rem;
        }
        .candidates-table th {
          text-align: left;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .candidates-table td {
          padding: 1rem;
          border-top: 1px solid var(--border);
        }
        .candidates-table tr:hover {
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
        }
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 900;
        }
        .drawer {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 600px;
          background: var(--bg-secondary);
          z-index: 901;
          padding: 2rem;
          overflow-y: auto;
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        .action-container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(17, 24, 39, 0.8);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--border);
        }
        .form-input {
          width: 100%;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: white;
          margin-bottom: 1rem;
          display: block;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

            <header className="header">
                <div
                    className="header-content"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                        }}
                    >
                        <Activity className="text-accent-primary" /> HR Command Center
                    </div>
                    <nav style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            className={`btn btn-secondary ${currentView === "jobs" ? "active" : ""
                                }`}
                            onClick={() => setCurrentView("jobs")}
                        >
                            Jobs
                        </button>
                        <button
                            className={`btn btn-secondary ${currentView === "interviews" ? "active" : ""
                                }`}
                            onClick={() => setCurrentView("interviews")}
                        >
                            Interviews
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setCurrentView("create-job")}
                        >
                            <Plus size={16} /> New Job
                        </button>
                    </nav>
                </div>
            </header>

            <div className="content">
                {currentView === "jobs" && (
                    <JobsListView
                        jobs={jobs}
                        onSelectJob={(job) => {
                            setSelectedJob(job);
                            setCurrentView("job-detail");
                        }}
                    />
                )}

                {currentView === "interviews" && (
                    <InterviewScheduleView interviews={interviews} />
                )}

                {currentView === "create-job" && (
                    <CreateJobForm
                        onBack={() => setCurrentView("jobs")}
                        onSuccess={handleCreateJob}
                    />
                )}

                {currentView === "job-detail" && selectedJob && (
                    <JobDetailView
                        job={selectedJob}
                        onBack={() => setCurrentView("jobs")}
                        onViewCandidates={() => setCurrentView("candidates")}
                        onCloseJob={() => {
                            setActionContext({ job: selectedJob });
                            setCurrentView("close-job-action");
                        }}
                    />
                )}

                {currentView === "candidates" && selectedJob && (
                    <CandidatesView
                        candidates={getJobCandidates(selectedJob.id)}
                        job={selectedJob}
                        onBack={() => setCurrentView("job-detail")}
                        onSelectCandidate={setSelectedCandidate}
                    />
                )}

                {currentView === "close-job-action" && actionContext?.job && (
                    <CloseJobActionPage
                        job={actionContext.job}
                        candidates={getJobCandidates(actionContext.job.id)}
                        existingInterviews={interviews}
                        onBack={() => setCurrentView("job-detail")}
                        onComplete={handleCloseAndShortlist}
                    />
                )}

                {currentView === "reject-action" && actionContext?.candidate && (
                    <RejectActionPage
                        candidate={actionContext.candidate}
                        onBack={() => setCurrentView("candidates")}
                        onComplete={(id: string, reason: string) =>
                            handleUpdateStatus(id, "Rejected", reason)
                        }
                    />
                )}

                {selectedCandidate && (
                    <CandidateDrawer
                        candidate={selectedCandidate}
                        onClose={() => setSelectedCandidate(null)}
                        onUpdateStatus={handleUpdateStatus}
                        onRejectRequest={() => {
                            setSelectedCandidate(null);
                            setActionContext({ candidate: selectedCandidate });
                            setCurrentView("reject-action");
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

interface JobsListViewProps {
    jobs: Job[];
    onSelectJob: (job: Job) => void;
}

function JobsListView({ jobs, onSelectJob }: JobsListViewProps) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1.5rem",
            }}
        >
            {jobs.length === 0 && (
                <div
                    style={{
                        gridColumn: "1/-1",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                        padding: "2rem",
                    }}
                >
                    No active jobs found. Create one to get started.
                </div>
            )}
            {jobs.map((job) => (
                <div key={job.id} className="job-card" onClick={() => onSelectJob(job)}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                        }}
                    >
                        <h3 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                            {job.title}
                        </h3>
                        <span className={`status-badge ${job.status}`}>{job.status}</span>
                    </div>
                    <div
                        style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem",
                            marginBottom: "0.5rem",
                        }}
                    >
                        {job.location}
                    </div>
                    {job.closing_date && (
                        <div
                            style={{
                                fontSize: "0.8rem",
                                color: "var(--accent-warning)",
                                marginBottom: "1rem",
                            }}
                        >
                            <Calendar
                                size={12}
                                style={{ display: "inline", marginRight: "4px" }}
                            />
                            Expires: {new Date(job.closing_date).toLocaleDateString()}
                        </div>
                    )}

                    <div
                        style={{
                            marginTop: "1rem",
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: "0.2rem",
                            textAlign: "center",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: "bold" }}>
                                {job.pipeline?.applied || 0}
                            </div>
                            <div
                                style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}
                            >
                                APPLIED
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: "bold" }}>
                                {job.pipeline?.ats_screening || 0}
                            </div>
                            <div
                                style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}
                            >
                                SCREEN
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: "bold" }}>
                                {job.pipeline?.ai_interview || 0}
                            </div>
                            <div
                                style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}
                            >
                                AI INT
                            </div>
                        </div>
                        <div>
                            <div
                                style={{ fontWeight: "bold", color: "var(--accent-success)" }}
                            >
                                {job.pipeline?.selected || 0}
                            </div>
                            <div
                                style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}
                            >
                                SELECT
                            </div>
                        </div>
                        <div>
                            <div
                                style={{ fontWeight: "bold", color: "var(--accent-danger)" }}
                            >
                                {job.pipeline?.rejected || 0}
                            </div>
                            <div
                                style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}
                            >
                                REJECT
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface InterviewScheduleViewProps {
    interviews: Interview[];
}

function InterviewScheduleView({ interviews }: InterviewScheduleViewProps) {
    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem" }}>Upcoming Interviews</h2>
            {interviews.length === 0 ? (
                <div
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                    }}
                >
                    No interviews scheduled.
                </div>
            ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {interviews
                        .sort(
                            (a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
                        )
                        .map((int) => (
                            <div
                                key={int.id}
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                                >
                                    <Clock className="text-accent-primary" />
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                                color: "var(--accent-primary)",
                                            }}
                                        >
                                            {new Date(int.scheduled_time).toLocaleString()}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {int.type || "Standard Interview"} ({int.duration || 60}m)
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: "bold" }}>{int.candidate_name}</div>
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {int.job_title}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

interface CreateJobFormProps {
    onBack: () => void;
    onSuccess: (data: CreateJobData) => void;
}

function CreateJobForm({ onBack, onSuccess }: CreateJobFormProps) {
    const [formData, setFormData] = useState<CreateJobData>({
        title: "",
        location: "",
        target_shortlist: 5,
        closing_date: "",
        daily_start_time: "09:00",
        daily_end_time: "17:00",
        interview_duration: 60,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'interview_duration' || name === 'target_shortlist'
                ? parseInt(value)
                : value
        }));
    };

    return (
        <div className="action-container">
            <h2 style={{ marginBottom: "1.5rem" }}>Create New Position</h2>
            <label className="form-label">Job Title</label>
            <input
                className="form-input"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Engineer"
            />

            <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
            >
                <div>
                    <label className="form-label">Location</label>
                    <input
                        className="form-input"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Remote"
                    />
                </div>
                <div>
                    <label className="form-label">Closing Date</label>
                    <input
                        className="form-input"
                        type="date"
                        name="closing_date"
                        value={formData.closing_date}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div
                style={{
                    marginTop: "1.5rem",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                }}
            >
                <h3
                    style={{
                        fontSize: "1rem",
                        marginBottom: "1rem",
                        color: "var(--accent-primary)",
                    }}
                >
                    Auto-Scheduling Configuration
                </h3>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    <div>
                        <label className="form-label">Daily Start Time</label>
                        <input
                            className="form-input"
                            type="time"
                            name="daily_start_time"
                            value={formData.daily_start_time}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="form-label">Daily End Time</label>
                        <input
                            className="form-input"
                            type="time"
                            name="daily_end_time"
                            value={formData.daily_end_time}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="form-label">Duration (Mins)</label>
                        <input
                            className="form-input"
                            type="number"
                            name="interview_duration"
                            value={formData.interview_duration}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "1rem",
                    marginTop: "1.5rem",
                }}
            >
                <button className="btn btn-secondary" onClick={onBack}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={() => onSuccess(formData)}>
                    Create Job
                </button>
            </div>
        </div>
    );
}

interface JobDetailViewProps {
    job: Job;
    onBack: () => void;
    onViewCandidates: () => void;
    onCloseJob: () => void;
}

function JobDetailView({ job, onBack, onViewCandidates, onCloseJob }: JobDetailViewProps) {
    return (
        <div>
            <button
                className="btn btn-secondary"
                onClick={onBack}
                style={{ marginBottom: "1rem" }}
            >
                <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Back
            </button>
            <div className="action-container" style={{ maxWidth: "100%" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                            {job.title}
                        </h1>
                        <div style={{ color: "var(--text-secondary)" }}>{job.location}</div>
                    </div>
                    <span
                        className={`status-badge ${job.status}`}
                        style={{ fontSize: "1rem" }}
                    >
                        {job.status}
                    </span>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                    <button className="btn btn-primary" onClick={onViewCandidates}>
                        <Users size={18} /> View Candidates
                    </button>
                    {job.status === "active" && (
                        <button className="btn btn-secondary" onClick={onCloseJob}>
                            <CheckCircle size={18} /> Close & Shortlist
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface CandidatesViewProps {
    candidates: Candidate[];
    job: Job;
    onBack: () => void;
    onSelectCandidate: (candidate: Candidate) => void;
}

function CandidatesView({ candidates, job, onBack, onSelectCandidate }: CandidatesViewProps) {
    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                }}
            >
                <button className="btn btn-secondary" onClick={onBack}>
                    <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />{" "}
                    Back
                </button>
                <h2>Candidates: {job.title}</h2>
            </div>
            <table className="candidates-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Scores</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {candidates.map((c) => (
                        <tr
                            key={c.id}
                            onClick={() => onSelectCandidate(c)}
                            style={{ opacity: c.status === "Rejected" ? 0.5 : 1 }}
                        >
                            <td>
                                <div style={{ fontWeight: "bold" }}>{c.name}</div>
                                <div
                                    style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
                                >
                                    {c.email}
                                </div>
                            </td>
                            <td>
                                <span
                                    className={`status-badge badge-${c.status.replace(" ", "-")}`}
                                >
                                    {c.status}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <span>ATS: {c.ats_score || 0}</span>
                                    {c.interview_score && (
                                        <span style={{ color: "var(--accent-primary)" }}>
                                            AI: {c.interview_score}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: "0.3rem 0.6rem" }}
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface CloseJobActionPageProps {
    job: Job;
    candidates: Candidate[];
    existingInterviews: Interview[];
    onBack: () => void;
    onComplete: (jobId: string, selectedIds: string[], generatedInterviews: Interview[]) => void;
}

function CloseJobActionPage({
    job,
    candidates,
    existingInterviews,
    onBack,
    onComplete,
}: CloseJobActionPageProps) {
    const [selected, setSelected] = useState<string[]>([]);
    const eligible = candidates
        .filter((c) => c.status === "Applied")
        .sort((a, b) => (b.ats_score || 0) - (a.ats_score || 0));

    useEffect(() => {
        setSelected(eligible.slice(0, job.target_shortlist || 5).map((c) => c.id));
    }, [eligible.length]);

    const toggle = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const handleConfirm = () => {
        // Bulk Auto-Schedule Logic
        let currentInterviews = [...existingInterviews];
        const newInterviews: Interview[] = [];

        selected.forEach((cid) => {
            const candidate = candidates.find((c) => c.id === cid);
            const slot = findNextAvailableSlot(job, currentInterviews);

            if (slot && candidate) {
                const interview: Interview = {
                    id: Date.now().toString(), // Temporary ID
                    candidate_id: cid,
                    candidate_name: candidate.name,
                    job_title: job.title,
                    scheduled_time: slot,
                    duration: job.interview_duration || 60,
                    status: "scheduled",
                    type: "Initial Screening",
                };
                newInterviews.push(interview);
                currentInterviews.push(interview); // Update local state for next iteration collision check
            }
        });

        onComplete(job.id, selected, newInterviews);
    };

    return (
        <div className="action-container">
            <h2>Shortlist Candidates</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Select candidates to shortlist and auto-schedule screenings.
            </p>
            <div
                style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "2rem" }}
            >
                {eligible.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => toggle(c.id)}
                        style={{
                            padding: "1rem",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            marginBottom: "0.5rem",
                            cursor: "pointer",
                            background: selected.includes(c.id)
                                ? "rgba(0,217,255,0.1)"
                                : "transparent",
                            borderColor: selected.includes(c.id)
                                ? "var(--accent-primary)"
                                : "var(--border)",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                        }}
                    >
                        <input type="checkbox" checked={selected.includes(c.id)} readOnly />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold" }}>{c.name}</div>
                            <div>ATS: {c.ats_score || 0}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button className="btn btn-secondary" onClick={onBack}>
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleConfirm}
                    disabled={selected.length === 0}
                >
                    Shortlist ({selected.length})
                </button>
            </div>
        </div>
    );
}

interface RejectActionPageProps {
    candidate: Candidate;
    onBack: () => void;
    onComplete: (id: string, reason: string) => void;
}

function RejectActionPage({ candidate, onBack, onComplete }: RejectActionPageProps) {
    const [reason, setReason] = useState("");
    return (
        <div className="action-container">
            <h2 style={{ color: "var(--accent-danger)" }}>Reject Candidate</h2>
            <p style={{ marginBottom: "1rem" }}>
                Rejecting: <strong>{candidate.name}</strong>
            </p>
            <textarea
                className="form-input"
                rows={4}
                placeholder="Reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button className="btn btn-secondary" onClick={onBack}>
                    Cancel
                </button>
                <button
                    className="btn btn-danger"
                    onClick={() => onComplete(candidate.id, reason)}
                >
                    Confirm Rejection
                </button>
            </div>
        </div>
    );
}

interface CandidateDrawerProps {
    candidate: Candidate;
    onClose: () => void;
    onUpdateStatus: (candidateId: string, newStatus: CandidateStatus, reason?: string | null) => void;
    onRejectRequest: () => void;
}

function CandidateDrawer({
    candidate,
    onClose,
    onUpdateStatus,
    onRejectRequest,
}: CandidateDrawerProps) {
    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className="drawer">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "2rem",
                    }}
                >
                    <h2>{candidate.name}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                        }}
                    >
                        <X />
                    </button>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <span
                        className={`status-badge badge-${candidate.status.replace(
                            " ",
                            "-"
                        )}`}
                        style={{ fontSize: "1.1rem" }}
                    >
                        {candidate.status}
                    </span>
                </div>

                <div
                    className="info-section"
                    style={{
                        marginBottom: "2rem",
                        background: "rgba(255,255,255,0.05)",
                        padding: "1rem",
                        borderRadius: "8px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                            color: "var(--text-secondary)",
                            alignItems: "center",
                        }}
                    >
                        <Phone size={14} /> {candidate.phone || "N/A"}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginBottom: "1rem",
                            color: "var(--text-secondary)",
                            alignItems: "center",
                        }}
                    >
                        <LinkIcon size={14} />
                        {candidate.resume_url ? (
                            <a
                                href={candidate.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: "var(--accent-primary)",
                                    textDecoration: "none",
                                }}
                            >
                                View Resume
                            </a>
                        ) : (
                            <span>No Resume</span>
                        )}
                    </div>

                    <div
                        style={{
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            color: "var(--text-secondary)",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Resume Summary
                    </div>
                    <div style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                        <p>
                            <strong>Experience:</strong>{" "}
                            {candidate.profile?.experience || "N/A"}
                        </p>
                        <p>
                            <strong>Key Skills:</strong>{" "}
                            {candidate.profile?.skills?.join(", ") || "N/A"}
                        </p>
                        <p>
                            <strong>Location:</strong> {candidate.profile?.location || "N/A"}
                        </p>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <div
                                style={{
                                    fontSize: "0.8rem",
                                    textTransform: "uppercase",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                ATS Score
                            </div>
                            <div
                                style={{
                                    fontSize: "2rem",
                                    fontWeight: "bold",
                                    color: "var(--accent-primary)",
                                }}
                            >
                                {candidate.ats_score || 0}/100
                            </div>
                        </div>
                        {candidate.interview_score && (
                            <div>
                                <div
                                    style={{
                                        fontSize: "0.8rem",
                                        textTransform: "uppercase",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    AI Interview
                                </div>
                                <div
                                    style={{
                                        fontSize: "2rem",
                                        fontWeight: "bold",
                                        color: "var(--accent-success)",
                                    }}
                                >
                                    {candidate.interview_score}/100
                                </div>
                            </div>
                        )}
                    </div>

                    <ul
                        style={{
                            marginTop: "1rem",
                            paddingLeft: "1.2rem",
                            color: "var(--text-secondary)",
                        }}
                    >
                        {candidate.ats_reasons?.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>

                <div
                    style={{
                        marginTop: "auto",
                        paddingTop: "2rem",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        gap: "1rem",
                        flexDirection: "column",
                    }}
                >
                    {candidate.status !== "Rejected" &&
                        candidate.status !== "Selected" && (
                            <>
                                {candidate.status !== "AI Interview" && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ justifyContent: "center" }}
                                        onClick={() => onUpdateStatus(candidate.id, "AI Interview")}
                                    >
                                        <Star size={18} /> Move to AI Interview (Auto-Schedule)
                                    </button>
                                )}

                                <button
                                    className="btn btn-success"
                                    style={{ justifyContent: "center" }}
                                    onClick={() => onUpdateStatus(candidate.id, "Selected")}
                                >
                                    <UserCheck size={18} /> Select Candidate
                                </button>

                                <button
                                    className="btn btn-danger"
                                    style={{ justifyContent: "center" }}
                                    onClick={onRejectRequest}
                                >
                                    <Trash2 size={18} /> Reject
                                </button>
                            </>
                        )}

                    {(candidate.status === "Rejected" ||
                        candidate.status === "Selected") && (
                            <div
                                style={{ textAlign: "center", color: "var(--text-secondary)" }}
                            >
                                No further actions available.
                            </div>
                        )}
                </div>
            </div>
        </>
    );
}