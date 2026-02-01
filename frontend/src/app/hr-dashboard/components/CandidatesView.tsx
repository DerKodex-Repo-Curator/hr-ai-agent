// src/app/hr-dashboard/components/CandidatesView.tsx
import React from 'react';
import { Activity, ChevronRight, Star } from 'lucide-react';
import { Candidate, Job } from '../utils/types';

interface CandidatesViewProps {
    candidates: Candidate[];
    job: Job;
    onBack: () => void;
    onSelectCandidate: (candidate: Candidate) => void;
}

const CandidatesView: React.FC<CandidatesViewProps> = ({ candidates, job, onBack, onSelectCandidate }) => {

    // STANDBY ORBIT: Candidates with high scores but not yet moved to Screening
    const standbyCandidates = candidates.filter(c => 
        c.status === "In Orbit" && (c.ats_score ?? 0) >= 85
    );

    // ACTIVE PERSONNEL: Everyone except those in Standby
    const activeCandidates = candidates.filter(c => 
        !standbyCandidates.find(s => s.id === c.id)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer" 
                        onClick={onBack}
                    >
                        Back
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white">Mission: {job.role_title}</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{job.department} • {job.location}</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-blue-400 border border-blue-500/30 px-4 py-2 rounded bg-blue-500/5">
                    CAPACITY: {candidates.filter(c => ["ATS Screening", "AI Interview"].includes(c.status)).length} / {job.target_shortlist_count}
                </div>
            </div>

            {/* STANDBY SECTION (The "Agentic" highlight) */}
            {standbyCandidates.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(249,115,22,0.05)]">
                    <h3 className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} className="animate-pulse" /> Standby Orbit (Autonomous Promotion Ready)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {standbyCandidates.map(c => (
                            <div
                                key={c.id}
                                onClick={() => onSelectCandidate(c)}
                                className="bg-slate-900/80 p-4 rounded-xl flex justify-between items-center border border-white/5 hover:border-orange-500/50 cursor-pointer transition-all group"
                            >
                                <div>
                                    <p className="font-bold text-sm text-white group-hover:text-orange-300">{c.name}</p>
                                    <p className="text-[10px] text-slate-500">{c.email}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-orange-500 font-mono font-bold text-xl">{c.ats_score}%</div>
                                    <div className="text-[8px] text-orange-700 uppercase font-black">Alignment</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN TABLE SECTION */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Specialist</th>
                            <th className="p-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mission Status</th>
                            <th className="p-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Telemetry</th>
                            <th className="p-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {activeCandidates.map((c) => (
                            <tr 
                                key={c.id} 
                                onClick={() => onSelectCandidate(c)} 
                                className={`hover:bg-white/5 cursor-pointer transition-colors ${c.status === "Rejected" ? "opacity-40" : ""}`}
                            >
                                <td className="p-4">
                                    <div className="font-bold text-white text-sm">{c.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{c.email}</div>
                                </td>
                                <td className="p-4">
                                    {c.status === "AI Interview" && c.scheduled_interview_time ? (
                                        <div className="flex flex-col">
                                            <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-1 rounded border border-purple-500/30 w-fit">
                                                AI Interview
                                            </span>
                                            <span className="text-[9px] text-purple-600 mt-1 font-mono uppercase">
                                                Docking: {new Date(c.scheduled_interview_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-tighter
                                            ${c.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                              c.status === 'In Orbit' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                              'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                            {c.status}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-4 text-[10px] font-mono">
                                        <span className="text-slate-400">ATS: <b className="text-white">{c.ats_score}%</b></span>
                                        {c.interview_score && (
                                            <span className="text-blue-400">AI: <b className="text-blue-200">{c.interview_score}</b></span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-[10px] font-bold bg-white/5 border border-white/10 px-3 py-1 rounded hover:bg-white/10 text-white transition-all uppercase tracking-widest cursor-pointer">
                                        Expand
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CandidatesView;