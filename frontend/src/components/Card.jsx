import React from 'react';

export function Card({ children, className = "", noPadding = false, hoverEffect = false }) {
  const hoverStyles = hoverEffect ? "hover:border-[#8b5cf6]/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300" : "";
  return (
    <div className={`bg-[#1e293b] rounded-xl border border-[#334155] shadow-lg overflow-hidden ${hoverStyles} ${noPadding ? "" : "p-6"} ${className}`}>
      {children}
    </div>
  );
}
