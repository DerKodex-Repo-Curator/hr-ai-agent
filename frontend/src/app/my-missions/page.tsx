"use client";

import React, { useState, useEffect } from 'react';
import { 
  Rocket, Satellite, Signal, Activity, Terminal, 
  Loader2, AlertCircle, Briefcase, MapPin 
} from 'lucide-react';
import Header from '@/src/components/layout/Header';
import BackgroundDecor from '@/src/components/layout/BackgroundDecor';
import { useRouter } from 'next/navigation';

interface MissionUpdate {
  date: string;
  msg: string;
}

interface Application {
  id: string;
  role_title: string;
  status: string; // "Launched", "In Orbit", "Re-entry", "Docked"
  progress: number;
  applied_date: string;
  updates: MissionUpdate[];
}

export default function MyMissions() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyMissions() {
      try {
        // Replace with your actual auth-check or candidate ID logic
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-applications`);
        if (!response.ok) throw new Error("Failed to sync with Mission Control");
        
        const data = await response.json();
        setApps(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Telemetry Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyMissions();
  }, []);

  const handleJoinCrewRedirect = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      <BackgroundDecor />
      <Header onJoinCrew={handleJoinCrewRedirect} />

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
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
                <p className="text-2xl font-bold text-white">{apps.length.toString().padStart(2, '0')}</p>
              </div>
              <div className="border-r border-white/10" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Signal Strength</p>
                <p className="text-2xl font-bold text-green-500">Optimal</p>
              </div>
            </div>
          )}
        </div>

        {/* State Handling: Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
            <p className="italic animate-pulse tracking-widest text-xs uppercase">Synchronizing with Orbital Databases...</p>
          </div>
        )}

        {/* State Handling: Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] text-center max-w-2xl mx-auto">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
            <h2 className="text-xl font-bold text-white mb-2">Telemetry Lost</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold">Retry Link</button>
          </div>
        )}

        {/* Mission Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8">
            {apps.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/20 border border-dashed border-white/10 rounded-[2.5rem]">
                <Rocket className="mx-auto text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 italic">No satellites currently in orbit. Apply for a mission to begin.</p>
              </div>
            ) : (
              apps.map((app) => (
                <div key={app.id} className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32" />

                  <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">
                          ID: {app.id}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          Launched: {new Date(app.applied_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">{app.role_title}</h2>
                      
                      <div className="mb-8">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
                          <span className="text-blue-500 flex items-center gap-2">
                            <Satellite size={14} /> Orbit Alignment
                          </span>
                          <span className="text-slate-400">{app.status} • {app.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000"
                            style={{ width: `${app.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button className="bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest hover:bg-white/10">
                          <Terminal size={14} className="inline mr-2" /> Mission Logs
                        </button>
                        <button className="bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-500">
                          Contact HQ
                        </button>
                      </div>
                    </div>

                    <div className="lg:w-96 bg-slate-950/50 border border-white/5 rounded-3xl p-6">
                      <h3 className="text-[10px] font-bold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-widest">
                        <Activity size={14} className="text-blue-500" /> Automated Agent Updates
                      </h3>
                      <div className="space-y-6">
                        {app.updates.map((update, idx) => (
                          <div key={idx} className="flex gap-4 relative">
                            {idx !== app.updates.length - 1 && (
                              <div className="absolute left-[7px] top-6 w-[1px] h-full bg-white/10" />
                            )}
                            <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${idx === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-700'}`} />
                            <div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{update.date}</p>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{update.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* --- DUMMY DATA FOR REFERENCE (COMMENTED OUT) ---
const MOCK_APPLICATIONS = [
  {
    id: "MS-4201",
    role_title: "Aerospace Systems Engineer",
    status: "In Orbit",
    progress: 65,
    applied_date: "2026-01-28",
    updates: [
      { date: "2026-01-31", msg: "AI Agent completed initial technical scan." },
      { date: "2026-01-29", msg: "Application received and satellite launched." }
    ]
  }
];
*/