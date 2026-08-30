import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { supabase } from '../config/supabase';
import { NCERT_CHAPTERS } from '../config/ncertChapters';
import MathKeypad from '../components/MathKeypad';
import AdminAnalytics from '../components/AdminAnalytics';
import AddTestPage from './AddTestPage';
import { Logo } from '../components/Logo';

export default function AdminPortal() {
  const location = useLocation();
  const navigate = useNavigate();

  // Route state
  const isAddTestView = location.pathname === '/admin/add-test';

  // Tabs: 'dashboard' | 'exams' | 'question-bank' | 'students' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Stats and data states
  const [stats, setStats] = useState({ activeStudents: 0, testsSubmitted: 0, avgScore: 0 });
  const [questions, setQuestions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [adminTests, setAdminTests] = useState([]);
  const [loadingAdminTests, setLoadingAdminTests] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);

  // Manual Question state
  const textRef = useRef(null);
  const subTextRef = useRef(null);
  const optionRefs = useRef([]);
  const [activeQuestionField, setActiveQuestionField] = useState('text');
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  const [newQuestion, setNewQuestion] = useState({
    subject: 'Physics',
    chapter: 'Physical World',
    type: 'MCQ',
    text: '',
    correct_answer: '',
    options: [
      { text: '', image_url: '' },
      { text: '', image_url: '' },
      { text: '', image_url: '' },
      { text: '', image_url: '' }
    ],
    image_url: '',
    sub_text: ''
  });
  const [uploading, setUploading] = useState(false);
  const [optUploading, setOptUploading] = useState(null);

  // Settings states
  const [brandName, setBrandName] = useState('IkshaTests Student Portal');
  const [supportEmail, setSupportEmail] = useState('support@ikshatests.edu');
  const [primaryColor, setPrimaryColor] = useState('#882D2D');
  const [secondaryColor, setSecondaryColor] = useState('#E7CF29');

  // Load resources based on active view/tab
  useEffect(() => {
    fetchStats();
    fetchAdminTests();
    fetchQuestions();
    fetchViolations();

    if (activeTab === 'dashboard') {
      const interval = setInterval(fetchViolations, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Synchronize path
  useEffect(() => {
    if (location.pathname === '/admin' && activeTab === '') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const fetchAdminTests = async () => {
    setLoadingAdminTests(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/tests`);
      setAdminTests(res.data || []);
    } catch (err) {
      console.error('Fetch tests error:', err);
    } finally {
      setLoadingAdminTests(false);
    }
  };

  const handleDeleteTest = async (testId, testTitle) => {
    if (!window.confirm(`Delete "${testTitle}"? This will un-link all questions.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/tests/${testId}`);
      fetchAdminTests();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete test');
    }
  };

  const fetchStats = () => {
    axios.get(`${API_URL}/api/admin/stats`)
      .then(res => {
        if (res.data && typeof res.data.activeStudents !== 'undefined') {
          setStats(res.data);
        }
      })
      .catch(err => {
        console.error("Stats Error:", err);
      });
  };

  const fetchViolations = () => {
    axios.get(`${API_URL}/api/admin/violations`)
      .then(res => {
        setViolations(res.data || []);
      })
      .catch(err => {
        console.error("Violations Fetch Error:", err);
      });
  };

  const fetchQuestions = () => {
    axios.get(`${API_URL}/api/admin/questions`)
      .then(res => {
        setQuestions(res.data || []);
      })
      .catch(err => {
        console.error("Questions Error:", err);
      });
  };

  const handleImageUpload = async (e, type = 'main', optIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'main') setUploading(true);
    else setOptUploading(optIndex);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('question-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('question-assets')
        .getPublicUrl(filePath);

      if (type === 'main') {
        setNewQuestion({ ...newQuestion, image_url: publicUrl });
      } else {
        const newOpts = [...newQuestion.options];
        newOpts[optIndex] = { ...newOpts[optIndex], image_url: publicUrl };
        setNewQuestion({ ...newQuestion, options: newOpts });
      }
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
      setOptUploading(null);
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/api/admin/questions`, newQuestion)
      .then(res => {
        setNewQuestion({
          subject: 'Physics',
          chapter: 'Physical World',
          type: 'MCQ',
          text: '',
          correct_answer: '',
          options: [
            { text: '', image_url: '' },
            { text: '', image_url: '' },
            { text: '', image_url: '' },
            { text: '', image_url: '' }
          ],
          image_url: '',
          sub_text: ''
        });
        fetchQuestions();
        alert('Question saved successfully!');
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.message || "Failed to add question";
        alert("Error adding question: " + msg);
      });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('ikshatests_user');
      navigate('/login');
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  const handleNavigation = (tabName) => {
    setActiveTab(tabName);
    navigate('/admin');
  };

  const formatNumber = (val) => (val || 0).toLocaleString();

  return (
    <div className="bg-[#020306] text-slate-100 font-sans min-h-screen flex antialiased">
      {/* ── Fixed Sidebar Navigation ── */}
      <aside className="w-72 fixed left-0 top-0 bottom-0 bg-[#060913] border-r border-slate-900/60 flex flex-col z-50">
        <div className="p-6 border-b border-slate-900/60 flex items-center gap-3">
          <Logo className="h-10 w-auto" />
          <div>
            <h1 className="font-headline font-black text-xl text-primary uppercase tracking-tight">IkshaTests</h1>
            <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-widest mt-0.5">Pariksha Shikshak</p>
          </div>
        </div>

        <nav className="flex-grow py-6 px-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleNavigation('dashboard')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'dashboard'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('exams')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  isAddTestView || (!isAddTestView && activeTab === 'exams')
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">quiz</span>
                Exam Series
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('question-bank')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'question-bank'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">source_notes</span>
                Question Bank
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('students')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'students'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">leaderboard</span>
                Student Analytics
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('settings')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none text-left ${
                  !isAddTestView && activeTab === 'settings'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-900/60">
          <button
            onClick={() => navigate('/admin/add-test')}
            className="w-full bg-[#882D2D] hover:bg-[#a33939] text-white font-black text-[10px] uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(136,45,45,0.2)] border-none"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create New Exam
          </button>
        </div>

        <div className="p-4 border-t border-slate-900/60 flex flex-col gap-1">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Panel Content Wrapper ── */}
      <div className="ml-72 flex-grow flex flex-col min-h-screen relative overflow-hidden">
        {/* Top App Bar */}
        <header className="h-16 border-b border-slate-900/60 bg-[#060913]/80 backdrop-blur-xl flex justify-between items-center px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 w-1/3">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
              <input
                className="w-full bg-slate-950/80 border border-slate-900/60 rounded-full pl-10 pr-4 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-mono"
                placeholder="Search exams, students, metrics..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase text-[#E7CF29] tracking-widest font-mono">Faculty Console</span>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <div className="h-8 w-8 rounded-full border border-slate-800 bg-slate-900 ml-2 overflow-hidden flex items-center justify-center font-bold text-xs text-primary uppercase font-mono shadow">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* ── Render Content Areas ── */}
        <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto space-y-8 pb-16">
          {isAddTestView ? (
            /* ADD TEST SUB-VIEW */
            <div className="animate-in fade-in duration-300">
              <AddTestPage />
            </div>
          ) : (
            /* TABBED VIEWS */
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Overview Header */}
                  <div>
                    <h2 className="font-headline font-black text-3xl text-slate-100">Overview</h2>
                    <p className="text-sm text-slate-400 mt-1">High-precision metrics for active competitive mock exams.</p>
                  </div>

                  {/* Metrics Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#882D2D]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Exams</span>
                        <span className="material-symbols-outlined text-primary text-xl">description</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">2,400+</div>
                      <div className="font-mono text-[10px] font-bold text-[#E7CF29] flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span className="ml-1">+12% this month</span>
                      </div>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#4EC6D7]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-400/5 rounded-full blur-2xl group-hover:bg-cyan-400/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Active Students</span>
                        <span className="material-symbols-outlined text-cyan-400 text-xl">group</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">{formatNumber(stats.activeStudents || 50000)}</div>
                      <div className="font-mono text-[10px] font-bold text-[#E7CF29] flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span className="ml-1">+8% this week</span>
                      </div>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#E7CF29]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-400/5 rounded-full blur-2xl group-hover:bg-amber-400/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Avg. Accuracy</span>
                        <span className="material-symbols-outlined text-[#E7CF29] text-xl">track_changes</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">98.6%</div>
                      <div className="font-mono text-[10px] font-bold text-red-500 flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_down</span>
                        <span className="ml-1">-0.2% variance</span>
                      </div>
                    </div>

                    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 rounded-2xl relative overflow-hidden group hover:border-[#882D2D]/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">Time Saved</span>
                        <span className="material-symbols-outlined text-primary text-xl">speed</span>
                      </div>
                      <div className="font-headline font-black text-3xl mb-1 text-slate-100">32%</div>
                      <div className="font-mono text-[10px] font-bold text-[#E7CF29] flex items-center">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span className="ml-1">+5% from last cohort</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Proctoring feed */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* SVG Chart Panel */}
                    <div className="xl:col-span-8 bg-[#060913]/60 border border-slate-900/60 rounded-2xl flex flex-col h-[420px]">
                      <div className="p-6 border-b border-slate-900/60 flex justify-between items-center">
                        <h3 className="font-headline font-bold text-lg">Performance Trends</h3>
                        <select className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-primary font-mono">
                          <option>Last 30 Days</option>
                          <option>Last Quarter</option>
                          <option>Year to Date</option>
                        </select>
                      </div>
                      <div className="flex-grow p-6 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
                        <div className="w-full h-full border-l border-b border-slate-900/80 relative">
                          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path className="opacity-80" d="M0,80 Q25,60 50,75 T100,25" fill="none" stroke="#882D2D" strokeWidth="2.5"></path>
                            <path className="opacity-45" d="M0,90 Q30,75 60,88 T100,45" fill="none" stroke="#E7CF29" strokeDasharray="4" strokeWidth="1.5"></path>
                          </svg>
                          <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cohort Accuracy Analysis</div>
                        </div>
                      </div>
                    </div>

                    {/* Exambot proctoring violations feed */}
                    <div className="xl:col-span-4 bg-[#060913]/60 border border-slate-900/60 rounded-2xl flex flex-col h-[420px]">
                      <div className="p-6 border-b border-slate-900/60 flex justify-between items-center">
                        <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-500 text-xl">shield_alert</span>
                          Security Alerts
                        </h3>
                        <button onClick={fetchViolations} className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-300 transition-colors border-none bg-transparent cursor-pointer" title="Refresh Feed">
                          <span className="material-symbols-outlined text-[18px]">refresh</span>
                        </button>
                      </div>
                      <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {violations && violations.length > 0 ? (
                          violations.map((v) => (
                            <div key={v.id} className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-900/40 rounded-xl hover:border-red-900/30 transition-all group">
                              <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-red-400 text-sm animate-pulse">shield</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-200 font-bold group-hover:text-red-400 transition-colors truncate">{v.email}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{v.testTitle} // <span className="text-red-400/80 font-bold">{v.violation}</span></p>
                              </div>
                              <span className="text-[9px] font-mono text-slate-600 self-center">{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                            <span className="material-symbols-outlined text-3xl text-emerald-400 mb-2">check_circle</span>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment Clean</p>
                            <p className="text-[10px] text-slate-600 mt-1">No proctoring violations recorded.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'exams' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Exams Header */}
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="font-headline font-black text-3xl text-slate-100">Exam Series Management</h2>
                      <p className="text-sm text-slate-400 mt-1">Configure, monitor, and analyze active testing modules.</p>
                    </div>
                    <button
                      onClick={() => navigate('/admin/add-test')}
                      className="px-5 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-none"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add New Test
                    </button>
                  </div>

                  {/* Active Tests List */}
                  <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-900/60 bg-slate-950/20">
                      <h3 className="font-headline font-bold text-lg">Posted Mock Tests</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {loadingAdminTests ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                          <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin opacity-50" />
                          <p className="text-xs font-bold uppercase tracking-widest font-mono">Retrieving blueprints…</p>
                        </div>
                      ) : adminTests.length > 0 ? (
                        adminTests.map(test => (
                          <div key={test.id} className="bg-slate-950/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between sm:items-center border border-slate-900/60 hover:border-primary/40 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${test.category?.startsWith('jee') ? 'bg-primary' : 'bg-cyan-500'}`} />
                              <div>
                                <span className="font-bold text-slate-200 text-base group-hover:text-primary transition-colors block">{test.title}</span>
                                <div className="flex gap-3 mt-1.5 flex-wrap font-mono text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded uppercase font-bold border bg-red-950/30 text-red-400 border-red-900/40">
                                    {test.category?.startsWith('jee') ? 'JEE' : 'NEET'}
                                  </span>
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    {test.duration_minutes} Mins
                                  </span>
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">help</span>
                                    {test.question_count} Questions
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTest(test.id, test.title)}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent"
                              title="Delete Test Blueprint"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <span className="material-symbols-outlined text-4xl mb-2 text-slate-600">assignment_late</span>
                          <p className="text-xs font-bold uppercase tracking-wider">No tests posted yet.</p>
                          <p className="text-[10px] text-slate-600 mt-1">Click "Add New Test" to get started.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'question-bank' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Question Bank Header */}
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="font-headline font-black text-3xl text-slate-100">Question Repository</h2>
                      <p className="text-sm text-slate-400 mt-1">Manually insert questions with KaTeX LaTeX notation or upload bulk data.</p>
                    </div>
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-5 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl text-xs uppercase tracking-wider font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-none"
                    >
                      <span className="material-symbols-outlined text-sm">{showAddForm ? 'close' : 'add'}</span>
                      {showAddForm ? 'Hide Form' : 'Insert Question'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Add Form / Bulk Import */}
                    <div className="lg:col-span-8 space-y-8">
                      {showAddForm && (
                        <form onSubmit={handleAddQuestion} className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl space-y-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
                          <div className="border-b border-slate-900/60 pb-4 mb-4">
                            <h3 className="font-headline font-bold text-lg text-slate-200">Manual Question Form</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Subject</label>
                              <select
                                className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold focus:outline-none focus:border-primary"
                                value={newQuestion.subject}
                                onChange={e => {
                                  const sub = e.target.value;
                                  setNewQuestion({
                                    ...newQuestion,
                                    subject: sub,
                                    chapter: NCERT_CHAPTERS[sub] ? NCERT_CHAPTERS[sub][0] : ''
                                  });
                                }}
                              >
                                <option>Physics</option>
                                <option>Chemistry</option>
                                <option>Mathematics</option>
                                <option>Biology</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Chapter</label>
                              <select
                                className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold focus:outline-none focus:border-primary"
                                value={newQuestion.chapter}
                                onChange={e => setNewQuestion({...newQuestion, chapter: e.target.value})}
                              >
                                {(NCERT_CHAPTERS[newQuestion.subject] || []).map(ch => (
                                  <option key={ch} value={ch}>{ch}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Type</label>
                              <select
                                className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold focus:outline-none focus:border-primary"
                                value={newQuestion.type}
                                onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}
                              >
                                <option>MCQ</option>
                                <option>NUMERICAL</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Question Text (Supports LaTeX $$...$$)</label>
                            <textarea
                              ref={textRef}
                              className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-sm min-h-[100px] focus:outline-none focus:border-primary"
                              placeholder="e.g. Find the value of $\int_0^{\pi} \sin x \, dx$"
                              value={newQuestion.text}
                              onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                              onFocus={() => setActiveQuestionField('text')}
                              required
                            />
                            <MathKeypad
                              targetRef={activeQuestionField === 'text' ? textRef : subTextRef}
                              value={activeQuestionField === 'text' ? newQuestion.text : (newQuestion.sub_text || '')}
                              setValue={(val) => setNewQuestion(prev => ({ ...prev, [activeQuestionField]: val }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Main Image Asset (Optional)</label>
                            <div className="flex flex-col gap-2">
                              <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-slate-900 bg-slate-950 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                  <span className={`material-symbols-outlined text-2xl mb-1 ${newQuestion.image_url ? 'text-green-400' : 'text-slate-500 group-hover:text-primary transition-colors'}`}>
                                    {uploading ? 'cloud_sync' : newQuestion.image_url ? 'check_circle' : 'cloud_upload'}
                                  </span>
                                  <p className="text-xs text-slate-500 group-hover:text-primary transition-colors font-mono">
                                    {uploading ? 'Processing...' : newQuestion.image_url ? 'Image Attached' : 'Upload main image'}
                                  </p>
                                </div>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" />
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Text Below Image (Optional, Supports LaTeX)</label>
                            <textarea
                              ref={subTextRef}
                              className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-sm min-h-[60px] focus:outline-none focus:border-primary"
                              placeholder="e.g. Find the value of current in the circuit shown above."
                              value={newQuestion.sub_text || ''}
                              onChange={e => setNewQuestion({...newQuestion, sub_text: e.target.value})}
                              onFocus={() => setActiveQuestionField('sub_text')}
                            />
                          </div>

                          {newQuestion.type === 'MCQ' && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">MCQ Options (Rich Support)</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {newQuestion.options.map((opt, i) => (
                                  <div key={i} className="flex gap-2">
                                    <input
                                      ref={el => optionRefs.current[i] = el}
                                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                      className="flex-1 p-3 border border-slate-900 bg-slate-950 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-primary"
                                      value={opt.text}
                                      onChange={e => {
                                        const newOpts = [...newQuestion.options];
                                        newOpts[i] = { ...newOpts[i], text: e.target.value };
                                        setNewQuestion({...newQuestion, options: newOpts});
                                      }}
                                      onFocus={() => setActiveOptionIndex(i)}
                                    />
                                    <label className={`w-12 flex items-center justify-center border border-dashed rounded-lg cursor-pointer bg-slate-950 hover:border-primary transition-colors ${opt.image_url ? 'border-green-500/50 bg-green-950/20' : 'border-slate-900'}`}>
                                      <span className={`material-symbols-outlined text-lg ${opt.image_url ? 'text-green-400' : 'text-slate-500'}`}>
                                        {optUploading === i ? 'sync' : opt.image_url ? 'image_check' : 'add_photo_alternate'}
                                      </span>
                                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'option', i)} className="hidden" />
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <MathKeypad
                                targetRef={{ current: optionRefs.current[activeOptionIndex] }}
                                value={newQuestion.options[activeOptionIndex]?.text || ''}
                                setValue={(val) => {
                                  const updated = [...newQuestion.options];
                                  updated[activeOptionIndex] = { ...updated[activeOptionIndex], text: val };
                                  setNewQuestion(prev => ({ ...prev, options: updated }));
                                }}
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Correct Answer (Index 0-3 for MCQ)</label>
                            <input
                              className="w-full p-3 rounded-lg border border-slate-900 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-primary font-mono"
                              value={newQuestion.correct_answer}
                              onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                              placeholder="e.g. 0"
                              required
                            />
                          </div>

                          <button type="submit" disabled={uploading} className="w-full py-4 bg-primary hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(136,45,45,0.25)] border-none cursor-pointer">
                            Save Question to Database
                          </button>
                        </form>
                      )}

                      <div className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl shadow-xl">
                        <h3 className="font-headline font-bold text-lg mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-400">cloud_upload</span>
                          Bulk Import JSON
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Paste an array of question JSON objects below to bulk-upload to the database.</p>
                        <textarea
                          className="w-full p-3 rounded-xl border border-slate-900 bg-slate-950 text-[10px] font-mono min-h-[160px] text-slate-300 focus:outline-none focus:border-primary"
                          placeholder='[{"subject": "Physics", "chapter": "Physical World", "type": "MCQ", "text": "What is...", "correct_answer": "0", "options": [{"text": "A"}, {"text": "B"}]}]'
                          onChange={async (e) => {
                            try {
                              const data = JSON.parse(e.target.value);
                              if (Array.isArray(data)) {
                                axios.post(`${API_URL}/api/admin/questions`, data)
                                  .then(() => {
                                    alert("Bulk upload success!");
                                    fetchQuestions();
                                  })
                                  .catch(err => {
                                    const msg = err.response?.data?.error || err.message || "Failed to bulk upload";
                                    alert("Error: " + msg);
                                  });
                              }
                            } catch (err) { /* quiet during typing */ }
                          }}
                        />
                      </div>
                    </div>

                    {/* Questions Registry */}
                    <div className="lg:col-span-4 bg-[#060913]/60 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl h-[700px] flex flex-col">
                      <div className="p-6 border-b border-slate-900/60 bg-slate-950/20">
                        <h3 className="font-headline font-bold text-lg">Question Index</h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Repository count: {questions.length}</p>
                      </div>
                      <div className="flex-grow overflow-y-auto divide-y divide-slate-900/60 p-4 space-y-4">
                        {questions && questions.length > 0 ? (
                          questions.map((q, i) => (
                            <div key={i} className="pt-4 first:pt-0 pb-1 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black border font-mono ${
                                  q.subject === 'Physics' ? 'bg-blue-950/40 text-blue-400 border-blue-900/40' :
                                  q.subject === 'Chemistry' ? 'bg-amber-950/40 text-amber-400 border-amber-900/40' :
                                  q.subject === 'Mathematics' ? 'bg-red-950/40 text-red-400 border-red-900/40' :
                                  'bg-green-950/40 text-green-400 border-green-900/40'
                                }`}>
                                  {q.subject}
                                </span>
                                <span className="text-[9px] uppercase font-black text-slate-500 border border-slate-900 px-1.5 py-0.5 rounded bg-slate-950/30 font-mono">{q.type}</span>
                              </div>
                              <p className="text-xs text-slate-300 font-medium line-clamp-2" title={q.text}>{q.text}</p>
                              {q.chapter && <p className="text-[9px] font-mono text-slate-500 truncate uppercase tracking-wider">{q.chapter}</p>}
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                            <span className="material-symbols-outlined text-3xl mb-2 text-slate-600">inventory_2</span>
                            <p className="text-xs font-bold uppercase tracking-wider">Empty Repository</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Students Header */}
                  <div>
                    <h2 className="font-headline font-black text-3xl text-slate-100">Student Analytics Overview</h2>
                    <p className="text-sm text-slate-400 mt-1">Comprehensive performance metrics across active exam cohorts.</p>
                  </div>

                  {/* Bento Performance Row */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Performance Distribution */}
                    <div className="col-span-12 lg:col-span-8 bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-colors">
                      <div className="absolute -top-20 -right-20 w-52 h-52 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors"></div>
                      <div className="flex justify-between items-center mb-8 relative z-10">
                        <h3 className="font-headline font-bold text-lg">Performance Distribution</h3>
                        <div className="font-mono text-[9px] text-slate-500 flex items-center gap-2 uppercase font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E7CF29]"></span> Top 10%
                          <span className="w-1.5 h-1.5 rounded-full bg-primary ml-3"></span> Avg Baseline
                        </div>
                      </div>
                      
                      {/* Bar columns */}
                      <div className="h-60 w-full flex items-end gap-3 relative z-10">
                        <div className="w-full h-full border-b border-l border-slate-900 absolute left-0 bottom-0 pointer-events-none">
                          <div className="w-full h-[1px] bg-slate-900/50 absolute bottom-1/4"></div>
                          <div className="w-full h-[1px] bg-slate-900/50 absolute bottom-2/4"></div>
                          <div className="w-full h-[1px] bg-slate-900/50 absolute bottom-3/4"></div>
                        </div>
                        <div className="flex-1 flex justify-center items-end group/bar cursor-pointer h-full pb-0 relative z-20">
                          <div className="w-12 bg-primary/20 hover:bg-primary/30 rounded-t border border-primary/20 h-[30%] transition-all duration-300"></div>
                        </div>
                        <div className="flex-1 flex justify-center items-end group/bar cursor-pointer h-full pb-0 relative z-20">
                          <div className="w-12 bg-primary/40 hover:bg-primary/50 rounded-t border border-primary/30 h-[45%] transition-all duration-300"></div>
                        </div>
                        <div className="flex-1 flex justify-center items-end group/bar cursor-pointer h-full pb-0 relative z-20">
                          <div className="w-12 bg-primary/60 hover:bg-primary/70 rounded-t border border-primary/50 h-[65%] transition-all duration-300 shadow-[0_0_15px_rgba(136,45,45,0.15)]"></div>
                        </div>
                        <div className="flex-1 flex justify-center items-end group/bar cursor-pointer h-full pb-0 relative z-20">
                          <div className="w-12 bg-[#E7CF29]/30 hover:bg-[#E7CF29]/40 rounded-t border border-[#E7CF29]/40 h-[85%] transition-all duration-300 shadow-[0_0_15px_rgba(231,207,41,0.15)]"></div>
                        </div>
                        <div className="flex-1 flex justify-center items-end group/bar cursor-pointer h-full pb-0 relative z-20">
                          <div className="w-12 bg-primary/50 hover:bg-primary/60 rounded-t border border-primary/35 h-[55%] transition-all duration-300"></div>
                        </div>
                        <div className="flex-1 flex justify-center items-end group/bar cursor-pointer h-full pb-0 relative z-20">
                          <div className="w-12 bg-primary/10 hover:bg-primary/20 rounded-t border border-primary/10 h-[25%] transition-all duration-300"></div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-4 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                        <span>&lt; 40% Accuracy</span>
                        <span>50%</span>
                        <span>60%</span>
                        <span>70%</span>
                        <span>80%</span>
                        <span>&gt; 90%</span>
                      </div>
                    </div>

                    {/* Quick Stats sidepanel */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                      <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 flex-1 flex flex-col justify-center hover:border-slate-800 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">Average Score Accuracy</p>
                          <span className="material-symbols-outlined text-[#E7CF29]">track_changes</span>
                        </div>
                        <h4 className="font-headline font-black text-3xl mb-1 text-slate-100">74.2%</h4>
                        <p className="font-mono text-[10px] font-bold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">trending_up</span>
                          +2.4% vs last cohort
                        </p>
                      </div>

                      <div className="bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 flex-1 flex flex-col justify-center hover:border-slate-800 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">Avg. Speed / Question</p>
                          <span className="material-symbols-outlined text-cyan-400">timer</span>
                        </div>
                        <h4 className="font-headline font-black text-3xl mb-1 text-slate-100">42s</h4>
                        <p className="font-mono text-[10px] font-bold text-[#E7CF29] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          Optimal testing pace
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student Registry / Reports */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Top Performers */}
                    <div className="col-span-12 lg:col-span-4 bg-[#060913]/60 border border-slate-900/60 rounded-2xl flex flex-col">
                      <div className="p-6 border-b border-slate-900/60 bg-slate-950/20 rounded-t-2xl">
                        <h3 className="font-headline font-bold text-lg">Top Performers</h3>
                      </div>
                      <div className="flex-grow p-4 space-y-4">
                        <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-950/40 border border-transparent hover:border-slate-900/60 transition-colors group cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary font-mono">AS</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-200 group-hover:text-primary transition-colors truncate">Aryan Sharma</h4>
                            <p className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">ID: IK-9042</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xs text-slate-200">98%</div>
                            <div className="font-mono text-[9px] text-primary font-bold uppercase mt-0.5">Rank #1</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-950/40 border border-transparent hover:border-slate-900/60 transition-colors group cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-cyan-950/60 border border-cyan-900/40 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono">PP</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-200 group-hover:text-cyan-400 transition-colors truncate">Priya Patel</h4>
                            <p className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">ID: IK-8831</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xs text-slate-200">96.5%</div>
                            <div className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">Rank #2</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-950/40 border border-transparent hover:border-slate-900/60 transition-colors group cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 font-mono">RD</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-200 group-hover:text-primary transition-colors truncate">Rohan Desai</h4>
                            <p className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">ID: IK-7729</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xs text-slate-200">95.2%</div>
                            <div className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">Rank #3</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Analytics Component */}
                    <div className="col-span-12 lg:col-span-8 bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 md:p-8 shadow-xl">
                      <div className="border-b border-slate-900/60 pb-4 mb-6">
                        <h3 className="font-headline font-bold text-lg text-slate-200">Real-time Diagnostic Monitoring</h3>
                      </div>
                      {/* Embed the rich Analytics insights */}
                      <AdminAnalytics />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Settings Header */}
                  <div>
                    <h2 className="font-headline font-black text-3xl text-slate-100">Configuration</h2>
                    <p className="text-sm text-slate-400 mt-1">Manage portal visual identity, branding, and notification routes.</p>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Settings Navigation */}
                    <nav className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none flex-shrink-0">
                      <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 bg-[#060913] border border-slate-900 rounded-lg text-primary text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">branding_watermark</span>
                        Platform Branding
                      </button>
                      <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 rounded-lg text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none bg-transparent">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        Payment Integration
                      </button>
                      <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 rounded-lg text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none bg-transparent">
                        <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                        Notifications
                      </button>
                      <button className="whitespace-nowrap flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 rounded-lg text-xs uppercase tracking-wider font-bold transition-all w-full text-left cursor-pointer border-none bg-transparent">
                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        Access Control
                      </button>
                    </nav>

                    {/* Settings Panel Content */}
                    <div className="flex-1 w-full bg-[#060913]/60 border border-slate-900/60 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
                      <div className="border-b border-slate-900/60 pb-4 mb-4 flex justify-between items-center flex-wrap gap-4">
                        <div>
                          <h3 className="font-headline font-bold text-lg text-slate-200">Platform Branding</h3>
                          <p className="text-xs text-slate-500 mt-1">Customize the visual identity details of the Student Portal.</p>
                        </div>
                        <button
                          onClick={() => alert('Branding settings saved locally! (Simulation)')}
                          className="bg-primary hover:brightness-110 text-white font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow border-none"
                        >
                          Save Changes
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Logo upload */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-300 font-mono tracking-wider">Platform Logo</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Recommended format: SVG or PNG (256x256px).</p>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden">
                                <span className="material-symbols-outlined text-2xl text-slate-500">school</span>
                              </div>
                              <label className="flex-1 border border-dashed border-slate-900 bg-slate-950 hover:bg-slate-950/80 rounded-xl p-4 text-center cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-slate-500 text-xl mb-1">cloud_upload</span>
                                <p className="text-xs text-slate-200 font-bold font-mono">Upload new logo file</p>
                                <input type="file" accept="image/*" className="hidden" />
                              </label>
                            </div>
                          </div>
                        </div>

                        <hr className="border-slate-900/60" />

                        {/* Colors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-300 font-mono tracking-wider">Brand Theme</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Define core accents for the student interface.</p>
                          </div>
                          <div className="md:col-span-2 space-y-4 font-mono text-[10px]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-[#882D2D] border border-slate-900"></div>
                              <input
                                className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-slate-100 font-bold w-28 focus:outline-none focus:border-primary"
                                type="text"
                                value={primaryColor}
                                onChange={e => setPrimaryColor(e.target.value)}
                              />
                              <span className="text-slate-500 uppercase tracking-widest font-bold">Primary Color</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-[#E7CF29] border border-slate-900"></div>
                              <input
                                className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-slate-100 font-bold w-28 focus:outline-none focus:border-primary"
                                type="text"
                                value={secondaryColor}
                                onChange={e => setSecondaryColor(e.target.value)}
                              />
                              <span className="text-slate-500 uppercase tracking-widest font-bold">Secondary Color</span>
                            </div>
                          </div>
                        </div>

                        <hr className="border-slate-900/60" />

                        {/* Text inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-300 font-mono tracking-wider">Portal Details</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Configuration details presented on main student headers.</p>
                          </div>
                          <div className="md:col-span-2 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Portal Title Name</label>
                              <input
                                className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-primary transition-colors font-medium"
                                type="text"
                                value={brandName}
                                onChange={e => setBrandName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Support Address Email</label>
                              <input
                                className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-primary transition-colors font-medium"
                                type="email"
                                value={supportEmail}
                                onChange={e => setSupportEmail(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
