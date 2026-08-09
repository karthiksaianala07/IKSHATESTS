import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Lock, Mail, KeyRound, Smartphone, User, RefreshCw, Shield, CheckCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

// Helper to generate a random 6-character visual CAPTCHA code
const generateRandomCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like O, 0, I, 1
  let text = '';
  for (let i = 0; i < 6; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
};

// Canvas drawing helper for premium neon/warped CAPTCHA
const drawCaptcha = (canvas, text) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background style
  ctx.fillStyle = '#020306'; // Venom black matching theme
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add some random noise lines
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 50) + 16}, ${Math.floor(Math.random() * 150) + 100}, ${Math.floor(Math.random() * 50) + 16}, 0.4)`;
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Add some random noise dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(16, 185, 129, ${Math.random() * 0.4 + 0.1})`; // Slime green
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw warped text
  ctx.font = 'bold 24px monospace';
  ctx.textBaseline = 'middle';
  
  const textWidth = ctx.measureText(text).width;
  const startX = (canvas.width - textWidth) / 2;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    ctx.save();
    
    // Position character with slight random offset
    const x = startX + i * 16 + Math.random() * 4 - 2;
    const y = canvas.height / 2 + Math.random() * 6 - 3;
    
    ctx.translate(x, y);
    
    // Rotate character slightly
    const angle = (Math.random() * 30 - 15) * Math.PI / 180;
    ctx.rotate(angle);
    
    // Premium theme colors
    const colors = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'password' | 'register' | 'otp_verify'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Registration States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Redraw CAPTCHA on code refresh/step change
  useEffect(() => {
    if (step === 'register' && canvasRef.current && generatedCaptcha) {
      drawCaptcha(canvasRef.current, generatedCaptcha);
    }
  }, [step, generatedCaptcha]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (email.trim() === '') return;
    setStep('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const res = await login(email, password);
    if (res.success) {
      if (email.toLowerCase() === 'karthiksaianala@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(res.error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (captchaInput.trim().toUpperCase() !== generatedCaptcha) {
      setError('Invalid CAPTCHA code. Please try again.');
      setCaptchaInput('');
      setGeneratedCaptcha(generateRandomCaptcha());
      return;
    }
    
    const res = await register(regEmail, regPassword, regFullName);
    if (res.success) {
      setSuccessMessage('Registration successful! You can now sign in.');
      setError('');
      // Clear registration fields
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setCaptchaInput('');
      setStep('email');
    } else {
      setError(res.error);
      setGeneratedCaptcha(generateRandomCaptcha());
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMessage('');
    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020306] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#10b981] rounded-full mix-blend-screen filter blur-[160px] opacity-[0.06] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#22c55e] rounded-full mix-blend-screen filter blur-[160px] opacity-[0.04] pointer-events-none animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
      
      <Card className="w-full max-w-md bg-slate-950/40 backdrop-blur-2xl border-slate-900/60 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8 hover:scale-105 transition-transform duration-500">
            <Logo className="h-20 w-auto shadow-[0_0_40px_rgba(255,255,255,0.05)] rounded-lg" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            {step === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-[#94a3b8]">
            {step === 'register' 
              ? 'Join IkshaTests for professional JEE & NEET mocks' 
              : 'Sign in to IkshaTests via Database Secure Auth'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-center transform transition-all animate-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-emerald-400">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-center transform transition-all animate-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-red-400">{error}</p>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><Mail size={16}/> Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="w-full pl-5 pr-4 py-4 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-medium text-lg placeholder:text-gray-600 animate-none"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full py-4 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all rounded-xl mt-4 cursor-pointer">
              Continue <Lock className="ml-2" size={18} />
            </Button>

            <div className="text-center mt-6">
              <button 
                type="button" 
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setStep('register');
                  setGeneratedCaptcha(generateRandomCaptcha());
                }} 
                className="text-sm text-[#94a3b8] hover:text-emerald-400 font-medium transition-colors cursor-pointer border-none bg-transparent"
              >
                New to IkshaTests? Register here
              </button>
            </div>

            <div className="relative my-6">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-900"></div></div>
               <div className="relative flex justify-center text-sm"><span className="px-4 bg-slate-950 text-[#94a3b8]">Or continue with</span></div>
            </div>
            
            <button type="button" onClick={handleGoogleLogin} className="w-full py-3.5 px-4 bg-white/90 hover:bg-white text-gray-900 font-bold rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer border-none">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
               Google Account
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-2">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><KeyRound size={16}/> Account Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="w-full px-5 py-4 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-medium text-lg placeholder:text-gray-600"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-gray-500 text-right mt-1">Forgot password is managed by Supabase Auth</p>
            </div>
            <Button type="submit" className="w-full py-4 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all rounded-xl mt-4">
              Sign In
            </Button>
            <button type="button" onClick={() => {setStep('email'); setError('');}} className="w-full text-center text-sm text-[#94a3b8] hover:text-emerald-400 font-medium transition-colors cursor-pointer border-none bg-transparent">
              Change Email
            </button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><User size={14}/> Full Name</label>
              <input 
                type="text" 
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Enter your full name" 
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-medium text-base placeholder:text-gray-600"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><Mail size={14}/> Email Address</label>
              <input 
                type="email" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Enter your email" 
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-medium text-base placeholder:text-gray-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><KeyRound size={14}/> Password</label>
              <input 
                type="password" 
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create password" 
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-medium text-base placeholder:text-gray-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><KeyRound size={14}/> Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password" 
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-medium text-base placeholder:text-gray-600"
                required
              />
            </div>

            {/* Visual CAPTCHA */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><Lock size={14}/> Visual CAPTCHA</label>
              <div className="flex gap-2 items-center">
                <canvas 
                  ref={canvasRef} 
                  width={140} 
                  height={45} 
                  className="rounded-xl border border-slate-900 bg-slate-950 shrink-0"
                />
                <button 
                  type="button" 
                  onClick={() => setGeneratedCaptcha(generateRandomCaptcha())}
                  className="p-3 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-900 rounded-xl text-emerald-400 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw size={16} />
                </button>
                <input 
                  type="text" 
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter code" 
                  className="flex-grow min-w-0 px-3 py-3 bg-slate-950/80 border border-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all shadow-inner font-bold text-center text-base uppercase tracking-widest placeholder:text-gray-600 placeholder:tracking-normal placeholder:font-medium"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3.5 text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all rounded-xl mt-4 cursor-pointer">
              Register Account <Shield size={16} className="ml-2" />
            </Button>

            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => {
                  setError('');
                  setStep('email');
                }} 
                className="text-sm text-[#94a3b8] hover:text-emerald-400 font-medium transition-colors cursor-pointer border-none bg-transparent"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
