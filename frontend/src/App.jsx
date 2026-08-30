import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Shield } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TestLibrary from './pages/TestLibrary';
import LibrarySection from './pages/LibrarySection';
import Exams from './pages/Exams';
import TestConsole from './pages/TestConsole';
import AdminPortal from './pages/AdminPortal';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Logo } from './components/Logo';
import SparkleOrbs from './components/SparkleOrbs';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full animate-spin"></div>
             <div className="absolute inset-0 w-16 h-16 border-4 border-[#ec4899]/20 border-b-[#ec4899] rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
          </div>
          <div className="text-center">
            <p className="text-[#8b5cf6] font-black text-xs uppercase tracking-[0.3em] mb-1 animate-pulse">Initializing Portal</p>
            <p className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Securing Session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  useEffect(() => {
    // Remove legacy theme class triggers if any exist
    document.documentElement.classList.remove('theme-emerald-gold', 'theme-violet-coral', 'theme-ocean-orange');
    localStorage.removeItem('theme');
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [activeTheme, setActiveTheme] = useState('orange');
  const [blob1Pos, setBlob1Pos] = useState({ top: '0%', right: '0%' });
  const [blob2Pos, setBlob2Pos] = useState({ bottom: '0%', left: '0%' });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY >= 250);
      if (scrollY < 250) {
        setIsMenuExpanded(false);
      }

      if (scrollY < 250) {
        setActiveTheme('orange');
      } else if (scrollY < 750) {
        setActiveTheme('red');
      } else {
        setActiveTheme('cyan');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run handleScroll initially to set the state on render
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Collapse menu on route change
  useEffect(() => {
    setIsMenuExpanded(false);
  }, [location.pathname]);

  // Collapse menu on clicking outside when expanded on scroll
  useEffect(() => {
    if (!isMenuExpanded) return;
    const handleClickOutside = (e) => {
      const menuEl = document.getElementById('floating-navigation-bar');
      if (menuEl && !menuEl.contains(e.target)) {
        setIsMenuExpanded(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuExpanded]);

  // Sync theme string to DOM document root to dynamically load global Tailwind color tokens
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-orange', 'theme-red', 'theme-cyan');
    root.classList.add(`theme-${activeTheme}`);
  }, [activeTheme]);

  // Dynamic parallax coordinates drift for background bioluminescent light orbs
  useEffect(() => {
    const moveBlobs = () => {
      const top = Math.floor(Math.random() * 50); // 0% to 50%
      const right = Math.floor(Math.random() * 50); // 0% to 50%
      setBlob1Pos({ top: `${top}%`, right: `${right}%` });

      const bottom = Math.floor(Math.random() * 50); // 0% to 50%
      const left = Math.floor(Math.random() * 50); // 0% to 50%
      setBlob2Pos({ bottom: `${bottom}%`, left: `${left}%` });
    };

    // Calculate initial positions
    moveBlobs();

    // Recalculate coordinates every 8 seconds for a slow, floating drift
    const interval = setInterval(moveBlobs, 8000);
    return () => clearInterval(interval);
  }, []);

  const isTestConsole = location.pathname.includes('/test/');
  const isLoginPage = location.pathname === '/login';
  const isAdminPortal = location.pathname.startsWith('/admin');

  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin opacity-50"></div>
          <p className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Architecting Session...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) return <Login />;
  
  if (isTestConsole) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white">
        <Routes>
          <Route path="/test/:id" element={<ProtectedRoute><TestConsole /></ProtectedRoute>} />
        </Routes>
      </div>
    );
  }

  if (isAdminPortal) {
    return (
      <div className="bg-[#020306] text-slate-100 font-sans min-h-screen flex flex-col selection:bg-red-500/30 selection:text-red-200 relative antialiased">
        <Routes>
          <Route path="/admin/*" element={<ProtectedRoute requireAdmin={true}><AdminPortal /></ProtectedRoute>} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="bg-[#04060B] text-slate-100 font-body min-h-screen flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      
      {/* Global Dynamic Pulsating Background Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Blob 1: Top-Right */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[150px] transition-all duration-[4000ms] ease-in-out animate-pulse"
          style={{
            top: blob1Pos.top,
            right: blob1Pos.right,
            backgroundColor: 
              activeTheme === 'orange' ? 'rgba(249,115,22,0.15)' :
              activeTheme === 'red' ? 'rgba(239,68,68,0.15)' :
              activeTheme === 'cyan' ? 'rgba(78,198,215,0.15)' :
              'rgba(148,163,184,0.15)'
          }}
        />
        {/* Blob 2: Bottom-Left */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[150px] transition-all duration-[4000ms] ease-in-out animate-[pulse_3s_ease-in-out_infinite]"
          style={{
            animationDelay: '1s',
            bottom: blob2Pos.bottom,
            left: blob2Pos.left,
            backgroundColor: 
              activeTheme === 'orange' ? 'rgba(249,115,22,0.13)' :
              activeTheme === 'red' ? 'rgba(239,68,68,0.13)' :
              activeTheme === 'cyan' ? 'rgba(78,198,215,0.13)' :
              'rgba(148,163,184,0.13)'
          }}
        />
      </div>



      {/* Universal Floating Glassmorphic Tab Navigation */}
      <div 
        id="floating-navigation-bar"
        className={`fixed top-6 left-6 md:left-12 z-[60] select-none transition-all duration-300 ${
          (!isScrolled || isMenuExpanded)
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-900/60 backdrop-blur-2xl shadow-2xl rounded-2xl px-5 py-2.5">
          <Link to="/" className="flex items-center gap-2 px-1 py-1 rounded-xl">
            <Logo className="h-6 w-auto" />
          </Link>

          <div className="w-[1px] h-6 bg-slate-800/80"></div>

          <nav className="flex items-center gap-1">
            <Link to="/plans" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all">Plans</Link>
            
            {/* Exam Series Hover Dropdown */}
            <div className="relative group py-1.5">
              <Link to="/exams" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all flex items-center gap-1 cursor-pointer">
                Exam Series
                <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
              </Link>
              
              {/* Dropdown Menu Overlay */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-slate-950/90 border border-slate-900/60 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-[70] flex flex-col gap-1">
                <Link to="/jee-library" className="px-3.5 py-2.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all text-left uppercase tracking-wider">
                  IIT JEE
                </Link>
                <Link to="/neet-library" className="px-3.5 py-2.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all text-left uppercase tracking-wider">
                  NEET (UG)
                </Link>
              </div>
            </div>

            <Link to="/dashboard" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-900/30 transition-all">Dashboard</Link>
          </nav>

          <div className="w-[1px] h-6 bg-slate-800/80"></div>

          {user ? (
            <button 
              onClick={handleLogout} 
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border border-slate-800 cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <Link 
              to="/login" 
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border border-slate-800"
            >
              Sign In
            </Link>
          )}

          {/* Close button shown only when menu is expanded via collapsed button trigger */}
          {isScrolled && (
            <>
              <div className="w-[1px] h-6 bg-slate-800/80"></div>
              <button 
                onClick={() => setIsMenuExpanded(false)}
                className="p-1.5 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Compact Floating Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent immediate trigger of click outside handler
          setIsMenuExpanded(true);
        }}
        className={`fixed top-6 left-6 md:left-12 z-[60] flex items-center gap-2.5 bg-slate-950/80 border border-slate-900/60 backdrop-blur-2xl shadow-2xl rounded-2xl px-4 py-2.5 text-slate-200 hover:text-white hover:bg-slate-900/60 transition-all duration-300 cursor-pointer ${
          (isScrolled && !isMenuExpanded)
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <Logo className="h-5 w-auto" />
        <span className="w-[1px] h-4 bg-slate-800/80"></span>
        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Menu className="h-3 w-3" /> Menu
        </span>
      </button>

      {/* Main Routing Content */}
      <main className={`${location.pathname === '/' ? 'pt-0' : 'pt-28 md:pt-32'} flex-1 flex flex-col min-h-screen bg-transparent relative z-10`}>
        <div className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plans" element={<Pricing />} />
            <Route path="/exams" element={<div className="p-4 md:p-8 min-h-[calc(100vh-4rem)]"><Exams /></div>} />
            <Route path="/dashboard" element={<ProtectedRoute><div className="p-4 md:p-8 min-h-[calc(100vh-4rem)]"><Dashboard /></div></ProtectedRoute>} />
            <Route path="/jee-library" element={<div className="p-4 md:p-8 min-h-[calc(100vh-4rem)]"><TestLibrary pathway="jee" /></div>} />
            <Route path="/neet-library" element={<div className="p-4 md:p-8 min-h-[calc(100vh-4rem)]"><TestLibrary pathway="neet" /></div>} />
            <Route path="/library/:section" element={<ProtectedRoute><div className="p-4 md:p-8 min-h-[calc(100vh-4rem)]"><LibrarySection /></div></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Global Footer (shown on inner pages, hidden on Home which has dedicated dark footer) */}
        {location.pathname !== '/' && (
          <footer className="w-full bg-[#020305]/40 backdrop-blur-md border-t border-slate-900/60 py-12 px-6 md:px-12 z-10 relative shrink-0">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              
              <div className="flex flex-col items-center md:items-start gap-3">
                <div className="flex items-center gap-3">
                  <Logo className="h-8 w-auto" />
                </div>
                <p className="text-xs text-slate-500 font-medium max-w-sm">
                  High-accuracy educational mock consoles and diagnostic behavioral reporting for all exams.
                </p>
              </div>

              <div className="flex items-center gap-8 text-xs font-bold text-slate-400 font-mono">
                <Link to="/exams" className="hover:text-emerald-400 transition-colors">Exam Series</Link>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link>
                <Link to="/login" className="hover:text-emerald-400 transition-colors font-bold text-emerald-400">Student Portal</Link>
              </div>

              <div className="text-[11px] text-slate-600 font-mono tracking-wider uppercase">
                © 2026 IKSHATESTS // ALL RIGHTS RESERVED
              </div>

            </div>
          </footer>
        )}
      </main>

      {/* Sparkle Orbs Interactive Layer (placed at bottom of DOM order to guarantee click priority) */}
      <SparkleOrbs />
    </div>
  );
}
