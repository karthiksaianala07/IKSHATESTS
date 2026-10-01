import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Home, BookOpen, Clock, ShieldCheck } from 'lucide-react';

export default function PlansComingSoon() {
  const navigate = useNavigate();

  // Ensure body scroll is strictly disabled while on this page
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 py-2 select-none overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#1282a2]/20 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-[#034078]/25 rounded-full blur-[90px] sm:blur-[110px] pointer-events-none" />

      {/* Main Centered Content */}
      <div className="relative z-10 max-w-2xl w-full mx-auto text-center flex flex-col items-center justify-center space-y-2.5 sm:space-y-4 md:space-y-5 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#034078]/40 border border-[#1282a2]/40 text-[#1282a2] text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shrink-0">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#1282a2] animate-ping" />
          <span>Subscription Upgrades Underway</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1 sm:space-y-2 shrink-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-headline tracking-tight leading-tight">
            Subscription Plans <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1282a2] via-[#38bdf8] to-[#fefcfb]">
              Coming Soon
            </span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#fefcfb]/80 max-w-lg mx-auto leading-relaxed line-clamp-2 sm:line-clamp-none">
            We are redesigning our membership packages to deliver maximum value for IIT JEE & NEET aspirants. All diagnostic mocks are currently free to explore.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5 w-full max-w-xl mx-auto shrink-0">
          <div className="bg-[#001f54]/70 border border-[#034078]/60 backdrop-blur-xl p-2.5 sm:p-3.5 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 transition-all hover:border-[#1282a2]/50">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1282a2]/15 border border-[#1282a2]/30 flex items-center justify-center text-[#1282a2]">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-[11px] sm:text-xs font-bold text-white leading-tight">Full Mock Access</h2>
            <p className="hidden sm:block text-[10px] sm:text-[11px] text-[#fefcfb]/70 leading-snug">
              Blueprints & digitized PYQs active
            </p>
          </div>

          <div className="bg-[#001f54]/70 border border-[#034078]/60 backdrop-blur-xl p-2.5 sm:p-3.5 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 transition-all hover:border-[#1282a2]/50">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1282a2]/15 border border-[#1282a2]/30 flex items-center justify-center text-[#1282a2]">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-[11px] sm:text-xs font-bold text-white leading-tight">Real NTA UI</h2>
            <p className="hidden sm:block text-[10px] sm:text-[11px] text-[#fefcfb]/70 leading-snug">
              Authentic CBT proctor conditions
            </p>
          </div>

          <div className="bg-[#001f54]/70 border border-[#034078]/60 backdrop-blur-xl p-2.5 sm:p-3.5 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 transition-all hover:border-[#1282a2]/50">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1282a2]/15 border border-[#1282a2]/30 flex items-center justify-center text-[#1282a2]">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-[11px] sm:text-xs font-bold text-white leading-tight">Early Perks</h2>
            <p className="hidden sm:block text-[10px] sm:text-[11px] text-[#fefcfb]/70 leading-snug">
              Special launch rates for users
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full max-w-sm sm:max-w-md mx-auto shrink-0 pt-0.5 sm:pt-1">
          <button
            onClick={() => navigate('/exams')}
            className="flex-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(18,130,162,0.35)] flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
          >
            <span>Explore Exams</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#001f54]/80 hover:bg-[#034078] text-[#fefcfb] border border-[#034078]/60 hover:border-[#1282a2]/40 font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
