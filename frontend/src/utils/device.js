import { useState, useEffect } from 'react';

/**
 * Checks whether the current device is a mobile device (phone, tablet, or touch device with screen width < 1024px).
 * Online mock tests require a desktop or laptop environment with a keyboard and mouse to simulate actual CBT exam conditions.
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';

  // 1. Explicit desktop operating systems (Windows, macOS, Linux, ChromeOS) must NEVER be treated as mobile,
  // even if they have touchscreens (Surface, Lenovo Yoga, HP Envy) or high-DPI scaling.
  const isDesktopOS = /Windows NT|Macintosh|X11|Linux x86_64|CrOS/i.test(ua);
  if (isDesktopOS && window.innerWidth >= 768) {
    return false;
  }

  // 2. Mobile User Agents
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);

  return (isMobileUA && window.innerWidth < 768) || window.innerWidth < 500;
};

/**
 * Custom React hook that reacts to device/window resize events to detect mobile devices.
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isMobile;
};
