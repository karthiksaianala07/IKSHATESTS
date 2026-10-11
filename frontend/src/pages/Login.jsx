import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ArrowLeft, Shield, Check } from 'lucide-react';
import { Logo } from '../components/Logo';

// Brand educational assets
import ikshaCbtIllustration from '../assets/iksha-cbt-illustration.jpg';
import saiVikashLogo from '../assets/sai-vikash-logo.png';

// Feature flags (temporarily blocked as requested)
const ENABLE_GOOGLE_LOGIN = false;
const ENABLE_DEV_BYPASS = false;

export default function Login() {
  const navigate = useNavigate();
  const { user, login, loginWithGoogle } = useAuth();
  const { tenant, subdomain: currentSubdomain, redirectToSubdomain, isTenantPortal } = useTenant();

  const tenantLogoSrc = (tenant?.code === 'SV' || tenant?.subdomain === 'saivikash' || tenant?.logo_url?.includes('sai-vikash'))
    ? saiVikashLogo
    : (tenant?.logo_url || null);

  // Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically redirect if already authenticated as admin
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please provide both User ID / Email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (res.success) {
        const cleanLower = identifier.trim().toLowerCase();
        const cleanUpper = identifier.trim().toUpperCase();
        const isAdmin = res.user?.role === 'admin' || 
          res.user?.user_metadata?.role === 'admin' ||
          cleanLower === 'karthiksaianala@gmail.com' || 
          cleanLower === 'ikshatests@zohomail.in' ||
          cleanUpper === 'DBA' ||
          cleanUpper === 'DBA2';

        const targetPath = isAdmin ? '/admin' : '/dashboard';

        // Multi-Tenant Cross-Subdomain Redirection:
        // If user belongs to an institute with a subdomain and isn't currently on it,
        // redirect them directly to that institute's subdomain portal!
        if (res.subdomain && res.subdomain !== currentSubdomain) {
          setSuccessMessage(`Redirecting to ${res.institution?.name || res.subdomain} portal...`);
          setTimeout(() => {
            redirectToSubdomain(res.subdomain, targetPath);
          }, 400);
          return;
        }

        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(res.error || 'Failed to authenticate.');
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!ENABLE_GOOGLE_LOGIN) return;
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || 'Google authentication was cancelled or failed.');
      }
    } catch (err) {
      setError('Unable to authenticate with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#070b19] flex items-center justify-center p-3 sm:p-5 md:p-8 relative overflow-y-auto overflow-x-hidden font-sans select-none">

      {/* Background Atmosphere & Dynamic Pulsating Bulbs */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${ikshaCbtIllustration})` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Right Electric Cyan Pulsating Bulb */}
        <div 
          className="absolute -top-24 -right-24 w-[650px] h-[650px] bg-[#1282a2]/25 rounded-full mix-blend-screen filter blur-[160px] animate-pulse" 
        />
        {/* Bottom-Left Ocean Blue Pulsating Bulb */}
        <div 
          className="absolute -bottom-24 -left-24 w-[650px] h-[650px] bg-[#034078]/40 rounded-full mix-blend-screen filter blur-[160px] animate-[pulse_3.5s_ease-in-out_infinite]" 
          style={{ animationDelay: '1s' }}
        />
        {/* Center Accent Pulsating Glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00b4d8]/15 rounded-full mix-blend-screen filter blur-[180px] animate-[pulse_5s_ease-in-out_infinite]" 
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Floating Back to Home Pill */}
      <Link
        to="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#fefcfb]/80 hover:text-white bg-[#0a1128]/70 hover:bg-[#001f54]/80 border border-[#034078]/60 hover:border-[#1282a2]/60 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full backdrop-blur-xl transition-all duration-200 group shadow-lg"
      >
        <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5 text-[#1282a2] group-hover:text-white" />
        <span>Back to Home</span>
      </Link>

      {/* Glassmorphic Floating Window matching Home Page Colors */}
      <div className="w-full max-w-5xl bg-[#001f54]/85 backdrop-blur-2xl rounded-[32px] sm:rounded-[38px] md:rounded-[42px] shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_80px_rgba(18,130,162,0.22)] border border-[#034078]/60 p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 relative z-10 overflow-hidden my-auto">

        {/* LEFT COLUMN: Clean Visual Showcase Card */}
        <div className="lg:col-span-5 relative rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden min-h-[360px] lg:min-h-[580px] select-none border border-[#034078]/40 shadow-inner">
          {/* Background Visual Asset (Option A: CBT Simulator Illustration) */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 hover:scale-105"
            style={{ backgroundImage: `url(${ikshaCbtIllustration})` }}
          />
        </div>

        {/* RIGHT COLUMN: Glassmorphic Floating Window Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-6 lg:p-7 text-[#fefcfb]">

          {/* Form Content Area */}
          <div className="max-w-md w-full mx-auto my-auto py-0">

            {tenant ? (
              /* Tenant Header: Welcome to -> <Logo> CBT Platform -> powered by <Ikshatests> */
              <div className="mb-4 sm:mb-6 text-center flex flex-col items-center">
                <span className="text-xs sm:text-sm font-bold tracking-widest text-[#00b4d8] uppercase mb-1">
                  Welcome to
                </span>

                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-1">
                  {tenantLogoSrc ? (
                    <img
                      src={tenantLogoSrc}
                      alt={tenant.name || "Institution Logo"}
                      className="h-8 sm:h-10 md:h-11 w-auto max-w-[210px] sm:max-w-[250px] object-contain rounded-md shadow-sm"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-[#00b4d8] uppercase">
                      {tenant.name}
                    </span>
                  )}
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#fefcfb] tracking-tight uppercase whitespace-nowrap">
                    CBT Platform
                  </span>
                </div>

                <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-2 sm:gap-2.5">
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-300 lowercase">
                    powered by
                  </span>
                  <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
                    <Logo
                      forcePlatform={true}
                      className="h-7 sm:h-8 w-auto gap-2"
                      titleClassName="!text-[14px] sm:!text-[15px]"
                      subtitleClassName="!text-[9.5px] sm:!text-[10px]"
                    />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Central Platform Logo Header */}
                <div className="flex items-center justify-center pb-2 sm:pb-3">
                  <Link to="/" className="flex items-center gap-2 group">
                    <Logo
                      className="h-11 sm:h-12 w-auto gap-3.5"
                      titleClassName="!text-[26px]"
                      subtitleClassName="!text-[17px]"
                    />
                  </Link>
                </div>

                {/* Title & Greeting - Centered */}
                <div className="mb-3 text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#fefcfb] tracking-tight">
                    Hi Aspirant
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                    Welcome to IKSHATESTS
                  </p>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-200 flex items-center gap-2 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-3 p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={tenant ? `User ID or Email (e.g. ${tenant.code}-STU-101)` : "User ID or Email (e.g. SV-STU-101, IK2026-101)"}
                  className="w-full px-4 py-3 bg-[#0a1128]/80 border border-[#034078]/60 hover:border-[#1282a2]/60 rounded-xl sm:rounded-2xl text-[#fefcfb] placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#1282a2] focus:ring-4 focus:ring-[#1282a2]/20 transition-all shadow-inner"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-[#0a1128]/80 border border-[#034078]/60 hover:border-[#1282a2]/60 rounded-xl sm:rounded-2xl text-[#fefcfb] placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#1282a2] focus:ring-4 focus:ring-[#1282a2]/20 transition-all shadow-inner"
                  required
                />
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => alert('Student credentials and passwords are administrator-managed.\n\nPlease contact your teacher or institution administrator to update or reset your password.')}
                    className="text-[11px] font-semibold text-[#1282a2] hover:text-[#00b4d8] transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot password ?
                  </button>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-xl sm:rounded-2xl bg-[#1282a2] hover:bg-[#159cc2] text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(18,130,162,0.4)] hover:shadow-[0_0_35px_rgba(18,130,162,0.6)] transition-all cursor-pointer active:scale-98 disabled:opacity-70 mt-2"
              >
                {isSubmitting ? 'Signing in...' : 'Login'}
              </button>

              {/* Divider & Google Login Button (Temporarily Blocked) */}
              {ENABLE_GOOGLE_LOGIN && (
                <>
                  <div className="relative my-2.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#034078]/50" />
                    </div>
                    <div className="relative flex justify-center text-xs text-slate-400">
                      <span className="px-3 bg-[#001f54] rounded-full">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full py-2.5 sm:py-3 px-4 bg-[#0a1128]/70 hover:bg-[#0a1128] border border-[#034078]/60 hover:border-[#1282a2]/50 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer active:scale-98"
                  >
                    <span>Login with Google</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                  </button>
                </>
              )}
            </form>

            {/* Dev Bypass Mock Admin (Temporarily Blocked) */}
            {ENABLE_DEV_BYPASS && (
              <div className="mt-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('ikshatests_user', JSON.stringify({ email: 'karthiksaianala@gmail.com', role: 'admin', full_name: 'Karthik Sai Anala', id: 'mock-admin-id' }));
                    window.location.href = '/admin';
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none inline-flex items-center gap-1"
                >
                  <Shield size={12} /> Dev Bypass: Mock Admin
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
