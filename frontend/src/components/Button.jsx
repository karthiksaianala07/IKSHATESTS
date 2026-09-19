import React from 'react';

export function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a1128] shadow-sm flex items-center justify-center cursor-pointer active:scale-95";
  
  const variants = {
    primary: "bg-[#1282a2] text-[#0a1128] hover:bg-[#159cc2] focus:ring-[#1282a2] shadow-[0_0_15px_rgba(18,130,162,0.35)] font-bold",
    secondary: "bg-[#001f54] text-[#fefcfb] hover:bg-[#034078] hover:text-white border border-[#034078]/40 focus:ring-[#034078]",
    outline: "border border-[#034078] text-[#fefcfb] hover:bg-[#034078]/20 hover:text-white focus:ring-[#034078]",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    success: "bg-[#034078] text-white hover:bg-[#04569e] focus:ring-[#034078]",
    ghost: "text-[#fefcfb] hover:text-white hover:bg-[#001f54] shadow-none"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
