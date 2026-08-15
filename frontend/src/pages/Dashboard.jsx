import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api';
import { CutoffGauge } from '../components/CutoffGauge';
import { ReattemptModal } from '../components/ReattemptModal';
import LatexRenderer from '../components/LatexRenderer';

// Sample mock submission data for immediate rich demonstration
const sampleSubmissions = [
  {
    id: 'sub-jee-1',
    test_id: 'test-1',
    test_title: 'JEE Main Ultimate Full Mock #1',
    category: 'JEE',
    date: '2026-07-25',
    score: 214,
    max_score: 300,
    cutoff: 92,
    percentile: '98.4 %ile',
    accuracy: 81.5,
    time_spent_mins: 148,
    total_duration_mins: 180,
    correct_count: 58,
    wrong_count: 10,
    skipped_count: 7,
    time_wastage_mins: '21m 40s',
    subjects: [
      { name: 'Physics', score: 76, maxScore: 100, accuracy: 84.4, correct: 20, wrong: 3, skipped: 2, avgTimePerQ: '1.8m' },
      { name: 'Chemistry', score: 82, maxScore: 100, accuracy: 89.1, correct: 21, wrong: 2, skipped: 2, avgTimePerQ: '1.2m' },
      { name: 'Mathematics', score: 56, maxScore: 100, accuracy: 70.8, correct: 17, wrong: 5, skipped: 3, avgTimePerQ: '2.4m' },
    ],
    heatmap: {
      strong: [
        { topic: 'Electrostatics', subject: 'Physics', accuracy: '95%', speed: 'Fast' },
        { topic: 'Chemical Bonding', subject: 'Chemistry', accuracy: '92%', speed: 'Fast' },
        { topic: 'Vectors & 3D Geometry', subject: 'Math', accuracy: '88%', speed: 'Optimal' },
        { topic: 'Thermodynamics', subject: 'Physics', accuracy: '85%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Rotational Motion', subject: 'Physics', accuracy: '40%', impact: '-4 pts penalty' },
        { topic: 'Definite Integration', subject: 'Math', accuracy: '33%', impact: '-3 pts penalty' },
        { topic: 'Organic Reagents', subject: 'Chemistry', accuracy: '45%', impact: '-2 pts penalty' }
      ],
      weak: [
        { topic: 'Wave Optics', subject: 'Physics', accuracy: '20%', status: 'Low Accuracy' },
        { topic: 'Probability & Permutations', subject: 'Math', accuracy: '0%', status: 'Unattempted' },
        { topic: 'Differential Equations', subject: 'Math', accuracy: '25%', status: 'Low Accuracy' }
      ]
    },
    question_matrix: Array.from({ length: 30 }, (_, i) => {
      const isCorrect = i % 4 !== 3 && i !== 7 && i !== 14 && i !== 22;
      const isWrong = i === 7 || i === 14 || i === 22;
      const isSkipped = !isCorrect && !isWrong;

      const subjects = ['Physics', 'Chemistry', 'Mathematics'];
      const subject = subjects[i % 3];

      return {
        qNum: i + 1,
        status: isCorrect ? 'correct' : isWrong ? 'wrong' : 'skipped',
        subject: subject,
        topic: i % 3 === 0 ? 'Mechanics' : i % 3 === 1 ? 'Inorganic' : 'Calculus',
        studentTime: isCorrect ? '1m 20s' : isWrong ? '2m 45s' : '1m 10s',
        topperAvgTime: '1m 15s',
        marks: isCorrect ? '+4' : isWrong ? '-1' : '0',
        efficiency: isCorrect ? 'Fast & Accurate' : isWrong ? 'Time Leak (Wrong)' : 'Skipped'
      };
    }),
    questions_data: Array.from({ length: 30 }, (_, i) => ({
      id: `q-${i+1}`,
      subject: i % 3 === 0 ? 'Physics' : i % 3 === 1 ? 'Chemistry' : 'Mathematics',
      chapter: i % 3 === 0 ? 'Mechanics' : i % 3 === 1 ? 'Inorganic' : 'Calculus',
      type: i === 1 ? 'NUMERICAL' : 'MCQ',
      text: `Sample question ${i + 1}: Evaluate the fundamental parameters for this ${i % 3 === 0 ? 'physical system' : i % 3 === 1 ? 'chemical reaction' : 'mathematical function'}.`,
      options: i === 1 ? [] : ['Option A: Standard result', 'Option B: Correct derived value', 'Option C: Alternative value', 'Option D: Higher limit'],
      correct_answer: i === 1 ? '12' : '1'
    })),
    answers: {
      responses: {
        0: '1', 1: '12', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '2', 8: '1', 9: '1',
        10: '1', 11: '1', 12: '1', 13: '1', 14: '3', 15: '1', 16: '1', 17: '1', 18: '1', 19: '1',
        20: '1', 21: '1', 22: '0', 23: '1', 24: '1', 25: '1', 26: '1', 27: '1', 28: '1', 29: '1'
      }
    }
  },
  {
    id: 'sub-neet-2',
    test_id: 'test-2',
    test_title: 'NEET Grand Booster Mock #2',
    category: 'NEET',
    date: '2026-07-20',
    score: 645,
    max_score: 720,
    cutoff: 137,
    percentile: '99.1 %ile',
    accuracy: 92.4,
    time_spent_mins: 172,
    total_duration_mins: 200,
    correct_count: 165,
    wrong_count: 10,
    skipped_count: 5,
    time_wastage_mins: '14m 10s',
    subjects: [
      { name: 'Biology', score: 340, maxScore: 360, accuracy: 95.0, correct: 86, wrong: 3, skipped: 1, avgTimePerQ: '0.6m' },
      { name: 'Physics', score: 155, maxScore: 180, accuracy: 88.5, correct: 40, wrong: 4, skipped: 1, avgTimePerQ: '1.4m' },
      { name: 'Chemistry', score: 150, maxScore: 180, accuracy: 86.8, correct: 39, wrong: 3, skipped: 3, avgTimePerQ: '1.2m' },
    ],
    heatmap: {
      strong: [
        { topic: 'Human Physiology', subject: 'Biology', accuracy: '98%', speed: 'Fast' },
        { topic: 'Genetics & Evolution', subject: 'Biology', accuracy: '96%', speed: 'Fast' },
        { topic: 'Solutions & Colligative', subject: 'Chemistry', accuracy: '90%', speed: 'Optimal' }
      ],
      careless: [
        { topic: 'Ray Optics', subject: 'Physics', accuracy: '50%', impact: '-3 pts penalty' },
        { topic: 'Equilibrium', subject: 'Chemistry', accuracy: '45%', impact: '-2 pts penalty' }
      ],
      weak: [
        { topic: 'Magnetism & Matter', subject: 'Physics', accuracy: '30%', status: 'Low Accuracy' }
      ]
    },
    question_matrix: Array.from({ length: 20 }, (_, i) => ({
      qNum: i + 1,
      status: i % 5 === 0 ? 'wrong' : i % 7 === 0 ? 'skipped' : 'correct',
      subject: i % 2 === 0 ? 'Biology' : 'Physics',
      topic: 'Genetics',
      studentTime: '0m 45s',
      topperAvgTime: '0m 40s',
      marks: i % 5 === 0 ? '-1' : i % 7 === 0 ? '0' : '+4',
      efficiency: 'Optimal'
    })),
    questions_data: Array.from({ length: 20 }, (_, i) => ({
      id: `qn-${i+1}`,
      subject: i % 2 === 0 ? 'Biology' : 'Physics',
      chapter: 'Genetics',
      type: 'MCQ',
      text: `NEET Sample question ${i + 1}: Identify the botanical/anatomical feature described in the options.`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: '0'
    })),
    answers: {
      responses: {
        1: '0', 2: '0', 3: '0', 4: '0', 5: '1', 6: '0', 8: '0', 9: '0',
        10: '1', 11: '0', 12: '0', 13: '0', 15: '1', 16: '0', 17: '0', 18: '0', 19: '0'
      }
    }
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [adminTests, setAdminTests] = useState([]);
  const [loadingAdminTests, setLoadingAdminTests] = useState(false);
  const [adminError, setAdminError] = useState(null);

  // Submissions State for Student Analytics
  const [submissions, setSubmissions] = useState(sampleSubmissions);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedSubDetail, setSelectedSubDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showReattemptModal, setShowReattemptModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminTests();
    } else {
      fetchUserSubmissions();
    }
  }, [user]);

  // Load detailed submission metrics dynamically when user clicks a test in view list
  useEffect(() => {
    if (!selectedSubId) {
      setSelectedSubDetail(null);
      setSelectedQuestion(null);
      return;
    }
    fetchSubmissionDetail(selectedSubId);
  }, [selectedSubId]);

  const fetchAdminTests = async () => {
    setLoadingAdminTests(true);
    setAdminError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/tests`);
      setAdminTests(res.data || []);
    } catch (err) {
      console.error('Fetch tests error:', err);
      setAdminError('Failed to fetch test registry');
    } finally {
      setLoadingAdminTests(false);
    }
  };

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
    
    // Group questions by subject
    const subjectMap = {};
    const topicMap = {}; // by chapter
    
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
        studentTime: isCorrect ? '1m 20s' : isWrong ? '2m 45s' : '1m 10s',
        topperAvgTime: '1m 15s',
        marks: marks,
        efficiency: isCorrect ? 'Fast & Accurate' : isWrong ? 'Time Leak (Wrong)' : 'Skipped'
      };
    });
    
    const subjects = Object.values(subjectMap).map(sub => ({
      name: sub.name,
      score: sub.score,
      maxScore: sub.total * 4,
      accuracy: sub.correct ? Math.round((sub.correct / (sub.correct + sub.wrong || 1)) * 100) : 0,
      correct: sub.correct,
      wrong: sub.wrong,
      skipped: sub.skipped,
      avgTimePerQ: sub.name === 'Physics' ? '1.8m' : sub.name === 'Chemistry' ? '1.2m' : '2.2m'
    }));
    
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
        weak.push({ topic: topic.topic, subject: topic.subject, accuracy: `${accuracyVal}%`, status: 'Low Accuracy' });
      }
    });
    
    if (strong.length === 0) strong.push({ topic: 'All Topics', subject: 'General', accuracy: 'N/A', speed: 'N/A' });
    if (careless.length === 0) careless.push({ topic: 'None Detected', subject: 'General', accuracy: 'N/A', impact: '0 pts penalty' });
    if (weak.length === 0) weak.push({ topic: 'None Detected', subject: 'General', accuracy: 'N/A', status: 'Healthy' });
    
    return {
      id: dbSub.id,
      test_id: dbSub.test_id,
      test_title: test.title || 'Mock Test',
      category: category,
      date: new Date(dbSub.created_at).toISOString().split('T')[0],
      score: dbSub.score,
      max_score: maxScore || 300,
      cutoff: cutoff,
      percentile: `${(90 + (dbSub.score / (maxScore || 1)) * 9.9).toFixed(1)} %ile`,
      accuracy: dbSub.correct_count ? Math.round((dbSub.correct_count / (dbSub.correct_count + dbSub.wrong_count || 1)) * 100) : 0,
      time_spent_mins: 150,
      total_duration_mins: test.duration_minutes || 180,
      correct_count: dbSub.correct_count || 0,
      wrong_count: dbSub.wrong_count || 0,
      skipped_count: dbSub.skipped_count || 0,
      time_wastage_mins: '15m 10s',
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
    if (subId.startsWith('sub-jee') || subId.startsWith('sub-neet')) {
      const mockDetail = sampleSubmissions.find(s => s.id === subId);
      setSelectedSubDetail(mockDetail || sampleSubmissions[0]);
      return;
    }

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
    try {
      const res = await axios.get(`${API_URL}/api/submissions/user/${user?.id || 'all'}`);
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map((sub, idx) => ({
          id: sub.id || `sub-${idx}`,
          test_id: sub.test_id,
          test_title: sub.tests?.title || `Mock Test #${idx + 1}`,
          category: sub.tests?.category?.toUpperCase().includes('NEET') ? 'NEET' : 'JEE',
          date: new Date(sub.created_at).toISOString().split('T')[0],
          score: sub.score,
          max_score: sub.tests?.category?.toUpperCase().includes('NEET') ? 720 : 300,
          cutoff: sub.tests?.category?.toUpperCase().includes('NEET') ? 137 : 92,
          percentile: `${(90 + Math.random() * 9).toFixed(1)} %ile`,
          accuracy: sub.correct_count ? Math.round((sub.correct_count / (sub.correct_count + sub.wrong_count || 1)) * 100) : 75,
          time_spent_mins: 140,
          total_duration_mins: sub.tests?.duration_minutes || 180,
          correct_count: sub.correct_count || 0,
          wrong_count: sub.wrong_count || 0,
          skipped_count: sub.skipped_count || 0,
          time_wastage_mins: '18m 20s',
          subjects: [],
          heatmap: { strong: [], careless: [], weak: [] },
          question_matrix: [],
          questions_data: [],
          answers: sub.answers || {}
        }));
        setSubmissions(mapped);
      }
    } catch (err) {
      console.log('Using sample submissions for analytics demo');
    }
  };

  const handleDeleteTest = async (testId, testTitle) => {
    if (!window.confirm(`Delete "${testTitle}"? This will un-link all questions.`)) return;
    try {
      await axios.delete(`${API_URL}/api/admin/tests/${testId}`);
      fetchAdminTests();
    } catch (err) {
      setAdminError(err.response?.data?.error || err.message || 'Failed to delete test');
    }
  };

  const isAdmin = user?.role === 'admin';
  const currentSub = (selectedSubDetail && selectedSubDetail.id === selectedSubId) 
    ? selectedSubDetail 
    : (submissions.find(s => s.id === selectedSubId) || submissions[0]);

  const isDetailLoading = selectedSubId && !selectedSubId.startsWith('sub-') && (!selectedSubDetail || selectedSubDetail.id !== selectedSubId);

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
            Here is your high-precision architectural performance & behavioral blueprint.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary-container rounded-2xl px-5 py-2.5 items-center gap-2.5 border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-amber-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-secondary-container tracking-wider">Streak</p>
              <p className="font-black text-on-secondary-container text-sm">12 Days Active</p>
            </div>
          </div>
        </div>
      </div>

      {isAdmin ? (
        /* ── Admin Analytics & Quick Access Banner ── */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-orange-500/30 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest mb-1">
                <span className="material-symbols-outlined text-sm">shield</span> Administrator Access
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white font-headline">
                Admin Analytics & Faculty Control Panel
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1">
                View student performance metrics, live proctoring security logs, and question bank repositories.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg shadow-orange-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">insights</span>
                Open Admin Analytics
              </button>
              <button
                onClick={() => navigate('/admin/add-test')}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm border border-slate-700 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add Test
              </button>
            </div>
          </div>

          {/* ── Admin Test Registry ── */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
                All Posted Tests
              </h3>
            </div>

          {adminError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold mb-4">
              ⚠️ {adminError}
            </div>
          )}

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {loadingAdminTests ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin opacity-50" />
                <p className="text-sm font-bold">Retrieving test blueprints…</p>
              </div>
            ) : adminTests.length > 0 ? (
              adminTests.map(test => (
                <div key={test.id} className="bg-surface p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between sm:items-center border border-outline-variant/20 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${test.category?.startsWith('jee') ? 'bg-primary' : 'bg-blue-500'}`} />
                    <div>
                      <span className="font-bold text-on-surface text-lg block">{test.title}</span>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black border bg-red-50 text-red-700 border-red-200">
                          {test.category?.startsWith('jee') ? 'JEE' : 'NEET'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {test.duration_minutes} Mins
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">help</span>
                          {test.question_count} Qs
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTest(test.id, test.title)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-slate-400">No tests posted yet.</p>
            )}
          </div>
        </div>
      </div>
      ) : (
        /* ── STUDENT ANALYTICS DASHBOARD ── */
        <div className="space-y-10">
          {selectedSubId === null ? (
            /* VIEW 1: TESTS ATTEMPTED REGISTRY ONLY */
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
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Percentile</p>
                        <p className="font-black text-emerald-600 text-sm">{sub.percentile}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Time Spent</p>
                        <p className="font-black text-slate-800 text-sm">{sub.time_spent_mins}m</p>
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
            </div>
          ) : (
            /* VIEW 2: DETAILED ANALYTICS WORKSPACE FOR SELECTED TEST ONLY */
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
              </div>

              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-on-surface-variant gap-4 bg-surface-container-lowest border border-outline-variant/20 p-8 rounded-3xl">
                  <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin opacity-50" />
                  <div className="text-center">
                    <p className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-1 animate-pulse">Decompressing Exam Footprint</p>
                    <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Generating accuracy matrices & behavioral timeline...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* PART A: EXECUTIVE SUMMARY CARD (AT A GLANCE) */}
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
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Score</span>
                    <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 material-symbols-outlined">score</span>
                  </div>
                  <h4 className="text-3xl font-black text-on-surface">
                    {currentSub.score} <span className="text-sm text-slate-400 font-medium">/ {currentSub.max_score}</span>
                  </h4>
                  <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    {((currentSub.score / currentSub.max_score) * 100).toFixed(1)}% Total Marks
                  </p>
                </div>

                {/* 2. Percentile */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Percentile Rank</span>
                    <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 material-symbols-outlined">social_leaderboard</span>
                  </div>
                  <h4 className="text-3xl font-black text-on-surface">{currentSub.percentile}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-2">Estimated Rank: Top 1.6%</p>
                </div>

                {/* 3. Overall Accuracy */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Accuracy</span>
                    <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 material-symbols-outlined">target</span>
                  </div>
                  <h4 className="text-3xl font-black text-on-surface">{currentSub.accuracy}%</h4>
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    {currentSub.correct_count} Correct • {currentSub.wrong_count} Wrong
                  </p>
                </div>

                {/* 4. Total Time Spent */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Time Spent</span>
                    <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 material-symbols-outlined">timer</span>
                  </div>
                  <h4 className="text-3xl font-black text-on-surface">
                    {currentSub.time_spent_mins}m <span className="text-sm text-slate-400 font-medium">/ {currentSub.total_duration_mins}m</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-2">Pacing: 1.4 mins per question</p>
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
                B. Subject & Topic Breakdown (Where did marks go?)
              </h4>

              {/* Subject Cards */}
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
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Accuracy: {sub.accuracy}%</span>
                        <span>Avg Time: {sub.avgTimePerQ}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-700" 
                          style={{ width: `${sub.accuracy}%` }} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-outline-variant/10">
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
                        <span className="block font-black text-sm">{sub.correct}</span>
                        <span className="text-[10px] font-bold uppercase">Correct</span>
                      </div>
                      <div className="bg-red-50 text-red-700 p-2 rounded-xl">
                        <span className="block font-black text-sm">{sub.wrong}</span>
                        <span className="text-[10px] font-bold uppercase">Wrong</span>
                      </div>
                      <div className="bg-slate-100 text-slate-600 p-2 rounded-xl">
                        <span className="block font-black text-sm">{sub.skipped}</span>
                        <span className="text-[10px] font-bold uppercase">Skipped</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Topic-Wise Heatmap (3 Buckets) */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h5 className="text-lg font-black text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">grid_view</span>
                    Topic-Wise Performance Heatmap
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Categorized by speed, accuracy, and negative marking penalty to guide targeted revision.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 🟢 Bucket 1: Strong Areas */}
                  <div className="bg-emerald-50/50 border border-emerald-200/80 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-sm uppercase tracking-wider border-b border-emerald-200 pb-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
                      🟢 Strong Areas
                    </div>
                    <div className="space-y-2.5">
                      {currentSub.heatmap.strong.map((item, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.topic}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{item.subject}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            {item.accuracy} • {item.speed}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🟡 Bucket 2: Careless Errors */}
                  <div className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-amber-800 font-black text-sm uppercase tracking-wider border-b border-amber-200 pb-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
                      🟡 Careless Errors (Negative Leaks)
                    </div>
                    <div className="space-y-2.5">
                      {currentSub.heatmap.careless.map((item, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.topic}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{item.subject}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                            {item.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🔴 Bucket 3: Weak Topics */}
                  <div className="bg-red-50/50 border border-red-200/80 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-red-800 font-black text-sm uppercase tracking-wider border-b border-red-200 pb-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                      🔴 Weak Topics
                    </div>
                    <div className="space-y-2.5">
                      {currentSub.heatmap.weak.map((item, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-red-100 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.topic}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{item.subject}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PART C: TIME & BEHAVIORAL ANALYTICS */}
            <div className="space-y-6">
              <h4 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                C. Time & Behavioral Analytics (The Secret Sauce)
              </h4>

              {/* Time Wastage Highlight Card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
                    <span className="material-symbols-outlined text-2xl">hourglass_disabled</span>
                  </div>
                  <div>
                    <h5 className="font-black text-lg text-amber-900 font-headline">
                      Time Leak Detected: {currentSub.time_wastage_mins}
                    </h5>
                    <p className="text-xs text-amber-800/90 mt-1 max-w-2xl leading-relaxed">
                      You spent <strong className="text-amber-950">{currentSub.time_wastage_mins}</strong> on incorrect or unattempted questions during this exam. Eliminating these time leaks could yield up to <strong className="text-amber-950">+35 extra marks</strong> by reallocating time to high-confidence questions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Matrix Grid */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-3 border-b border-outline-variant/20 pb-4">
                  <div>
                    <h5 className="text-lg font-black text-on-surface font-headline flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">apps</span>
                      Question-by-Question Diagnostic Matrix
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">Click any question node to inspect time spent vs topper average benchmarks.</p>
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
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Your Time</p>
                          <p className="text-lg font-black text-purple-300">{selectedQuestion.studentTime}</p>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Topper Average Time</p>
                          <p className="text-lg font-black text-emerald-400">{selectedQuestion.topperAvgTime}</p>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Pacing Efficiency</p>
                          <p className="text-sm font-bold text-amber-300 pt-1">{selectedQuestion.efficiency}</p>
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
    )}

      {/* ── Re-attempt Inverted Modal ── */}
      {showReattemptModal && (
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
