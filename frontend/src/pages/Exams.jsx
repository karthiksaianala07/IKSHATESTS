import React from 'react';
import { Link } from 'react-router-dom';

export default function Exams() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-3xl lg:text-4xl font-black text-on-surface mb-2 font-headline">Available Exam Pathways</h2>
        <p className="text-on-surface-variant max-w-2xl text-lg font-medium">Architectural blueprints and comprehensive syllabi for India's most competitive entrance examinations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* IIT JEE */}
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-3xl overflow-hidden shadow-2xl hover:shadow-primary/[0.04] hover:border-primary/20 transition-all duration-500 group flex flex-col">
          <div className="h-44 bg-slate-900/80 border-b border-slate-950 relative overflow-hidden flex items-center p-8 shrink-0">
             <span className="material-symbols-outlined text-primary/10 text-[140px] absolute -bottom-6 -right-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">architecture</span>
             <h3 className="text-3xl md:text-4xl font-black text-slate-100 z-10 font-headline tracking-widest drop-shadow-md">IIT JEE</h3>
          </div>
          <div className="p-8 flex-1 flex flex-col pt-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-xl border border-primary/20 shadow-sm">Engineering</span>
              <span className="px-4 py-1.5 bg-slate-900/40 text-slate-400 text-xs font-bold rounded-xl border border-slate-900 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">school</span> Mains & Advanced</span>
            </div>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium flex-1 text-base">Master Physics, Chemistry, and Mathematics with our high-precision curriculum designed for top percentile rankers. Access targeted practice algorithms built for the hardest exam patterns.</p>
            <Link to="/jee-library" className="block w-full py-4 text-center rounded-xl font-bold bg-slate-950 border border-slate-900 text-primary hover:bg-primary hover:text-slate-950 hover:shadow-[0_0_15px_var(--theme-primary-shadow)] hover:border-primary transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider">
               Explore JEE Mock Tests
            </Link>
          </div>
        </div>

        {/* NEET */}
        <div className="bg-slate-950/40 border border-slate-900/60 rounded-3xl overflow-hidden shadow-2xl hover:shadow-primary/[0.04] hover:border-primary/20 transition-all duration-500 group flex flex-col">
          <div className="h-44 bg-slate-900/80 border-b border-slate-950 relative overflow-hidden flex items-center p-8 shrink-0">
             <span className="material-symbols-outlined text-primary/10 text-[140px] absolute -bottom-6 -right-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">biotech</span>
             <h3 className="text-3xl md:text-4xl font-black text-slate-100 z-10 font-headline tracking-widest drop-shadow-md">NEET (UG)</h3>
          </div>
          <div className="p-8 flex-1 flex flex-col pt-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-xl border border-primary/20 shadow-sm">Medical</span>
              <span className="px-4 py-1.5 bg-slate-900/40 text-slate-400 text-xs font-bold rounded-xl border border-slate-900 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">vaccines</span> Biology Intensive</span>
            </div>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium flex-1 text-base">Comprehensive Biology focused learning with intensive Physics and Chemistry modules for medical aspirants. Experience strict NCERT-aligned problem solving structured for speed and perfect accuracy.</p>
            <Link to="/neet-library" className="block w-full py-4 text-center rounded-xl font-bold bg-slate-950 border border-slate-900 text-primary hover:bg-primary hover:text-slate-950 hover:shadow-[0_0_15px_var(--theme-primary-shadow)] hover:border-primary transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider">
               Explore NEET Mock Tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
