"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, FileText, CheckCircle, ArrowLeft, X, MapPin, Briefcase, Globe, ShieldCheck, User, Phone, GraduationCap, Award } from 'lucide-react';
import { supabase, uploadResume } from '@/src/lib/supabase';

export default function ApplyModal({ job, onClose }: { job: any, onClose: () => void }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Form, 3: Auth, 4: Launch
  const [isParsing, setIsParsing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [missionPassword, setMissionPassword] = useState('');
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', education: '',
    skills: '', total_experience_years: '', summary: '',
    github_url: '', linkedin_url: '', resume_url: ''
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setFormData(prev => ({
          ...prev,
          email: session.user.email || prev.email
        }));
      }
    };
    checkSession();
  }, []);

  const handleFinalSubmit = async () => {
    setStep(4);
    try {
      let authData;
      let session;

      if (!isLoggedIn) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: missionPassword,
        });

        if (signUpError?.code === 'user_already_exists') {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: missionPassword,
          });
          if (signInError) throw signInError;
          authData = signInData;
        } else if (signUpError) {
          throw signUpError;
        } else {
          authData = signUpData;
        }
        session = authData.session;
      } else {
        const { data: currentSession } = await supabase.auth.getSession();
        session = currentSession.session;
        authData = { user: session?.user };
      }

      if (!session) throw new Error("Could not verify orbital credentials.");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          user_id: authData.user?.id,
          job_id: job.id
        })
      });

      if (!response.ok) throw new Error("FastAPI telemetry sync failed");

      setTimeout(() => {
        window.location.href = "/my-missions";
      }, 4000);

    } catch (err: any) {
      console.error("Mission Aborted:", err.message);
      setStep(3);
      alert(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      /* // --- PRODUCTION READY CODE ---
      const publicUrl = await uploadResume(file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse_resume`, { method: 'POST', body: file });
      const parsedData = await response.json();
      setFormData(prev => ({ ...prev, ...parsedData, resume_url: publicUrl }));
      setStep(2);
      */

      // --- DEMO MODE CODE ---
      setTimeout(() => {
        const mockParsedData = {
          "full_name": "Jonah Janar Ji",
          "email": "jona.janar@example.com",
          "phone": "+971 50 123 4567",
          "education": "Master of Business Administration (MBA), Focus on Tech Management",
          "total_experience_years": "5",
          "skills": "React, Next.js, FastAPI, PostgreSQL, Project Management, Python",
          "summary": "Experienced professional with a background in engineering and business administration. Specialized in building scalable web applications.",
          "github_url": "https://github.com/jona",
          "linkedin_url": "https://linkedin.com/in/jona",
          "resume_url": "https://vunwdklvoxohyaqcqluw.supabase.co/storage/v1/object/public/agency/demo.pdf"
        };
        setFormData(prev => ({ ...prev, ...mockParsedData }));
        setIsParsing(false);
        setStep(2);
      }, 2000);
    } catch (err) {
      console.error("Mission Control Error:", err);
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[700px] rounded-[2.5rem] overflow-hidden flex shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-8 z-50 text-slate-500 hover:text-white transition cursor-pointer"><X size={24} /></button>

        {/* LEFT PANE: Mission Briefing */}
        <div className="w-5/12 bg-slate-950/50 p-10 border-r border-slate-800 hidden md:flex flex-col">
          <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-[10px] mb-6"><Globe size={14} /> Mission Briefing</div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{job.role_title}</h2>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-slate-400 text-sm italic"><Briefcase size={18} className="text-blue-500" /> {job.department}</div>
            <div className="flex items-center gap-3 text-slate-400 text-sm italic"><MapPin size={18} className="text-blue-500" /> {job.location}</div>
          </div>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-slate-400 text-sm leading-relaxed">
            <h4 className="text-slate-200 font-semibold mb-2 uppercase tracking-tighter">Objective</h4>
            <p>{job.description}</p>
          </div>
        </div>

        {/* RIGHT PANE: Mission Execution */}
        <div className="flex-1 p-10 relative overflow-hidden flex flex-col justify-center bg-slate-900">
          <AnimatePresence mode="wait">

            {step === 1 && (
              <motion.div key="step1" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase">Initiate Application</h2>
                <p className="text-slate-400 mb-8 text-sm">Upload flight data to begin AI mission mapping.</p>
                {isParsing ? (
                  <div className="py-12"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="inline-block mb-6"><Rocket className="text-blue-500 w-12 h-12" /></motion.div><p className="text-slate-300 italic">Agent is analyzing coordinates...</p></div>
                ) : (
                  <div className="border-2 border-dashed border-slate-700 p-12 rounded-3xl hover:border-blue-500 transition-all cursor-pointer bg-slate-950/30 group relative">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <FileText className="mx-auto text-slate-500 group-hover:text-blue-500 mb-4 transition-colors" size={48} />
                    <p className="text-slate-300 font-medium">Drop Flight Log (Resume)</p>
                  </div>
                )}
                <button onClick={onClose} className="mt-8 text-slate-600 hover:text-red-400 text-xs font-bold uppercase tracking-widest cursor-pointer">Abort Mission</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="h-full flex flex-col justify-center">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><CheckCircle className="text-blue-500" size={20} /> Verify Mission Profile</h2>
                <p className="text-slate-400 text-xs mb-6 italic">AI has auto-filled these coordinates. Confirm before final launch.</p>

                <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Full Name</label>
                    <input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-sm" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Email</label>
                    <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-sm" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Phone</label>
                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-sm" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Experience (Years)</label>
                    <input value={formData.total_experience_years} onChange={e => setFormData({ ...formData, total_experience_years: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-sm" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Education</label>
                    <input value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-sm" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">Skills</label>
                    <textarea value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs h-16 resize-none" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">GitHub</label>
                    <input value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-1">LinkedIn</label>
                    <input value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs" />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer"><ArrowLeft size={14} /> Re-Upload</button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/40 uppercase tracking-widest text-xs cursor-pointer">Verify & Next</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">
                  {isLoggedIn ? "Confirm Mission Parameters" : "Secure Your Credentials"}
                </h3>

                {!isLoggedIn ? (
                  <>
                    <p className="text-slate-400 text-xs">Create an access key to track your mission logs.</p>
                    <input
                      type="password"
                      placeholder="New Access Key"
                      className="..."
                      onChange={(e) => setMissionPassword(e.target.value)}
                    />
                  </>
                ) : (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Authenticated Pilot</p>
                    <p className="text-sm text-white">{formData.email}</p>
                  </div>
                )}

                <button onClick={handleFinalSubmit} className="...">
                  🚀 Launch Satellite
                </button>
              </div>
            )}

            {step === 4 && (
              <motion.div key="step4" className="h-full flex flex-col items-center justify-center text-center">
                <motion.div initial={{ y: 200, scale: 1 }} animate={{ y: -700, scale: 0.1 }} transition={{ duration: 3.5, ease: "easeIn" }}>
                  <Rocket className="text-blue-500" size={80} />
                  <div className="text-orange-500 text-2xl mt-2 animate-pulse">🔥</div>
                </motion.div>
                <h2 className="text-3xl font-bold text-white mt-8 tracking-tighter">Mission Confirmed!</h2>
                <p className="text-slate-400 text-sm mt-2">Candidate data is now in orbit. Transmitting to HR HQ.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}