import React from 'react';
import finalLogo from '../assets/Final_Logo.png';

export function Logo({ className = "h-10 w-auto", imgClassName = "", showText = true, textClassName = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0 group ${className}`}>
      {/* Platform Logo Badge - Rounded square with subtle curvature */}
      <img 
        src={finalLogo} 
        alt="IKSHATESTS" 
        className={`h-full w-auto max-h-full aspect-square object-cover rounded-[4px] shadow-sm shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(18,130,162,0.35)] ${imgClassName}`}
      />

      {/* Two-Line Brand Typography (Centered to each other and matched to span full height of logo badge) */}
      {showText && (
        <div className={`h-full flex flex-col justify-between items-center text-center leading-none select-none whitespace-nowrap shrink-0 py-[1px] ${textClassName}`}>
          <span className="text-[17px] font-black tracking-wider text-[#00b4d8] uppercase whitespace-nowrap group-hover:brightness-110 transition-all leading-none">
            IKSHATESTS
          </span>
          <span className="text-[11.5px] font-medium tracking-normal text-slate-300 whitespace-nowrap group-hover:text-white transition-colors leading-none">
            Pariksha Shikshak
          </span>
        </div>
      )}
    </div>
  );
}
