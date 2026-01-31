"use client";

import React, { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, Clock, Users, Briefcase, Activity,
    ChevronRight, Plus, Eye, X, Trash2, ArrowRight, UserCheck, Star, Calendar, FileText
} from 'lucide-react';

interface Candidate {
    id: number;
    name: string;
    email: string;
    job_id: number;
    status: string;
    ats_score: number;
    transcript_score?: number | null;
    profile: {
        experience: string;
        skills: string[];
        location: string;
        current_role: string;
        summary: string;
    };
    ats_reasons: string[];
    reject_reason?: string; // Optional field for rejection
}

// --- DATA GENERATION HELPERS ---
const generateMockCandidates = () => {
    const candidates: { id: number; name: string; email: string; job_id: number; status: string; ats_score: number; transcript_score: number | null; profile: { experience: string; skills: string[]; location: string; current_role: string; summary: string; }; ats_reasons: string[]; }[] = [];
    let idCounter = 100;
    const frontendSkills = ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Node.js', 'GraphQL', 'AWS', 'Redux'];
    const designSkills = ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'UI/UX', 'Wireframing', 'HTML/CSS'];

    const getRandomSkills = (type: string) => {
        const pool = type === 'frontend' ? frontendSkills : designSkills;
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    };

    const createBatch = (jobId: number, jobType: string, status: string, count: number, baseScore: number) => {
        for (let i = 0; i < count; i++) {
            const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
            const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
            const locations = ['Remote', 'New York', 'San Francisco', 'London', 'Berlin', 'Austin'];

            const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            const expYears = Math.floor(Math.random() * 8) + 1;
            const skills = getRandomSkills(jobType);

            candidates.push({
                id: idCounter++,
                name: name,
                email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                job_id: jobId,
                status: status,
                ats_score: Math.min(100, Math.floor(Math.random() * 20) + baseScore),
                transcript_score: status === 'shortlisted' ? Math.min(100, Math.floor(Math.random() * 20) + 70) : null,
                profile: {
                    experience: `${expYears} years`,
                    skills: skills,
                    location: locations[Math.floor(Math.random() * locations.length)],
                    current_role: jobType === 'frontend' ? 'Software Engineer' : 'Product Designer',
                    summary: `${expYears} years of experience in ${skills[0]} and ${skills[1]}.`
                },
                ats_reasons: ['Qualified based on resume parsing', 'Skills match requirements']
            });
        }
    };

    createBatch(1, 'frontend', 'shortlisted', 15, 80);
    createBatch(1, 'frontend', 'submitted', 50, 60);
    createBatch(2, 'design', 'shortlisted', 15, 80);
    createBatch(2, 'design', 'submitted', 50, 60);

    return candidates;
};

const INITIAL_JOBS = [
    {
        id: 1, title: 'Senior Frontend Engineer', status: 'active', location: 'Remote',
        created_at: '2026-01-15', closing_date: '2026-03-01', target_shortlist: 5, interview_times: ['09:00', '14:00'],
        pipeline: { submitted: 0, shortlisted: 0, final_round: 0, hired: 0, rejected: 0 }
    },
    {
        id: 2, title: 'Product Designer', status: 'active', location: 'San Francisco',
        created_at: '2026-01-20', closing_date: '2026-02-28', target_shortlist: 3, interview_times: ['10:00', '15:00'],
        pipeline: { submitted: 0, shortlisted: 0, final_round: 0, hired: 0, rejected: 0 }
    }
];

const GENERATED_CANDIDATES = generateMockCandidates();

