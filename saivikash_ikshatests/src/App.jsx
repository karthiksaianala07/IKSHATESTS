import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Shield } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TestLibrary from './pages/TestLibrary';
import LibrarySection from './pages/LibrarySection';
import Exams from './pages/Exams';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Logo } from './components/Logo';
import saiVikashLogo from './assets/sai-vikash-logo.png';
import SparkleOrbs from './components/SparkleOrbs';

// Lazy loaded heavy modules to drastically reduce initial bundle size and lighten mobile memory
const TestConsole = lazy(() => import('./pages/TestConsole'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const TestPaperPdfView = lazy(() => import('./pages/TestPaperPdfView'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#0a1128] flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#034078]/20 border-t-[#1282a2] rounded-full animate-spin"></div>
      <p className="text-[#1282a2] font-black text-xs uppercase tracking-widest animate-pulse">Loading Module...</p>
    </div>
  </div>
);

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1128] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-[#034078]/20 border-t-[#1282a2] rounded-full animate-spin"></div>
             <div className="absolute inset-0 w-16 h-16 border-4 border-[#fefcfb]/20 border-b-[#fefcfb] rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
          </div>
          <div className="text-center">
            <p className="text-[#1282a2] font-black text-xs uppercase tracking-[0.3em] mb-1 animate-pulse">Initializing Portal</p>
            <p className="text-[#fefcfb] text-[10px] uppercase font-bold tracking-widest">Securing Session...</p>
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

  // Automatically redirect any authenticated admin user to the admin panel
  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      if (location.pathname === '/' || location.pathname === '/login') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const [activeTheme, setActiveTheme] = useState('orange');
  const [blob1Pos, setBlob1Pos] = useState({ top: '0%', right: '0%' });
  const [blob2Pos, setBlob2Pos] = useState({ bottom: '0%', left: '0%' });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Collapse menus on route change
  useEffect(() => {
    setIsMenuExpanded(false);
    setIsMobileMenuOpen(false);
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

  const isTestPaperPdf = location.pathname.startsWith('/admin/test-paper/');
  const isTestConsole = location.pathname.includes('/test/') && !isTestPaperPdf;
  const isLoginPage = location.pathname === '/login';
  const isAdminPortal = location.pathname.startsWith('/admin') && !isTestPaperPdf;

  // If user is admin and on /login or /, immediately redirect to /admin without rendering Home
  if (user?.role === 'admin' && (isLoginPage || location.pathname === '/')) {
    return <Navigate to="/admin" replace />;
  }

  if (isLoginPage) return <Login />;
  
  if (isTestPaperPdf) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin/test-paper/:id" element={<ProtectedRoute requireAdmin={true}><TestPaperPdfView /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    );
  }

  if (isTestConsole) {
    return (
      <div className="min-h-screen bg-[#16425b] text-white">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/test/:id" element={<ProtectedRoute><TestConsole /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  if (isAdminPortal) {
    return (
      <div className="bg-[#0a1128] text-[#fefcfb] font-sans min-h-screen flex flex-col selection:bg-[#1282a2]/30 selection:text-white relative antialiased">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/*" element={<ProtectedRoute requireAdmin={true}><AdminPortal /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1128] text-[#fefcfb] font-body min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col selection:bg-[#1282a2]/30 selection:text-white relative">
      
      {/* Global Dynamic Pulsating Background Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Blob 1: Top-Right */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[150px] transition-all duration-[4000ms] ease-in-out animate-pulse"
          style={{
            top: blob1Pos.top,
            right: blob1Pos.right,
            backgroundColor: 
              activeTheme === 'orange' ? 'rgba(18,130,162,0.14)' :
              activeTheme === 'red' ? 'rgba(254,252,251,0.14)' :
              activeTheme === 'cyan' ? 'rgba(3,64,120,0.16)' :
              'rgba(18,130,162,0.14)'
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
              activeTheme === 'orange' ? 'rgba(18,130,162,0.12)' :
              activeTheme === 'red' ? 'rgba(254,252,251,0.12)' :
              activeTheme === 'cyan' ? 'rgba(3,64,120,0.14)' :
              'rgba(18,130,162,0.12)'
          }}
        />
      </div>

      {/* Universal Floating Glassmorphic Tab Navigation (Desktop: md and up) */}
      <div 
        id="floating-navigation-bar"
        className={`hidden md:block fixed top-6 left-6 md:left-12 z-[60] select-none transition-all duration-300 ${
          (!isScrolled || isMenuExpanded)
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4 bg-[#001f54]/90 border border-[#034078]/40 backdrop-blur-2xl shadow-2xl rounded-2xl px-5 py-2.5 whitespace-nowrap">
          <Link to="/" className="flex items-center gap-2 px-1 py-0.5 rounded-xl shrink-0 mr-1 group">
            <img 
              src={saiVikashLogo} 
              alt="Sai Vikash" 
              className="h-8 md:h-9 w-auto max-h-9 object-contain shrink-0 transition-all duration-300 group-hover:scale-105"
            />
          </Link>

          <div className="w-[1px] h-6 bg-[#034078]/40 shrink-0"></div>

          <nav className="flex items-center gap-1 shrink-0">
            <Link to="/plans" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#fefcfb] hover:text-white hover:bg-[#034078] transition-all whitespace-nowrap">Plans</Link>
            
            {/* Exam Series Hover Dropdown */}
            <div className="relative group py-1.5 shrink-0">
              <Link to="/exams" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#fefcfb] hover:text-white hover:bg-[#034078] transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap">
                Exam Series
                <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
              </Link>
              
              {/* Dropdown Menu Overlay */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-[#001f54]/95 border border-[#034078]/40 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-[70] flex flex-col gap-1">
                <Link to="/jee-library" className="px-3.5 py-2.5 rounded-xl text-[10px] font-bold text-[#fefcfb] hover:text-[#1282a2] hover:bg-[#034078] transition-all text-left uppercase tracking-wider">
                  IIT JEE
                </Link>
                <Link to="/neet-library" className="px-3.5 py-2.5 rounded-xl text-[10px] font-bold text-[#fefcfb] hover:text-[#1282a2] hover:bg-[#034078] transition-all text-left uppercase tracking-wider">
                  NEET (UG)
                </Link>
              </div>
            </div>

            {user?.role === 'admin' ? (
              <Link to="/admin" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#1282a2] hover:text-white hover:bg-[#1282a2]/20 border border-[#1282a2]/40 transition-all flex items-center gap-1.5 whitespace-nowrap">
                <Shield className="w-3.5 h-3.5" /> Admin Panel
              </Link>
            ) : (
              <Link to="/dashboard" className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#fefcfb] hover:text-white hover:bg-[#034078] transition-all whitespace-nowrap">Dashboard</Link>
            )}
          </nav>

          <div className="w-[1px] h-6 bg-[#034078]/40 shrink-0"></div>

          {user ? (
            <button 
              onClick={handleLogout} 
              className="bg-[#034078] hover:bg-[#1282a2] text-[#fefcfb] hover:text-white px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border border-[#034078]/40 cursor-pointer whitespace-nowrap shrink-0"
            >
              Logout
            </button>
          ) : (
            <Link 
              to="/login" 
              className="bg-[#034078] hover:bg-[#1282a2] text-[#fefcfb] hover:text-white px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border border-[#034078]/40 whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}

          {/* Close button shown only when menu is expanded via collapsed button trigger */}
          {isScrolled && (
            <>
              <div className="w-[1px] h-6 bg-[#034078]/40 shrink-0"></div>
              <button 
                onClick={() => setIsMenuExpanded(false)}
                className="p-1.5 hover:bg-[#034078] rounded-xl text-[#fefcfb] hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Compact Floating Menu Button (Desktop: md and up) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent immediate trigger of click outside handler
          setIsMenuExpanded(true);
        }}
        className={`hidden md:flex fixed top-6 left-6 md:left-12 z-[60] items-center gap-2.5 bg-[#001f54]/90 border border-[#034078]/40 backdrop-blur-2xl shadow-2xl rounded-2xl px-4 py-2.5 text-[#fefcfb] hover:text-white hover:bg-[#034078] transition-all duration-300 cursor-pointer ${
          (isScrolled && !isMenuExpanded)
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <img 
          src={saiVikashLogo} 
          alt="Sai Vikash" 
          className="h-6 w-auto max-h-6 object-contain shrink-0" 
        />
        <span className="w-[1px] h-4 bg-[#034078]/40"></span>
        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Menu className="h-3 w-3" /> Menu
        </span>
      </button>

      {/* Mobile Glassmorphic Navigation Bar & Slide-down Drawer (< md) */}
      <header className="md:hidden fixed top-3 left-3 right-3 z-[60] select-none">
        <div className="flex items-center justify-between bg-[#001f54]/95 border border-[#034078]/50 backdrop-blur-2xl shadow-2xl rounded-2xl px-4 py-2.5">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
            <img 
              src={saiVikashLogo} 
              alt="Sai Vikash" 
              className="h-7 w-auto max-h-7 object-contain shrink-0" 
            />
          </Link>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="p-2 rounded-xl text-[#fefcfb] hover:text-white hover:bg-[#034078]/60 transition-all cursor-pointer flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-[#1282a2]" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Card */}
        {isMobileMenuOpen && (
          <div className="mt-2 w-full bg-[#001f54]/98 border border-[#034078]/60 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              <Link 
                to="/plans" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-[#fefcfb] hover:text-white bg-[#034078]/30 hover:bg-[#034078]/60 border border-[#034078]/30 transition-all"
              >
                <span>Plans & Pricing</span>
                <span className="text-[#1282a2] text-sm">→</span>
              </Link>

              {/* Exam Series Section */}
              <div className="bg-[#034078]/20 border border-[#034078]/30 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1282a2] uppercase tracking-wider px-1">
                  <span>Exam Series</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <Link 
                    to="/jee-library" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-center bg-[#034078]/50 hover:bg-[#034078] text-[#fefcfb] border border-[#034078]/40 transition-all uppercase tracking-wider"
                  >
                    IIT JEE
                  </Link>
                  <Link 
                    to="/neet-library" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-center bg-[#034078]/50 hover:bg-[#034078] text-[#fefcfb] border border-[#034078]/40 transition-all uppercase tracking-wider"
                  >
                    NEET (UG)
                  </Link>
                </div>
              </div>

              {user?.role === 'admin' ? (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-[#1282a2] hover:text-white bg-[#1282a2]/15 hover:bg-[#1282a2]/30 border border-[#1282a2]/40 transition-all"
                >
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Admin Panel</span>
                  <span className="text-sm">→</span>
                </Link>
              ) : (
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-[#fefcfb] hover:text-white bg-[#034078]/30 hover:bg-[#034078]/60 border border-[#034078]/30 transition-all"
                >
                  <span>Student Dashboard</span>
                  <span className="text-[#1282a2] text-sm">→</span>
                </Link>
              )}
            </nav>

            <div className="w-full h-[1px] bg-[#034078]/40 my-0.5"></div>

            {user ? (
              <button 
                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} 
                className="w-full bg-[#034078] hover:bg-[#1282a2] text-[#fefcfb] hover:text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-[#034078]/50 cursor-pointer text-center"
              >
                Logout
              </button>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(18,130,162,0.4)] text-center block"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Backdrop for Mobile Drawer */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden transition-opacity" 
        />
      )}

      {/* Main Routing Content */}
      <main className={`${location.pathname === '/' ? 'pt-0' : 'pt-20 sm:pt-24 md:pt-32'} flex-1 flex flex-col min-h-screen min-h-[100dvh] w-full max-w-full bg-transparent relative z-10`}>
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
          <footer className="w-full bg-[#001f54]/90 backdrop-blur-md border-t border-[#034078]/30 py-12 px-6 md:px-12 z-10 relative shrink-0">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              
              <div className="flex flex-col items-center md:items-start gap-3">
                <div className="flex items-center gap-3">
                  <Logo className="h-10 w-auto" />
                </div>
                <p className="text-xs text-[#fefcfb]/70 font-medium max-w-sm">
                  High-accuracy educational mock consoles and diagnostic behavioral reporting for all exams.
                </p>
              </div>

              <div className="flex items-center gap-8 text-xs font-bold text-[#fefcfb] font-mono">
                <Link to="/exams" className="hover:text-[#1282a2] transition-colors">Exam Series</Link>
                <Link to={user?.role === 'admin' ? "/admin" : "/dashboard"} className="hover:text-[#1282a2] transition-colors">
                  {user?.role === 'admin' ? "Admin Panel" : "Dashboard"}
                </Link>
                <Link to="/login" className="hover:text-[#fefcfb] transition-colors font-bold text-[#1282a2]">Student Portal</Link>
              </div>

              <div className="text-[11px] text-[#fefcfb]/50 font-mono tracking-wider uppercase">
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
