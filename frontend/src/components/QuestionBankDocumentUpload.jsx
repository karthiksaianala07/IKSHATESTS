import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import LatexRenderer from './LatexRenderer';
import MathKeypad from './MathKeypad';
import { supabase } from '../config/supabase';
import { NCERT_CHAPTERS } from '../config/ncertChapters';
import { API_URL } from '../config/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function QuestionBankDocumentUpload({ onQuestionsSaved }) {
  const fileInputRef = useRef(null);
  const reviewTextRefs = useRef(new Map());
  const reviewSubTextRefs = useRef(new Map());

  const [selectedFile, setSelectedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState('');
  const [error, setError] = useState(null);
  const [stagedQuestions, setStagedQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Batch subject & chapter override
  const [batchSubject, setBatchSubject] = useState('Physics');
  const [batchChapter, setBatchChapter] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'docx', 'doc'].includes(ext)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a valid PDF or Word (.docx) file.');
      }
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setExtracting(true);
    setError(null);
    setExtractProgress('Preparing document...');

    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase();

      if (ext === 'pdf') {
        setExtractProgress('Rendering PDF pages to canvas...');
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const images = [];
        const pageCanvases = [];
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          setExtractProgress(`Rendering page ${i} of ${numPages}...`);
          const page = await pdf.getPage(i);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
          pageCanvases.push(canvas);

          const base64Image = canvas.toDataURL('image/jpeg', 0.75);
          images.push(base64Image.split(',')[1]);
        }

        setExtractProgress('Analyzing document and extracting questions with AI...');
        const res = await axios.post(
          `${API_URL}/api/admin/extract-pdf`,
          { images },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (res.data && res.data.questions) {
          const rawQuestions = res.data.questions;
          const cleaned = [];

          for (let qIdx = 0; qIdx < rawQuestions.length; qIdx++) {
            const q = rawQuestions[qIdx];
            let finalImageUrl = q.image_url || null;

            if (q.diagram_bbox && Array.isArray(q.diagram_bbox) && q.diagram_bbox.length === 4) {
              const [ymin, xmin, ymax, xmax] = q.diagram_bbox;
              if (
                typeof ymin === 'number' &&
                typeof xmin === 'number' &&
                typeof ymax === 'number' &&
                typeof xmax === 'number' &&
                ymax > ymin &&
                xmax > xmin
              ) {
                const pageIdx = q.page_index !== undefined ? q.page_index : 0;
                const srcCanvas = pageCanvases[pageIdx];
                if (srcCanvas) {
                  try {
                    const cropCanvas = document.createElement('canvas');
                    const cropCtx = cropCanvas.getContext('2d');

                    const x = (xmin / 1000) * srcCanvas.width;
                    const y = (ymin / 1000) * srcCanvas.height;
                    const w = ((xmax - xmin) / 1000) * srcCanvas.width;
                    const h = ((ymax - ymin) / 1000) * srcCanvas.height;

                    cropCanvas.width = w;
                    cropCanvas.height = h;
                    cropCtx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h);

                    const blob = await new Promise((resolve) => cropCanvas.toBlob(resolve, 'image/png'));
                    if (blob) {
                      const fileName = `qb_extracted_${Date.now()}_q${qIdx}.png`;
                      const filePath = `questions/${fileName}`;

                      let { error: uploadError } = await supabase.storage
                        .from('question-assets')
                        .upload(filePath, blob);

                      if (!uploadError) {
                        const {
                          data: { publicUrl },
                        } = supabase.storage.from('question-assets').getPublicUrl(filePath);
                        finalImageUrl = publicUrl;
                      }
                    }
                  } catch (cropErr) {
                    console.error('[QuestionBank] Failed to crop diagram:', cropErr);
                  }
                }
              }
            }

            let cleanedOptions = q.options;
            if (cleanedOptions && Array.isArray(cleanedOptions)) {
              cleanedOptions = cleanedOptions.map((opt) => {
                if (typeof opt === 'string') {
                  return {
                    text: opt.replace(/^(?:\(?[1-4a-dA-D]\)\s*|(?:\(?[1-4a-dA-D]\)?\.\s+))/, ''),
                    image_url: ''
                  };
                }
                if (typeof opt === 'object') {
                  return {
                    text: opt.text || '',
                    image_url: opt.image_url || ''
                  };
                }
                return { text: String(opt || ''), image_url: '' };
              });
            } else {
              cleanedOptions = [
                { text: '', image_url: '' },
                { text: '', image_url: '' },
                { text: '', image_url: '' },
                { text: '', image_url: '' }
              ];
            }

            cleaned.push({
              subject: q.subject || 'Physics',
              chapter: q.chapter || '',
              type: (q.type?.toUpperCase() === 'INTEGER' || q.type?.toUpperCase() === 'NUMERICAL') ? 'NUMERICAL' : 'MCQ',
              text: q.text || '',
              options: cleanedOptions,
              correct_answer: q.correct_answer !== undefined && q.correct_answer !== null ? String(q.correct_answer) : '',
              image_url: finalImageUrl,
              sub_text: q.sub_text || ''
            });
          }

          setStagedQuestions(cleaned);
        }
      } else if (ext === 'docx' || ext === 'doc') {
        setExtractProgress('Reading Word document binary...');
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });

        setExtractProgress('Parsing text & diagrams with AI...');
        const res = await axios.post(
          `${API_URL}/api/admin/extract-docx`,
          { docx: base64 },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (res.data && res.data.questions) {
          const rawQuestions = res.data.questions;
          const cleaned = rawQuestions.map((q) => {
            let cleanedOptions = q.options;
            if (cleanedOptions && Array.isArray(cleanedOptions)) {
              cleanedOptions = cleanedOptions.map((opt) => {
                if (typeof opt === 'string') {
                  return {
                    text: opt.replace(/^(?:\(?[1-4a-dA-D]\)\s*|(?:\(?[1-4a-dA-D]\)?\.\s+))/, ''),
                    image_url: ''
                  };
                }
                if (typeof opt === 'object') {
                  return {
                    text: opt.text || '',
                    image_url: opt.image_url || ''
                  };
                }
                return { text: String(opt || ''), image_url: '' };
              });
            } else {
              cleanedOptions = [
                { text: '', image_url: '' },
                { text: '', image_url: '' },
                { text: '', image_url: '' },
                { text: '', image_url: '' }
              ];
            }

            return {
              subject: q.subject || 'Physics',
              chapter: q.chapter || '',
              type: (q.type?.toUpperCase() === 'INTEGER' || q.type?.toUpperCase() === 'NUMERICAL') ? 'NUMERICAL' : 'MCQ',
              text: q.text || '',
              options: cleanedOptions,
              correct_answer: q.correct_answer !== undefined && q.correct_answer !== null ? String(q.correct_answer) : '',
              image_url: q.image_url || null,
              sub_text: q.sub_text || ''
            };
          });

          setStagedQuestions(cleaned);
        }
      }
    } catch (err) {
      console.error('[DocumentExtractError]', err);
      setError(err.response?.data?.error || err.message || 'Failed to extract document questions');
    } finally {
      setExtracting(false);
      setExtractProgress('');
    }
  };

  const updateStagedQuestion = (index, field, value) => {
    setStagedQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateStagedOption = (qIdx, optIdx, field, value) => {
    setStagedQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = { ...opts[optIdx], [field]: value };
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const removeStagedQuestion = (index) => {
    setStagedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const applyBatchSubjectChapter = () => {
    if (!batchSubject) return;
    setStagedQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        subject: batchSubject,
        chapter: batchChapter || q.chapter
      }))
    );
  };

  const handleSaveToBank = async () => {
    if (stagedQuestions.length === 0) return;

    // Basic validation
    for (let i = 0; i < stagedQuestions.length; i++) {
      const q = stagedQuestions[i];
      if (!q.text.trim()) {
        alert(`Question #${i + 1} has empty question text.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = stagedQuestions.map((q) => ({
        subject: q.subject,
        chapter: q.chapter || null,
        type: q.type || 'MCQ',
        text: q.text,
        options: q.options || [],
        correct_answer: q.correct_answer || '',
        image_url: q.image_url || null,
        sub_text: q.sub_text || null
      }));

      await axios.post(`${API_URL}/api/admin/questions`, payload);
      alert(`Success! Successfully added ${stagedQuestions.length} questions to the Question Bank.`);
      setStagedQuestions([]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onQuestionsSaved) onQuestionsSaved();
    } catch (err) {
      console.error('[SaveStagedQuestionsError]', err);
      const msg = err.response?.data?.error || err.message || 'Failed to save questions';
      alert('Error saving questions: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#060913]/60 border border-slate-900/60 p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
      <div className="border-b border-slate-900/60 pb-4 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h3 className="font-headline font-bold text-lg text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">document_scanner</span>
            Import from PDF or Word Document
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload exam test papers in PDF or Word (.docx) format. The AI extractor will automatically parse formulas, diagrams, questions, options, and answer keys.
          </p>
        </div>

        {stagedQuestions.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-950/50 border border-cyan-700/40 text-cyan-300 text-xs font-mono font-bold rounded-full">
              {stagedQuestions.length} Staged
            </span>
            <button
              onClick={() => setStagedQuestions([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
            >
              Clear Staged
            </button>
          </div>
        )}
      </div>

      {/* ── Dropzone & Upload Controls ── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-800 hover:border-primary/50 transition-colors rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 bg-slate-950/40"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">upload_file</span>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-200">
            Drag & drop your PDF or Word document here, or click to browse
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supported formats: <span className="font-mono text-slate-400">.pdf, .docx, .doc</span>
          </p>
        </div>

        <input
          type="file"
          accept=".pdf,.docx,.doc"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">folder_open</span>
            {selectedFile ? selectedFile.name : 'Select Document'}
          </button>

          {selectedFile && (
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting}
              className="px-6 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{extractProgress || 'Processing Document...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  <span>Extract Questions Now</span>
                </>
              )}
            </button>
          )}
        </div>

        {selectedFile && !extracting && (
          <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono">
            <span className="material-symbols-outlined text-sm text-cyan-400">description</span>
            <span>{selectedFile.name}</span>
            <span className="opacity-60">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
          <span className="material-symbols-outlined text-base text-rose-400">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Staging & Review Area ── */}
      {stagedQuestions.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-slate-900/60">
          <div className="flex justify-between items-center flex-wrap gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-900/80">
            <div>
              <h4 className="font-headline font-bold text-sm text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">task_alt</span>
                Review Extracted Questions ({stagedQuestions.length})
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inspect formulas, diagrams, and options. Modify details or delete unwanted questions before saving to the bank.
              </p>
            </div>

            <button
              onClick={handleSaveToBank}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving to Repository...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  <span>Save {stagedQuestions.length} Questions to Bank</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Batch Attribute Setter */}
          <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-900 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Assign:</span>
            <select
              value={batchSubject}
              onChange={(e) => {
                const sub = e.target.value;
                setBatchSubject(sub);
                setBatchChapter(NCERT_CHAPTERS[sub] ? NCERT_CHAPTERS[sub][0] : '');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 text-xs font-bold"
            >
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
            </select>

            <select
              value={batchChapter}
              onChange={(e) => setBatchChapter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 text-xs font-bold max-w-[220px]"
            >
              <option value="">Keep / Choose Chapter</option>
              {(NCERT_CHAPTERS[batchSubject] || []).map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={applyBatchSubjectChapter}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Apply to All Staged
            </button>
          </div>

          {/* Question Review Cards */}
          <div className="space-y-4 max-h-[850px] overflow-y-auto pr-2">
            {stagedQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl relative group space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-900/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-black bg-primary/20 text-cyan-300 border border-primary/30">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                      {q.type}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStagedQuestion(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Remove Question"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 block">Subject</label>
                    <select
                      value={q.subject}
                      onChange={(e) => updateStagedQuestion(idx, 'subject', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-800 rounded-lg bg-slate-900 text-slate-200 font-bold"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 block">Chapter</label>
                    <select
                      value={q.chapter || ''}
                      onChange={(e) => updateStagedQuestion(idx, 'chapter', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-800 rounded-lg bg-slate-900 text-slate-200 font-bold truncate"
                    >
                      <option value="">Select Chapter</option>
                      {q.chapter && !(NCERT_CHAPTERS[q.subject] || []).includes(q.chapter) && (
                        <option value={q.chapter}>{q.chapter} (Extracted)</option>
                      )}
                      {(NCERT_CHAPTERS[q.subject] || []).map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 block">Correct Answer</label>
                    <input
                      type="text"
                      value={q.correct_answer}
                      onChange={(e) => updateStagedQuestion(idx, 'correct_answer', e.target.value)}
                      placeholder="e.g. Option A or 4.5"
                      className="w-full p-2 text-xs border border-slate-800 rounded-lg bg-slate-900 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Question Text (LaTeX)</label>
                  <textarea
                    ref={(el) => {
                      if (el) reviewTextRefs.current.set(idx, el);
                      else reviewTextRefs.current.delete(idx);
                    }}
                    value={q.text}
                    onChange={(e) => updateStagedQuestion(idx, 'text', e.target.value)}
                    rows={3}
                    className="w-full p-3 text-xs border border-slate-800 rounded-xl bg-slate-900 text-slate-200 font-mono focus:outline-none focus:border-primary"
                  />
                  <MathKeypad
                    targetRef={{ current: reviewTextRefs.current.get(idx) }}
                    value={q.text || ''}
                    setValue={(val) => updateStagedQuestion(idx, 'text', val)}
                  />
                  {q.text && (
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                      <p className="text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Math Preview:</p>
                      <LatexRenderer text={q.text} />
                    </div>
                  )}
                </div>

                {/* Diagram / Image */}
                {q.image_url && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
                    <p className="text-[9px] font-mono font-bold uppercase text-slate-400 self-start">Attached Diagram / Figure:</p>
                    <img src={q.image_url} alt="Extracted diagram" className="max-h-48 object-contain rounded-lg border border-slate-800" />
                    <button
                      type="button"
                      onClick={() => updateStagedQuestion(idx, 'image_url', null)}
                      className="text-[10px] text-rose-400 hover:underline self-end cursor-pointer"
                    >
                      Remove Diagram
                    </button>
                  </div>
                )}

                {/* MCQ Options */}
                {q.type === 'MCQ' && (
                  <div className="space-y-2 pt-2 border-t border-slate-900/60">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Options</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateStagedOption(idx, oIdx, 'text', e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 p-2 text-xs border border-slate-800 rounded-lg bg-slate-900 text-slate-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveToBank}
              disabled={saving}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">cloud_upload</span>
                  <span>Save All {stagedQuestions.length} Questions to Question Bank</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
