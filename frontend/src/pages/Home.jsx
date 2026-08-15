import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';


// ── Custom Spotlight Benefits Card Component ──
function WhyChooseUsCard({ children, title, icon, activeGlow }) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden p-6 rounded-3xl bg-[#090b11]/80 border border-slate-900/60 shadow-xl flex flex-col justify-between group min-h-[160px] text-left transition-all duration-300 hover:border-slate-800"
    >
      {/* Scroll-morphed Spotlight Mask */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.25 : 0,
          background: `radial-gradient(circle 140px at ${coords.x}px ${coords.y}px, ${activeGlow}, transparent 80%)`
        }}
      />

      <div className="relative z-10 flex gap-4 items-start">
        <div className="w-12 h-12 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0 shadow-md group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-100 tracking-tight font-headline">{title}</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-medium">{children}</p>
        </div>
      </div>
    </div>
  );
}



// ── Main Page Component ──
export default function Home() {
  const { user, logout } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [activeTheme, setActiveTheme] = useState('orange'); // Initial state matches 0-250px range (orange)

  // Scroll tracking & Scrollmation Theme morpher triggers
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      if (currentScrollY < 250) {
        setActiveTheme('orange');
      } else if (currentScrollY < 750) {
        setActiveTheme('red');
      } else {
        setActiveTheme('gunmetal');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme configurations built from brand colors #882D2D, #E7CF29, #4EC6D7
  const themes = {
    cyan: {
      accent: "from-[#4EC6D7] via-cyan-300 to-[#E7CF29]",
      accentText: "text-[#4EC6D7]",
      glowBg: "rgba(78,198,215,0.06)",
      borderColor: "border-[#4EC6D7]/30",
      glowHover: "rgba(78,198,215,0.2)",
      btnStyle: "bg-[#4EC6D7] hover:bg-[#6dd4e2] text-slate-950 font-black shadow-[0_0_25px_rgba(78,198,215,0.35)]",
      borderNeon: "border-[#4EC6D7] shadow-[0_0_20px_rgba(78,198,215,0.35)]"
    },
    orange: {
      accent: "from-[#E7CF29] via-[#4EC6D7] to-[#882D2D]",
      accentText: "text-[#E7CF29]",
      glowBg: "rgba(231,207,41,0.06)",
      borderColor: "border-[#E7CF29]/30",
      glowHover: "rgba(231,207,41,0.2)",
      btnStyle: "bg-[#882D2D] hover:bg-[#a33939] text-white font-black shadow-[0_0_25px_rgba(136,45,45,0.4)]",
      borderNeon: "border-[#E7CF29] shadow-[0_0_20px_rgba(231,207,41,0.35)]"
    },
    red: {
      accent: "from-[#882D2D] via-red-400 to-[#E7CF29]",
      accentText: "text-[#882D2D]",
      glowBg: "rgba(136,45,45,0.06)",
      borderColor: "border-[#882D2D]/30",
      glowHover: "rgba(136,45,45,0.2)",
      btnStyle: "bg-[#882D2D] hover:bg-[#a33939] text-white font-black shadow-[0_0_25px_rgba(136,45,45,0.35)]",
      borderNeon: "border-[#882D2D] shadow-[0_0_20px_rgba(136,45,45,0.35)]"
    }
  };

  const themeConfig = themes[activeTheme];

  return (
    <div className="w-full bg-transparent text-slate-100 min-h-screen font-body overflow-x-hidden selection:bg-slate-800 selection:text-white relative">
      
      {/* ── Background Glow & Orbs System ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid coordinate overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-35" />
      </div>

      {/* ── 2. Hero Content Section ── */}
      <section className="relative pt-28 md:pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column (Content) */}
        <div className="lg:col-span-6 space-y-8 text-left">

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-headline tracking-tight leading-[1.06] text-slate-100">
            High-Precision Mock Exams for{' '}
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${themeConfig.accent} transition-all duration-1000`}>
              Competitive Success
            </span>
          </h1>

          {/* Subparagraph */}
          <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">
            Accelerate your preparation with real-time testing metrics, instant time-wastage diagnostics, and targeted error correction consoles designed for all competitive examinations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/login"
              className={`px-8 py-4 ${themeConfig.btnStyle} font-black rounded-2xl transition-all duration-1000 hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2`}
            >
              Start Today
              <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
            </Link>
            <Link
              to="/exams"
              className="px-8 py-4 bg-slate-950/60 hover:bg-slate-900/60 text-slate-300 hover:text-white font-bold rounded-2xl border border-slate-800 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              Registration
            </Link>
          </div>

          {/* Why Choose Us benefits */}
          <div className="space-y-6 pt-10 border-t border-slate-900/60">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100 font-headline">Why Choose Us</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <WhyChooseUsCard title="Analytics" icon="insights" activeGlow={themeConfig.glowHover}>
                Optimize your data analytics for training and result.
              </WhyChooseUsCard>

              <WhyChooseUsCard title="Expert Support" icon="headset" activeGlow={themeConfig.glowHover}>
                Expert walkthroughs and dedicated support.
              </WhyChooseUsCard>

              <WhyChooseUsCard title="Real-time Feedback" icon="schedule" activeGlow={themeConfig.glowHover}>
                Data diagnostics and real-time feedback.
              </WhyChooseUsCard>

            </div>
          </div>

        </div>

        {/* Right Column (Empty slot container to preserve exact layout alignment) */}
        <div className="lg:col-span-6 hidden lg:block" />

      </section>

      {/* ── 3. Platform Key Metrics Ribbon ── */}
      <section id="sec-services" className="border-y border-slate-900/70 bg-[#060912]/80 backdrop-blur-md py-10 px-6 z-10 relative select-none">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Active Test Console</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-slate-200 mt-1">2,400+ Mocks</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Accuracy Diagnostics</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-slate-200 mt-1">98.6%</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Avg Speed Increase</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-slate-200 mt-1">32% Faster</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Enrolled Students</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-slate-200 mt-1">50,000+</p>
          </div>
        </div>
      </section>

      {/* ── 4. Footer ── */}
      <footer className="w-full bg-[#020305]/40 backdrop-blur-md border-t border-slate-900/60 py-12 px-6 md:px-12 z-10 relative">
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

    </div>
  );
}
