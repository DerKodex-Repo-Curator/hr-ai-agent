// components/jobs/JobCard.tsx
export default function JobCard({ job, onApply }: { job: any, onApply: (job: any) => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all group shadow-xl">
      <h3 className="text-xl font-bold text-white mb-2">{job.role_title}</h3>
      <div className="text-sm text-slate-400 mb-4 flex gap-2 flex-wrap">
        <span>{job.department}</span> • <span>{job.location}</span> • <span>{job.type || 'Full-time'}</span>
      </div>
      <p className="text-slate-300 text-sm line-clamp-2 mb-6">{job.description}</p>
      <button 
        onClick={() => onApply(job)}
        className="w-full bg-blue-600 group-hover:bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition"
      >
        🚀 Apply Now
      </button>
    </div>
  );
}