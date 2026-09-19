import React from 'react';
import { Link } from 'react-router-dom';

export default function Exams() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 font-headline">Available Exam Pathways</h2>
        <p className="text-[#fefcfb] max-w-2xl text-lg font-medium">Architectural blueprints and comprehensive syllabi for India's most competitive entrance examinations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* IIT JEE */}
        <div className="bg-[#001f54]/90 border border-[#034078]/30 rounded-3xl overflow-hidden shadow-2xl hover:border-[#1282a2]/50 transition-all duration-500 group flex flex-col">
          <div className="h-44 bg-[#0a1128] border-b border-[#034078]/30 relative overflow-hidden flex items-center p-8 shrink-0">
             <span className="material-symbols-outlined text-[#034078]/10 group-hover:text-[#1282a2]/15 text-[140px] absolute -bottom-6 -right-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">architecture</span>
             <h3 className="text-3xl md:text-4xl font-black text-white z-10 font-headline tracking-widest drop-shadow-md">IIT JEE</h3>
          </div>
          <div className="p-8 flex-1 flex flex-col pt-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-[#1282a2]/15 text-[#1282a2] text-xs font-black uppercase tracking-widest rounded-xl border border-[#1282a2]/30 shadow-sm">Engineering</span>
              <span className="px-4 py-1.5 bg-[#001f54] text-[#fefcfb] text-xs font-bold rounded-xl border border-[#034078]/30 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">school</span> Mains & Advanced</span>
            </div>
            <p className="text-[#fefcfb] mb-10 leading-relaxed font-medium flex-1 text-base">Master Physics, Chemistry, and Mathematics with our high-precision curriculum designed for top percentile rankers. Access targeted practice algorithms built for the hardest exam patterns.</p>
            <Link to="/jee-library" className="block w-full py-4 text-center rounded-xl font-bold bg-[#0a1128] border border-[#034078]/40 text-[#fefcfb] hover:bg-[#1282a2] hover:text-[#0a1128] hover:border-[#1282a2] hover:shadow-[0_0_20px_rgba(18,130,162,0.35)] transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider">
               Explore JEE Mock Tests
            </Link>
          </div>
        </div>

        {/* NEET */}
        <div className="bg-[#001f54]/90 border border-[#034078]/30 rounded-3xl overflow-hidden shadow-2xl hover:border-[#034078]/70 transition-all duration-500 group flex flex-col">
          <div className="h-44 bg-[#0a1128] border-b border-[#034078]/30 relative overflow-hidden flex items-center p-8 shrink-0">
             <span className="material-symbols-outlined text-[#034078]/10 group-hover:text-[#034078]/20 text-[140px] absolute -bottom-6 -right-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">biotech</span>
             <h3 className="text-3xl md:text-4xl font-black text-white z-10 font-headline tracking-widest drop-shadow-md">NEET (UG)</h3>
          </div>
          <div className="p-8 flex-1 flex flex-col pt-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-[#034078]/15 text-[#034078] text-xs font-black uppercase tracking-widest rounded-xl border border-[#034078]/30 shadow-sm">Medical</span>
              <span className="px-4 py-1.5 bg-[#001f54] text-[#fefcfb] text-xs font-bold rounded-xl border border-[#034078]/30 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">vaccines</span> Biology Intensive</span>
            </div>
            <p className="text-[#fefcfb] mb-10 leading-relaxed font-medium flex-1 text-base">Comprehensive Biology focused learning with intensive Physics and Chemistry modules for medical aspirants. Experience strict NCERT-aligned problem solving structured for speed and perfect accuracy.</p>
            <Link to="/neet-library" className="block w-full py-4 text-center rounded-xl font-bold bg-[#0a1128] border border-[#034078]/40 text-[#fefcfb] hover:bg-[#034078] hover:text-white hover:border-[#034078] hover:shadow-[0_0_20px_rgba(3,64,120,0.35)] transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider">
               Explore NEET Mock Tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
