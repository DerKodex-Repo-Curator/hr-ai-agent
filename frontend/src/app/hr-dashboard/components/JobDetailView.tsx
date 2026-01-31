// src/app/hr-dashboard/components/JobDetailView.tsx
import React from 'react';
import { ChevronRight, Users, CheckCircle } from 'lucide-react';
import { Job } from '../utils/types';

interface JobDetailViewProps {
    job: Job;
    onBack: () => void;
    onViewCandidates: () => void;
    onCloseJob: () => void;
}

const JobDetailView: React.FC<JobDetailViewProps> = ({ job, onBack, onViewCandidates, onCloseJob }) => {
    return (
        <div>
            <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
                <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Back
            </button>
            <div className="action-container" style={{ maxWidth: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{job.title}</h1>
                        <div style={{ color: "var(--text-secondary)" }}>{job.location}</div>
                    </div>
                    <span className={`status-badge ${job.status}`} style={{ fontSize: "1rem" }}>{job.status}</span>
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
};

export default JobDetailView;