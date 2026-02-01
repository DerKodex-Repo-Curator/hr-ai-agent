"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

// Added onOpenLogin to the props interface
export default function Header({ 
  onJoinCrew, 
  onOpenLogin 
}: { 
  onJoinCrew: () => void; 
  onOpenLogin?: () => void; 
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-[100] bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6 md:px-12 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* LOGO SECTION */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-white p-1.5 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-blue-500/50 transition-all">
            <img src="/images/spaceLogo.png" alt="Space42" className="h-6" />
          </div>
          <div>
            <p className="text-white font-bold tracking-tighter text-lg leading-none">SPACE42</p>
            <p className="text-[9px] font-medium tracking-[0.2em] text-blue-500 uppercase">Mission Portal</p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${pathname === '/' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            Mission Hub
          </Link>

          {user && (
            <Link
              href="/my-missions"
              className={`text-xs font-bold uppercase tracking-widest transition-colors ${pathname === '/my-missions' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              My Orbit
            </Link>
          )}

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          {user ? (
            /* LOGGED IN VIEW */
            <div className="flex items-center gap-4">
              <div className="text-right hidden lg:block">
                <p className="text-[10px] font-bold text-white leading-none truncate max-w-[120px]">
                  {user.email.split('@')[0].toUpperCase()}
                </p>
                <p className="text-[8px] text-blue-500 font-bold uppercase tracking-tighter">Specialist</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-900 border border-white/10 p-2 rounded-full hover:border-red-500/50 transition-all text-slate-400 hover:text-red-400 cursor-pointer"
                title="Abort Session"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            /* LOGGED OUT VIEW */
            <div className="flex items-center gap-4">
              {/* PERSONNEL LOGIN BUTTON */}
              <button
                onClick={onOpenLogin}
                className="group flex flex-col items-center hover:opacity-80 transition-all cursor-pointer"
              >
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em]">Personnel</p>
                <div className="flex items-center gap-1 text-white font-bold">
                  <UserCircle size={16} className="text-blue-500" />
                  <span className="text-xs">Login</span>
                </div>
              </button>

              </div>
          )}
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <button className="md:hidden text-white cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 p-6 flex flex-col gap-6 md:hidden backdrop-blur-2xl">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white">Mission Hub</Link>
          {user && (
            <Link href="/my-missions" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white">My Orbit</Link>
          )}
          
          <div className="flex flex-col gap-3">
            {user ? (
              <button 
                onClick={handleLogout} 
                className="w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest bg-red-500/20 text-red-500 border border-red-500/20 cursor-pointer"
              >
                Abort Mission
              </button>
            ) : (
              <>
                <button 
                  onClick={() => { setIsMenuOpen(false); onOpenLogin?.(); }} 
                  className="w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest bg-white/5 text-white border border-white/10 cursor-pointer"
                >
                  Personnel Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}