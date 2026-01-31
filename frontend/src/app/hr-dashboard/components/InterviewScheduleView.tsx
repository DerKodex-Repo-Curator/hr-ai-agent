// src/app/hr-dashboard/components/InterviewScheduleView.tsx
import React from 'react';
import { Clock } from 'lucide-react';
import { Interview } from '../utils/types';

interface InterviewScheduleViewProps {
    interviews: Interview[];
}

const InterviewScheduleView: React.FC<InterviewScheduleViewProps> = ({ interviews }) => {
    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem" }}>Upcoming Interviews</h2>
            {interviews.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No interviews scheduled.
                </div>
            ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {interviews
                        .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                        .map((int) => (
                            <div key={int.id} style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <Clock className="text-accent-primary" />
                                    <div>
                                        <div style={{ fontWeight: "bold", color: "var(--accent-primary)" }}>
                                            {new Date(int.scheduled_time).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                            {int.type || "Standard Interview"} ({int.duration || 60}m)
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: "bold" }}>{int.candidate_name}</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{int.job_title}</div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default InterviewScheduleView;