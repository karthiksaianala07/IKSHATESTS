import React from 'react';
import finalLogo from '../assets/Final_Logo.png';

export function Logo({ className = "h-9 w-auto", imgClassName = "", showText = true, textClassName = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0 group ${className}`}>
      {/* Platform Logo Badge - Rounded square with subtle curvature */}
      <img 
        src={finalLogo} 
        alt="IKSHATESTS" 
        className={`h-full w-auto max-h-full aspect-square object-cover rounded-[4px] shadow-sm shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(246,195,67,0.35)] ${imgClassName}`}
      />

      {/* Two-Line Brand Typography (Center-Aligned to each other, protected from shrinking/wrapping) */}
      {showText && (
        <div className={`flex flex-col items-center justify-center text-center leading-none select-none whitespace-nowrap shrink-0 ${textClassName}`}>
          <span className="text-[13px] font-black tracking-wider text-white uppercase whitespace-nowrap group-hover:text-[#E7CF29] transition-colors">
            IKSHATESTS
          </span>
          <span className="text-[9.5px] font-medium tracking-normal text-slate-300 whitespace-nowrap group-hover:text-white transition-colors mt-0.5">
            Pariksha Shikshak
          </span>
        </div>
      )}
    </div>
  );
}
