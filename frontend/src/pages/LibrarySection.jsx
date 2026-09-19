import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

// All 6 unique section slugs fully described in palette themes
const SECTION_META = {
  'jee-full':    { title: 'Full-Length Mocks',    description: 'Complete JEE 2026 pattern structural simulations — 90 Qs, 3 Hours.',  icon: 'assignment',  color: 'from-[#1282a2] to-[#034078]',  examLabel: 'JEE',  examColor: 'bg-[#1282a2]/15 text-[#1282a2] border-[#1282a2]/30' },
  'jee-pyq':     { title: 'Previous Year Papers',  description: 'Actual JEE Mains & Advanced papers from 2015–2025, fully digitized.',  icon: 'history_edu', color: 'from-[#1282a2] to-[#001f54]', examLabel: 'JEE',  examColor: 'bg-[#1282a2]/15 text-[#1282a2] border-[#1282a2]/30' },
  'jee-chapter': { title: 'Subject-wise Tests',   description: 'Target Physics, Chemistry, and Maths chapters by topic precision.',    icon: 'category',    color: 'from-[#034078] to-[#1282a2]',  examLabel: 'JEE',  examColor: 'bg-[#1282a2]/15 text-[#1282a2] border-[#1282a2]/30' },
  'neet-full':   { title: 'Full-Length Mocks',    description: 'Complete NEET UG pattern simulations — 200 Qs, 3 Hrs 20 Mins.',        icon: 'assignment',  color: 'from-[#034078] to-[#fefcfb]',  examLabel: 'NEET', examColor: 'bg-[#034078]/20 text-[#fefcfb] border-[#034078]/35' },
  'neet-pyq':    { title: 'Previous Year Papers',  description: 'Actual NEET UG papers from 2015–2025 fully digitized and solved.',     icon: 'history_edu', color: 'from-[#0a1128] to-[#034078]', examLabel: 'NEET', examColor: 'bg-[#034078]/20 text-[#fefcfb] border-[#034078]/35' },
  'neet-chapter':{ title: 'Subject-wise Tests',   description: 'Intensive Biology, Chemistry & Physics topic-targeted assessments.',    icon: 'biotech',     color: 'from-[#001f54] to-[#1282a2]',  examLabel: 'NEET', examColor: 'bg-[#034078]/20 text-[#fefcfb] border-[#034078]/35' },
};

export default function LibrarySection() {
  const { section } = useParams();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const meta = SECTION_META[section] || {
    title: 'Tests', description: 'Available assessments.',
    icon: 'quiz', color: 'from-[#034078] to-[#0a1128]',
    examLabel: '—', examColor: 'bg-[#0a1128] text-[#fefcfb] border-[#034078]/30'
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
      <div className="flex items-center gap-4 border-b border-[#034078]/30 pb-6 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-[#0a1128] border border-[#034078]/30 rounded-xl hover:bg-[#001f54] transition-colors active:scale-95 text-[#fefcfb] hover:text-white flex items-center justify-center cursor-pointer shadow-sm"
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
            <h2 className="text-3xl lg:text-4xl font-black text-white font-headline">{meta.title}</h2>
            <p className="text-[#fefcfb] text-sm font-medium mt-0.5">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#fefcfb]">
          <div className="w-10 h-10 border-4 border-t-[#1282a2] border-[#034078]/30 rounded-full animate-spin opacity-80"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Loading tests…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-6 bg-red-950/40 border border-red-500/40 text-red-300 rounded-2xl text-sm font-bold text-center">
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
            <h3 className="text-2xl font-black text-white mb-2 font-headline">No Tests Posted Yet</h3>
            <p className="text-[#fefcfb] max-w-sm mx-auto font-medium leading-relaxed">
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
                className="bg-[#001f54]/90 border border-[#034078]/30 p-6 md:p-8 rounded-2xl shadow-2xl hover:border-[#1282a2]/50 transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-2"
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
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0a1128] text-[#1282a2] border border-[#1282a2]/30">
                        <span className="material-symbols-outlined text-[12px]">lock_clock</span>
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-white mb-4 group-hover:text-[#1282a2] transition-colors font-headline leading-snug">
                  {test.title}
                </h3>

                {/* Stats chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-bold text-[#fefcfb] bg-[#0a1128] px-3 py-1.5 rounded-lg border border-[#034078]/30 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                    {test.question_count} Qs
                  </span>
                  <span className="text-xs font-bold text-[#fefcfb] bg-[#0a1128] px-3 py-1.5 rounded-lg border border-[#034078]/30 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {test.duration_minutes} Mins
                  </span>
                </div>

                {/* Scheduled date notice */}
                {isScheduled && (
                  <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-[#0a1128] border border-[#1282a2]/30 rounded-xl text-xs text-[#1282a2] font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-[#1282a2]">event</span>
                    Opens: {new Date(test.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                )}

                <button className={`mt-auto w-full py-4 rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm uppercase tracking-wider ${
                  isScheduled
                    ? 'bg-[#0a1128] border border-[#034078]/20 text-[#fefcfb]/40 cursor-not-allowed'
                    : 'bg-[#0a1128] border border-[#034078]/40 text-[#fefcfb] hover:bg-[#1282a2] hover:text-[#0a1128] hover:shadow-[0_0_20px_rgba(18,130,162,0.35)] hover:border-[#1282a2]'
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
