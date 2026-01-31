"use client";
import React, { useState, useEffect } from 'react';
import { Search, Rocket, MapPin, Briefcase, Filter, Loader2 } from 'lucide-react';
import ApplyModal from '@/src/components/modals/ApplyModal';
import Header from '@/src/components/layout/Header';
import BackgroundDecor from '@/src/components/layout/BackgroundDecor';

interface Job {
  id: number;
  role_title: string;
  department: string;
  location: string;
  description: string;
}

export default function CareerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Fetch jobs from the backend environment variable
  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`);
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error("Mission Control: Error fetching orbital roles", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    // <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 relative">
      <BackgroundDecor />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* KPI Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Total Openings", val: jobs.length.toString(), icon: "📦" },
            { label: "Departments", val: new Set(jobs.map(j => j.department)).size.toString(), icon: "🏢" },
            { label: "Live Missions", val: jobs.length, icon: "🛰️" }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.val}</p>
              </div>
              <div className="text-2xl opacity-50">{stat.icon}</div>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Rocket className="text-blue-500" /> Open Positions
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="italic">Scanning deep space for career opportunities...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {jobs.map((job) => (
              <div key={job.id} className="group bg-slate-900/60 border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/50 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h3 className="text-xl font-bold mb-3">{job.role_title}</h3>
                <div className="flex gap-3 text-xs text-slate-400 mb-6">
                  <span>{job.department}</span> • <span>{job.location}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2">{job.description}</p>
                <button
                  onClick={() => setSelectedJob(job)}
                  className="w-full bg-blue-600 group-hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  🚀 Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedJob && <ApplyModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}