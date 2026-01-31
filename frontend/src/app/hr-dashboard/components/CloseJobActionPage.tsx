// src/app/hr-dashboard/components/CloseJobActionPage.tsx
import React, { useState, useEffect } from 'react';
import { Job, Candidate, Interview } from '../utils/types';
import { findNextAvailableSlot } from '../utils/scheduling';

interface CloseJobActionPageProps {
    job: Job;
    candidates: Candidate[];
    existingInterviews: Interview[];
    onBack: () => void;
    onComplete: (jobId: string, selectedIds: string[], generatedInterviews: Interview[]) => void;
}

const CloseJobActionPage: React.FC<CloseJobActionPageProps> = ({ job, candidates, existingInterviews, onBack, onComplete }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const eligible = candidates
        .filter((c) => c.status === "Applied")
        .sort((a, b) => (b.ats_score || 0) - (a.ats_score || 0));

    useEffect(() => {
        setSelected(eligible.slice(0, job.target_shortlist || 5).map((c) => c.id));
    }, [eligible.length]);

    const toggle = (id: string) =>
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const handleConfirm = () => {
        let currentInterviews = [...existingInterviews];
        const newInterviews: Interview[] = [];

        selected.forEach((cid) => {
            const candidate = candidates.find((c) => c.id === cid);
            const slot = findNextAvailableSlot(job, currentInterviews);

            if (slot && candidate) {
                const interview: Interview = {
                    id: Date.now().toString(),
                    candidate_id: cid,
                    candidate_name: candidate.name,
                    job_title: job.title,
                    scheduled_time: slot,
                    duration: job.interview_duration || 60,
                    status: "scheduled",
                    type: "Initial Screening",
                };
                newInterviews.push(interview);
                currentInterviews.push(interview);
            }
        });

        onComplete(job.id, selected, newInterviews);
    };

    return (
        <div className="action-container">
            <h2>Shortlist Candidates</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Select candidates to shortlist and auto-schedule screenings.</p>
            <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "2rem" }}>
                {eligible.map((c) => (
                    <div key={c.id} onClick={() => toggle(c.id)} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "0.5rem", cursor: "pointer", background: selected.includes(c.id) ? "rgba(0,217,255,0.1)" : "transparent", borderColor: selected.includes(c.id) ? "var(--accent-primary)" : "var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <input type="checkbox" checked={selected.includes(c.id)} readOnly />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold" }}>{c.name}</div>
                            <div>ATS: {c.ats_score || 0}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button className="btn btn-secondary" onClick={onBack}>Cancel</button>
                <button className="btn btn-primary" onClick={handleConfirm} disabled={selected.length === 0}>Shortlist ({selected.length})</button>
            </div>
        </div>
    );
};

export default CloseJobActionPage;