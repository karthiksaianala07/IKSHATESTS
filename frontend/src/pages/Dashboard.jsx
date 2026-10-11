import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api';
import { CutoffGauge } from '../components/CutoffGauge';
import { ReattemptModal } from '../components/ReattemptModal';
import LatexRenderer from '../components/LatexRenderer';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Submissions State for Real Student Analytics
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedSubDetail, setSelectedSubDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showReattemptModal, setShowReattemptModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      fetchUserSubmissions();
    }
  }, [user, navigate]);

  // Load detailed submission metrics dynamically when student clicks a test
  useEffect(() => {
    if (!selectedSubId) {
      setSelectedSubDetail(null);
      setSelectedQuestion(null);
      return;
    }
    fetchSubmissionDetail(selectedSubId);
  }, [selectedSubId]);

  const checkAnswer = (studentAnswer, q) => {
    if (studentAnswer === undefined || studentAnswer === null || String(studentAnswer).trim() === '') return false;
    const sa = String(studentAnswer).trim().toLowerCase();
    const ca = String(q.correct_answer).trim().toLowerCase();
    
    if (sa === ca) return true;
    
    if (q.type?.toUpperCase() === 'MCQ' || (q.options && q.options.length > 0)) {
      const optionLetters = ['a', 'b', 'c', 'd', 'e'];
      const caMatch = ca.match(/option\s*([a-e1-5])/);
      if (caMatch) {
        const char = caMatch[1];
        if (/^[1-5]$/.test(char)) {
          const idx = parseInt(char, 10) - 1;
          if (sa === String(idx)) return true;
        } else {
          const idx = optionLetters.indexOf(char);
          if (idx !== -1 && sa === String(idx)) return true;
        }
      }
      
      if (ca.length === 1 && /^[a-e]$/.test(ca)) {
        const idx = optionLetters.indexOf(ca);
        if (idx !== -1 && sa === String(idx)) return true;
      }
      
      if (/^[1-5]$/.test(ca) && /^[0-4]$/.test(sa)) {
        if (parseInt(ca, 10) - 1 === parseInt(sa, 10)) return true;
      }
    }
    return false;
  };

  const processBackendSubmission = (dbSub) => {
    const test = dbSub.tests || {};
    const questions = test.questions || [];
    const responses = dbSub.answers?.responses || {};
    
    const category = test.category?.toUpperCase().includes('NEET') ? 'NEET' : 'JEE';
    const totalQuestions = questions.length;
    const maxScore = totalQuestions * 4;
    const cutoff = category === 'NEET' ? 137 : 92;
    const score = typeof dbSub.score === 'number' ? dbSub.score : 0;
    const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
    const totalAttempted = (dbSub.correct_count || 0) + (dbSub.wrong_count || 0);
    const accuracy = totalAttempted > 0 ? Math.round(((dbSub.correct_count || 0) / totalAttempted) * 100) : 0;
    
    // Group questions by subject & chapter
    const subjectMap = {};
    const topicMap = {};
    
    const questionMatrix = questions.map((q, idx) => {
      const studentAnswer = responses[idx];
      const isSkipped = studentAnswer === undefined || studentAnswer === null || String(studentAnswer).trim() === '';
      const isCorrect = !isSkipped && checkAnswer(studentAnswer, q);
      const isWrong = !isSkipped && !isCorrect;
      
      const status = isCorrect ? 'correct' : isWrong ? 'wrong' : 'skipped';
      const marks = isCorrect ? '+4' : isWrong ? '-1' : '0';
      
      const subName = q.subject || 'General';
      if (!subjectMap[subName]) {
        subjectMap[subName] = { name: subName, correct: 0, wrong: 0, skipped: 0, total: 0, score: 0 };
      }
      subjectMap[subName].total += 1;
      if (isCorrect) {
        subjectMap[subName].correct += 1;
        subjectMap[subName].score += 4;
      } else if (isWrong) {
        subjectMap[subName].wrong += 1;
        subjectMap[subName].score -= 1;
      } else {
        subjectMap[subName].skipped += 1;
      }
      
      const topicName = q.chapter || 'General Concepts';
      if (!topicMap[topicName]) {
        topicMap[topicName] = { topic: topicName, subject: subName, correct: 0, total: 0 };
      }
      topicMap[topicName].total += 1;
      if (isCorrect) topicMap[topicName].correct += 1;
      
      return {
        qNum: idx + 1,
        status: status,
        subject: subName,
        topic: topicName,
        marks: marks,
        efficiency: isCorrect ? 'Correct (+4)' : isWrong ? 'Negative Penalty (-1)' : 'Unattempted (0)'
      };
    });
    
    const subjects = Object.values(subjectMap).map(sub => {
      const subAttempted = sub.correct + sub.wrong;
      return {
        name: sub.name,
        score: sub.score,
        maxScore: sub.total * 4,
        accuracy: subAttempted > 0 ? Math.round((sub.correct / subAttempted) * 100) : 0,
        correct: sub.correct,
        wrong: sub.wrong,
        skipped: sub.skipped
      };
    });
    
    const strong = [];
    const careless = [];
    const weak = [];
    
    Object.values(topicMap).forEach(topic => {
      const accuracyVal = topic.total ? Math.round((topic.correct / topic.total) * 100) : 0;
      const wrongCount = topic.total - topic.correct;
      
      if (accuracyVal >= 80) {
        strong.push({ topic: topic.topic, subject: topic.subject, accuracy: `${accuracyVal}%`, speed: 'Optimal' });
      } else if (accuracyVal >= 30) {
        careless.push({ topic: topic.topic, subject: topic.subject, accuracy: `${accuracyVal}%`, impact: `-${wrongCount} pts penalty` });
      } else {
        weak.push({ topic: topic.topic, subject: topic.subject, accuracy: `${accuracyVal}%`, status: 'Needs Revision' });
      }
    });
    
    if (strong.length === 0) strong.push({ topic: 'All Topics Evaluated', subject: 'General', accuracy: 'N/A', speed: 'N/A' });
    if (careless.length === 0) careless.push({ topic: 'None Detected', subject: 'General', accuracy: 'N/A', impact: '0 pts penalty' });
    if (weak.length === 0) weak.push({ topic: 'None Detected', subject: 'General', accuracy: 'N/A', status: 'Healthy' });
    
    return {
      id: dbSub.id,
      test_id: dbSub.test_id,
      test_title: test.title || 'Exam Attempt',
      category: category,
      date: dbSub.created_at ? new Date(dbSub.created_at).toISOString().split('T')[0] : 'Recent',
      score: score,
      max_score: maxScore || (category === 'NEET' ? 720 : 300),
      percentage: percentage,
      cutoff: cutoff,
      accuracy: accuracy,
      total_duration_mins: test.duration_minutes || (category === 'NEET' ? 200 : 180),
      correct_count: dbSub.correct_count || 0,
      wrong_count: dbSub.wrong_count || 0,
      skipped_count: dbSub.skipped_count || 0,
      subjects: subjects,
      heatmap: { strong, careless, weak },
      question_matrix: questionMatrix,
      answers: dbSub.answers || {},
      questions_data: questions.map(q => ({
        id: q.id,
        subject: q.subject,
        chapter: q.chapter || 'General',
        type: q.type || 'MCQ',
        text: q.text,
        options: q.options || [],
        correct_answer: q.correct_answer,
        image_url: q.image_url,
        sub_text: q.sub_text
      }))
    };
  };

  const fetchSubmissionDetail = async (subId) => {
    if (!subId) return;
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API_URL}/api/submissions/detail/${subId}`);
      if (res.data) {
        const parsed = processBackendSubmission(res.data);
        setSelectedSubDetail(parsed);
      }
    } catch (err) {
      console.error("Error fetching submission details:", err);
      setSelectedSubDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchUserSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      if (!user?.id) {
        setSubmissions([]);
        return;
      }
      const res = await axios.get(`${API_URL}/api/submissions/user/${user.id}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((sub, idx) => {
          const cat = sub.tests?.category?.toUpperCase().includes('NEET') ? 'NEET' : 'JEE';
          const maxScore = cat === 'NEET' ? 720 : (sub.tests?.total_marks || 300);
          const cutoff = cat === 'NEET' ? 137 : 92;
          const score = typeof sub.score === 'number' ? sub.score : 0;
          const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
          const totalAttempted = (sub.correct_count || 0) + (sub.wrong_count || 0);
          const accuracy = totalAttempted > 0 ? Math.round(((sub.correct_count || 0) / totalAttempted) * 100) : 0;

          return {
            id: sub.id || `sub-${idx}`,
            test_id: sub.test_id,
            test_title: sub.tests?.title || `Exam Attempt #${idx + 1}`,
            category: cat,
            date: sub.created_at ? new Date(sub.created_at).toISOString().split('T')[0] : 'Recent',
            score: score,
            max_score: maxScore,
            percentage: percentage,
            cutoff: cutoff,
            accuracy: accuracy,
            total_duration_mins: sub.tests?.duration_minutes || (cat === 'NEET' ? 200 : 180),
            correct_count: sub.correct_count || 0,
            wrong_count: sub.wrong_count || 0,
            skipped_count: sub.skipped_count || 0,
            subjects: [],
            heatmap: { strong: [], careless: [], weak: [] },
            question_matrix: [],
            questions_data: [],
            answers: sub.answers || {}
          };
        });
        setSubmissions(mapped);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error fetching student submissions:', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const currentSub = (selectedSubDetail && selectedSubDetail.id === selectedSubId) 
    ? selectedSubDetail 
    : (submissions.find(s => s.id === selectedSubId) || null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1400px] mx-auto pb-16">
      {/* ── Top Header & Greeting ── */}
      <div className="flex justify-between items-end flex-wrap gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
              {isAdmin ? 'Admin Portal' : 'Student Performance Command Center'}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-on-surface font-headline">
            Welcome back, {user?.full_name || (user?.email ? user.email.split('@')[0] : 'Aspirant')}!
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            Here is your live architectural performance and examination diagnostic blueprint.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary-container rounded-2xl px-5 py-2.5 items-center gap-2.5 border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-primary text-2xl">
              assignment_turned_in
            </span>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-secondary-container tracking-wider">Tests Taken</p>
              <p className="font-black text-on-secondary-container text-sm">
                {submissions.length} {submissions.length === 1 ? 'Exam Attempt' : 'Exam Attempts'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STUDENT ANALYTICS DASHBOARD ── */}
      <div className="space-y-10">
        {selectedSubId === null ? (
          /* VIEW 1: TESTS ATTEMPTED REGISTRY */
          <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
                  Tests Attempted
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">Select any test below and click "View Analysis" to open its detailed diagnostic report.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                Total Attempted: {submissions.length}
              </span>
            </div>

            {loadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                <div className="w-10 h-10 border-4 border-t-primary rounded-full animate-spin opacity-60" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading your test records...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface/50">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                  <span className="material-symbols-outlined text-3xl">assignment_add</span>
                </div>
                <h4 className="text-xl font-bold text-on-surface font-headline mb-1">
                  No Test Attempts Found
                </h4>
                <p className="text-sm text-slate-400 max-w-md mb-6">
                  You haven't attempted any tests yet. Take an exam from the institution portal or test library to see your real-time analytics and detailed diagnostics.
                </p>
                <button
                  onClick={() => navigate('/tests')}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Explore Tests
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {submissions.map((sub) => (
                  <div 
                    key={sub.id}
                    className="bg-surface border border-outline-variant/20 hover:border-primary/50 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                            sub.category === 'JEE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {sub.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold">{sub.date}</span>
                        </div>
                        <h4 className="font-bold text-on-surface text-xl font-headline group-hover:text-primary transition-colors">{sub.test_title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-primary">{sub.score}</span>
                        <span className="text-xs text-slate-400 font-bold block">/ {sub.max_score}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-outline-variant/10 text-center text-xs bg-slate-50/50 rounded-xl">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</p>
                        <p className="font-black text-slate-800 text-sm">{sub.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Score %</p>
                        <p className="font-black text-emerald-600 text-sm">{sub.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p>
                        <p className="font-black text-slate-800 text-sm">{sub.total_duration_mins}m</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        sub.score >= sub.cutoff ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {sub.score >= sub.cutoff ? 'check_circle' : 'pending_actions'}
                        </span>
                        {sub.score >= sub.cutoff ? 'Cutoff Cleared' : 'Below Cutoff'}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white hover:brightness-110 font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-primary/20 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">analytics</span>
                        View Analysis
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: DETAILED ANALYTICS WORKSPACE FOR SELECTED TEST */
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Back Button & Header Banner */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedSubId(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-wider rounded-xl border border-outline-variant/30 transition-all cursor-pointer flex items-center gap-2 w-fit active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to All Attempted Tests
              </button>

              {currentSub && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-xl flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-black uppercase tracking-widest">
                        Diagnostic Analysis
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">• {currentSub.date}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black font-headline text-white">
                      {currentSub.test_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowReattemptModal(true)}
                      className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">replay</span>
                      Re-attempt Inverted (Wrong & Skipped)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-32 text-on-surface-variant gap-4 bg-surface-container-lowest border border-outline-variant/20 p-8 rounded-3xl">
                <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin opacity-50" />
                <div className="text-center">
                  <p className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-1 animate-pulse">Loading Test Details</p>
                  <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Generating question matrix and topic diagnostics...</p>
                </div>
              </div>
            ) : !currentSub ? (
              <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant/20 rounded-3xl">
                <p className="text-sm text-slate-400 mb-4">Submission details could not be found or have been removed.</p>
                <button
                  onClick={() => setSelectedSubId(null)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider"
                >
                  Return to Tests List
                </button>
              </div>
            ) : (
              <>
                {/* PART A: EXECUTIVE SUMMARY CARD */}
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">insights</span>
                    A. Executive Summary (At a Glance)
                  </h4>

                  {/* 4 Metric Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* 1. Total Score */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Score</span>
                        <span className="p-2.5 rounded-xl bg-purple-950/40 text-purple-400 border border-purple-800/30 material-symbols-outlined">score</span>
                      </div>
                      <h4 className="text-3xl font-black text-on-surface">
                        {currentSub.score} <span className="text-sm text-slate-400 font-medium">/ {currentSub.max_score}</span>
                      </h4>
                      <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        {currentSub.percentage}% Total Marks
                      </p>
                    </div>

                    {/* 2. Qualifying Cut-off Benchmark */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cut-off Status</span>
                        <span className="p-2.5 rounded-xl bg-blue-950/40 text-blue-400 border border-blue-800/30 material-symbols-outlined">verified</span>
                      </div>
                      <h4 className={`text-2xl font-black ${currentSub.score >= currentSub.cutoff ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {currentSub.score >= currentSub.cutoff ? 'Cleared' : 'Below Cutoff'}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-2">
                        Benchmark: {currentSub.cutoff} pts ({currentSub.category})
                      </p>
                    </div>

                    {/* 3. Overall Accuracy */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Accuracy</span>
                        <span className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 material-symbols-outlined">target</span>
                      </div>
                      <h4 className="text-3xl font-black text-on-surface">{currentSub.accuracy}%</h4>
                      <p className="text-xs text-slate-400 font-medium mt-2">
                        {currentSub.correct_count} Correct • {currentSub.wrong_count} Wrong
                      </p>
                    </div>

                    {/* 4. Total Duration */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exam Duration</span>
                        <span className="p-2.5 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-800/30 material-symbols-outlined">timer</span>
                      </div>
                      <h4 className="text-3xl font-black text-on-surface">
                        {currentSub.total_duration_mins}m
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-2">
                        {currentSub.skipped_count} Unattempted Questions
                      </p>
                    </div>
                  </div>

                  {/* Cut-off Gauge Component */}
                  <CutoffGauge 
                    score={currentSub.score} 
                    maxScore={currentSub.max_score} 
                    cutoff={currentSub.cutoff} 
                    category={currentSub.category} 
                  />
                </div>

                {/* PART B: SUBJECT & TOPIC BREAKDOWN */}
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">pie_chart</span>
                    B. Subject & Topic Breakdown
                  </h4>

                  {/* Subject Cards */}
                  {currentSub.subjects && currentSub.subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {currentSub.subjects.map((sub, i) => (
                        <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="font-black text-lg text-on-surface font-headline">{sub.name}</h5>
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black">
                              {sub.score} / {sub.maxScore} pts
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-400">
                              <span>Accuracy: {sub.accuracy}%</span>
                              <span>Total: {sub.correct + sub.wrong + sub.skipped} Qs</span>
                            </div>
                            <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden border border-outline-variant/20">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-700" 
                                style={{ width: `${sub.accuracy}%` }} 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-outline-variant/10">
                            <div className="bg-emerald-950/30 border border-emerald-800/30 text-emerald-400 p-2 rounded-xl">
                              <span className="block font-black text-sm">{sub.correct}</span>
                              <span className="text-[10px] font-bold uppercase opacity-80">Correct</span>
                            </div>
                            <div className="bg-rose-950/30 border border-rose-800/30 text-rose-400 p-2 rounded-xl">
                              <span className="block font-black text-sm">{sub.wrong}</span>
                              <span className="text-[10px] font-bold uppercase opacity-80">Wrong</span>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/30 text-slate-400 p-2 rounded-xl">
                              <span className="block font-black text-sm">{sub.skipped}</span>
                              <span className="text-[10px] font-bold uppercase opacity-80">Skipped</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-xs text-slate-400">
                      Subject breakdown is being processed.
                    </div>
                  )}

                  {/* Topic-Wise Heatmap (3 Buckets) */}
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                    <div>
                      <h5 className="text-lg font-black text-on-surface font-headline flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">grid_view</span>
                        Topic-Wise Performance Heatmap
                      </h5>
                      <p className="text-xs text-slate-400 mt-1">
                        Categorized by accuracy and error frequency to guide targeted revision.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 🟢 Bucket 1: Strong Areas */}
                      <div className="bg-emerald-950/20 border border-emerald-800/30 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider border-b border-emerald-800/20 pb-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                          Strong Areas
                        </div>
                        <div className="space-y-2.5">
                          {currentSub.heatmap?.strong?.map((item, idx) => (
                            <div key={idx} className="bg-surface-container/60 p-3.5 rounded-xl border border-outline-variant/30 shadow-sm flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-on-surface">{item.topic}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{item.subject}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 text-[10px] font-bold rounded">
                                {item.accuracy}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 🟡 Bucket 2: Careless Errors */}
                      <div className="bg-amber-950/20 border border-amber-800/30 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-amber-800/20 pb-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></span>
                          Negative Leaks
                        </div>
                        <div className="space-y-2.5">
                          {currentSub.heatmap?.careless?.map((item, idx) => (
                            <div key={idx} className="bg-surface-container/60 p-3.5 rounded-xl border border-outline-variant/30 shadow-sm flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-on-surface">{item.topic}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{item.subject}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-700/40 text-amber-300 text-[10px] font-bold rounded">
                                {item.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 🔴 Bucket 3: Weak Topics */}
                      <div className="bg-rose-950/20 border border-rose-800/30 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider border-b border-rose-800/20 pb-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></span>
                          Needs Revision
                        </div>
                        <div className="space-y-2.5">
                          {currentSub.heatmap?.weak?.map((item, idx) => (
                            <div key={idx} className="bg-surface-container/60 p-3.5 rounded-xl border border-outline-variant/30 shadow-sm flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-on-surface">{item.topic}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{item.subject}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-700/40 text-rose-300 text-[10px] font-bold rounded">
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PART C: QUESTION-BY-QUESTION DIAGNOSTIC MATRIX */}
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">apps</span>
                    C. Question-by-Question Diagnostic Matrix
                  </h4>

                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                    <div className="flex justify-between items-center flex-wrap gap-3 border-b border-outline-variant/20 pb-4">
                      <div>
                        <h5 className="text-lg font-black text-on-surface font-headline flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">fact_check</span>
                          Response Breakdown
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">Click any question node to inspect question details, your selection, and the correct answer.</p>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Correct (+4)
                        </span>
                        <span className="flex items-center gap-1.5 text-red-700">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span> Incorrect (-1)
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-3 h-3 rounded-full bg-slate-300"></span> Unattempted (0)
                        </span>
                      </div>
                    </div>

                    {/* Matrix Grid */}
                    {currentSub.question_matrix && currentSub.question_matrix.length > 0 ? (
                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
                        {currentSub.question_matrix.map((q) => {
                          const isSelected = selectedQuestion?.qNum === q.qNum;
                          let btnStyle = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
                          if (q.status === 'correct') btnStyle = "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600 shadow-sm";
                          if (q.status === 'wrong') btnStyle = "bg-red-500 text-white hover:bg-red-600 border-red-600 shadow-sm";

                          return (
                            <button
                              key={q.qNum}
                              onClick={() => setSelectedQuestion(q)}
                              className={`h-11 rounded-xl font-black text-xs flex flex-col items-center justify-center border transition-all cursor-pointer active:scale-90 ${btnStyle} ${
                                isSelected ? 'ring-4 ring-purple-400/50 scale-105' : ''
                              }`}
                            >
                              <span>Q{q.qNum}</span>
                              <span className="text-[9px] opacity-80">{q.marks}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No question evaluation records available for this exam.
                      </div>
                    )}

                    {/* Selected Question Detail Card */}
                    {selectedQuestion && (() => {
                      const targetQ = currentSub.questions_data?.[selectedQuestion.qNum - 1];
                      const studentAns = currentSub.answers?.responses?.[selectedQuestion.qNum - 1];
                      
                      const getOptionLabel = (idx) => {
                        if (idx === undefined || idx === null || String(idx).trim() === '') return 'Skipped';
                        if (!targetQ || !targetQ.options || targetQ.options.length === 0) return `Value: ${idx}`;
                        const labels = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'];
                        const parsedIdx = parseInt(idx, 10);
                        if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < targetQ.options.length) {
                          return `${labels[parsedIdx]}: ${targetQ.options[parsedIdx]}`;
                        }
                        return `Selected: ${idx}`;
                      };

                      const getCorrectAnswerLabel = () => {
                        if (!targetQ) return '';
                        const ca = String(targetQ.correct_answer).trim();
                        const parsedIdx = parseInt(ca, 10);
                        if (targetQ.options && targetQ.options.length > 0 && !isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < targetQ.options.length) {
                          const labels = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'];
                          return `${labels[parsedIdx]}: ${targetQ.options[parsedIdx]}`;
                        }
                        return ca;
                      };

                      return (
                        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-5 animate-in fade-in">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${
                                selectedQuestion.status === 'correct' ? 'bg-emerald-500' : selectedQuestion.status === 'wrong' ? 'bg-red-500' : 'bg-slate-400'
                              }`} />
                              <h6 className="font-black text-lg">Question {selectedQuestion.qNum} Detailed Analysis</h6>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-slate-800 text-purple-300 text-xs font-bold border border-slate-700">
                              {selectedQuestion.subject} • {selectedQuestion.topic}
                            </span>
                          </div>

                          {/* Display actual question text */}
                          {targetQ && (
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                              <div className="text-sm font-semibold text-slate-300 font-body leading-relaxed text-left">
                                <LatexRenderer text={targetQ.text} />
                              </div>
                              {targetQ.image_url && (
                                <div className="my-3 max-w-full overflow-hidden flex justify-center">
                                  <img src={targetQ.image_url} alt={`Question ${selectedQuestion.qNum} Illustration`} className="max-h-[300px] object-contain rounded-lg border border-slate-700" />
                                </div>
                              )}
                              {targetQ.sub_text && (
                                <div className="text-sm font-semibold text-slate-300 font-body leading-relaxed text-left">
                                  <LatexRenderer text={targetQ.sub_text} />
                                </div>
                              )}
                              
                              {/* Options display */}
                              {targetQ.options && targetQ.options.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3">
                                  {targetQ.options.map((opt, oIdx) => {
                                    const labels = ['A', 'B', 'C', 'D', 'E'];
                                    const isSelected = String(studentAns) === String(oIdx);
                                    const isCorrect = checkAnswer(oIdx, targetQ);
                                    let optStyle = "border-slate-800 bg-slate-900/30 text-slate-400";
                                    if (isSelected) {
                                      optStyle = isCorrect 
                                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                                        : "border-red-500 bg-red-950/20 text-red-300";
                                    } else if (isCorrect && studentAns !== undefined) {
                                      optStyle = "border-emerald-500/50 bg-emerald-950/10 text-emerald-400/80";
                                    }

                                    return (
                                      <div key={oIdx} className={`p-3 rounded-lg border text-xs font-semibold ${optStyle} flex gap-2.5 items-start text-left`}>
                                        <span className="font-bold">{labels[oIdx]}.</span>
                                        <div className="flex-1"><LatexRenderer text={opt} /></div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Student Answer & Correct Answer comparison */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-800 text-xs font-bold">
                                <div className="flex-1 p-3 bg-slate-900/50 rounded-lg flex items-center justify-between border border-slate-800">
                                  <span className="text-slate-400">Your Response:</span>
                                  <span className={selectedQuestion.status === 'correct' ? 'text-emerald-400' : selectedQuestion.status === 'wrong' ? 'text-red-400' : 'text-slate-400'}>
                                    {getOptionLabel(studentAns)}
                                  </span>
                                </div>
                                <div className="flex-1 p-3 bg-slate-900/50 rounded-lg flex items-center justify-between border border-slate-800">
                                  <span className="text-slate-400">Correct Answer:</span>
                                  <span className="text-emerald-400">{getCorrectAnswerLabel()}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center pt-2">
                            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Marks Impact</p>
                              <p className={`text-lg font-black ${selectedQuestion.status === 'correct' ? 'text-emerald-400' : selectedQuestion.status === 'wrong' ? 'text-red-400' : 'text-slate-400'}`}>
                                {selectedQuestion.marks} Marks
                              </p>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Question Status</p>
                              <p className="text-lg font-black text-purple-300 capitalize">
                                {selectedQuestion.status}
                              </p>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Topic Classification</p>
                              <p className="text-sm font-bold text-amber-300 pt-1 truncate">
                                {selectedQuestion.topic || selectedQuestion.subject}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Re-attempt Inverted Modal ── */}
      {showReattemptModal && currentSub && (
        <ReattemptModal
          testTitle={currentSub.test_title}
          questions={currentSub.questions_data || []}
          originalAnswers={currentSub.answers?.responses || {}}
          onClose={() => setShowReattemptModal(false)}
        />
      )}
    </div>
  );
}
