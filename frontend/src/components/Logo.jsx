import React from 'react';
import finalLogo from '../assets/Final_Logo.png';
import saiVikashLogo from '../assets/sai-vikash-logo.png';
import { useTenant } from '../context/TenantContext';

export function Logo({ 
  className = "h-10 w-auto", 
  imgClassName = "", 
  showText = true, 
  textClassName = "",
  titleClassName = "",
  subtitleClassName = "",
  forcePlatform = false,
  title = null
}) {
  let tenant = null;
  try {
    const tenantCtx = useTenant();
    tenant = tenantCtx?.tenant;
  } catch (e) {
    // Graceful fallback if rendered outside TenantProvider
  }

  // If on an institute subdomain and not forcing platform logo
  if (!forcePlatform && tenant) {
    let logoSrc = tenant.logo_url;
    if (tenant.code === 'SV' || logoSrc?.includes('sai-vikash')) {
      logoSrc = saiVikashLogo;
    }

    return (
      <div className={`inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0 group ${className}`}>
        {logoSrc ? (
          <img 
            src={logoSrc} 
            alt={tenant.name || "Institution"} 
            className={`h-full w-auto max-h-full object-contain shrink-0 transition-all duration-300 group-hover:scale-105 ${imgClassName}`}
          />
        ) : (
          <div className="h-full px-3 py-1 rounded bg-[#034078] text-white font-black text-sm flex items-center justify-center tracking-wider">
            {tenant.code || 'INST'}
          </div>
        )}
        
        {showText && (
          <div className={`h-full flex flex-col justify-center select-none whitespace-nowrap shrink-0 py-[1px] ${textClassName}`}>
            <svg viewBox="0 0 114 26" className="w-[114px] h-[26px] select-none shrink-0 overflow-visible" fill="none">
              <text 
                x="0" 
                y="11" 
                textLength="114" 
                lengthAdjust="spacing" 
                className={`fill-[#00b4d8] font-black text-[13px] uppercase font-sans tracking-normal transition-all group-hover:brightness-110 ${titleClassName}`}
              >
                {title || "CBT Platform"}
              </text>
              <text 
                x="0" 
                y="24" 
                textLength="114" 
                lengthAdjust="spacing" 
                className={`fill-slate-300 font-medium text-[9.8px] font-sans tracking-normal transition-colors group-hover:fill-white ${subtitleClassName}`}
              >
                Powered by IkshaTests
              </text>
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Default Central IkshaTests Logo
  return (
    <div className={`inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0 group ${className}`}>
      {/* Platform Logo Badge - Rounded square with subtle curvature */}
      <img 
        src={finalLogo} 
        alt="IKSHATESTS" 
        className={`h-full w-auto max-h-full aspect-square object-cover rounded-[4px] shadow-sm shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(18,130,162,0.35)] ${imgClassName}`}
      />

      {/* Two-Line Brand Typography */}
      {showText && (
        <div className={`h-full flex flex-col justify-between items-center text-center leading-none select-none whitespace-nowrap shrink-0 py-[1px] ${textClassName}`}>
          <span className={`text-[17px] font-black tracking-wider text-[#00b4d8] uppercase whitespace-nowrap group-hover:brightness-110 transition-all leading-none ${titleClassName}`}>
            IKSHATESTS
          </span>
          <span className={`text-[11.5px] font-medium tracking-normal text-slate-300 whitespace-nowrap group-hover:text-white transition-colors leading-none ${subtitleClassName}`}>
            Pariksha Shikshak
          </span>
        </div>
      )}
    </div>
  );
}
