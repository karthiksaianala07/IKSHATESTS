import { useState, useEffect } from 'react';

/**
 * Checks whether the current device is a mobile device (phone, tablet, or touch device with screen width < 1024px).
 * Online mock tests require a desktop or laptop environment with a keyboard and mouse to simulate actual CBT exam conditions.
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth < 1024;

  return isMobileUA || (hasTouch && isSmallScreen) || window.innerWidth < 768;
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
