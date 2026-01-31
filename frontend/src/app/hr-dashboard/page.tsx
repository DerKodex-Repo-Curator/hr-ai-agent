// src/app/hr-dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Activity, Plus } from "lucide-react";
import JobCard from "./components/JobCard";
import InterviewScheduleView from "./components/InterviewScheduleView";
import CreateJobForm from "./components/CreateJobForm";
import JobDetailView from "./components/JobDetailView";
import CandidatesView from "./components/CandidatesView";
import CloseJobActionPage from "./components/CloseJobActionPage";
import RejectActionPage from "./components/RejectActionPage";
import CandidateDrawer from "./components/CandidateDrawer";
import {
    fetchJobs,
    fetchCandidates,
    fetchInterviews,
    createJob,
    updateCandidate,
    createInterview,
    updateJob
} from "./utils/api";
import { findNextAvailableSlot } from "./utils/scheduling";
import { Job, Candidate, Interview, CreateJobData, View, ActionContext, CandidateStatus } from "./utils/types";
import "./styles/global.css";

export default function HRDashboard() {
    const [currentView, setCurrentView] = useState<View>("jobs");
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [actionContext, setActionContext] = useState<ActionContext | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // const [jobsData, candidatesData, interviewsData] = await Promise.all([
                //     fetchJobs(),
                //     fetchCandidates(),
                //     fetchInterviews()
                // ]);
                // setJobs(jobsData || []);
                // setCandidates(candidatesData || []);
                // setInterviews(interviewsData || []);
                const [jobsData,] = await Promise.all([
                    fetchJobs(),
                ]);
                setJobs(jobsData || []);
                setCandidates([]);
                setInterviews([]);
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

    const handleCreateJob = async (newJobData: CreateJobData) => {
        try {
            const createdJob = await createJob({
                ...newJobData,
                status: "active",
                created_at: new Date().toISOString(),
                pipeline: { applied: 0, ats_screening: 0, ai_interview: 0, selected: 0, rejected: 0 },
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
            setCandidates((prev) =>
                prev.map((c) =>
                    c.id === candidateId
                        ? { ...c, status: newStatus, ...(reason && { reject_reason: reason }) }
                        : c
                )
            );

            await updateCandidate(candidateId, { status: newStatus, reject_reason: reason });

            const candidate = candidates.find((c) => c.id === candidateId);
            const job = jobs.find((j) => j.id === candidate?.job_id);

            if (newStatus === "AI Interview" && job && candidate) {
                const slot = findNextAvailableSlot(job, interviews);
                if (!slot) {
                    alert("Could not find an available time slot within the next 30 days!");
                    return;
                }

                const newInterview: Interview = {
                    id: Date.now().toString(),
                    candidate_id: candidate.id,
                    candidate_name: candidate.name,
                    job_title: job.title,
                    scheduled_time: slot,
                    duration: job.interview_duration || 60,
                    status: "scheduled",
                    type: "Final Round",
                };

                try {
                    const createdInterview = await createInterview(newInterview);
                    setInterviews((prev) => [...prev, createdInterview]);
                    alert(`Auto-Scheduled Interview for ${candidate.name}\nDate: ${new Date(slot).toLocaleString()}`);
                } catch (err) {
                    console.error("Scheduling failed", err);
                }
            }

            if (["Selected", "AI Interview", "Rejected"].includes(newStatus)) setSelectedCandidate(null);
            if (newStatus === "Rejected") {
                setCurrentView("candidates");
                setActionContext(null);
            }
        } catch (err) {
            console.error(err);
            alert("Update failed.");
        }
    };

    const handleCloseAndShortlist = async (jobId: string, selectedIds: string[], generatedInterviews: Interview[]) => {
        try {
            await Promise.all([
                updateJob(jobId, { status: "closed" }),
                ...selectedIds.map((id) => updateCandidate(id, { status: "Selected" })),
                ...generatedInterviews.map((int) => createInterview(int)),
            ]);

            setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j)));
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

    const getJobCandidates = (jobId: string) => candidates.filter((c) => c.job_id === jobId);

    if (loading) {
        return (
            <div className="loading-screen">
                <Activity className="animate-spin" size={32} /> Loading HR Data...
            </div>
        );
    }

    return (
        <div className="hr-dashboard">
            <div className="dashboard-container">
                <header className="header">
                    <div className="header-content">
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "1.5rem", fontWeight: "bold" }}>
                            <Activity className="text-accent-primary" /> HR Command Center
                        </div>
                        <nav style={{ display: "flex", gap: "0.5rem" }}>
                            <button className={`btn btn-secondary ${currentView === "jobs" ? "active" : ""}`} onClick={() => setCurrentView("jobs")}>Jobs</button>
                            <button className={`btn btn-secondary ${currentView === "interviews" ? "active" : ""}`} onClick={() => setCurrentView("interviews")}>Interviews</button>
                            <button className="btn btn-primary" onClick={() => setCurrentView("create-job")}><Plus size={16} /> New Job</button>
                        </nav>
                    </div>
                </header>

                <div className="content">
                    {currentView === "jobs" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                            {jobs.length === 0 && (
                                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                                    No active jobs found. Create one to get started.
                                </div>
                            )}
                            {jobs.map((job) => (
                                <JobCard key={job.id} job={job} onClick={() => { setSelectedJob(job); setCurrentView("job-detail"); }} />
                            ))}
                        </div>
                    )}

                    {currentView === "interviews" && <InterviewScheduleView interviews={interviews} />}
                    {currentView === "create-job" && <CreateJobForm onBack={() => setCurrentView("jobs")} onSuccess={handleCreateJob} />}
                    {currentView === "job-detail" && selectedJob && (
                        <JobDetailView
                            job={selectedJob}
                            onBack={() => setCurrentView("jobs")}
                            onViewCandidates={() => setCurrentView("candidates")}
                            onCloseJob={() => { setActionContext({ job: selectedJob }); setCurrentView("close-job-action"); }}
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
                            onComplete={(id: string, reason: string) => handleUpdateStatus(id, "Rejected", reason)}
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
        </div>
    );
}