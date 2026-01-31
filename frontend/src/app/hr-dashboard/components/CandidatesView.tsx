// src/app/hr-dashboard/components/CandidatesView.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Candidate, Job } from '../utils/types';

interface CandidatesViewProps {
    candidates: Candidate[];
    job: Job;
    onBack: () => void;
    onSelectCandidate: (candidate: Candidate) => void;
}

const CandidatesView: React.FC<CandidatesViewProps> = ({ candidates, job, onBack, onSelectCandidate }) => {
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <button className="btn btn-secondary" onClick={onBack}>
                    <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Back
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
                        <tr key={c.id} onClick={() => onSelectCandidate(c)} style={{ opacity: c.status === "Rejected" ? 0.5 : 1 }}>
                            <td>
                                <div style={{ fontWeight: "bold" }}>{c.name}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{c.email}</div>
                            </td>
                            <td>
                                <span className={`status-badge badge-${c.status.replace(" ", "-")}`}>{c.status}</span>
                            </td>
                            <td>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <span>ATS: {c.ats_score || 0}</span>
                                    {c.interview_score && (
                                        <span style={{ color: "var(--accent-primary)" }}>AI: {c.interview_score}</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem" }}>View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CandidatesView;