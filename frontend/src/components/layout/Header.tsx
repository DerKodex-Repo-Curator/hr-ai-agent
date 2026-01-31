// src/components/layout/Header.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import { UserCircle } from 'lucide-react';

export default function Header({ user }: { user?: any }) {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-white p-1.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          {/* Ensure image is in /public/spaceLogo.png */}
          <img src="/images/spaceLogo.png" alt="Space42" className="h-7" />
        </div>
        <p className="text-xs font-medium tracking-wider text-slate-400 uppercase hidden md:block italic">
          Shape the Future of SpaceTech and AI Innovation
        </p>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <Link href="/my-jobs" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition">
            My Missions
          </Link>
        ) : (
          <button className="flex items-center gap-2 bg-transparent border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer" title='Candidate Login'>
            <UserCircle size={18} />
            Mission Access
          </button>
        )}
      </div>
    </header>
  );
}