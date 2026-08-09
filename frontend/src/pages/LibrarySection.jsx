import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

// All 6 unique section slugs fully described
// All 6 unique section slugs fully described in cyber themes
const SECTION_META = {
  'jee-full':    { title: 'Full-Length Mocks',    description: 'Complete JEE 2026 pattern structural simulations — 90 Qs, 3 Hours.',  icon: 'assignment',  color: 'from-cyan-500 to-blue-600',  examLabel: 'JEE',  examColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'jee-pyq':     { title: 'Previous Year Papers',  description: 'Actual JEE Mains & Advanced papers from 2015–2025, fully digitized.',  icon: 'history_edu', color: 'from-cyan-600 to-indigo-800',       examLabel: 'JEE',  examColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'jee-chapter': { title: 'Subject-wise Tests',   description: 'Target Physics, Chemistry, and Maths chapters by topic precision.',    icon: 'category',    color: 'from-cyan-400 to-teal-500',        examLabel: 'JEE',  examColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'neet-full':   { title: 'Full-Length Mocks',    description: 'Complete NEET UG pattern simulations — 200 Qs, 3 Hrs 20 Mins.',        icon: 'assignment',  color: 'from-emerald-500 to-green-600',         examLabel: 'NEET', examColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'neet-pyq':    { title: 'Previous Year Papers',  description: 'Actual NEET UG papers from 2015–2025 fully digitized and solved.',     icon: 'history_edu', color: 'from-emerald-600 to-teal-800',          examLabel: 'NEET', examColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'neet-chapter':{ title: 'Subject-wise Tests',   description: 'Intensive Biology, Chemistry & Physics topic-targeted assessments.',    icon: 'biotech',     color: 'from-emerald-400 to-teal-500',       examLabel: 'NEET', examColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export default function LibrarySection() {
  const { section } = useParams();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const meta = SECTION_META[section] || {
    title: 'Tests', description: 'Available assessments.',
    icon: 'quiz', color: 'from-zinc-600 to-zinc-800',
    examLabel: '—', examColor: 'bg-zinc-100 text-zinc-700 border-zinc-200'
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Use the section slug directly as the category filter in the DB
    axios.get(`${API_URL}/api/tests?category=${encodeURIComponent(section)}`)
      .then(res => setTests(res.data || []))
      .catch(err => {
        console.error('Failed to fetch tests:', err);
        setError('Could not load tests. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [section]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-6 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`p-3 bg-gradient-to-br ${meta.color} text-white rounded-xl shadow-md`}>
            <span className="material-symbols-outlined text-2xl">{meta.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.examColor}`}>
                {meta.examLabel}
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-on-surface font-headline">{meta.title}</h2>
            <p className="text-on-surface-variant text-sm font-medium mt-0.5">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-t-primary rounded-full animate-spin opacity-60"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Loading tests…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-xl`}>
            <span className="material-symbols-outlined text-white text-5xl">{meta.icon}</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-on-surface mb-2 font-headline">No Tests Posted Yet</h3>
            <p className="text-on-surface-variant max-w-sm mx-auto font-medium leading-relaxed">
              The admin hasn't published any <strong>{meta.examLabel} {meta.title}</strong> yet. Check back soon!
            </p>
          </div>
        </div>
      )}

      {/* Tests grid */}
      {!loading && !error && tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test) => {
            const isScheduled = test.scheduled_at && new Date() < new Date(test.scheduled_at);
            return (
              <div
                key={test.id}
                onClick={() => navigate(`/test/${test.id}`)}
                className="bg-slate-950/40 border border-slate-900/60 p-6 md:p-8 rounded-2xl shadow-2xl hover:shadow-primary/[0.03] transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-2"
              >
                {/* Icon + badge row */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 bg-gradient-to-br ${meta.color} text-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <span className="material-symbols-outlined text-2xl">{meta.icon}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1.5 rounded text-[10px] tracking-wider font-black uppercase border ${meta.examColor}`}>
                      {meta.examLabel}
                    </span>
                    {isScheduled && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/60 text-amber-500 border border-slate-900">
                        <span className="material-symbols-outlined text-[12px]">lock_clock</span>
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-slate-100 mb-4 group-hover:text-primary transition-colors font-headline leading-snug">
                  {test.title}
                </h3>

                {/* Stats chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-bold text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                    {test.question_count} Qs
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {test.duration_minutes} Mins
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {new Date(test.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Scheduled date notice */}
                {isScheduled && (
                  <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-amber-500 font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-amber-500">event</span>
                    Opens: {new Date(test.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                )}

                <button className={`mt-auto w-full py-4 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider ${
                  isScheduled
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-950 border border-slate-900 text-primary hover:bg-primary hover:text-slate-950 hover:shadow-[0_0_15px_var(--theme-primary-shadow)] hover:border-primary'
                }`}>
                  {isScheduled ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      Deploy Assessment
                    </span>
                  ) : 'Deploy Assessment'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
