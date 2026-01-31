"use client";
import React, { useState } from 'react';
import { Search, Rocket, MapPin, Briefcase, Filter } from 'lucide-react';
import ApplyModal from '@/src/components/modals/ApplyModal';

const MOCK_JOBS = [
  { id: 1, role_title: "Aerospace Systems Engineer", department: "Engineering", location: "Low Earth Orbit Ops", description: "Design and analyze spacecraft systems for orbital operations." },
  { id: 2, role_title: "Mission Control Specialist", department: "Operations", location: "Houston, TX", description: "Monitor live missions and support astronauts during critical phases." },
  { id: 3, role_title: "Propulsion Test Engineer", department: "Engineering", location: "Mojave Test Site", description: "Lead testing campaigns for next-gen rocket engines." }
];

interface Job {
  id: number;
  role_title: string;
  department: string;
  location: string;
  description: string;
}

export default function CareerPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* 1. Sticky Space42 Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <img src="/images/spaceLogo.png" alt="Space42" className="h-7" />
          </div>
          <p className="text-xs font-medium tracking-wider text-slate-400 uppercase hidden md:block">
            Mission: Transform Candidate Experience
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          Crew Login
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 2. Filters & Search */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 mb-12 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-1 md:col-span-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input placeholder="Search roles..." className="w-full bg-slate-950 border-white/10 rounded-xl py-3 pl-11 text-sm focus:border-blue-500 transition-colors" />
            </div>
            <select className="bg-slate-950 border-white/10 rounded-xl py-3 px-4 text-sm"><option>All Departments</option></select>
            <select className="bg-slate-950 border-white/10 rounded-xl py-3 px-4 text-sm"><option>All Locations</option></select>
            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl py-3 transition-colors">Clear Filters</button>
          </div>
        </div>

        {/* 3. KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Total Openings", val: "10", icon: "📦" },
            { label: "Departments", val: "3", icon: "🏢" },
            { label: "Jobs Posted (30d)", val: "10 jobs", icon: "🛰️" }
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

        {/* 4. Job Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_JOBS.map((job) => (
            <div key={job.id} className="group bg-slate-900/60 border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/50 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <h3 className="text-xl font-bold mb-3">{job.role_title}</h3>
              <div className="flex gap-3 text-xs text-slate-400 mb-6">
                <span>{job.department}</span> • <span>{job.location}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2">{job.description}</p>
              <button 
                onClick={() => setSelectedJob(job)}
                className="w-full bg-blue-600 group-hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2"
              >
                🚀 Apply Now
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* 5. The Application Modal */}
      {selectedJob && <ApplyModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}