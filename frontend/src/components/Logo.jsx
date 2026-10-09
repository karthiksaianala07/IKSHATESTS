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
  forcePlatform = false
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
          <div className={`h-full flex flex-col justify-center text-left leading-none select-none whitespace-nowrap shrink-0 py-[1px] ${textClassName}`}>
            <span className={`text-[15px] font-black tracking-wider text-[#00b4d8] uppercase whitespace-nowrap group-hover:brightness-110 transition-all leading-tight ${titleClassName}`}>
              {tenant.name}
            </span>
            <span className={`text-[10px] font-medium tracking-normal text-slate-300 whitespace-nowrap group-hover:text-white transition-colors leading-tight ${subtitleClassName}`}>
              Powered by IkshaTests
            </span>
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
