import React, { useState, useEffect, useRef } from 'react';
import API from '../config/api';
import { supabase } from '../config/supabase';
import { NCERT_CHAPTERS } from '../config/ncertChapters';
import MathKeypad from '../components/MathKeypad';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [stats, setStats] = useState({ activeStudents: 0, testsSubmitted: 0, avgScore: 0 });
  const [questions, setQuestions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  
  const textRef = useRef(null);
  const subTextRef = useRef(null);
  const optionRefs = useRef([]);
  const [activeQuestionField, setActiveQuestionField] = useState('text');
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  
  // New Question State - Now supports Rich Options
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

  useEffect(() => {
    if (activeTab === 'monitoring') {
      fetchStats();
      fetchViolations();
      const interval = setInterval(fetchViolations, 8000);
      return () => clearInterval(interval);
    } else {
      fetchQuestions();
    }
  }, [activeTab]);

  const fetchStats = () => {
    API.get('/api/admin/stats')
      .then(res => {
        if (res.data && typeof res.data.activeStudents !== 'undefined') {
          setStats(res.data);
        }
      })
      .catch(err => {
        console.error("Stats Error:", err);
        setError("Failed to fetch analytics");
      });
  };

  const fetchViolations = () => {
    API.get('/api/admin/violations')
      .then(res => {
        setViolations(res.data || []);
      })
      .catch(err => {
        console.error("Violations Fetch Error:", err);
      });
  };

  const fetchQuestions = () => {
    API.get('/api/admin/questions')
      .then(res => {
        setQuestions(res.data || []);
      })
      .catch(err => {
        console.error("Questions Error:", err);
        setError("Failed to fetch question repository");
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
    
    API.post('/api/admin/questions', newQuestion)
      .then(res => {
        setShowAddForm(false);
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
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.message || "Failed to add question";
        alert("Error adding question: " + msg);
      });
  };

  const formatNumber = (val) => (val || 0).toLocaleString();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-on-surface mb-2 font-headline">Faculty & Admin Panel</h2>
          <p className="text-on-surface-variant text-lg max-w-2xl">Manage study materials, question repositories, and student analytics.</p>
        </div>
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/20 w-full sm:w-auto overflow-x-auto shadow-inner">
          <button onClick={() => setActiveTab('monitoring')} className={`px-5 py-2.5 rounded-md font-bold text-sm whitespace-nowrap transition-colors flex-1 sm:flex-none cursor-pointer ${activeTab === 'monitoring' ? 'bg-white text-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>Analytics</button>
          <button onClick={() => setActiveTab('question-bank')} className={`px-5 py-2.5 rounded-md font-bold text-sm whitespace-nowrap transition-colors flex-1 sm:flex-none cursor-pointer ${activeTab === 'question-bank' ? 'bg-white text-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>Question Bank</button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold animate-in zoom-in-95">
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-sm hover:translate-y-[-4px] transition-transform">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform scale-[2] -translate-y-4 translate-x-4"><span className="material-symbols-outlined text-green-700 text-6xl">monitoring</span></div>
              <div className="flex items-center gap-3 text-on-surface-variant font-bold uppercase tracking-widest text-xs z-10"><span className="material-symbols-outlined text-green-700 text-lg">monitoring</span> Active Students</div>
              <h3 className="text-4xl font-black text-on-surface z-10 mt-1">{formatNumber(stats.activeStudents)}</h3>
              <p className="text-[10px] tracking-wider font-bold text-green-700 bg-green-100 px-2 py-1 rounded w-fit z-10 mt-2 uppercase">+12% from last hour</p>
            </div>
            
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-sm hover:translate-y-[-4px] transition-transform">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform scale-[2] -translate-y-4 translate-x-4"><span className="material-symbols-outlined text-blue-700 text-6xl">task_alt</span></div>
              <div className="flex items-center gap-3 text-on-surface-variant font-bold uppercase tracking-widest text-xs z-10"><span className="material-symbols-outlined text-blue-700 text-lg">task_alt</span> Tests Submitted Today</div>
              <h3 className="text-4xl font-black text-on-surface z-10 mt-1">{formatNumber(stats.testsSubmitted)}</h3>
            </div>
            
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-sm hover:translate-y-[-4px] transition-transform">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform scale-[2] -translate-y-4 translate-x-4"><span className="material-symbols-outlined text-purple-700 text-6xl">groups</span></div>
              <div className="flex items-center gap-3 text-on-surface-variant font-bold uppercase tracking-widest text-xs z-10"><span className="material-symbols-outlined text-purple-700 text-lg">groups</span> Avg. Score (JEE Full)</div>
              <h3 className="text-4xl font-black text-on-surface z-10 mt-1">{stats.avgScore || 0}<span className="text-lg text-on-surface-variant font-medium ml-1">/300</span></h3>
            </div>
          </div>

          {/* Exambot Section */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 flex flex-col space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-3xl">shield_alert</span>
                  🤖 Exambot Real-time Security Feed
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">Live proctoring violations and Safe Exam Browser checks from active exam sessions.</p>
              </div>
              <button onClick={fetchViolations} className="p-2 hover:bg-zinc-100 rounded-full cursor-pointer transition-colors" title="Force Reload">
                <span className="material-symbols-outlined text-xl text-zinc-500">refresh</span>
              </button>
            </div>

            <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-inner">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Student Email</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Exam Title</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Violation / Alert</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Time</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-medium">
                  {violations && violations.length > 0 ? (
                    violations.map((v) => (
                      <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-5 py-4 text-xs font-bold text-gray-700">{v.email}</td>
                        <td className="px-5 py-4 text-xs font-semibold text-gray-500">{v.testTitle}</td>
                        <td className="px-5 py-4 text-xs">
                          <span className="flex items-center gap-2 text-red-700 font-bold">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                            {v.violation}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[10px] text-gray-400 font-mono">
                          {new Date(v.timestamp).toLocaleTimeString()} ({new Date(v.timestamp).toLocaleDateString()})
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-black tracking-widest ${
                            v.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' :
                            v.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {v.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-on-surface-variant font-bold">
                        🟢 No active violations recorded. All exam environments are clean.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'question-bank' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 flex flex-col space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2"><span className="material-symbols-outlined text-primary text-3xl">source_notes</span> Question Repository</h3>
               <button onClick={() => setShowAddForm(!showAddForm)} className="h-10 px-5 bg-primary hover:bg-primary-container text-white rounded-lg text-sm font-bold shadow-md cursor-pointer transition-colors">
                 {showAddForm ? 'Cancel' : 'Add New'}
               </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddQuestion} className="bg-surface-container-low p-6 rounded-xl border border-primary/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Subject</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold"
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
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Chapter</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold"
                      value={newQuestion.chapter}
                      onChange={e => setNewQuestion({...newQuestion, chapter: e.target.value})}
                    >
                      {(NCERT_CHAPTERS[newQuestion.subject] || []).map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Type</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm font-bold"
                      value={newQuestion.type}
                      onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}
                    >
                      <option>MCQ</option>
                      <option>NUMERICAL</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Question Text (Supports LaTeX)</label>
                  <textarea 
                    ref={textRef}
                    className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm min-h-[100px]"
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

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Main Image Asset (Optional)</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary transition-all duration-300 group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className={`material-symbols-outlined text-3xl mb-2 ${newQuestion.image_url ? 'text-green-500' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                          {uploading ? 'cloud_sync' : newQuestion.image_url ? 'check_circle' : 'cloud_upload'}
                        </span>
                        <p className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                          {uploading ? 'Processing...' : newQuestion.image_url ? 'Image Attached' : 'Click to upload main image'}
                        </p>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Text Below Image (Optional, Supports LaTeX)</label>
                  <textarea 
                    ref={subTextRef}
                    className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm min-h-[60px]"
                    placeholder="e.g. Find the value of current in the circuit shown above."
                    value={newQuestion.sub_text || ''}
                    onChange={e => setNewQuestion({...newQuestion, sub_text: e.target.value})}
                    onFocus={() => setActiveQuestionField('sub_text')}
                  />
                </div>

                {newQuestion.type === 'MCQ' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">MCQ Options (Rich Support)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {newQuestion.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            ref={el => optionRefs.current[i] = el}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            className="flex-1 p-2.5 border border-outline-variant rounded-lg bg-white text-sm"
                            value={opt.text}
                            onChange={e => {
                              const newOpts = [...newQuestion.options];
                              newOpts[i] = { ...newOpts[i], text: e.target.value };
                              setNewQuestion({...newQuestion, options: newOpts});
                            }}
                            onFocus={() => setActiveOptionIndex(i)}
                          />
                          <label className={`w-12 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${opt.image_url ? 'bg-green-50 border-green-400' : 'border-outline-variant hover:border-primary'}`}>
                             <span className={`material-symbols-outlined text-xl ${opt.image_url ? 'text-green-600' : 'text-zinc-400'}`}>
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
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Correct Answer (Index 0-3 for MCQ)</label>
                  <input 
                    className="w-full p-2.5 rounded-lg border border-outline-variant bg-white text-sm"
                    value={newQuestion.correct_answer}
                    onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                    required
                  />
                </div>

                <button type="submit" disabled={uploading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">Save Question to Database</button>
              </form>
            )}
            
            <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-inner">
               <table className="w-full text-left text-sm text-on-surface">
                 <thead className="bg-surface-container text-on-surface-variant">
                   <tr>
                     <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Subject</th>
                     <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Text Preview</th>
                     <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Rich Assets</th>
                     <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Type</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-outline-variant/20">
                   {questions && questions.length > 0 ? (
                      questions.map((q, i) => (
                        <tr key={i} className="hover:bg-surface-container-low transition-colors">
                           <td className="px-5 py-4">
                             <div className="flex flex-col gap-1 items-start">
                               <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black border ${q.subject === 'Physics' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.subject === 'Chemistry' ? 'bg-amber-50 text-amber-700 border-amber-200' : q.subject === 'Mathematics' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                 {q.subject}
                               </span>
                               {q.chapter && (
                                 <span className="text-[10px] text-on-surface-variant font-bold max-w-[150px] truncate" title={q.chapter}>
                                   {q.chapter}
                                 </span>
                               )}
                             </div>
                           </td>
                          <td className="px-5 py-4 font-mono text-xs truncate max-w-[250px]">{q.text}</td>
                          <td className="px-5 py-4 font-bold text-[10px] text-primary">
                             {q.image_url ? 'Main + ' : ''}
                             {Array.isArray(q.options) && q.options.some(o => typeof o === 'object' && o.image_url) ? 'Opt Images' : '-'}
                          </td>
                          <td className="px-5 py-4"><span className="px-2 py-1 bg-surface-container-high rounded text-[10px] uppercase font-black border border-outline-variant/30 text-on-surface-variant">{q.type}</span></td>
                        </tr>
                      ))
                   ) : (
                     <tr>
                        <td colSpan="4" className="px-5 py-12 text-center text-on-surface-variant">No questions found. Use "Add New" or bulk import.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 h-fit shadow-sm">
            <h3 className="text-2xl font-black text-on-surface mb-3 font-headline flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-3xl">cloud_upload</span> Bulk Import</h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Paste your questions JSON here to bulk-upload to Database.</p>
            <textarea 
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface text-[10px] font-mono mb-4 min-h-[200px]"
              placeholder='[{"subject": "Physics", ...}]'
              onChange={async (e) => {
                try {
                  const data = JSON.parse(e.target.value);
                  if (Array.isArray(data)) {
                    API.post('/api/admin/questions', data)
                      .then(() => {
                        alert("Bulk upload success!");
                        fetchQuestions();
                      })
                      .catch(err => {
                        const msg = err.response?.data?.error || err.message || "Failed to bulk upload";
                        alert("Error: " + msg);
                      });
                  }
                } catch (err) { /* silent on typing */ }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
