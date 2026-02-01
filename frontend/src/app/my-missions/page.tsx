"use client";

import React, { useState, useEffect } from 'react';
import {
  Rocket, Satellite, Signal, Activity, Terminal,
  Loader2, AlertCircle, Calendar, CheckCircle2,
  MapPin,
  X
} from 'lucide-react';
import Header from '@/src/components/layout/Header';
import BackgroundDecor from '@/src/components/layout/BackgroundDecor';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';

interface MissionUpdate {
  date: string;
  msg: string;
}

interface Application {
  job_location: string;
  role_title: string;
  department: string;
  id: string;
  job_id: number;
  full_name: string;
  status: string; // "In Orbit", "ATS Screening", "AI Interview", "Rejected"
  progress: number;
  created_at: string;
  updates: MissionUpdate[];
  proposed_slots?: string[]; // Times sent by AI Agent
  scheduled_interview_time?: string;
}

export default function MyMissions() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogMission, setSelectedLogMission] = useState<Application | null>(null);

  useEffect(() => {
    async function fetchMyMissions() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/my-missions`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        setApps(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMyMissions();
  }, []);

  const handleConfirmSlot = async (appId: string, slot: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${appId}/confirm-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_time: slot })
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Docking failed:", err);
    }
  };

  // Logic to calculate active vs total missions
  const activeMissionsCount = apps.filter(app => app.status !== "Rejected").length;

  // Sorting: Active missions first, Rejected missions last
  const sortedApps = [...apps].sort((a, b) => {
    if (a.status === "Rejected" && b.status !== "Rejected") return 1;
    if (a.status !== "Rejected" && b.status === "Rejected") return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest first within categories
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative">
      <BackgroundDecor />
      <nav className="sticky top-0 z-[100] w-full bg-slate-950/95 backdrop-blur-xl border-b border-white/5">
        <Header onJoinCrew={() => router.push('/')} />
      </nav>
      <main className="max-w-6xl mx-auto px-6 pb-12 py-4 relative z-10 overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-[0.3em] text-xs mb-2">
              <Signal size={14} className={loading ? "animate-pulse" : ""} />
              {loading ? "Establishing Link..." : "Live Telemetry"}
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Mission Control</h1>
          </div>

          {!loading && (
            <div className="bg-slate-900/50 border border-white/10 p-4 rounded-2xl flex gap-8 backdrop-blur-md">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Missions</p>
                <p className="text-2xl font-bold text-white">{activeMissionsCount.toString().padStart(2, '0')}</p>
              </div>
              <div className="border-r border-white/10" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Signal Strength</p>
                <p className={`text-2xl font-bold ${activeMissionsCount > 0 ? "text-green-500" : "text-slate-500"}`}>
                  {activeMissionsCount > 0 ? "Optimal" : "Standby"}
                </p>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
            <p className="italic animate-pulse tracking-widest text-xs uppercase text-center">Synchronizing with Orbital Databases...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] text-center max-w-2xl mx-auto">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
            <h2 className="text-xl font-bold text-white mb-2">Telemetry Lost</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 cursor-pointer">Retry Link</button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8">
            {sortedApps.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/20 border border-dashed border-white/10 rounded-[2.5rem]">
                <Rocket className="mx-auto text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 italic uppercase text-xs tracking-widest">No satellites in orbit. Apply for a mission.</p>
              </div>
            ) : (
              sortedApps.map((app) => {
                const isRejected = app.status === "Rejected";
                
                return (
                  <div 
                    key={app.id} 
                    className={`rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group transition-all duration-500 border
                      ${isRejected 
                        ? "bg-slate-950/40 border-white/5 grayscale-[0.3] opacity-80 hover:grayscale-0 hover:opacity-100" 
                        : "bg-slate-900/40 border-white/10 hover:border-blue-500/30"
                      }`}
                  >
                    {/* Decorative Background Glow - Soft Rose for Rejected, Blue for Active */}
                    <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] -mr-32 -mt-32 transition-colors
                      ${isRejected ? "bg-rose-900/10" : "bg-blue-600/5"}
                    `} />

                    <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-[9px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest
                            ${isRejected 
                              ? "bg-slate-500/10 text-slate-500 border-white/5" 
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            ID: {app.id.toString().slice(0, 8)}
                          </span>
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                            Launched: {new Date(app.created_at).toLocaleDateString()}
                          </span>
                          <span className={`text-[9px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest
                            ${isRejected 
                              ? "bg-slate-800/20 text-slate-500 border-white/5" 
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {app.department}
                          </span>
                        </div>

                        <h2 className={`text-3xl font-bold mb-2 tracking-tight transition-colors ${isRejected ? "text-slate-400" : "text-white"}`}>
                          {app.role_title}
                        </h2>
                        <p className={`text-xs font-medium mb-6 flex items-center gap-2 ${isRejected ? "text-slate-500" : "text-blue-400"}`}>
                          <MapPin size={12} /> {app.job_location}
                        </p>

                        {/* Status Bar Section */}
                        <div className="mb-8">
                          <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isRejected ? "text-slate-600" : "text-blue-500"}`}>
                                {isRejected 
                                  ? <><AlertCircle size={14} /> Mission Terminated</>
                                  : <><Satellite size={14} className="animate-pulse" /> Orbit Alignment</>
                                }
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                                Current Vector
                              </span>
                              <h2 className={`text-2xl font-black uppercase tracking-tighter drop-shadow-sm
                                ${isRejected 
                                  ? "text-rose-500/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" 
                                  : "text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                }`}
                              >
                                {app.status}
                              </h2>
                            </div>
                          </div>

                          {/* Progress Bar - Only visible if NOT rejected */}
                          {!isRejected && (
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000"
                                style={{ width: `${app.progress}%` }}
                              />
                            </div>
                          )}
                          
                          {/* Divider for Rejected State */}
                          {isRejected && (
                             <div className="relative w-full h-[1px] bg-white/5">
                               <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l to-transparent from-rose-500/30" />
                             </div>
                          )}
                        </div>

                        {/* AI Interview Scheduling (Only for Active) */}
                        {app.proposed_slots && app.proposed_slots.length > 0 && !app.scheduled_interview_time && !isRejected && (
                          <div className="mb-8 p-6 bg-blue-600/10 border border-blue-500/30 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <Calendar size={14} /> AI Agent Briefing Windows Detected
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {app.proposed_slots.map((slot) => (
                                <button
                                  key={slot}
                                  onClick={() => handleConfirmSlot(app.id, slot)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all uppercase cursor-pointer"
                                >
                                  {new Date(slot).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.scheduled_interview_time && !isRejected && (
                          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 className="text-green-500" size={18} />
                            <div>
                              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Briefing Locked</p>
                              <p className="text-xs text-slate-300">Docking scheduled for {new Date(app.scheduled_interview_time).toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        {/* BUTTON ACTIONS */}
                        <div className={`grid gap-4 ${isRejected ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {!isRejected ? (
                            <>
                              <button
                                onClick={() => setSelectedLogMission(app)}
                                className="bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest hover:bg-white/10 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Terminal size={14} /> Mission Logs
                              </button>
                              <button
                                onClick={() => {
                                  const subject = encodeURIComponent(`Mission Inquiry: ${app.role_title} (ID: ${app.id.slice(0, 8)})`);
                                  const body = encodeURIComponent(`Hello Mission Control,\n\nI am inquiring about my mission status for the ${app.role_title} position.\n\nMission ID: ${app.id}`);
                                  window.location.href = `mailto:mission-control@space42.com?subject=${subject}&body=${body}`;
                                }}
                                className="bg-blue-600 text-white font-bold py-3 rounded-xl cursor-pointer transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-500 cursor-pointer text-center"
                              >
                                Contact HQ
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { window.location.href = "https://hr-ai-agent-azure.vercel.app/"; }}
                              className="bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/5 font-bold py-3 rounded-xl cursor-pointer transition-all text-[10px] uppercase tracking-widest shadow-none text-center w-full"
                            >
                              View Alternate Roles
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Updates Timeline */}
                      <div className={`lg:w-96 border rounded-3xl p-6 transition-colors
                        ${isRejected ? "bg-black/20 border-white/5" : "bg-slate-950/50 border-white/5"}
                      `}>
                        <h3 className="text-[10px] font-bold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-widest">
                          <Activity size={14} className={isRejected ? "text-slate-500" : "text-blue-500"} /> Automated Agent Updates
                        </h3>
                        <div className="space-y-6">
                          {app.updates?.slice().reverse().map((update, idx) => (
                            <div key={idx} className="flex gap-4 relative">
                              {idx !== app.updates.length - 1 && (
                                <div className="absolute left-[7px] top-6 w-[1px] h-full bg-white/10" />
                              )}
                              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 
                                ${idx === 0 
                                  ? (isRejected ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]") 
                                  : 'bg-slate-800'
                                }`} 
                              />
                              <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{update.date}</p>
                                <p className={`text-[11px] leading-relaxed ${isRejected ? "text-slate-400 italic" : "text-slate-300"}`}>
                                  {update.msg}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
      <MissionLogModal
        isOpen={!!selectedLogMission}
        onClose={() => setSelectedLogMission(null)}
        mission={selectedLogMission}
      />
    </div>
  );
}

const MissionLogModal = ({ isOpen, onClose, mission }: any) => {
  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <div className="bg-slate-800 px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
            </div>
            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest font-bold">
              Mission-Log://{mission.id.slice(0, 8)}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 font-mono max-h-[60vh] overflow-y-auto custom-scrollbar bg-black/20">
          <div className="text-cyan-400 text-xs mb-6 animate-pulse">
            {`> Establish connection to ${mission.role_title}... SUCCESS`}
            <br />
            {`> Decrypting Agent Telemetry... DONE`}
          </div>

          <div className="space-y-6">
            {mission.updates?.slice().reverse().map((log: any, i: any) => (
              <div key={i} className="relative pl-6 border-l border-cyan-500/20">
                <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                <p className="text-[10px] text-cyan-700 mb-1">{log.date}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{log.msg}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-slate-600 italic">
            --- End of Transmission ---
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};