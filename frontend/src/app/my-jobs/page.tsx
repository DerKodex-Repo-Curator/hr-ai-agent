"use client";
import { useState, useEffect } from 'react';
import { Rocket, Clock, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/src/components/layout/Header';

export default function MyJobsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock User for Demo - Replace with your Auth logic
  const user = { name: "Sona Susan Eldhose", email: "sona@example.com" };

  useEffect(() => {
    async function fetchMyJobs() {
      // Fetch from Supabase where email == user.email
      // const { data } = await supabase.from('candidates').select('*, jobs(*)').eq('email', user.email);
      // setApplications(data);
      setLoading(false);
    }
    fetchMyJobs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header user={user} />
      
      <main className="max-w-5xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-bold mb-8">My Space Missions</h1>

        {applications.length === 0 && !loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-20 text-center">
            <div className="text-6xl mb-6">🛰️</div>
            <h2 className="text-2xl font-semibold mb-4">No active missions found</h2>
            <p className="text-slate-400 mb-8">You haven't applied to any positions yet. Start your journey at Space42.</p>
            <a href="/" className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition">
              Explore Careers
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Map through applications here */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Aerospace Systems Engineer</h3>
                <p className="text-slate-500 text-sm">Applied on Jan 31, 2026</p>
              </div>
              <div className="flex items-center gap-2 bg-blue-900/30 text-blue-400 px-4 py-2 rounded-full border border-blue-800/50">
                <Clock size={16} />
                <span className="text-sm font-bold">ATS Screening</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}