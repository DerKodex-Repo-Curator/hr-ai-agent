// src/app/hr-dashboard/components/RejectActionPage.tsx
import React, { useState } from 'react';
import { Candidate } from '../utils/types';

interface RejectActionPageProps {
    candidate: Candidate;
    onBack: () => void;
    onComplete: (id: string, reason: string) => void;
}

const RejectActionPage: React.FC<RejectActionPageProps> = ({ candidate, onBack, onComplete }) => {
    const [reason, setReason] = useState("");

    return (
        <div className="action-container">
            <h2 style={{ color: "var(--accent-danger)" }}>Reject Candidate</h2>
            <p style={{ marginBottom: "1rem" }}>Rejecting: <strong>{candidate.name}</strong></p>
            <textarea className="form-input" rows={4} placeholder="Reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button className="btn btn-secondary" onClick={onBack}>Cancel</button>
                <button className="btn btn-danger" onClick={() => onComplete(candidate.id, reason)}>Confirm Rejection</button>
            </div>
        </div>
    );
};

export default RejectActionPage;