"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadResume } from '@/src/lib/supabase';

export default function ApplyModal({ job, onClose }: { job: any, onClose: () => void }) {
  const [step, setStep] = useState<'upload' | 'parsing' | 'form' | 'launch'>('upload');
  const [formData, setFormData] = useState({ 
    full_name: '', 
    email: '', 
    phone: '', 
    resume_url: '',
    cover_letter: ''
  });
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('File too large. Max 10MB.');
      return;
    }

    if (!['application/pdf', 
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          .includes(file.type)) {
      setError('Please upload PDF or Word document.');
      return;
    }

    setError('');
    setStep('parsing');
    
    try {
      // 1. Upload to Supabase Storage
      const resumeUrl = await uploadResume(file);
      
      // 2. Parse with FastAPI
      const parseFormData = new FormData();
      parseFormData.append('file', file);
      
      // For demo, you can skip the actual API call if it's not ready
      const useMockData = true; // Set to false for real API
      
      let parsedInfo;
      if (!useMockData) {
        const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse_resume`, {
          method: 'POST',
          body: parseFormData,
        });
        
        if (!parseResponse.ok) {
          throw new Error(`Parse failed: ${parseResponse.statusText}`);
        }
        
        parsedInfo = await parseResponse.json();
      } else {
        // Mock data for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        parsedInfo = {
          full_name: 'Alex Johnson',
          email: 'alex.johnson@example.com',
          phone: '+1 (555) 987-6543',
          skills: ['React', 'TypeScript', 'Next.js', 'Node.js'],
          experience: '5 years as Full Stack Developer'
        };
      }
      
      setFormData({ 
        ...formData, 
        ...parsedInfo, 
        resume_url: resumeUrl 
      });
      setStep('form');
      
    } catch (error) {
      console.error('Upload/Parsing error:', error);
      setError('Failed to process resume. Please try again.');
      setStep('upload');
    }
  };

  const handleFinalSubmit = async () => {
    setStep('launch');
    
    // Submit to your FastAPI backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          ...formData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      
      // Success - close after animation
      setTimeout(() => {
        onClose();
        // Optional: Show success toast
        alert('Application submitted successfully!');
      }, 3000);
      
    } catch (error) {
      console.error('Submission error:', error);
      setError('Failed to submit application.');
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
      >
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 m-4 rounded-xl">
            {error}
          </div>
        )}
        
        {/* Rest of your JSX remains the same */}
        {step === 'upload' && (
          <div className="p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Apply for {job.role_title}</h2>
            <div className="border-2 border-dashed border-slate-700 p-12 rounded-2xl hover:border-blue-500 transition cursor-pointer relative">
              <input 
                type="file" 
                onChange={handleFileUpload} 
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              <div className="text-slate-400">Drop your resume here or click to browse</div>
              <div className="text-xs text-slate-500 mt-2">PDF, DOCX up to 10MB</div>
            </div>
          </div>
        )}
        
        {/* ... rest of your modal code ... */}
      </motion.div>
    </div>
  );
}