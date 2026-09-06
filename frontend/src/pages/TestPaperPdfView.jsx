import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import LatexRenderer from '../components/LatexRenderer';
import finalLogo from '../assets/Final_Logo.png';

export default function TestPaperPdfView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSolutions, setShowSolutions] = useState(true);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/tests/${id}/full`);
      if (res.data && res.data.test) {
        setTest(res.data.test);
        setQuestions(res.data.questions || []);
      } else {
        setError('Test details not found.');
      }
    } catch (err) {
      console.error('Fetch test details error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load test paper.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-700">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-[#162839] rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-600">Generating Printable Test Paper...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full shadow-lg text-center">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Unable to Load Test Paper</h2>
          <p className="text-sm text-slate-600 mb-6">{error || 'Test not found in repository.'}</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-6 py-2.5 bg-[#162839] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
          >
            Back to Admin Portal
          </button>
        </div>
      </div>
    );
  }

  // Group questions by subject if multiple subjects exist
  const subjectsMap = {};
  questions.forEach(q => {
    const sub = q.subject || 'General Section';
    if (!subjectsMap[sub]) subjectsMap[sub] = [];
    subjectsMap[sub].push(q);
  });
  const subjectKeys = Object.keys(subjectsMap);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans print:bg-white print:text-black">
      {/* ── Floating Action Bar (Hidden on Print) ── */}
      <div className="no-print sticky top-0 z-50 bg-[#060913]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Admin
          </button>
          <div className="h-4 w-[1px] bg-slate-700" />
          <span className="text-xs font-bold text-slate-300 truncate max-w-xs md:max-w-md">
            {test.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
            <input
              type="checkbox"
              checked={showSolutions}
              onChange={e => setShowSolutions(e.target.checked)}
              className="rounded accent-[#4EC6D7]"
            />
            Include Solutions & Explanations
          </label>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E7CF29] hover:bg-[#edd850] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ── Printable Paper Container ── */}
      <div className="max-w-[850px] mx-auto my-8 bg-white border border-slate-200 shadow-2xl p-8 sm:p-14 rounded-2xl print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-full">
        
        {/* ── Test Paper Header ── */}
        <header className="border-b-2 border-slate-900 pb-6 mb-8 text-center relative">
          {/* Top Brand Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={finalLogo} 
                alt="IKSHATESTS" 
                className="w-10 h-10 aspect-square object-cover rounded-[4px] shadow-sm"
              />
              <div className="flex flex-col items-start leading-none select-none">
                <span className="text-[14px] font-black tracking-wider uppercase text-[#162839]">
                  IKSHATESTS
                </span>
                <span className="text-[10px] font-semibold tracking-normal text-[#1e3a5f] mt-0.5">
                  Pariksha Shikshak
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 text-[#162839] border border-slate-300 rounded-md text-[11px] font-black tracking-widest uppercase">
                {test.category?.toUpperCase() || 'MOCK ASSESSMENT'}
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Official Mock Examination Paper</p>
            </div>
          </div>

          {/* Test Main Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-[#162839] tracking-tight uppercase mb-3">
            {test.title}
          </h1>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-700">
            <div>
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Total Questions</span>
              <span className="text-sm font-black text-slate-900">{questions.length} Questions</span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Time Allowed</span>
              <span className="text-sm font-black text-slate-900">{test.duration_minutes || 180} Minutes</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Maximum Marks</span>
              <span className="text-sm font-black text-slate-900">{questions.length * 4} Marks</span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-left text-[11px] text-slate-700 leading-relaxed">
            <strong className="text-amber-900 uppercase font-black tracking-wider block mb-0.5">Instructions for Candidates:</strong>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li>This examination paper consists of Multiple Choice Questions (MCQs) and/or Numerical Answer questions.</li>
              <li>Each correct response awards <strong>+4 Marks</strong>. Each incorrect MCQ incurs a penalty of <strong>-1 Mark</strong>. Unattempted questions award 0 marks.</li>
              <li>Use the diagrams and scientific notations provided to solve corresponding equations.</li>
            </ul>
          </div>
        </header>

        {/* ── Test Questions Section ── */}
        <main className="space-y-8">
          {subjectKeys.map((subjectName, subIdx) => {
            const subjectQuestions = subjectsMap[subjectName];
            return (
              <section key={subIdx} className="space-y-6">
                {/* Subject Section Divider */}
                <div className="bg-[#162839] text-white px-4 py-2 rounded-lg flex items-center justify-between shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-wider">
                    Section {subIdx + 1}: {subjectName}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-200">
                    {subjectQuestions.length} Questions
                  </span>
                </div>

                {/* Questions in this subject */}
                <div className="space-y-6">
                  {subjectQuestions.map((q, qIndex) => {
                    // Overall question index in the whole paper
                    const globalIndex = questions.indexOf(q) + 1;
                    const isNumerical = q.type?.toUpperCase() === 'NUMERICAL' || q.type?.toUpperCase() === 'INTEGER';
                    const hasOptions = Array.isArray(q.options) && q.options.length > 0;

                    return (
                      <article 
                        key={q.id || qIndex} 
                        className="p-5 rounded-xl border border-slate-200 bg-white break-inside-avoid print:border-slate-300 print:p-4 print:mb-4 shadow-sm"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        {/* Question Header & Badge */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-[#162839] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              {globalIndex}
                            </span>
                            <span className="text-xs font-black uppercase text-[#162839] tracking-wider">
                              Question {globalIndex}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono">
                            {q.chapter && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold">
                                {q.chapter}
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-semibold uppercase">
                              {isNumerical ? 'Numerical Value' : 'Single Correct (MCQ)'}
                            </span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="text-sm text-slate-900 leading-relaxed font-medium mb-3">
                          <LatexRenderer text={q.text} />
                        </div>

                        {/* Question Image / Diagram */}
                        {q.image_url && (
                          <div className="my-3.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-center max-h-[260px] overflow-hidden">
                            <img 
                              src={q.image_url} 
                              alt={`Diagram for Question ${globalIndex}`} 
                              className="max-h-[240px] w-auto object-contain"
                            />
                          </div>
                        )}

                        {/* Sub-Text if present */}
                        {q.sub_text && (
                          <div className="text-sm text-slate-800 leading-relaxed font-medium my-2.5">
                            <LatexRenderer text={q.sub_text} />
                          </div>
                        )}

                        {/* Multiple Choice Options */}
                        {hasOptions && !isNumerical && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2 border-t border-slate-100">
                            {q.options.map((opt, optIdx) => {
                              const optLabel = String.fromCharCode(65 + optIdx);
                              const optText = typeof opt === 'object' ? (opt.text || '') : String(opt || '');
                              const optImg = typeof opt === 'object' ? opt.image_url : null;

                              return (
                                <div 
                                  key={optIdx} 
                                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-800"
                                >
                                  <span className="w-5 h-5 rounded-full bg-[#162839]/10 text-[#162839] font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                    {optLabel}
                                  </span>
                                  <div className="flex-1 font-medium leading-relaxed">
                                    <LatexRenderer text={optText} />
                                    {optImg && (
                                      <img src={optImg} alt={`Option ${optLabel}`} className="max-h-16 object-contain mt-1 rounded border border-slate-200" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Numerical Answer Box Indicator */}
                        {isNumerical && (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600">Answer:</span>
                            <div className="w-32 h-8 border-2 border-dashed border-slate-300 rounded-md bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-mono">
                              [ Enter Value ]
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>

        {/* ── Answer Key Section ── */}
        <section className="mt-12 pt-8 border-t-2 border-slate-900 break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="bg-[#162839] text-white px-4 py-2.5 rounded-lg flex items-center justify-between mb-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#E7CF29]">key</span>
              Official Answer Key
            </h2>
            <span className="text-xs text-slate-200 font-mono">Master Evaluation Matrix</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-px bg-slate-200 text-center text-xs">
              {questions.map((q, idx) => {
                const ans = q.correct_answer || '—';
                return (
                  <div key={idx} className="bg-white p-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-mono font-bold">Q{idx + 1}</span>
                    <span className="font-black text-[#162839] text-xs mt-0.5">
                      {ans}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Solutions & Explanations Section ── */}
        {showSolutions && (
          <section className="mt-12 pt-8 border-t-2 border-slate-900 space-y-6">
            <div className="bg-[#162839] text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#4EC6D7]">psychology</span>
                Detailed Solutions & Step-by-Step Explanations
              </h2>
              <span className="text-xs text-slate-200 font-mono">{questions.length} Explanations</span>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const isNumerical = q.type?.toUpperCase() === 'NUMERICAL' || q.type?.toUpperCase() === 'INTEGER';
                return (
                  <article 
                    key={idx} 
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 break-inside-avoid shadow-sm"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#162839] text-white flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-black text-[#162839] uppercase">
                          Question {idx + 1} Solution
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600">Correct Answer:</span>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs font-mono">
                          {q.correct_answer || 'Not Specified'}
                        </span>
                      </div>
                    </div>

                    {/* Explanation text */}
                    <div className="text-xs text-slate-700 leading-relaxed font-medium">
                      {q.explanation ? (
                        <LatexRenderer text={q.explanation} />
                      ) : (
                        <p className="text-slate-500 italic">
                          {isNumerical 
                            ? `Substitute the known values from the problem statement into the governing formula to compute the exact numerical answer: ${q.correct_answer}.`
                            : `Refer to fundamental NCERT principles for ${q.subject || 'this subject'}${q.chapter ? ` (${q.chapter})` : ''}. Option ${q.correct_answer} is the mathematically and theoretically verified correct choice.`}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Running Branded Footer (Appears on screen and across all printed pages) ── */}
        <footer className="mt-14 pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left select-none">
          {/* Exact Website Branding Layout in Navy Blue */}
          <div className="flex items-center gap-2.5">
            <img 
              src={finalLogo} 
              alt="IKSHATESTS" 
              className="w-8 h-8 aspect-square object-cover rounded-[4px] shadow-sm"
            />
            <div className="flex flex-col items-center justify-center text-center leading-none select-none">
              <span className="text-[13px] font-black tracking-wider uppercase text-[#162839]">
                IKSHATESTS
              </span>
              <span className="text-[9.5px] font-medium tracking-normal text-[#1e3a5f] mt-0.5">
                Pariksha Shikshak
              </span>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-500 font-mono">
            <p className="font-semibold text-slate-600">Architecture for JEE & NEET Success</p>
            <p>© {new Date().getFullYear()} IKSHATESTS • All Rights Reserved</p>
          </div>
        </footer>
      </div>

      {/* ── Print-specific CSS styles ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 16mm 12mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          article, section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
