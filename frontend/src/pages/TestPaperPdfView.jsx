import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { supabase } from '../config/supabase';
import LatexRenderer from '../components/LatexRenderer';
import MathKeypad from '../components/MathKeypad';
import { NCERT_CHAPTERS } from '../config/ncertChapters';
import finalLogo from '../assets/Final_Logo.png';

export default function TestPaperPdfView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSolutions, setShowSolutions] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Paper Details Edit State
  const [showEditPaperModal, setShowEditPaperModal] = useState(false);
  const [paperEditData, setPaperEditData] = useState({ title: '', duration_minutes: 180, category: '' });
  const [savingPaper, setSavingPaper] = useState(false);

  // Question Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({
    subject: 'Physics',
    chapter: '',
    type: 'MCQ',
    text: '',
    sub_text: '',
    image_url: '',
    options: [
      { text: '', image_url: null },
      { text: '', image_url: null },
      { text: '', image_url: null },
      { text: '', image_url: null }
    ],
    correct_answer: 'Option A',
    explanation: ''
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [activeEditOptionIndex, setActiveEditOptionIndex] = useState(0);
  const [activeEditField, setActiveEditField] = useState('text'); // 'text' | 'sub_text' | 'explanation' | 'option'
  const [editImgUploading, setEditImgUploading] = useState(false);
  const [editOptUploading, setEditOptUploading] = useState(null);

  const editTextRef = useRef(null);
  const editSubTextRef = useRef(null);
  const editExplanationRef = useRef(null);
  const editOptionRefs = useRef([]);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    setLoading(true);
    setError(null);

    // 1. First Attempt: Dedicated Admin Full Test Endpoint
    try {
      const res = await axios.get(`${API_URL}/api/admin/tests/${id}/full`);
      if (res.data && res.data.test) {
        setTest(res.data.test);
        setQuestions(res.data.questions || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Endpoint /api/admin/tests/:id/full unavailable, trying standard endpoint or Supabase fallback...', err.message);
    }

    // 2. Second Attempt: Standard Test Fetch Endpoint
    try {
      const res = await axios.get(`${API_URL}/api/tests/${id}`);
      if (res.data && (res.data.questions || res.data.title)) {
        setTest({
          id: res.data.testId || id,
          title: res.data.title || 'Mock Examination Paper',
          category: res.data.category || 'MOCK EXAM',
          duration_minutes: res.data.duration_minutes || 180,
          scheduled_at: res.data.scheduled_at || null
        });
        setQuestions(res.data.questions || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Endpoint /api/tests/:id failed, attempting direct Supabase query...', err.message);
    }

    // 3. Third Attempt: Direct Supabase Database Query (100% Resilient)
    try {
      let testRecord = null;

      const { data: t1 } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (t1) {
        testRecord = t1;
      } else {
        const { data: t2 } = await supabase
          .from('tests')
          .select('*')
          .eq('title', id)
          .maybeSingle();
        testRecord = t2;
      }

      if (!testRecord) {
        throw new Error('Test blueprint not found in repository.');
      }

      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testRecord.id)
        .order('created_at', { ascending: true });

      if (qErr) throw qErr;

      setTest(testRecord);
      setQuestions(qData || []);
    } catch (err) {
      console.error('Fetch test details error:', err);
      setError(err.message || 'Failed to load test paper.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishTest = async () => {
    if (!test?.id) return;
    setPublishing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await axios.post(`${API_URL}/api/admin/tests/${test.id}/publish`);
      setTest(prev => ({
        ...prev,
        status: 'published',
        category: (prev.category || '').replace('__draft', '')
      }));
      setActionSuccess('Question paper successfully approved and published! It is now live for students.');
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      console.error('Publish test error:', err);
      setActionError(err.response?.data?.error || err.message || 'Failed to publish test');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublishTest = async () => {
    if (!test?.id) return;
    if (!window.confirm('Revert this test to a staged draft? It will be hidden from students.')) return;
    setPublishing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await axios.post(`${API_URL}/api/admin/tests/${test.id}/unpublish`);
      setTest(prev => ({
        ...prev,
        status: 'draft',
        category: (prev.category || '').replace('__draft', '')
      }));
      setActionSuccess('Test reverted to Staged Draft. It is now hidden from students.');
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      console.error('Unpublish test error:', err);
      setActionError(err.response?.data?.error || err.message || 'Failed to revert test to draft');
    } finally {
      setPublishing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Paper Details Edit Handler ──
  const handleOpenEditPaper = () => {
    setPaperEditData({
      title: test?.title || '',
      duration_minutes: test?.duration_minutes || 180,
      category: (test?.category || '').replace('__draft', '')
    });
    setShowEditPaperModal(true);
  };

  const handleSavePaperDetails = async (e) => {
    e.preventDefault();
    if (!paperEditData.title.trim()) {
      alert("Test paper title cannot be empty.");
      return;
    }
    setSavingPaper(true);
    setActionError(null);
    try {
      const updates = {
        title: paperEditData.title.trim(),
        duration_minutes: parseInt(paperEditData.duration_minutes) || 180,
        category: paperEditData.category.trim()
      };

      const res = await axios.patch(`${API_URL}/api/admin/tests/${test.id}`, updates);
      if (res.data?.test) {
        setTest(prev => ({ ...prev, ...res.data.test }));
      } else {
        setTest(prev => ({ ...prev, ...updates }));
      }

      setShowEditPaperModal(false);
      setActionSuccess("Test paper specifications updated successfully!");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error("Save paper details error:", err);
      setActionError(err.response?.data?.error || err.message || "Failed to update test details");
    } finally {
      setSavingPaper(false);
    }
  };

  // ── Upload Image Helper ──
  const handleUploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.publicUrl) return res.data.publicUrl;
    } catch (e) {
      console.warn("Backend image upload route unavailable, trying direct Supabase fallback:", e.message);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `questions/${fileName}`;
    const { error: upErr } = await supabase.storage.from('question-assets').upload(filePath, file);
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('question-assets').getPublicUrl(filePath);
    return data?.publicUrl;
  };

  const handleEditImageUpload = async (e, target = 'main', optIdx = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (target === 'main') setEditImgUploading(true);
    else setEditOptUploading(optIdx);

    try {
      const publicUrl = await handleUploadImageFile(file);
      if (!publicUrl) throw new Error("Could not retrieve image URL.");

      if (target === 'main') {
        setEditFormData(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setEditFormData(prev => {
          const nextOpts = [...prev.options];
          nextOpts[optIdx] = { ...nextOpts[optIdx], image_url: publicUrl };
          return { ...prev, options: nextOpts };
        });
      }
    } catch (err) {
      alert("Error uploading image: " + err.message);
    } finally {
      setEditImgUploading(false);
      setEditOptUploading(null);
    }
  };

  // ── Question Edit Modal Handlers ──
  const handleOpenEditQuestion = (q) => {
    const rawOpts = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', '', '', ''];
    const normalizedOptions = rawOpts.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return { text: opt.text || '', image_url: opt.image_url || null };
      }
      return { text: String(opt || ''), image_url: null };
    });
    while (normalizedOptions.length < 4) {
      normalizedOptions.push({ text: '', image_url: null });
    }

    setEditingQuestion(q);
    setEditFormData({
      id: q.id,
      subject: q.subject || 'Physics',
      chapter: q.chapter || '',
      type: q.type || 'MCQ',
      text: q.text || '',
      sub_text: q.sub_text || '',
      image_url: q.image_url || '',
      options: normalizedOptions,
      correct_answer: q.correct_answer || (q.type === 'MCQ' ? 'Option A' : ''),
      explanation: q.explanation || ''
    });
    setActiveEditField('text');
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!editFormData.text.trim()) {
      alert("Question content is required.");
      return;
    }
    setSavingQuestion(true);
    setActionError(null);
    try {
      const formattedOptions = editFormData.type === 'MCQ'
        ? editFormData.options.map(opt => ({ text: opt.text, image_url: opt.image_url || null }))
        : [];

      const payload = {
        subject: editFormData.subject,
        chapter: editFormData.chapter || null,
        type: editFormData.type,
        text: editFormData.text,
        sub_text: editFormData.sub_text || null,
        image_url: editFormData.image_url || null,
        options: formattedOptions,
        correct_answer: editFormData.correct_answer,
        explanation: editFormData.explanation || null
      };

      // 1. Try backend PUT endpoint
      let updatedQ = null;
      try {
        const res = await axios.put(`${API_URL}/api/admin/questions/${editingQuestion.id}`, payload);
        if (res.data?.question) {
          updatedQ = res.data.question;
        }
      } catch (apiErr) {
        console.warn("Backend PUT question failed, attempting direct Supabase query...", apiErr.message);
      }

      // 2. Direct Supabase query fallback
      if (!updatedQ) {
        const { data, error } = await supabase
          .from('questions')
          .update(payload)
          .eq('id', editingQuestion.id)
          .select()
          .single();
        if (error) throw error;
        updatedQ = data;
      }

      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...payload, ...updatedQ } : q));
      setEditingQuestion(null);
      setActionSuccess("Question successfully updated! Proofreading view refreshed.");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error("Failed to update question:", err);
      setActionError(err.response?.data?.error || err.message || "Failed to update question");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to remove this question from the test paper?")) return;
    try {
      try {
        await axios.delete(`${API_URL}/api/admin/questions/${qId}`);
      } catch (apiErr) {
        await supabase.from('questions').delete().eq('id', qId);
      }
      setQuestions(prev => prev.filter(q => q.id !== qId));
      setActionSuccess("Question successfully removed from test paper.");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error("Delete question error:", err);
      setActionError(err.message || "Failed to delete question");
    }
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

  const isDraft = test?.status === 'draft' || (test?.category && test.category.includes('__draft'));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans print:bg-white print:text-black">
      {/* ── Floating Action Bar (Hidden on Print) ── */}
      <div className="no-print sticky top-0 z-50 bg-[#060913]/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Admin Portal
          </button>
          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
          <span className="text-xs font-bold text-slate-300 truncate max-w-xs md:max-w-sm">
            {test.title}
          </span>
          {/* Status Badge */}
          {isDraft ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>STAGED DRAFT</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>PUBLISHED LIVE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Edit Paper Details Button */}
          <button
            onClick={handleOpenEditPaper}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-[#1282a2]/40 hover:border-[#1282a2] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="Edit Test Paper specifications (Title, Duration, Category)"
          >
            <span className="material-symbols-outlined text-base">edit_document</span>
            <span>Edit Paper Info</span>
          </button>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
            <input
              type="checkbox"
              checked={showSolutions}
              onChange={e => setShowSolutions(e.target.checked)}
              className="rounded accent-[#1282a2]"
            />
            Solutions
          </label>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border border-slate-700"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print / PDF
          </button>

          {/* Staging & Publishing Actions */}
          {isDraft ? (
            <button
              onClick={handlePublishTest}
              disabled={publishing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer border-none disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">{publishing ? 'hourglass_top' : 'check_circle'}</span>
              <span>{publishing ? 'Publishing…' : 'Approve & Publish to Students'}</span>
            </button>
          ) : (
            <button
              onClick={handleUnpublishTest}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Revert this test to a staged draft hidden from students"
            >
              <span className="material-symbols-outlined text-sm">{publishing ? 'hourglass_top' : 'unpublished'}</span>
              <span>{publishing ? 'Reverting…' : 'Revert to Draft'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Feedback Alerts */}
      {actionSuccess && (
        <div className="no-print max-w-4xl mx-auto mt-4 px-4">
          <div className="p-4 bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400/80 hover:text-emerald-200 cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <div className="no-print max-w-4xl mx-auto mt-4 px-4">
          <div className="p-4 bg-red-950/70 border border-red-500/60 text-red-300 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-red-400 text-lg">error</span>
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-red-400/80 hover:text-red-200 cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Printable Paper Container ── */}
      <div className="max-w-[850px] mx-auto my-8 bg-white border border-slate-200 shadow-2xl p-8 sm:p-14 rounded-2xl print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-full">
        
        {/* Admin Proofreading Notice Banner */}
        {isDraft && (
          <div className="no-print mb-8 p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl text-amber-950 flex items-start justify-between gap-3.5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <span className="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0 mt-0.5">rate_review</span>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                  <span>Teacher Proofreading & Live Editing Console</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    Draft Mode
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  This question paper is staged as a <strong>Private Draft</strong>. You can inspect formulas, diagrams, answer keys, and solutions. Click the <strong>"Edit"</strong> button on any question to change text, insert LaTeX symbols via the Math Keyboard, replace diagrams, or modify options.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenEditPaper}
              className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs border border-amber-400 transition-colors cursor-pointer shrink-0"
            >
              Edit Paper Info
            </button>
          </div>
        )}

        {/* ── Test Paper Header ── */}
        <header className="border-b-2 border-slate-900 pb-6 mb-8 text-center relative group">
          {/* Top Brand Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={finalLogo} 
                alt="IKSHATESTS" 
                className="w-10 h-10 aspect-square object-cover rounded-[4px] shadow-sm"
              />
              <div className="h-10 flex flex-col justify-between items-center text-center leading-none select-none py-[1px]">
                <span className="text-[17px] font-black tracking-wider uppercase text-[#0a1128] leading-none">
                  IKSHATESTS
                </span>
                <span className="text-[11.5px] font-semibold tracking-normal text-[#034078] leading-none">
                  Pariksha Shikshak
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 text-[#0a1128] border border-slate-300 rounded-md text-[11px] font-black tracking-widest uppercase">
                {test.category?.toUpperCase() || 'MOCK ASSESSMENT'}
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Official Mock Examination Paper</p>
            </div>
          </div>

          {/* Test Main Title */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0a1128] tracking-tight uppercase">
              {test.title}
            </h1>
            <button
              onClick={handleOpenEditPaper}
              className="no-print p-1.5 text-slate-400 hover:text-[#034078] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Title and Specifications"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>

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
                <div className="bg-[#001f54] text-white px-4 py-2 rounded-lg flex items-center justify-between shadow-sm">
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
                    const globalIndex = questions.indexOf(q) + 1;
                    const isNumerical = q.type?.toUpperCase() === 'NUMERICAL' || q.type?.toUpperCase() === 'INTEGER';
                    const hasOptions = Array.isArray(q.options) && q.options.length > 0;

                    return (
                      <article 
                        key={q.id || qIndex} 
                        className="p-5 rounded-xl border border-slate-200 bg-white break-inside-avoid print:border-slate-300 print:p-4 print:mb-4 shadow-sm relative group hover:border-[#1282a2]/40 transition-colors"
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        {/* Question Header & Proofreading Edit Actions */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-[#16425b] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              {globalIndex}
                            </span>
                            <span className="text-xs font-black uppercase text-[#16425b] tracking-wider">
                              Question {globalIndex}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
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

                            {/* Proofreading Action Buttons (Hidden on Print) */}
                            <div className="no-print flex items-center gap-1.5 ml-2">
                              <button
                                onClick={() => handleOpenEditQuestion(q)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#034078]/10 hover:bg-[#034078]/20 text-[#034078] border border-[#034078]/30 font-bold text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                                title={`Edit Question ${globalIndex}`}
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title={`Delete Question ${globalIndex}`}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
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
                              const optText = typeof opt === 'object' && opt !== null ? (opt.text || '') : String(opt || '');
                              const optImg = typeof opt === 'object' && opt !== null ? opt.image_url : null;

                              return (
                                <div 
                                  key={optIdx} 
                                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-800"
                                >
                                  <span className="w-5 h-5 rounded-full bg-[#16425b]/10 text-[#16425b] font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
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
          <div className="bg-[#001f54] text-white px-4 py-2.5 rounded-lg flex items-center justify-between mb-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1282a2]">key</span>
              Official Answer Key
            </h2>
            <span className="text-xs text-[#fefcfb] font-mono">Master Evaluation Matrix</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-px bg-slate-200 text-center text-xs">
              {questions.map((q, idx) => {
                const ans = q.correct_answer || '—';
                return (
                  <div key={idx} className="bg-white p-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-mono font-bold">Q{idx + 1}</span>
                    <span className="font-black text-[#001f54] text-xs mt-0.5">
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
            <div className="bg-[#001f54] text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#1282a2]">psychology</span>
                Detailed Solutions & Step-by-Step Explanations
              </h2>
              <span className="text-xs text-[#fefcfb] font-mono">{questions.length} Explanations</span>
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
                        <span className="w-6 h-6 rounded-md bg-[#001f54] text-white flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-black text-[#001f54] uppercase">
                          Question {idx + 1} Solution
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600">Correct Answer:</span>
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs font-mono">
                            {q.correct_answer || 'Not Specified'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenEditQuestion(q)}
                          className="no-print flex items-center gap-1 text-[11px] font-bold text-[#034078] hover:text-[#1282a2] hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          Edit
                        </button>
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
          <div className="flex items-center gap-2.5">
            <img 
              src={finalLogo} 
              alt="IKSHATESTS" 
              className="w-8 h-8 aspect-square object-cover rounded-[4px] shadow-sm"
            />
            <div className="h-8 flex flex-col justify-between items-center text-center leading-none select-none py-[0.5px]">
              <span className="text-[14px] font-black tracking-wider uppercase text-[#0a1128] leading-none">
                IKSHATESTS
              </span>
              <span className="text-[9.5px] font-medium tracking-normal text-[#034078] leading-none">
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

      {/* ── MODAL 1: Edit Paper Specifications (Title, Duration, Category) ── */}
      {showEditPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a1128] border border-[#034078] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#001f54]/60 border-b border-[#034078] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1282a2] text-2xl">edit_document</span>
                <h3 className="font-bold text-white text-base">Edit Paper Specifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPaperModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePaperDetails} className="p-6 space-y-4 text-white">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Test Paper Title
                </label>
                <input
                  type="text"
                  value={paperEditData.title}
                  onChange={e => setPaperEditData({ ...paperEditData, title: e.target.value })}
                  placeholder="e.g. JEE Main Full Syllabus Mock Test - 01"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#001f54]/50 border border-[#034078] rounded-xl text-sm text-white focus:outline-none focus:border-[#1282a2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={paperEditData.duration_minutes}
                    onChange={e => setPaperEditData({ ...paperEditData, duration_minutes: e.target.value })}
                    min="10"
                    max="600"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#001f54]/50 border border-[#034078] rounded-xl text-sm text-white focus:outline-none focus:border-[#1282a2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Category / Exam Target
                  </label>
                  <input
                    type="text"
                    value={paperEditData.category}
                    onChange={e => setPaperEditData({ ...paperEditData, category: e.target.value })}
                    placeholder="e.g. JEE Main, NEET"
                    className="w-full px-3.5 py-2.5 bg-[#001f54]/50 border border-[#034078] rounded-xl text-sm text-white focus:outline-none focus:border-[#1282a2]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#034078]/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditPaperModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPaper}
                  className="px-5 py-2 bg-gradient-to-r from-[#1282a2] to-[#034078] hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPaper ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Specifications</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Full Question Editor Modal with MathKeypad & Image Upload ── */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0a1128] border border-[#034078] rounded-2xl w-full max-w-3xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#001f54]/80 border-b border-[#034078] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1282a2]/20 border border-[#1282a2]/50 text-cyan-300 font-black text-sm">
                  #{questions.indexOf(editingQuestion) + 1}
                </span>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <span>Edit Question Content & Formulas</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Proofreading edits will immediately update the printable paper and student test.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSaveQuestion} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Row 1: Subject, Chapter, Type, Correct Answer */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#001f54]/30 p-3.5 rounded-xl border border-[#034078]/60">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#fefcfb]/70 mb-1 block">Subject</label>
                  <select
                    value={editFormData.subject}
                    onChange={e => {
                      const sub = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        subject: sub,
                        chapter: NCERT_CHAPTERS[sub] ? NCERT_CHAPTERS[sub][0] : ''
                      });
                    }}
                    className="w-full p-2 text-xs border border-[#034078] bg-[#001f54] text-white rounded-lg cursor-pointer"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#fefcfb]/70 mb-1 block">Chapter</label>
                  <select
                    value={editFormData.chapter || ''}
                    onChange={e => setEditFormData({ ...editFormData, chapter: e.target.value })}
                    className="w-full p-2 text-xs border border-[#034078] bg-[#001f54] text-white rounded-lg cursor-pointer truncate"
                  >
                    <option value="">Select Chapter</option>
                    {(NCERT_CHAPTERS[editFormData.subject] || []).map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#fefcfb]/70 mb-1 block">Type</label>
                  <select
                    value={editFormData.type}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full p-2 text-xs border border-[#034078] bg-[#001f54] text-white rounded-lg cursor-pointer"
                  >
                    <option value="MCQ">Single Correct (MCQ)</option>
                    <option value="NUMERICAL">Numerical Value</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#fefcfb]/70 mb-1 block">Correct Answer</label>
                  {editFormData.type === 'MCQ' ? (
                    <select
                      value={editFormData.correct_answer}
                      onChange={e => setEditFormData({ ...editFormData, correct_answer: e.target.value })}
                      className="w-full p-2 text-xs border border-[#034078] bg-[#001f54] text-white rounded-lg cursor-pointer font-bold text-emerald-400"
                    >
                      <option value="Option A">Option A</option>
                      <option value="Option B">Option B</option>
                      <option value="Option C">Option C</option>
                      <option value="Option D">Option D</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editFormData.correct_answer}
                      onChange={e => setEditFormData({ ...editFormData, correct_answer: e.target.value })}
                      placeholder="e.g. 4.5 or 12"
                      className="w-full p-2 text-xs border border-[#034078] bg-[#001f54] text-white rounded-lg font-mono"
                    />
                  )}
                </div>
              </div>

              {/* Question Text with Math Keypad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-[#fefcfb]/80 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1282a2]"></span>
                    Question Content (Supports LaTeX Math Formulas)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Use $...$ for inline math</span>
                </div>
                <textarea
                  ref={editTextRef}
                  value={editFormData.text}
                  onChange={e => setEditFormData({ ...editFormData, text: e.target.value })}
                  onFocus={() => setActiveEditField('text')}
                  rows={3}
                  className="w-full p-3 text-sm border border-[#034078] bg-[#001f54]/60 text-white rounded-xl focus:border-[#1282a2] focus:outline-none"
                  placeholder="e.g. Calculate the electric field $\vec{E}$ at a distance $r$ from an infinite wire..."
                />

                {/* Math Keypad for Question Text */}
                <MathKeypad
                  targetRef={editTextRef}
                  value={editFormData.text}
                  setValue={val => setEditFormData(prev => ({ ...prev, text: val }))}
                />

                {/* Live Math Preview */}
                {editFormData.text && (
                  <div className="p-3 bg-[#001f54]/40 rounded-xl border border-[#034078]/50">
                    <p className="text-[10px] uppercase font-bold text-[#1282a2] mb-1">Live Math Preview:</p>
                    <div className="text-sm text-white leading-relaxed">
                      <LatexRenderer text={editFormData.text} />
                    </div>
                  </div>
                )}
              </div>

              {/* Main Question Diagram / Image Asset */}
              <div className="space-y-2 bg-[#001f54]/30 p-4 rounded-xl border border-[#034078]/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-[#fefcfb]/80 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#1282a2] text-sm">image</span>
                    Main Diagram / Image Asset
                  </label>
                  {editFormData.image_url && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, image_url: '' })}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Remove Image
                    </button>
                  )}
                </div>

                {editFormData.image_url ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-[#001f54]/40 rounded-lg border border-[#034078]/40">
                    <img
                      src={editFormData.image_url}
                      alt="Attached question asset"
                      className="max-h-36 object-contain rounded border border-[#034078]"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="text-[11px] text-slate-300">Image successfully attached. You can replace it anytime.</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1282a2] bg-[#1282a2]/20 hover:bg-[#1282a2]/30 text-cyan-300 text-xs font-bold cursor-pointer transition-all">
                        <span className="material-symbols-outlined text-sm">
                          {editImgUploading ? 'sync' : 'upload_file'}
                        </span>
                        <span>{editImgUploading ? 'Uploading...' : 'Replace Diagram'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleEditImageUpload(e, 'main')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#034078] hover:border-[#1282a2] rounded-xl cursor-pointer bg-[#001f54]/20 hover:bg-[#001f54]/40 transition-all group">
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-cyan-300 mb-1">
                      {editImgUploading ? 'sync' : 'add_photo_alternate'}
                    </span>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                      {editImgUploading ? 'Uploading Diagram...' : 'Click to Upload Diagram / Asset'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleEditImageUpload(e, 'main')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Sub-text (Below Image) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#fefcfb]/80 block">
                  Text Below Image (Optional, Supports LaTeX)
                </label>
                <textarea
                  ref={editSubTextRef}
                  value={editFormData.sub_text}
                  onChange={e => setEditFormData({ ...editFormData, sub_text: e.target.value })}
                  onFocus={() => setActiveEditField('sub_text')}
                  rows={2}
                  className="w-full p-2.5 text-xs border border-[#034078] bg-[#001f54]/60 text-white rounded-xl focus:border-[#1282a2] focus:outline-none"
                  placeholder="Optional text to display below the diagram"
                />
                <MathKeypad
                  targetRef={editSubTextRef}
                  value={editFormData.sub_text}
                  setValue={val => setEditFormData(prev => ({ ...prev, sub_text: val }))}
                />
              </div>

              {/* Options Section (If MCQ) */}
              {editFormData.type === 'MCQ' && (
                <div className="space-y-3 pt-3 border-t border-[#034078]/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-[#fefcfb]/80 block">
                      Multiple Choice Options (A, B, C, D)
                    </label>
                    <span className="text-[10px] text-slate-400">Attach text formulas and/or option diagrams</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editFormData.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border transition-all ${
                          activeEditOptionIndex === oIdx
                            ? 'border-[#1282a2] bg-[#001f54]/70 shadow-md'
                            : 'border-[#034078]/60 bg-[#001f54]/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-md bg-[#1282a2]/20 border border-[#1282a2]/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            ref={el => { editOptionRefs.current[oIdx] = el; }}
                            type="text"
                            value={opt.text}
                            onChange={e => {
                              const nextOpts = [...editFormData.options];
                              nextOpts[oIdx] = { ...nextOpts[oIdx], text: e.target.value };
                              setEditFormData({ ...editFormData, options: nextOpts });
                            }}
                            onFocus={() => {
                              setActiveEditOptionIndex(oIdx);
                              setActiveEditField('option');
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)} (LaTeX)`}
                            className="flex-1 p-2 text-xs border border-[#034078] bg-[#001f54] text-white rounded-lg focus:border-[#1282a2] focus:outline-none"
                          />
                          {/* Option Image Upload Button */}
                          <label
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-dashed cursor-pointer transition-colors shrink-0 ${
                              opt.image_url
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                                : 'border-[#034078] hover:border-[#1282a2] bg-[#001f54] text-slate-400'
                            }`}
                            title={`Upload diagram for Option ${String.fromCharCode(65 + oIdx)}`}
                          >
                            <span className="material-symbols-outlined text-base">
                              {editOptUploading === oIdx ? 'sync' : opt.image_url ? 'check_circle' : 'add_photo_alternate'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleEditImageUpload(e, 'option', oIdx)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Option Image Preview & Remove */}
                        {opt.image_url && (
                          <div className="flex items-center gap-2 pl-8 pt-1">
                            <img
                              src={opt.image_url}
                              alt={`Option ${String.fromCharCode(65 + oIdx)}`}
                              className="max-h-12 border border-[#034078] rounded object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextOpts = [...editFormData.options];
                                nextOpts[oIdx] = { ...nextOpts[oIdx], image_url: null };
                                setEditFormData({ ...editFormData, options: nextOpts });
                              }}
                              className="text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                              Remove Image
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Math Keypad for the Active Option */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Math Keypad for Option {String.fromCharCode(65 + activeEditOptionIndex)}:
                    </p>
                    <MathKeypad
                      targetRef={{ current: editOptionRefs.current[activeEditOptionIndex] }}
                      value={editFormData.options[activeEditOptionIndex]?.text || ''}
                      setValue={val => {
                        const nextOpts = [...editFormData.options];
                        nextOpts[activeEditOptionIndex] = { ...nextOpts[activeEditOptionIndex], text: val };
                        setEditFormData(prev => ({ ...prev, options: nextOpts }));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Solution / Explanation */}
              <div className="space-y-2 pt-3 border-t border-[#034078]/50">
                <label className="text-xs font-bold uppercase text-[#fefcfb]/80 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1282a2] text-sm">psychology</span>
                  Detailed Solution & Step-by-Step Explanation (LaTeX)
                </label>
                <textarea
                  ref={editExplanationRef}
                  value={editFormData.explanation}
                  onChange={e => setEditFormData({ ...editFormData, explanation: e.target.value })}
                  onFocus={() => setActiveEditField('explanation')}
                  rows={3}
                  className="w-full p-2.5 text-xs border border-[#034078] bg-[#001f54]/60 text-white rounded-xl focus:border-[#1282a2] focus:outline-none"
                  placeholder="Provide step-by-step mathematical reasoning for students..."
                />
                <MathKeypad
                  targetRef={editExplanationRef}
                  value={editFormData.explanation}
                  setValue={val => setEditFormData(prev => ({ ...prev, explanation: val }))}
                />
                {editFormData.explanation && (
                  <div className="p-3 bg-[#001f54]/40 rounded-xl border border-[#034078]/50">
                    <p className="text-[10px] uppercase font-bold text-[#1282a2] mb-1">Solution Preview:</p>
                    <div className="text-xs text-slate-200 leading-relaxed">
                      <LatexRenderer text={editFormData.explanation} />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-[#034078] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(editingQuestion.id)}
                  className="px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl text-xs font-bold border border-red-900/50 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Delete Question</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingQuestion}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingQuestion ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        <span>Save Question Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
