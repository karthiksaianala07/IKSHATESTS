import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const TenantContext = createContext();

// Helper to extract the active subdomain from the current hostname or dev query param
export function extractSubdomain() {
  try {
    const hostname = window.location.hostname.toLowerCase();
    
    // 1. Check for manual development query parameter override: ?subdomain=saivikash
    const searchParams = new URLSearchParams(window.location.search);
    const querySubdomain = searchParams.get('subdomain');
    if (querySubdomain && querySubdomain.trim()) {
      return querySubdomain.trim().toLowerCase();
    }

    // 2. Local development subdomains: e.g. saivikash.localhost, saivikash.ikshatests.local
    if (hostname.includes('localhost') || hostname.endsWith('.local')) {
      const localParts = hostname.split('.');
      if (localParts.length >= 2 && localParts[0] !== 'localhost' && localParts[0] !== '127' && localParts[0] !== 'www') {
        return localParts[0];
      }
    }

    // 3. Production subdomains: e.g. saivikash.ikshatests.com, dps.ikshatests.com
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sub = parts[0];
      if (sub !== 'www' && sub !== 'app' && sub !== 'api') {
        return sub;
      }
    }

    // 4. Session Storage fallback for single-page preview mode
    const cachedSubdomain = sessionStorage.getItem('ikshatests_active_subdomain');
    if (cachedSubdomain) {
      return cachedSubdomain.toLowerCase();
    }

    return null;
  } catch (e) {
    return null;
  }
}

export function TenantProvider({ children }) {
  const detectedSubdomain = extractSubdomain();
  const [subdomain, setSubdomain] = useState(detectedSubdomain);
  const [tenant, setTenant] = useState(() => {
    if (!detectedSubdomain) return null;
    try {
      const cached = sessionStorage.getItem(`ikshatests_tenant_${detectedSubdomain}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loadingTenant, setLoadingTenant] = useState(!!detectedSubdomain && !tenant);

  useEffect(() => {
    if (!subdomain) {
      setTenant(null);
      setLoadingTenant(false);
      document.title = 'IkshaTests - Next-Gen Examination Platform';
      return;
    }

    let isMounted = true;

    const fetchTenantDetails = async () => {
      try {
        setLoadingTenant(true);
        const res = await axios.get(`${API_URL}/api/institutions/by-subdomain/${subdomain}`);
        if (res.data?.success && res.data.institution) {
          const inst = res.data.institution;
          if (isMounted) {
            setTenant(inst);
            sessionStorage.setItem(`ikshatests_tenant_${subdomain}`, JSON.stringify(inst));
            sessionStorage.setItem('ikshatests_active_subdomain', subdomain);
            
            // Apply Dynamic Document Title
            document.title = `${inst.name} | IkshaTests CBT Portal`;

            // Apply Dynamic CSS Custom Properties for Theming
            if (inst.brand_theme) {
              const root = document.documentElement;
              if (inst.brand_theme.primary) {
                root.style.setProperty('--tenant-primary', inst.brand_theme.primary);
              }
              if (inst.brand_theme.secondary) {
                root.style.setProperty('--tenant-secondary', inst.brand_theme.secondary);
              }
              if (inst.brand_theme.accent) {
                root.style.setProperty('--tenant-accent', inst.brand_theme.accent);
              }
            }
          }
        } else {
          if (isMounted) setTenant(null);
        }
      } catch (err) {
        console.warn(`[TENANT_RESOLVE_WARN] Could not load details for subdomain "${subdomain}":`, err.message);
        if (isMounted) {
          // If in offline / demo mode and subdomain is saivikash, load Sai Vikash default
          if (subdomain === 'saivikash') {
            const fallbackSv = {
              code: 'SV',
              subdomain: 'saivikash',
              name: 'Sai Vikash Educational Institutions',
              logo_url: '/assets/sai-vikash-logo.png',
              brand_theme: { primary: '#1282a2', secondary: '#034078', accent: '#00b4d8' }
            };
            setTenant(fallbackSv);
            document.title = `${fallbackSv.name} | IkshaTests CBT Portal`;
          } else {
            setTenant(null);
          }
        }
      } finally {
        if (isMounted) setLoadingTenant(false);
      }
    };

    fetchTenantDetails();

    return () => {
      isMounted = false;
    };
  }, [subdomain]);

  // Helper method to safely redirect a student or admin to their institute's subdomain
  const redirectToSubdomain = (targetSubdomain, path = '/dashboard') => {
    if (!targetSubdomain) {
      window.location.href = path;
      return;
    }

    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;

    // 1. Localhost development environment
    if (host.includes('localhost') || host === '127.0.0.1') {
      // In local dev, we can set session storage or use query param redirection
      sessionStorage.setItem('ikshatests_active_subdomain', targetSubdomain);
      window.location.href = `${protocol}//${host}${port}${path}?subdomain=${targetSubdomain}`;
      return;
    }

    // 2. Production domain (e.g. ikshatests.com or render/vercel)
    const hostParts = host.split('.');
    let baseDomain = host;
    if (hostParts.length >= 2) {
      // e.g. ikshatests.com
      baseDomain = hostParts.slice(-2).join('.');
    }

    const targetUrl = `${protocol}//${targetSubdomain}.${baseDomain}${port}${path}`;
    window.location.href = targetUrl;
  };

  return (
    <TenantContext.Provider value={{
      tenant,
      subdomain,
      setSubdomain,
      isTenantPortal: Boolean(subdomain && tenant),
      loadingTenant,
      redirectToSubdomain
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
