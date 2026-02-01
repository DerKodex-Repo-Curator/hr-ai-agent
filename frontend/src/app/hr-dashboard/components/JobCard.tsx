// src/app/hr-dashboard/components/JobCard.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import { Job } from '../utils/types';

interface JobCardProps {
    job: Job;
    onClick: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
    return (
        <div className="job-card" onClick={onClick}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{job.role_title}</h3>
                <span className={`status-badge ${job.status}`}>{job.status}</span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                {job.location}
            </div>
            {job.closing_date && (
                <div style={{ fontSize: "0.8rem", color: "var(--accent-warning)", marginBottom: "1rem" }}>
                    <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
                    Expires: {new Date(job.closing_date).toLocaleDateString()}
                </div>
            )}

            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.2rem", textAlign: "center" }}>
                <div>
                    <div style={{ fontWeight: "bold" }}>{job.pipeline?.applied || 0}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>APPLIED</div>
                </div>
                <div>
                    <div style={{ fontWeight: "bold" }}>{job.pipeline?.ats_screening || 0}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>SCREEN</div>
                </div>
                <div>
                    <div style={{ fontWeight: "bold" }}>{job.pipeline?.ai_interview || 0}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>AI INT</div>
                </div>
                <div>
                    <div style={{ fontWeight: "bold", color: "var(--accent-success)" }}>{job.pipeline?.selected || 0}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>SELECT</div>
                </div>
                <div>
                    <div style={{ fontWeight: "bold", color: "var(--accent-danger)" }}>{job.pipeline?.rejected || 0}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>REJECT</div>
                </div>
            </div>
        </div>
    );
};

export default JobCard;