export default function HRDashboard() {
    const [currentView, setCurrentView] = useState('jobs');
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [actionContext, setActionContext] = useState<any>(null);
    const [jobs, setJobs] = useState(INITIAL_JOBS);
    const [candidates, setCandidates] = useState<Candidate[]>(GENERATED_CANDIDATES); const [interviews, setInterviews] = useState<any[]>([]);

    useEffect(() => {
        setJobs(prevJobs => prevJobs.map(job => {
            const jobCandidates = candidates.filter(c => c.job_id === job.id);
            return {
                ...job,
                pipeline: {
                    submitted: jobCandidates.filter(c => c.status === 'submitted').length,
                    shortlisted: jobCandidates.filter(c => c.status === 'shortlisted').length,
                    final_round: jobCandidates.filter(c => c.status === 'final_round').length,
                    hired: jobCandidates.filter(c => c.status === 'hired').length,
                    rejected: jobCandidates.filter(c => c.status === 'rejected').length
                }
            };
        }));
    }, [candidates]);

    const handleCreateJob = (newJobData: any) => {
        const newJob = {
            ...newJobData,
            id: Date.now(),
            status: 'active',
            created_at: new Date().toISOString(),
            pipeline: { submitted: 0, shortlisted: 0, final_round: 0, hired: 0, rejected: 0 }
        };
        setJobs(prev => [newJob, ...prev]);
        setCurrentView('jobs');
    };

    const handleUpdateStatus = (candidateId: number, newStatus: string, reason: string | null = null) => {
        setCandidates(prev => prev.map(c =>
            c.id === candidateId
                ? { ...c, status: newStatus, ...(reason && { reject_reason: reason }) }
                : c
        ));

        const candidate = candidates.find(c => c.id === candidateId);
        const job = jobs.find(j => j.id === candidate?.job_id);

        if (newStatus === 'final_round' && job) {
            scheduleFinalInterview(candidate, job);
        }

        if (['hired', 'final_round', 'rejected'].includes(newStatus)) {
            setSelectedCandidate(null);
        }
        if (newStatus === 'rejected') {
            setCurrentView('candidates');
            setActionContext(null);
        }
    };

    const scheduleFinalInterview = (candidate: any, job: any) => {
        let date = new Date();
        date.setDate(date.getDate() + 1);
        if (date.getDay() === 0) date.setDate(date.getDate() + 1);
        if (date.getDay() === 6) date.setDate(date.getDate() + 2);

        const timeSlot = job.interview_times[Math.floor(Math.random() * job.interview_times.length)] || '10:00';
        const [h, m] = timeSlot.split(':');
        date.setHours(parseInt(h), parseInt(m));

        const newInterview = {
            id: Date.now(),
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            job_title: job.title,
            scheduled_time: date.toISOString(),
            status: 'scheduled',
            type: 'Final Round'
        };

        setInterviews(prev => [...prev, newInterview]);
        alert(`Auto-Scheduled Final Round Interview for ${candidate.name}\nDate: ${date.toLocaleString()}`);
    };

    const handleCloseAndShortlist = (jobId: number, selectedIds: number[], generatedInterviews: any[]) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'closed' } : j));
        setInterviews(prev => [...prev, ...generatedInterviews]);
        setCandidates(prev => prev.map(c => {
            if (c.job_id !== jobId) return c;
            if (selectedIds.includes(c.id)) return { ...c, status: 'shortlisted' };
            if (c.status === 'submitted') return { ...c, status: 'rejected' };
            return c;
        }));
        setActionContext(null);
        setCurrentView('jobs');
    };

    const getJobCandidates = (jobId: number) => candidates.filter(c => c.job_id === jobId);

    return (
        <div className="dashboard-container">
            <style jsx global>{`
        :root {
          --bg-primary: #0a0e17; --bg-secondary: #111827;
          --accent-primary: #00d9ff; --accent-secondary: #7c3aed; 
          --accent-success: #10b981; --accent-warning: #f59e0b; --accent-danger: #ef4444;
          --text-primary: #f9fafb; --text-secondary: #9ca3af; --border: #1f2937;
        }
        .dashboard-container { min-height: 100vh; background: linear-gradient(135deg, #0a0e17 0%, #111827 50%, #1a2234 100%); color: var(--text-primary); }
        .header { background: rgba(17, 24, 39, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 1.5rem 2rem; position: sticky; top: 0; z-index: 100; }
        .content { max-width: 1600px; margin: 0 auto; padding: 2rem; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: 0.2s; border: none; }
        .btn-primary { background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); color: white; }
        .btn-secondary { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); border: 1px solid var(--border); }
        .job-card { background: rgba(17, 24, 39, 0.6); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; cursor: pointer; transition: all 0.3s; }
        .job-card:hover { border-color: var(--accent-primary); transform: translateY(-5px); }
        .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
        .status-badge.active { background: rgba(16, 185, 129, 0.2); color: var(--accent-success); }
        .candidates-table { width: 100%; border-collapse: collapse; background: rgba(17, 24, 39, 0.6); border-radius: 12px; overflow: hidden; }
        .candidates-table td, .candidates-table th { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border); }
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 900; }
        .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 500px; background: var(--bg-secondary); z-index: 901; padding: 2rem; border-left: 1px solid var(--border); }
        .form-input { width: 100%; padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; color: white; margin-bottom: 1rem; }
      `}</style>

            <header className="header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        <Activity className="text-accent-primary" /> HR Command Center
                    </div>
                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => setCurrentView('jobs')}>Jobs</button>
                        <button className="btn btn-secondary" onClick={() => setCurrentView('interviews')}>Interviews</button>
                        <button className="btn btn-primary" onClick={() => setCurrentView('create-job')}><Plus size={16} /> New Job</button>
                    </nav>
                </div>
            </header>

            <div className="content">
                {currentView === 'jobs' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {jobs.map(job => (
                            <div key={job.id} className="job-card" onClick={() => { setSelectedJob(job); setCurrentView('job-detail'); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem' }}>{job.title}</h3>
                                    <span className={`status-badge ${job.status}`}>{job.status}</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{job.location}</div>
                                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                    <div><div style={{ fontWeight: 'bold' }}>{job.pipeline.submitted}</div><div style={{ fontSize: '0.6rem' }}>NEW</div></div>
                                    <div><div style={{ fontWeight: 'bold' }}>{job.pipeline.shortlisted}</div><div style={{ fontSize: '0.6rem' }}>SHORT</div></div>
                                    <div><div style={{ fontWeight: 'bold' }}>{job.pipeline.final_round}</div><div style={{ fontSize: '0.6rem' }}>FINAL</div></div>
                                    <div><div style={{ fontWeight: 'bold', color: 'var(--accent-success)' }}>{job.pipeline.hired}</div><div style={{ fontSize: '0.6rem' }}>HIRED</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {currentView === 'job-detail' && selectedJob && (
                    <div>
                        <button className="btn btn-secondary" onClick={() => setCurrentView('jobs')} style={{ marginBottom: '1.5rem' }}>← Back</button>
                        <div style={{ background: 'rgba(17,24,39,0.8)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <h1 style={{ fontSize: '2.5rem' }}>{selectedJob.title}</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>{selectedJob.location}</p>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setCurrentView('candidates')}>View {getJobCandidates(selectedJob.id).length} Candidates</button>
                                {selectedJob.status === 'active' && <button className="btn btn-secondary" onClick={() => { setActionContext({ job: selectedJob }); setCurrentView('close-job-action'); }}>Close & Shortlist</button>}
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'candidates' && selectedJob && (
                    <div>
                        <button className="btn btn-secondary" onClick={() => setCurrentView('job-detail')} style={{ marginBottom: '1.5rem' }}>← Back</button>
                        <table className="candidates-table">
                            <thead><tr><th>Name</th><th>Status</th><th>ATS Score</th><th>Actions</th></tr></thead>
                            <tbody>
                                {getJobCandidates(selectedJob.id).map(c => (
                                    <tr key={c.id} onClick={() => setSelectedCandidate(c)} style={{ cursor: 'pointer' }}>
                                        <td>{c.name}</td>
                                        <td><span className={`status-badge`}>{c.status}</span></td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{c.ats_score}</td>
                                        <td><Eye size={18} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Simplified Auth/Rejection Logic in Drawers */}
                {selectedCandidate && (
                    <>
                        <div className="drawer-overlay" onClick={() => setSelectedCandidate(null)} />
                        <div className="drawer">
                            <h2 style={{ fontSize: '1.8rem' }}>{selectedCandidate.name}</h2>
                            <div style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
                                <p><strong>Experience:</strong> {selectedCandidate.profile.experience}</p>
                                <p><strong>Location:</strong> {selectedCandidate.profile.location}</p>
                                <div style={{ marginTop: '2rem' }}>
                                    <div style={{ fontSize: '0.8rem' }}>ATS SCORE</div>
                                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{selectedCandidate.ats_score}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '2rem' }}>
                                <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedCandidate.id, 'final_round')}>Move to Final (Auto-Schedule)</button>
                                <button className="btn btn-secondary" style={{ backgroundColor: 'var(--accent-success)' }} onClick={() => handleUpdateStatus(selectedCandidate.id, 'hired')}>Hire Crew Member</button>
                                <button className="btn btn-secondary" style={{ backgroundColor: 'var(--accent-danger)' }} onClick={() => handleUpdateStatus(selectedCandidate.id, 'rejected')}>Reject</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}