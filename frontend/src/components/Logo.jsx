import React from 'react';
import officialLogo from '../assets/official-logo.png';

export function Logo({ className = "h-10 w-auto", showText = true }) {
  return (
    <div className={`inline-flex items-center gap-3 cursor-pointer select-none group ${className}`}>
      {/* Official Transparent PNG Logo Icon */}
      <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-300 group-hover:scale-105 shrink-0">
        <img 
          src={officialLogo} 
          alt="IKSHATESTS Pariksha Shikshak" 
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(231,207,41,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(78,198,215,0.5)] transition-all duration-300"
        />
      </div>

      {/* Center-Aligned Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center items-center text-center leading-none">
          <span className="text-lg font-black tracking-wider text-white font-headline group-hover:text-[#4EC6D7] transition-colors">
            IKSHA<span className="text-[#E7CF29]">TESTS</span>
          </span>
          <span className="text-[9px] font-bold tracking-[0.22em] text-slate-400 uppercase mt-0.5 group-hover:text-slate-300 transition-colors text-center w-full">
            Pariksha Shikshak
          </span>
        </div>
      )}
    </div>
  );
}
