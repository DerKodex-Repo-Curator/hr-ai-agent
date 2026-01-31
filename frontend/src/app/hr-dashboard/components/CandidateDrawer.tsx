// src/app/hr-dashboard/components/CandidateDrawer.tsx
import React from 'react';
import { X, Phone, Link as LinkIcon, Star, UserCheck, Trash2 } from 'lucide-react';
import { Candidate, CandidateStatus } from '../utils/types';

interface CandidateDrawerProps {
    candidate: Candidate;
    onClose: () => void;
    onUpdateStatus: (candidateId: string, newStatus: CandidateStatus, reason?: string | null) => void;
    onRejectRequest: () => void;
}

const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ candidate, onClose, onUpdateStatus, onRejectRequest }) => {
    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className="drawer">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                    <h2>{candidate.name}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                        <X />
                    </button>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <span className={`status-badge badge-${candidate.status.replace(" ", "-")}`} style={{ fontSize: "1.1rem" }}>
                        {candidate.status}
                    </span>
                </div>

                <div className="info-section" style={{ marginBottom: "2rem", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--text-secondary)", alignItems: "center" }}>
                        <Phone size={14} /> {candidate.phone || "N/A"}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-secondary)", alignItems: "center" }}>
                        <LinkIcon size={14} />
                        {candidate.resume_url ? (
                            <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
                                View Resume
                            </a>
                        ) : (
                            <span>No Resume</span>
                        )}
                    </div>

                    <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Resume Summary</div>
                    <div style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                        <p><strong>Experience:</strong> {candidate.profile?.experience || "N/A"}</p>
                        <p><strong>Key Skills:</strong> {candidate.profile?.skills?.join(", ") || "N/A"}</p>
                        <p><strong>Location:</strong> {candidate.profile?.location || "N/A"}</p>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>ATS Score</div>
                            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-primary)" }}>{candidate.ats_score || 0}/100</div>
                        </div>
                        {candidate.interview_score && (
                            <div>
                                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>AI Interview</div>
                                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-success)" }}>{candidate.interview_score}/100</div>
                            </div>
                        )}
                    </div>

                    <ul style={{ marginTop: "1rem", paddingLeft: "1.2rem", color: "var(--text-secondary)" }}>
                        {candidate.ats_reasons?.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginTop: "auto", paddingTop: "2rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1rem", flexDirection: "column" }}>
                    {candidate.status !== "Rejected" && candidate.status !== "Selected" && (
                        <>
                            {candidate.status !== "AI Interview" && (
                                <button className="btn btn-secondary" style={{ justifyContent: "center" }} onClick={() => onUpdateStatus(candidate.id, "AI Interview")}>
                                    <Star size={18} /> Move to AI Interview (Auto-Schedule)
                                </button>
                            )}

                            <button className="btn btn-success" style={{ justifyContent: "center" }} onClick={() => onUpdateStatus(candidate.id, "Selected")}>
                                <UserCheck size={18} /> Select Candidate
                            </button>

                            <button className="btn btn-danger" style={{ justifyContent: "center" }} onClick={onRejectRequest}>
                                <Trash2 size={18} /> Reject
                            </button>
                        </>
                    )}

                    {(candidate.status === "Rejected" || candidate.status === "Selected") && (
                        <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>No further actions available.</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CandidateDrawer;