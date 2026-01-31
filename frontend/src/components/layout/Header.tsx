// components/layout/Header.tsx
"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function Header({ user }: { user: any }) {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="bg-white p-2 rounded-md">
          <img src="/images/spaceLogo.png" alt="Space42" className="h-8" />
        </div>
        <span className="text-slate-400 italic text-sm hidden md:block">
          Shape the Future of SpaceTech and AI Innovation at Space42
        </span>
      </div>
      
      <nav className="flex gap-6 items-center">
        {user ? (
          <>
            <Link href="/my-jobs" className="text-slate-200 hover:text-blue-400 transition">My Jobs</Link>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">
              {user.name[0]}
            </div>
          </>
        ) : (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition shadow-lg shadow-blue-900/20">
            Login
          </button>
        )}
      </nav>
    </header>
  );
}