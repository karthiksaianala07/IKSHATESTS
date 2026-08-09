import React from 'react';

export function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f172a] shadow-sm flex items-center justify-center cursor-pointer active:scale-95";
  
  const variants = {
    primary: "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] focus:ring-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]",
    secondary: "bg-[#1e293b] text-[#f8fafc] hover:bg-[#334155] focus:ring-[#334155]",
    outline: "border border-[#334155] text-[#f8fafc] hover:bg-[#1e293b] focus:ring-[#334155]",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500",
    ghost: "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] shadow-none"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
