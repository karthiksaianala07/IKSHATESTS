import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import LatexRenderer from '../components/LatexRenderer';
import { supabase } from '../config/supabase';
import { NCERT_CHAPTERS } from '../config/ncertChapters';
import MathKeypad from '../components/MathKeypad';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


export default function AddTestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const manualTextRef = useRef(null);
  const manualSubTextRef = useRef(null);
  const manualOptionRefs = useRef([]);
  const reviewTextRefs = useRef(new Map());
  const reviewSubTextRefs = useRef(new Map());

  const [activeManualField, setActiveManualField] = useState('text');
  const [activeManualOptionIndex, setActiveManualOptionIndex] = useState(0);

  // Form state
  const [newTest, setNewTest] = useState({ title: '', category: 'jee-full', duration_minutes: 180, scheduled_at: '' });
  const [examType, setExamType] = useState('jee');
  const [sectionType, setSectionType] = useState('full');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Source toggle
  const [sourceMode, setSourceMode] = useState('database'); // 'database' | 'pdf' | 'manual'

  // Manual input state
  const [manualQuestion, setManualQuestion] = useState({
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
  const [manualUploading, setManualUploading] = useState(false);
  const [manualOptUploading, setManualOptUploading] = useState(null);

  // Question picker state (Database)
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  // PDF Extraction state
  const [pdfFile, setPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (sourceMode === 'database') fetchQuestions();
  }, [page, questionSearch, selectedSubjectFilter, selectedChapterFilter, sourceMode]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await API.get(
        `/api/admin/questions?paginate=true&page=${page}&limit=10&search=${questionSearch}&subject=${selectedSubjectFilter}&chapter=${selectedChapterFilter}`
      );
      if (res.data) {
        setAvailableQuestions(res.data.questions || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalQuestionsCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleToggleQuestion = (q) => {
    const exists = selectedQuestions.some(s => s.id === q.id);
    setSelectedQuestions(exists
      ? selectedQuestions.filter(s => s.id !== q.id)
      : [...selectedQuestions, q]
    );
  };

  const handleSelectAllFiltered = () => {
    const pageIds = availableQuestions.map(q => q.id);
    const selectedIds = selectedQuestions.map(q => q.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => !pageIds.includes(q.id)));
    } else {
      const next = [...selectedQuestions];
      availableQuestions.forEach(q => {
        if (!next.some(s => s.id === q.id)) next.push(q);
      });
      setSelectedQuestions(next);
    }
  };

  const handleSearchChange = (val) => { setQuestionSearch(val); setPage(1); };
  const handleSubjectChange = (val) => { setSelectedSubjectFilter(val); setSelectedChapterFilter('All'); setPage(1); };

  const handlePdfUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      
      if (ext === 'pmd' || ext === 'p65' || ext === 'pm6') {
        alert("Adobe PageMaker (.pmd) files are a proprietary, legacy format and cannot be parsed directly. Please print/export your PageMaker document to PDF and upload the PDF instead.");
        e.target.value = null;
        return;
      }
      
      if (ext === 'doc') {
        alert("Legacy Word (.doc) files are not directly supported. Please open the file in Microsoft Word, save it as a modern Word Document (.docx) or PDF, and upload that file.");
        e.target.value = null;
        return;
      }
      
      if (ext !== 'pdf' && ext !== 'docx') {
        alert("Unsupported file format. Please upload a PDF (.pdf) or Word Document (.docx).");
        e.target.value = null;
        return;
      }
      
      setPdfFile(file);
    }
  };

  const handleExtractDocument = async () => {
    if (!pdfFile) return;
    setExtracting(true);
    setError(null);
    try {
      const ext = pdfFile.name.split('.').pop().toLowerCase();
      if (ext === 'pdf') {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const images = [];
        const pageCanvases = [];
        const numPages = pdf.numPages;
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = 1.5; // Use 1.5 scale for higher quality cropping
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
          
          pageCanvases.push(canvas);
          const base64Image = canvas.toDataURL('image/jpeg', 0.75);
          const cleanBase64 = base64Image.split(',')[1];
          images.push(cleanBase64);
        }
        
        const res = await API.post('/api/admin/extract-pdf', { images }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.data && res.data.questions) {
          const rawQuestions = res.data.questions;
          const cleaned = [];
          
          for (let qIdx = 0; qIdx < rawQuestions.length; qIdx++) {
            const q = rawQuestions[qIdx];
            let finalImageUrl = q.image_url || null;
            
            if (q.diagram_bbox && Array.isArray(q.diagram_bbox) && q.diagram_bbox.length === 4) {
              const [ymin, xmin, ymax, xmax] = q.diagram_bbox;
              if (typeof ymin === 'number' && typeof xmin === 'number' &&
                  typeof ymax === 'number' && typeof xmax === 'number' &&
                  ymax > ymin && xmax > xmin) {
                  
                const pageIdx = q.page_index !== undefined ? q.page_index : 0;
                const srcCanvas = pageCanvases[pageIdx];
                if (srcCanvas) {
                  try {
                    const cropCanvas = document.createElement('canvas');
                    const cropCtx = cropCanvas.getContext('2d');
                    
                    // Convert normalized coordinates (0-1000) to actual canvas coordinates
                    const x = (xmin / 1000) * srcCanvas.width;
                    const y = (ymin / 1000) * srcCanvas.height;
                    const w = ((xmax - xmin) / 1000) * srcCanvas.width;
                    const h = ((ymax - ymin) / 1000) * srcCanvas.height;
                    
                    cropCanvas.width = w;
                    cropCanvas.height = h;
                    
                    cropCtx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h);
                    
                    const blob = await new Promise(resolve => cropCanvas.toBlob(resolve, 'image/png'));
                    if (blob) {
                      const fileName = `extracted_${Date.now()}_q${qIdx}.png`;
                      const filePath = `questions/${fileName}`;
                      
                      let { error: uploadError } = await supabase.storage
                        .from('question-assets')
                        .upload(filePath, blob);
                        
                      if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                          .from('question-assets')
                          .getPublicUrl(filePath);
                        finalImageUrl = publicUrl;
                        console.log(`[AddTestPage] Successfully cropped & uploaded diagram for question ${qIdx + 1}: ${publicUrl}`);
                      } else {
                        console.error(`[AddTestPage] Storage upload error:`, uploadError.message);
                      }
                    }
                  } catch (cropErr) {
                    console.error(`[AddTestPage] Failed to crop diagram for question ${qIdx + 1}:`, cropErr);
                  }
                }
              }
            }
            
            let cleanedOptions = q.options;
            if (cleanedOptions && Array.isArray(cleanedOptions)) {
              cleanedOptions = cleanedOptions.map(opt => {
                if (typeof opt === 'string') {
                  return opt.replace(/^(?:\(?[1-4a-dA-D]\)\s*|(?:\(?[1-4a-dA-D]\)?\.\s+))/, '');
                }
                return opt;
              });
            }
            
            cleaned.push({
              ...q,
              options: cleanedOptions,
              image_url: finalImageUrl
            });
          }
          
          setExtractedQuestions(cleaned);
        }
      } else if (ext === 'docx') {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(pdfFile);
        });
        
        const res = await API.post('/api/admin/extract-docx', { docx: base64 }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.data && res.data.questions) {
          const rawQuestions = res.data.questions;
          const cleaned = rawQuestions.map(q => {
            let cleanedOptions = q.options;
            if (cleanedOptions && Array.isArray(cleanedOptions)) {
              cleanedOptions = cleanedOptions.map(opt => {
                if (typeof opt === 'string') {
                  return opt.replace(/^(?:\(?[1-4a-dA-D]\)\s*|(?:\(?[1-4a-dA-D]\)?\.\s+))/, '');
                }
                return opt;
              });
            }
            return {
              ...q,
              options: cleanedOptions,
              type: (q.type?.toUpperCase() === 'INTEGER' || q.type?.toUpperCase() === 'NUMERICAL') ? 'NUMERICAL' : 'MCQ'
            };
          });
          setExtractedQuestions(cleaned);
        }
      }
    } catch (err) {
      console.error('Document extraction failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to extract document');
    } finally {
      setExtracting(false);
    }
  };

  const removeExtractedQuestion = (index) => {
    const next = [...extractedQuestions];
    next.splice(index, 1);
    setExtractedQuestions(next);
  };

  const updateExtractedQuestion = (index, field, value) => {
    const next = [...extractedQuestions];
    next[index] = { ...next[index], [field]: value };
    setExtractedQuestions(next);
  };

  const updateExtractedOption = (qIndex, oIndex, value) => {
    const next = [...extractedQuestions];
    next[qIndex].options[oIndex] = value;
    setExtractedQuestions(next);
  };

  const handleManualImageUpload = async (e, type = 'main', optIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'main') setManualUploading(true);
    else setManualOptUploading(optIndex);

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
        setManualQuestion(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        const newOpts = [...manualQuestion.options];
        newOpts[optIndex] = { ...newOpts[optIndex], image_url: publicUrl };
        setManualQuestion(prev => ({ ...prev, options: newOpts }));
      }
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setManualUploading(false);
      setManualOptUploading(null);
    }
  };

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    if (!manualQuestion.text.trim()) {
      alert("Question text is required.");
      return;
    }
    
    // JS-side validation of correct answer
    if (manualQuestion.correct_answer === undefined || manualQuestion.correct_answer === null || manualQuestion.correct_answer.toString().trim() === '') {
      alert("Correct answer is required.");
      return;
    }

    if (manualQuestion.type === 'MCQ') {
      // Validate that all MCQ options have either text or image
      const missingOption = manualQuestion.options.some((opt) => !opt.text.trim() && !opt.image_url);
      if (missingOption) {
        alert("All 4 MCQ options must have either text or an image.");
        return;
      }
    }
    
    const newQ = {
      subject: manualQuestion.subject,
      chapter: manualQuestion.chapter || null,
      type: manualQuestion.type,
      text: manualQuestion.text,
      correct_answer: manualQuestion.correct_answer,
      image_url: manualQuestion.image_url || null,
      sub_text: manualQuestion.sub_text || null,
      options: manualQuestion.type === 'MCQ'
        ? manualQuestion.options.map(opt => {
            if (opt.image_url) {
              return { text: opt.text, image_url: opt.image_url };
            }
            return opt.text;
          })
        : []
    };
    
    setExtractedQuestions(prev => [...prev, newQ]);
    
    // Reset form while keeping current subject & type selection
    setManualQuestion({
      subject: manualQuestion.subject,
      chapter: manualQuestion.chapter,
      type: manualQuestion.type,
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      // Convert the local datetime string to ISO 8601 with timezone offset
      // datetime-local gives "YYYY-MM-DDTHH:mm" without timezone, so we
      // explicitly parse it as local time and convert to UTC ISO string.
      const scheduledAtISO = newTest.scheduled_at
        ? new Date(newTest.scheduled_at).toISOString()
        : null;
      await API.post('/api/admin/tests', {
        ...newTest,
        scheduled_at: scheduledAtISO,
        created_by: user?.id,
        questionIds: selectedQuestions.map(q => q.id),
        newQuestions: extractedQuestions
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      console.error('Create test error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create test');
    } finally {
      setAdding(false);
    }
  };

  const selectedQuestionIds = selectedQuestions.map(q => q.id);
  const displayedQuestions = reviewMode
    ? selectedQuestions.filter(q => {
        const matchSub = selectedSubjectFilter === 'All' || q.subject?.toLowerCase() === selectedSubjectFilter.toLowerCase();
        const matchCh = selectedChapterFilter === 'All' || q.chapter?.toLowerCase() === selectedChapterFilter.toLowerCase();
        const matchSearch = q.text?.toLowerCase().includes(questionSearch.toLowerCase()) || q.subject?.toLowerCase().includes(questionSearch.toLowerCase());
        return matchSub && matchCh && matchSearch;
      })
    : availableQuestions;

  const totalSelectedCount = selectedQuestions.length + extractedQuestions.length;

  return (
    <div className="min-h-screen bg-surface animate-in fade-in duration-300">
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-xl border-b border-outline-variant/20 px-6 md:px-12 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-on-surface font-headline">Add New Test</h1>
          <p className="text-xs text-on-surface-variant font-medium">Fill in the details, pick questions, and publish.</p>
        </div>
        {totalSelectedCount > 0 && (
          <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-full border border-primary/20">
            {totalSelectedCount} question{totalSelectedCount !== 1 ? 's' : ''} staged
          </span>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        {success && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-bold text-sm flex items-center gap-3 animate-in zoom-in-95">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            Test published successfully! Redirecting to dashboard…
          </div>
        )}

        {error && (
          <div className="mb-6 p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-bold text-sm flex items-center gap-3 animate-in zoom-in-95">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Card 1: Test Identity ── */}
          <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-on-surface font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Test Identity
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-on-surface-variant">Test Title</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-outline-variant bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. JEE Full Mock Paper — April 2026"
                value={newTest.title}
                onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">school</span>
                Exam Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'jee',  label: 'JEE',  sub: 'IIT JEE Mains & Advanced', color: 'border-red-400 bg-red-50 text-red-700',    dot: 'bg-red-500' },
                  { id: 'neet', label: 'NEET', sub: 'NEET UG Medical Entrance',  color: 'border-blue-400 bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
                ].map(exam => (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => {
                      setExamType(exam.id);
                      setNewTest(prev => ({ ...prev, category: `${exam.id}-${sectionType}` }));
                    }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      examType === exam.id ? `${exam.color} shadow-md` : 'border-outline-variant/30 bg-surface hover:border-primary/40 text-on-surface-variant'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${examType === exam.id ? exam.dot : 'bg-outline-variant'}`} />
                    <div className="flex-1">
                      <span className="font-black text-base block">{exam.label}</span>
                      <span className="text-[11px] font-medium opacity-70">{exam.sub}</span>
                    </div>
                    {examType === exam.id && <span className="material-symbols-outlined">check_circle</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">layers</span>
                  Section
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'full',    label: 'Full-Length Mocks',    icon: 'assignment' },
                    { id: 'pyq',     label: 'Previous Year Papers', icon: 'history_edu' },
                    { id: 'chapter', label: 'Subject-wise Tests',   icon: examType === 'neet' ? 'biotech' : 'category' },
                  ].map(sec => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setSectionType(sec.id);
                        setNewTest(prev => ({ ...prev, category: `${examType}-${sec.id}` }));
                      }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                        sectionType === sec.id
                          ? 'border-primary bg-primary/8 text-primary shadow-sm'
                          : 'border-outline-variant/30 bg-surface hover:border-primary/40 text-on-surface-variant'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-xl ${sectionType === sec.id ? 'text-primary' : 'text-on-surface-variant'}`}>{sec.icon}</span>
                      <span className="font-bold text-sm">{sec.label}</span>
                      {sectionType === sec.id && <span className="material-symbols-outlined text-sm ml-auto text-primary">check_circle</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-outline-variant bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                    value={newTest.duration_minutes}
                    onChange={e => setNewTest({ ...newTest, duration_minutes: e.target.value })}
                    required
                    min="1"
                  />
                  <p className="text-xs text-on-surface-variant font-medium">Hint: JEE = 180 mins · NEET = 200 mins</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">event</span>
                    Schedule Date &amp; Time
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-wide">Optional</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-3 rounded-xl border border-outline-variant bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                    value={newTest.scheduled_at}
                    onChange={e => setNewTest({ ...newTest, scheduled_at: e.target.value })}
                  />
                  <p className="text-xs text-on-surface-variant font-medium">
                    If set, students cannot start this exam until this exact date &amp; time.
                    Leave blank to make the exam immediately available.
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-surface-container to-surface-container-low border border-outline-variant/30 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mb-3">Live Preview</p>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border uppercase ${
                      examType === 'jee' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'
                    }`}>{examType.toUpperCase()}</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">arrow_forward</span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black border bg-surface text-on-surface-variant border-outline-variant/40 uppercase">
                      {sectionType === 'full' ? 'Full Mock' : sectionType === 'pyq' ? 'PYQ' : 'Subject-wise'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-on-surface truncate">{newTest.title || <span className="text-on-surface-variant italic font-normal">Test title will appear here</span>}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">{newTest.duration_minutes} mins · {totalSelectedCount} questions staged</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Card 2: Question Sources ── */}
          <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-outline-variant/20 pb-4">
              <h2 className="text-lg font-black text-on-surface font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">library_books</span>
                Question Source
              </h2>
              <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSourceMode('database')}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${sourceMode === 'database' ? 'bg-white text-primary shadow-md border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  From Database
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('pdf')}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer ${sourceMode === 'pdf' ? 'bg-white text-primary shadow-md border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  AI Document Scan
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('manual')}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer ${sourceMode === 'manual' ? 'bg-white text-primary shadow-md border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">edit_square</span>
                  Add Manually
                </button>
              </div>
            </div>

            {/* ── Content Routing ── */}
            {sourceMode === 'database' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewMode(!reviewMode)}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5 cursor-pointer ${
                        reviewMode
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {reviewMode ? 'visibility' : 'visibility_off'}
                      </span>
                      {reviewMode ? 'Reviewing Selected' : 'Review Selected Only'}
                    </button>
                    {!reviewMode && (
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Select / Clear Page
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
                  {/* Search Bar */}
                  <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg">search</span>
                    <input
                      type="text"
                      placeholder="Search question text..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:outline-none focus:border-primary transition-colors"
                      value={questionSearch}
                      onChange={e => handleSearchChange(e.target.value)}
                    />
                  </div>

                  {/* Subject Dropdown */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center flex-shrink-0">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Subject:</span>
                      <select
                        value={selectedSubjectFilter}
                        onChange={e => handleSubjectChange(e.target.value)}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-outline-variant bg-white text-xs font-black focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      >
                        <option value="All">All Subjects</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>

                    {/* Chapter Dropdown */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Chapter:</span>
                      <select
                        value={selectedChapterFilter}
                        onChange={e => {
                          setSelectedChapterFilter(e.target.value);
                          setPage(1);
                        }}
                        disabled={selectedSubjectFilter === 'All'}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-outline-variant bg-white text-xs font-black focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:bg-surface-container cursor-pointer"
                      >
                        <option value="All">All Chapters</option>
                        {selectedSubjectFilter !== 'All' && (NCERT_CHAPTERS[selectedSubjectFilter] || []).map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {!reviewMode && (
                  <div className="flex justify-between items-center bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/10 text-xs">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-outline-variant rounded-lg font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      ← Prev
                    </button>
                    <span className="text-on-surface-variant font-medium">
                      Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                      <span className="text-on-surface-variant/60 ml-2">({totalQuestionsCount} total)</span>
                    </span>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-outline-variant rounded-lg font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <div className="border border-outline-variant/30 rounded-xl bg-white overflow-hidden shadow-inner">
                  <div className="divide-y divide-outline-variant/10 max-h-[400px] overflow-y-auto">
                    {loadingQuestions && !reviewMode ? (
                      <div className="p-16 text-center text-xs text-on-surface-variant font-bold flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-2 border-t-primary rounded-full animate-spin" />
                        Fetching question registry…
                      </div>
                    ) : displayedQuestions.length > 0 ? (
                      displayedQuestions.map(q => {
                        const isSelected = selectedQuestionIds.includes(q.id);
                        const subjectColors = {
                          Physics: 'bg-blue-50 text-blue-700 border-blue-200',
                          Chemistry: 'bg-amber-50 text-amber-700 border-amber-200',
                          Mathematics: 'bg-red-50 text-red-700 border-red-200',
                          Biology: 'bg-green-50 text-green-700 border-green-200',
                        };
                        return (
                          <div
                            key={q.id}
                            onClick={() => handleToggleQuestion(q)}
                            className={`p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-surface-container-low ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black border ${subjectColors[q.subject] || 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                                  {q.subject}
                                </span>
                                {q.chapter && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black border bg-zinc-50 text-zinc-600 border-zinc-200">
                                    {q.chapter}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-surface-container rounded text-[9px] uppercase font-black border border-outline-variant/20 text-on-surface-variant">
                                  {q.type}
                                </span>
                              </div>
                              <div className="text-sm text-on-surface font-medium line-clamp-2 leading-relaxed">
                                <LatexRenderer text={q.text} />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center text-sm text-on-surface-variant font-bold">
                        {reviewMode ? '✅ No selected questions match these filters.' : '🔍 No questions found.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sourceMode === 'pdf' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-surface-container-low border border-dashed border-primary/40 rounded-xl p-8 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface mb-1">Upload Test Document</h3>
                    <p className="text-xs text-on-surface-variant max-w-md">Gemini AI will scan the PDF or Word (.docx) document and instantly extract formatted questions, options, and answers.</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.pmd"
                    ref={fileInputRef}
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-white border border-outline-variant rounded-lg font-bold text-sm hover:border-primary transition-colors cursor-pointer"
                    >
                      {pdfFile ? pdfFile.name : 'Choose File'}
                    </button>
                    {pdfFile && (
                      <button
                        type="button"
                        onClick={handleExtractDocument}
                        disabled={extracting}
                        className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {extracting ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[18px]">auto_awesome</span> Extract Now</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sourceMode === 'manual' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 space-y-4 shadow-sm">
                  <h3 className="text-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_square</span>
                    Define Question
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-on-surface-variant">Subject</label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold focus:border-primary focus:outline-none"
                        value={manualQuestion.subject}
                        onChange={e => {
                          const sub = e.target.value;
                          setManualQuestion({
                            ...manualQuestion,
                            subject: sub,
                            chapter: NCERT_CHAPTERS[sub] ? NCERT_CHAPTERS[sub][0] : ''
                          });
                        }}
                      >
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-on-surface-variant">Chapter</label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold focus:border-primary focus:outline-none"
                        value={manualQuestion.chapter}
                        onChange={e => setManualQuestion({...manualQuestion, chapter: e.target.value})}
                      >
                        {(NCERT_CHAPTERS[manualQuestion.subject] || []).map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-on-surface-variant">Type</label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold focus:border-primary focus:outline-none"
                        value={manualQuestion.type}
                        onChange={e => {
                          const val = e.target.value;
                          setManualQuestion({
                            ...manualQuestion, 
                            type: val,
                            correct_answer: ''
                          });
                        }}
                      >
                        <option value="MCQ">MCQ (Multiple Choice)</option>
                        <option value="NUMERICAL">NUMERICAL (Integer/Decimal)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Question Text (Supports LaTeX)</label>
                    <textarea 
                      ref={manualTextRef}
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm min-h-[80px] focus:border-primary focus:outline-none"
                      placeholder="e.g. Find the value of $\int_0^{\pi} \sin x \, dx$"
                      value={manualQuestion.text}
                      onChange={e => setManualQuestion({...manualQuestion, text: e.target.value})}
                      onFocus={() => setActiveManualField('text')}
                    />
                    <MathKeypad 
                      targetRef={activeManualField === 'text' ? manualTextRef : manualSubTextRef} 
                      value={activeManualField === 'text' ? manualQuestion.text : (manualQuestion.sub_text || '')} 
                      setValue={(val) => setManualQuestion(prev => ({ ...prev, [activeManualField]: val }))} 
                    />
                    {manualQuestion.text && (
                      <div className="mt-2 p-3 bg-surface-container rounded-lg border border-outline-variant/20">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Live Math Preview:</p>
                        <div className="text-sm text-on-surface leading-relaxed">
                          <LatexRenderer text={manualQuestion.text} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Main Image Asset (Optional)</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary transition-all duration-300 group">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <span className={`material-symbols-outlined text-2xl mb-1 ${manualQuestion.image_url ? 'text-green-500' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                            {manualUploading ? 'cloud_sync' : manualQuestion.image_url ? 'check_circle' : 'cloud_upload'}
                          </span>
                          <p className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                            {manualUploading ? 'Processing...' : manualQuestion.image_url ? 'Image Attached' : 'Click to upload main image'}
                          </p>
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleManualImageUpload(e, 'main')} className="hidden" />
                      </label>
                      {manualQuestion.image_url && (
                        <div className="flex items-center gap-2 mt-1">
                          <img src={manualQuestion.image_url} alt="Attached asset" className="max-h-20 rounded border border-outline-variant/30 object-contain" />
                          <button 
                            type="button" 
                            onClick={() => setManualQuestion({ ...manualQuestion, image_url: '' })}
                            className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Text Below Image (Optional, Supports LaTeX)</label>
                    <textarea 
                      ref={manualSubTextRef}
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm min-h-[60px] focus:border-primary focus:outline-none"
                      placeholder="e.g. Find the value of current in the circuit shown above."
                      value={manualQuestion.sub_text || ''}
                      onChange={e => setManualQuestion({...manualQuestion, sub_text: e.target.value})}
                      onFocus={() => setActiveManualField('sub_text')}
                    />
                    {manualQuestion.sub_text && (
                      <div className="mt-2 p-3 bg-surface-container rounded-lg border border-outline-variant/20">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Live Math Preview:</p>
                        <div className="text-sm text-on-surface leading-relaxed">
                          <LatexRenderer text={manualQuestion.sub_text} />
                        </div>
                      </div>
                    )}
                  </div>

                  {manualQuestion.type === 'MCQ' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase text-on-surface-variant">MCQ Options (Rich Support)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {manualQuestion.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              ref={el => manualOptionRefs.current[i] = el}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              className="flex-1 p-2 border border-outline-variant rounded-lg bg-white text-xs focus:border-primary focus:outline-none"
                              value={opt.text}
                              onChange={e => {
                                const newOpts = [...manualQuestion.options];
                                newOpts[i] = { ...newOpts[i], text: e.target.value };
                                setManualQuestion({...manualQuestion, options: newOpts});
                              }}
                              onFocus={() => setActiveManualOptionIndex(i)}
                            />
                            <label className={`w-12 flex items-center justify-center border border-dashed rounded-lg cursor-pointer transition-colors ${opt.image_url ? 'bg-green-50 border-green-400 font-bold' : 'border-outline-variant hover:border-primary'}`}>
                               <span className={`material-symbols-outlined text-xl ${opt.image_url ? 'text-green-600' : 'text-zinc-400'}`}>
                                 {manualOptUploading === i ? 'sync' : opt.image_url ? 'check_circle' : 'add_photo_alternate'}
                               </span>
                               <input type="file" accept="image/*" onChange={(e) => handleManualImageUpload(e, 'option', i)} className="hidden" />
                            </label>
                            {opt.image_url && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  const newOpts = [...manualQuestion.options];
                                  newOpts[i] = { ...newOpts[i], image_url: '' };
                                  setManualQuestion({...manualQuestion, options: newOpts});
                                }}
                                className="text-xs text-red-500 hover:underline px-1 cursor-pointer font-bold"
                                title="Remove Image"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <MathKeypad 
                        targetRef={{ current: manualOptionRefs.current[activeManualOptionIndex] }} 
                        value={manualQuestion.options[activeManualOptionIndex]?.text || ''} 
                        setValue={(val) => {
                          const updated = [...manualQuestion.options];
                          updated[activeManualOptionIndex] = { ...updated[activeManualOptionIndex], text: val };
                          setManualQuestion(prev => ({ ...prev, options: updated }));
                        }} 
                      />

                      {/* Live Preview for Options */}
                      {manualQuestion.options.some(o => o.text) && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-surface-container rounded-lg border border-outline-variant/10">
                          {manualQuestion.options.map((opt, oIndex) => (
                            <div key={oIndex} className="text-xs text-on-surface flex items-start gap-1">
                              <span className="font-bold text-on-surface-variant mr-1">{String.fromCharCode(65 + oIndex)}.</span>
                              <LatexRenderer text={opt.text} />
                              {opt.image_url && <span className="text-[10px] text-primary ml-1">(Image attached)</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Correct Answer</label>
                    {manualQuestion.type === 'MCQ' ? (
                      <select 
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold focus:border-primary focus:outline-none"
                        value={manualQuestion.correct_answer}
                        onChange={e => setManualQuestion({...manualQuestion, correct_answer: e.target.value})}
                      >
                        <option value="">Select Correct Option</option>
                        <option value="0">Option A</option>
                        <option value="1">Option B</option>
                        <option value="2">Option C</option>
                        <option value="3">Option D</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        placeholder="e.g. 18.5"
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-medium focus:border-primary focus:outline-none"
                        value={manualQuestion.correct_answer}
                        onChange={e => setManualQuestion({...manualQuestion, correct_answer: e.target.value})}
                      />
                    )}
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAddManualQuestion}
                    disabled={manualUploading || !manualQuestion.text.trim() || (manualQuestion.type === 'MCQ' && !manualQuestion.correct_answer)}
                    className="w-full py-3 bg-primary hover:brightness-110 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">library_add</span>
                    Stage Question to Test
                  </button>
                </div>
              </div>
            )}

            {/* ── Staged/Extracted Questions Review list ── */}
            {(sourceMode === 'pdf' || sourceMode === 'manual') && extractedQuestions.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-outline-variant/20">
                <h3 className="text-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                  Staged Questions ({extractedQuestions.length})
                </h3>
                <p className="text-xs text-on-surface-variant">Review the questions below. You can make manual corrections before publishing. These will be added directly to the database.</p>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {extractedQuestions.map((eq, i) => (
                    <div key={i} className="bg-white border border-outline-variant/30 rounded-xl p-5 shadow-sm relative group">
                      <button
                        type="button"
                        onClick={() => removeExtractedQuestion(i)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Discard Question"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-1 block">Subject</label>
                          <select 
                            value={eq.subject || 'Physics'}
                            onChange={(e) => {
                              const sub = e.target.value;
                              const next = [...extractedQuestions];
                              next[i] = {
                                ...next[i],
                                subject: sub,
                                chapter: NCERT_CHAPTERS[sub] ? NCERT_CHAPTERS[sub][0] : ''
                              };
                              setExtractedQuestions(next);
                            }}
                            className="w-full p-2 text-xs border border-outline-variant rounded-md"
                          >
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Biology">Biology</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-1 block">Chapter</label>
                          <select 
                            value={eq.chapter || ''}
                            onChange={(e) => updateExtractedQuestion(i, 'chapter', e.target.value)}
                            className="w-full p-2 text-xs border border-outline-variant rounded-md font-bold"
                          >
                            <option value="">Select Chapter</option>
                            {eq.chapter && !(NCERT_CHAPTERS[eq.subject || 'Physics'] || []).includes(eq.chapter) && (
                              <option value={eq.chapter}>{eq.chapter} (AI Extracted)</option>
                            )}
                            {(NCERT_CHAPTERS[eq.subject || 'Physics'] || []).map(ch => (
                              <option key={ch} value={ch}>{ch}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-1 block">Correct Answer</label>
                          <input 
                            type="text"
                            value={eq.correct_answer || ''}
                            onChange={(e) => updateExtractedQuestion(i, 'correct_answer', e.target.value)}
                            placeholder="e.g. Option A"
                            className="w-full p-2 text-xs border border-outline-variant rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4 space-y-2">
                        <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-1 block">Question Text</label>
                        <textarea 
                          ref={el => {
                            if (el) reviewTextRefs.current.set(i, el);
                            else reviewTextRefs.current.delete(i);
                          }}
                          value={eq.text || ''}
                          onChange={(e) => updateExtractedQuestion(i, 'text', e.target.value)}
                          rows={3}
                          className="w-full p-3 text-sm border border-outline-variant rounded-md font-medium"
                        />
                        <MathKeypad targetRef={{ current: reviewTextRefs.current.get(i) }} value={eq.text || ''} setValue={(val) => updateExtractedQuestion(i, 'text', val)} />
                        {eq.text && (
                          <div className="mt-2 p-3 bg-surface-container rounded-lg border border-outline-variant/20">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Live Math Preview:</p>
                            <div className="text-sm text-on-surface leading-relaxed">
                              <LatexRenderer text={eq.text} />
                            </div>
                          </div>
                        )}
                        {eq.image_url && (
                          <div className="mt-2 p-2 bg-surface-container rounded-lg border border-outline-variant/20 flex flex-col items-center">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 self-start w-full text-left">Attached Diagram:</p>
                            <img src={eq.image_url} alt={`Diagram for Question ${i + 1}`} className="max-h-48 object-contain rounded-md" />
                          </div>
                        )}
                      </div>

                      <div className="mb-4 space-y-2">
                        <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-1 block">Text Below Image (Optional)</label>
                        <textarea 
                          ref={el => {
                            if (el) reviewSubTextRefs.current.set(i, el);
                            else reviewSubTextRefs.current.delete(i);
                          }}
                          value={eq.sub_text || ''}
                          onChange={(e) => updateExtractedQuestion(i, 'sub_text', e.target.value)}
                          rows={2}
                          placeholder="Optional text to display below the image"
                          className="w-full p-2 text-xs border border-outline-variant rounded-md font-medium"
                        />
                        <MathKeypad targetRef={{ current: reviewSubTextRefs.current.get(i) }} value={eq.sub_text || ''} setValue={(val) => updateExtractedQuestion(i, 'sub_text', val)} />
                        {eq.sub_text && (
                          <div className="mt-2 p-3 bg-surface-container rounded-lg border border-outline-variant/20">
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Live Math Preview:</p>
                            <div className="text-sm text-on-surface leading-relaxed font-semibold">
                              <LatexRenderer text={eq.sub_text} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-2 block">Options</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(eq.options || ['', '', '', '']).map((opt, oIndex) => {
                            const isOptObj = typeof opt === 'object' && opt !== null;
                            const optText = isOptObj ? opt.text : opt;
                            const optImg = isOptObj ? opt.image_url : null;
                            return (
                              <div key={oIndex} className="flex flex-col gap-2 border border-outline-variant/10 p-2 rounded-lg bg-surface/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-on-surface-variant w-4">{String.fromCharCode(65 + oIndex)}.</span>
                                  <input 
                                    type="text"
                                    value={optText}
                                    onChange={(e) => {
                                      const next = [...extractedQuestions];
                                      if (isOptObj) {
                                        next[i].options[oIndex] = { ...next[i].options[oIndex], text: e.target.value };
                                      } else {
                                        next[i].options[oIndex] = e.target.value;
                                      }
                                      setExtractedQuestions(next);
                                    }}
                                    className="flex-1 p-2 text-xs border border-outline-variant rounded-md"
                                  />
                                </div>
                                {optImg && (
                                  <div className="flex items-center gap-2 ml-6">
                                    <img src={optImg} alt={`Option ${String.fromCharCode(65 + oIndex)}`} className="max-h-12 border rounded object-contain" />
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const next = [...extractedQuestions];
                                        if (isOptObj) {
                                          next[i].options[oIndex] = e.target.value; // convert back to string
                                        }
                                        setExtractedQuestions(next);
                                      }}
                                      className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {eq.options && eq.options.some(opt => opt) && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-surface-container rounded-lg border border-outline-variant/10">
                            {(eq.options || ['', '', '', '']).map((opt, oIndex) => {
                              const isOptObj = typeof opt === 'object' && opt !== null;
                              const optText = isOptObj ? opt.text : opt;
                              const optImg = isOptObj ? opt.image_url : null;
                              return (
                                <div key={oIndex} className="text-xs text-on-surface flex flex-col gap-1">
                                  <div className="flex items-start gap-1">
                                    <span className="font-bold text-on-surface-variant mr-1">{String.fromCharCode(65 + oIndex)}.</span>
                                    <LatexRenderer text={optText} />
                                  </div>
                                  {optImg && <span className="text-[10px] text-primary ml-6">(Image attached)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Submit bar ── */}
          <div className="flex gap-4 pb-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-4 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:border-primary/40 hover:text-on-surface transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || success || totalSelectedCount === 0}
              className="flex-1 py-4 bg-primary hover:brightness-110 text-white font-black rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-wider cursor-pointer"
            >
              <span className="material-symbols-outlined">{adding ? 'hourglass_top' : 'publish'}</span>
              {adding ? 'Publishing…' : `Publish Test (${totalSelectedCount} Qs)`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
