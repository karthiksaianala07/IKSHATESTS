import React from 'react';

export function Card({ children, className = "", noPadding = false, hoverEffect = false }) {
  const hoverStyles = hoverEffect ? "hover:border-[#1282a2]/50 hover:shadow-[0_0_20px_rgba(18,130,162,0.15)] transition-all duration-300" : "";
  return (
    <div className={`bg-[#001f54] rounded-xl border border-[#034078]/30 shadow-lg overflow-hidden ${hoverStyles} ${noPadding ? "" : "p-6"} ${className}`}>
      {children}
    </div>
  );
}
