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
      className="relative overflow-hidden p-6 rounded-3xl bg-[#2f6690]/90 border border-[#3a7ca5]/30 shadow-xl flex flex-col justify-between group min-h-[160px] text-left transition-all duration-300 hover:border-[#81c3d7]/50"
    >
      {/* Scroll-morphed Spotlight Mask */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.35 : 0,
          background: `radial-gradient(circle 140px at ${coords.x}px ${coords.y}px, ${activeGlow}, transparent 80%)`
        }}
      />

      <div className="relative z-10 flex gap-4 items-start">
        <div className="w-12 h-12 rounded-xl bg-[#0e2a3b] border border-[#3a7ca5]/40 flex items-center justify-center text-[#81c3d7] shrink-0 shadow-md group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-white tracking-tight font-headline">{title}</h4>
          <p className="text-[#d9dcd6] text-xs leading-relaxed font-medium">{children}</p>
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
        setActiveTheme('cyan');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme configurations built from brand colors #0a1128, #001f54, #034078, #1282a2, #fefcfb
  const themes = {
    cyan: {
      accent: "from-[#034078] via-[#fefcfb] to-[#1282a2]",
      accentText: "text-[#034078]",
      glowBg: "rgba(3,64,120,0.1)",
      borderColor: "border-[#034078]/40",
      glowHover: "rgba(3,64,120,0.3)",
      btnStyle: "bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-black shadow-[0_0_25px_rgba(18,130,162,0.4)]",
      borderNeon: "border-[#034078] shadow-[0_0_20px_rgba(3,64,120,0.35)]"
    },
    orange: {
      accent: "from-[#1282a2] via-[#fefcfb] to-[#034078]",
      accentText: "text-[#1282a2]",
      glowBg: "rgba(18,130,162,0.1)",
      borderColor: "border-[#1282a2]/40",
      glowHover: "rgba(18,130,162,0.3)",
      btnStyle: "bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-black shadow-[0_0_25px_rgba(18,130,162,0.4)]",
      borderNeon: "border-[#1282a2] shadow-[0_0_20px_rgba(18,130,162,0.35)]"
    },
    red: {
      accent: "from-[#fefcfb] via-[#1282a2] to-[#034078]",
      accentText: "text-[#fefcfb]",
      glowBg: "rgba(254,252,251,0.1)",
      borderColor: "border-[#fefcfb]/40",
      glowHover: "rgba(254,252,251,0.3)",
      btnStyle: "bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-black shadow-[0_0_25px_rgba(18,130,162,0.4)]",
      borderNeon: "border-[#fefcfb] shadow-[0_0_20px_rgba(254,252,251,0.35)]"
    }
  };

  const themeConfig = themes[activeTheme];

  return (
    <div className="w-full bg-transparent text-[#fefcfb] min-h-screen font-body overflow-x-hidden selection:bg-[#1282a2]/30 selection:text-white relative">
      
      {/* ── Background Glow & Orbs System ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid coordinate overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#fefcfb08_1px,transparent_1px),linear-gradient(to_bottom,#fefcfb08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-35" />
      </div>

      {/* ── 2. Hero Content Section ── */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column (Content) */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-headline tracking-tight leading-[1.1] sm:leading-[1.06] text-white">
            High-Precision Mock Exams for{' '}
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${themeConfig.accent} transition-all duration-1000`}>
              Competitive Success
            </span>
          </h1>

          {/* Subparagraph */}
          <p className="text-sm sm:text-base text-[#fefcfb] leading-relaxed font-medium">
            Accelerate your preparation with real-time testing metrics, instant time-wastage diagnostics, and targeted error correction consoles designed for all competitive examinations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              to="/login"
              className={`w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 ${themeConfig.btnStyle} font-black rounded-2xl transition-all duration-1000 hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2`}
            >
              Start Today
              <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
            </Link>
            <Link
              to="/exams"
              className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-[#001f54] hover:bg-[#034078] text-[#fefcfb] hover:text-white font-bold rounded-2xl border border-[#034078]/40 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              Registration
            </Link>
          </div>

          {/* Why Choose Us benefits */}
          <div className="space-y-6 pt-8 sm:pt-10 border-t border-[#034078]/30">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white font-headline">Why Choose Us</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
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
      <section id="sec-services" className="border-y border-[#034078]/30 bg-[#001f54]/90 backdrop-blur-md py-8 sm:py-10 px-4 sm:px-6 z-10 relative select-none">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div>
            <p className="text-[10px] text-[#fefcfb]/70 font-mono uppercase tracking-widest">Active Test Console</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-white mt-1">2,400+ Mocks</p>
          </div>
          <div>
            <p className="text-[10px] text-[#fefcfb]/70 font-mono uppercase tracking-widest">Accuracy Diagnostics</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-white mt-1">98.6%</p>
          </div>
          <div>
            <p className="text-[10px] text-[#fefcfb]/70 font-mono uppercase tracking-widest">Avg Speed Increase</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-white mt-1">32% Faster</p>
          </div>
          <div>
            <p className="text-[10px] text-[#fefcfb]/70 font-mono uppercase tracking-widest">Enrolled Students</p>
            <p className="text-xl sm:text-2xl font-black font-headline text-white mt-1">50,000+</p>
          </div>
        </div>
      </section>

      {/* ── 4. Footer ── */}
      <footer className="w-full bg-[#0a1128]/80 backdrop-blur-md border-t border-[#034078]/30 py-10 sm:py-12 px-4 sm:px-6 md:px-12 z-10 relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
              <Logo className="h-9 sm:h-10 w-auto" />
            </div>
            <p className="text-xs text-[#fefcfb]/70 font-medium max-w-sm">
              High-accuracy educational mock consoles and diagnostic behavioral reporting for all exams.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs font-bold text-[#fefcfb] font-mono">
            <Link to="/exams" className="hover:text-[#1282a2] transition-colors">Exam Series</Link>
            <Link to={user?.role === 'admin' ? "/admin" : "/dashboard"} className="hover:text-[#1282a2] transition-colors">
              {user?.role === 'admin' ? "Admin Panel" : "Dashboard"}
            </Link>
            <Link to="/login" className="hover:text-[#fefcfb] transition-colors font-bold text-[#1282a2]">Student Portal</Link>
          </div>

          <div className="text-[10px] sm:text-[11px] text-[#fefcfb]/50 font-mono tracking-wider uppercase">
            © 2026 IKSHATESTS // ALL RIGHTS RESERVED
          </div>

        </div>
      </footer>

    </div>
  );
}
