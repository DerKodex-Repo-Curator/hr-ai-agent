"use client";

import React, { useState } from 'react';
import { 
  Rocket, MapPin, Briefcase, Clock, ShieldCheck, 
  ChevronRight, Activity, Satellite, Signal, Terminal 
} from 'lucide-react';
import Header from '@/src/components/layout/Header';
import BackgroundDecor from '@/src/components/layout/BackgroundDecor';
import { useRouter } from 'next/navigation';

const MOCK_APPLICATIONS = [
  {
    id: "MS-4201",
    role: "Aerospace Systems Engineer",
    status: "In Orbit", // Choices: Launched, In Orbit, Re-entry (Interview), Docked (Hired)
    progress: 65,
    applied_date: "2026-01-28",
    updates: [
      { date: "2026-01-31", msg: "AI Agent completed initial technical scan." },
      { date: "2026-01-29", msg: "Application received and satellite launched." }
    ]
  }
];

export default function MyMissions() {
  const router = useRouter();
  const [apps] = useState(MOCK_APPLICATIONS);

  // Define the function for the mission page
  const handleJoinCrewRedirect = () => {
    router.push('/');
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      <BackgroundDecor />
      <Header onJoinCrew={handleJoinCrewRedirect} />

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-[0.3em] text-xs mb-2">
              <Signal size={14} className="animate-pulse" /> Live Telemetry
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Mission Control</h1>
          </div>
          <div className="bg-slate-900/50 border border-white/10 p-4 rounded-2xl flex gap-8 backdrop-blur-md">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Active Missions</p>
              <p className="text-2xl font-bold text-white">01</p>
            </div>
            <div className="border-r border-white/10" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Signal Strength</p>
              <p className="text-2xl font-bold text-green-500">Optimal</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {apps.map((app) => (
            <div key={app.id} className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
              {/* Status Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32" />

              <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                {/* Mission Summary */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/20">
                      ID: {app.id}
                    </span>
                    <span className="text-slate-500 text-xs tracking-widest">LAUNCHED: {app.applied_date}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">{app.role}</h2>
                  
                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-3">
                      <span className="text-blue-500 flex items-center gap-2">
                        <Satellite size={14} /> Orbit Alignment
                      </span>
                      <span className="text-slate-400">{app.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                        style={{ width: `${app.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                      <Terminal size={16} /> Mission Logs
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                      Contact HQ
                    </button>
                  </div>
                </div>

                {/* Live Feed / Updates */}
                <div className="lg:w-96 bg-slate-950/50 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <Activity size={16} className="text-blue-500" /> System Updates
                  </h3>
                  <div className="space-y-6">
                    {app.updates.map((update, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        {idx !== app.updates.length - 1 && (
                          <div className="absolute left-[7px] top-6 w-[1px] h-full bg-white/10" />
                        )}
                        <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${idx === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-700'}`} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{update.date}</p>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">{update.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}