"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, Rocket, MapPin, Briefcase, Activity, Loader2, UserCircle } from 'lucide-react';
import ApplyModal from '@/src/components/modals/ApplyModal';
import Header from '@/src/components/layout/Header';
import BackgroundDecor from '@/src/components/layout/BackgroundDecor';
import { supabase } from '@/src/lib/supabase'; // Ensure this is imported

interface Job {
  id: number;
  role_title: string;
  department: string;
  location: string;
  description: string;
}

export default function CareerPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showLogin, setShowLogin] = useState(false); // New Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const positionsRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`);
        const data = await response.json();
        setAllJobs(data);
        setFilteredJobs(data);
      } catch (error) {
        setAllJobs([]);
        setFilteredJobs([]);
        console.error("Mission Control: Error fetching orbital roles", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    const filtered = allJobs.filter((job) => {
      const matchesSearch = job.role_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "All Departments" || job.department === selectedDept;
      return matchesSearch && matchesDept;
    });
    setFilteredJobs(filtered);
  }, [searchQuery, selectedDept, allJobs]);

  const departments = Array.from(new Set(allJobs?.map((j) => j.department)));

  const scrollToPositions = () => {
    positionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setShowLogin(false);
      window.location.href = "/my-missions"; // Redirect to their dashboard
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 relative">
      <BackgroundDecor />
      <Header
        onJoinCrew={scrollToPositions}
        onOpenLogin={() => setShowLogin(true)}
      />
      <main className="max-w-7xl mx-auto px-6 py-6 relative z-10">

        {/* COMPACT COMMAND BAR (Combined KPIs & Filters) */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 mb-8 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6 items-center">

            {/* MINI KPI SECTION */}
            <div className="flex gap-4 border-r border-white/10 pr-6 shrink-0 hidden lg:flex items-center">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Missions</p>
                <p className="text-xl font-bold text-blue-400">{allJobs.length}</p>
              </div>
              <div className="border-r border-white/10 h-8 mx-2" />
            </div>

            {/* FILTER CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs focus:border-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option>All Departments</option>
                  {departments?.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => { setSearchQuery(""); setSelectedDept("All Departments"); }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg py-2 px-4 text-xs transition-colors flex items-center justify-center cursor-pointer gap-2"
              >
                <Activity size={14} /> Reset Mission
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 tracking-tight">
          <Rocket className="text-blue-500 w-5 h-5" /> Active Orbital Slots
          {searchQuery && <span className="text-sm font-normal text-slate-500 italic ml-2">({filteredJobs.length} match)</span>}
        </h2>

        {/* LISTING GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm italic">Scanning coordinates...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl">
            <p className="text-slate-400 text-sm">No missions found in this sector.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredJobs?.map((job) => (
              <div key={job.id} className="group bg-slate-900/60 border border-white/10 p-6 rounded-2xl hover:border-blue-500/40 transition-all hover:-translate-y-1 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{job.role_title}</h3>
                <div className="flex gap-3 text-[11px] text-slate-500 mb-4 font-medium">
                  <span className="flex items-center gap-1 uppercase tracking-tighter"><Briefcase size={12} /> {job.department}</span>
                  <span className="flex items-center gap-1 uppercase tracking-tighter"><MapPin size={12} /> {job.location}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-2">{job.description}</p>
                <button
                  onClick={() => setSelectedJob(job)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-sm shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  🚀 Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-slate-900 border border-blue-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="text-blue-500" /> Returning Personnel
            </h2>
            <p className="text-slate-400 text-xs mb-8 uppercase tracking-widest font-bold">Secure Terminal Access</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Pilot Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-blue-500 outline-none"
                required
              />
              <input
                type="password"
                placeholder="Access Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-blue-500 outline-none"
                required
              />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs cursor-pointer">
                Establish Link
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-4 cursor-pointer"
              >
                Abort Connection
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}