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

      // 1. Handle Authentication
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

      // 2. Mission Launch (Standard JSON POST)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          job_id: job.id,
          user_id: authData.user?.id
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || "FastAPI telemetry sync failed");
      }

      // Success Sequence
      setTimeout(() => {
        window.location.href = "/my-missions";
      }, 4000);

    } catch (err: any) {
      console.error("Mission Aborted:", err.message);
      setStep(3); // Fallback to auth step if error occurs
      alert(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agency')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agency')
        .getPublicUrl(filePath);

      const parserFormData = new FormData();
      parserFormData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/parse_resume`, {
        method: 'POST',
        body: parserFormData
      });

      if (!response.ok) throw new Error("AI Parsing Engine failed to respond.");

      const parsedData = await response.json();

      setFormData(prev => ({
        ...prev,
        ...parsedData,
        resume_url: publicUrl
      }));

      setIsParsing(false);
      setStep(2);

    } catch (err: any) {
      console.error("Mission Control Error:", err.message);
      alert("Parsing Failed: " + err.message);
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
                <div className="mb-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <div className="p-1 bg-blue-500/20 rounded-md"><CheckCircle className="text-blue-500" size={18} /></div>
                    Verify Mission Profile
                  </h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">
                    Telemetry Synchronized. Confirm coordinates.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5 flex-1 overflow-y-auto pr-3 custom-scrollbar max-h-[400px]">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Full Name</label>
                    <input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Email</label>
                    <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Phone</label>
                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Experience (Years)</label>
                    <input value={formData.total_experience_years} onChange={e => setFormData({ ...formData, total_experience_years: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-all font-mono" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Education</label>
                    <input value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Specialized Skills</label>
                    <textarea value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white text-xs h-20 resize-none focus:border-blue-500 focus:outline-none transition-all leading-relaxed" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">GitHub Log</label>
                    <input value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-slate-300 text-[11px] focus:border-blue-500 focus:outline-none transition-all font-mono" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">LinkedIn Signal</label>
                    <input value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-slate-300 text-[11px] focus:border-blue-500 focus:outline-none transition-all font-mono" />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex gap-4 items-center">
                  <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"><ArrowLeft size={14} /> Abort & Retry</button>
                  <button 
                    onClick={() => isLoggedIn ? handleFinalSubmit() : setStep(3)} 
                    className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:from-blue-600 hover:to-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all"
                  >
                    Authorize & Proceed
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                    {isLoggedIn ? "Final Flight" : "Secure Your"}
                    <span className="block text-blue-500">Credentials</span>
                  </h3>
                </div>

                <div className="space-y-6">
                  {!isLoggedIn ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Encryption Required</p></div>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/30 transition-all opacity-0 group-focus-within:opacity-100" />
                        <input type="password" placeholder="Enter Access Key" className="relative w-full bg-slate-900/50 border-2 border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition-all font-mono tracking-widest" onChange={(e) => setMissionPassword(e.target.value)} />
                        <p className="mt-2 text-[9px] text-slate-500 uppercase tracking-widest px-2">Note: This key allows you to track telemetry logs in your dashboard.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden p-6 bg-slate-900/40 border border-blue-500/30 rounded-3xl backdrop-blur-md">
                      <div className="absolute top-0 right-0 p-2"><div className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[8px] font-bold text-blue-400 uppercase">Verified</div></div>
                      <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Authenticated Specialist</span><span className="text-lg font-bold text-white tracking-tight">{formData.email}</span></div>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-4">
                  <button onClick={handleFinalSubmit} className="group relative w-full overflow-hidden rounded-2xl bg-blue-600 px-8 py-5 transition-all hover:bg-blue-500 active:scale-[0.98]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="flex items-center justify-center gap-3"><span className="text-sm font-black uppercase tracking-[0.3em] text-white">Launch Satellite</span><span className="text-xl transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">🚀</span></div>
                  </button>
                  <div className="flex justify-center"><p className="text-[9px] text-slate-600 font-medium uppercase tracking-tighter">By launching, you agree to the <span className="text-slate-400 underline cursor-pointer">Interstellar Terms of Service</span></p></div>
                </div>
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