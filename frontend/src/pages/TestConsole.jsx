import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, ArrowLeft, AlertTriangle, ShieldAlert, Image as ImageIcon, Home as HomeIcon } from 'lucide-react';
import { Button } from '../components/Button';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import LatexRenderer from '../components/LatexRenderer';

// Helper to safely access sessionStorage in strict/lockdown environments
const getSafeSessionStorage = () => {
  try {
    const s = window.sessionStorage;
    s.setItem('__test__', '1');
    s.removeItem('__test__');
    return s;
  } catch (e) {
    const store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; }
    };
  }
};
const safeSessionStorage = getSafeSessionStorage();

const fallbackQuestions = [
  { id: 1, subject: "Physics", type: "MCQ", text: "A particle is moving in a circle of radius R with a constant speed v. What is the magnitude of average velocity after it has moved by an angle θ?", options: ["2v sin(θ/2) / θ", "v sin(θ)", "v cos(θ)", "v sin(θ/2)"], correct_answer: "0" },
  { id: 2, subject: "Physics", type: "NUMERICAL", text: "A car accelerates from rest at a constant rate 'a' for some time, after which it decelerates at a constant rate 'b' to come to rest. If total time elapsed is t, what is the maximum velocity acquired by car in terms of a, b, and t? (Enter 12 for demo)", correct_answer: "12" },
  { id: 3, subject: "Chemistry", type: "MCQ", text: "Which of the following has the highest dipole moment?", options: ["CH3Cl", "CH2Cl2", "CHCl3", "CCl4"], correct_answer: "0" },
  { id: 4, subject: "Mathematics", type: "MCQ", text: "The value of ∫ e^x (f(x) + f'(x)) dx is:", options: ["e^x f(x) + C", "e^x f'(x) + C", "e^x/f(x) + C", "None of these"], correct_answer: "0" }
];

export default function TestConsole() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mockQuestions, setMockQuestions] = useState([]);
  const [dbTestId, setDbTestId] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState(null);
  const [isLoadingTest, setIsLoadingTest] = useState(true);
  const [countdown, setCountdown] = useState(null); // seconds remaining until schedule

  const [isStarted, setIsStarted] = useState(false);
  const [isFullscreenError, setIsFullscreenError] = useState(false);
  const [violationWarning, setViolationWarning] = useState(null);
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationsList, setViolationsList] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(null);

  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);

  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamPermissionGranted, setWebcamPermissionGranted] = useState(true);
  const [webcamError, setWebcamError] = useState(null);
  const [webcamLoading, setWebcamLoading] = useState(false);

  const [faceDetected, setFaceDetected] = useState(true);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [lookAwayCountdown, setLookAwayCountdown] = useState(60);
  const videoRef = useRef(null);
  const trackerTaskRef = useRef(null);

  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10800); 
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState([]); 	

  const stopWebcam = () => {};

  useEffect(() => {
    // Fetch test questions
    axios.get(`${API_URL}/api/tests/${id}`)
      .then(res => {
        setMockQuestions(res.data.questions);
        setDbTestId(res.data.testId);
        setTestTitle(res.data.title || '');
        if (res.data.scheduled_at) {
          setScheduledAt(new Date(res.data.scheduled_at));
        }
        setStatus(res.data.questions.map((_, i) => i === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED'));
        setIsLoadingTest(false);
      })
      .catch(err => {
        console.warn("Failed to fetch live API payload. Activating fallback demo exam payload.", err);
        setMockQuestions(fallbackQuestions);
        setDbTestId("mock-demo-uuid-1234");
        setStatus(fallbackQuestions.map((_, i) => i === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED'));
        setIsLoadingTest(false);
      });
  }, [id]);

  // Live countdown to scheduled exam time
  useEffect(() => {
    if (!scheduledAt) return;
    const tick = () => {
      const diff = Math.ceil((scheduledAt.getTime() - Date.now()) / 1000);
      setCountdown(diff > 0 ? diff : 0);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [scheduledAt]);

  // Format seconds into HH:MM:SS
  const formatCountdown = (secs) => {
    if (secs === null || secs === undefined) return '';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    return `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  };

  const isLocked = scheduledAt && countdown !== null && countdown > 0;

  useEffect(() => {
    if (!isStarted || isSubmitted || violationWarning) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isSubmitted, violationWarning]);

  // Window Focus and Fullscreen Event Listeners
  useEffect(() => {
    if (!isStarted || isSubmitted) return;
    
    const handleFullscreenChange = () => { 
      if (!document.fullscreenElement && !violationWarning) {
        handleViolation("Fullscreen mode was exited. Fullscreen is mandatory during the exam."); 
      } 
    };
    const handleVisibilityChange = () => { 
      if (document.hidden && !violationWarning) {
        handleViolation("Tab switch detected. You are not allowed to navigate away from the exam page."); 
      } 
    };
    const handleBlur = () => { 
      if (!violationWarning) {
        handleViolation("Window focus lost. You are restricted from switching to other applications."); 
      } 
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isStarted, isSubmitted, violationWarning, violationsCount, violationsList]);

  // 60-Second Resume Countdown Timer
  useEffect(() => {
    if (!violationWarning || resumeCountdown === null || isSubmitted) return;

    if (resumeCountdown <= 0) {
      const reason = "Failed to resume the exam within the 60-second limit.";
      handleSubmit(reason);
      return;
    }

    const timer = setInterval(() => {
      setResumeCountdown(prev => {
        if (prev === null) {
          clearInterval(timer);
          return null;
        }
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [violationWarning, resumeCountdown, isSubmitted]);

  // 1. Right Click Block (disables functionality silently across the entire TestConsole page)
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Keyboard and Input Blockers + Mouse Exit Detector
  useEffect(() => {
    if (!isStarted || isSubmitted) return;

    // 2. Copy/Paste/Cut Blocks
    const handleCopy = (e) => {
      e.preventDefault();
      alert("Copying text is disabled during the exam.");
    };
    const handleCut = (e) => {
      e.preventDefault();
    };
    const handlePaste = (e) => {
      e.preventDefault();
      alert("Pasting text is disabled during the exam.");
    };

    // 3. System & Developer Shortcuts Block
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        alert("Developer tools are disabled during the exam.");
        return;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
        e.preventDefault();
        alert("Developer tools are disabled during the exam.");
        return;
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        alert("View source is disabled during the exam.");
        return;
      }
      if ((e.ctrlKey && (e.key === 'R' || e.key === 'r')) || e.key === 'F5') {
        e.preventDefault();
        alert("Page reloading is disabled during the exam.");
        return;
      }
      if (e.ctrlKey && (e.key === 'C' || e.key === 'c' || e.key === 'V' || e.key === 'v' || e.key === 'X' || e.key === 'x')) {
        e.preventDefault();
        return;
      }
      if (e.altKey || e.metaKey) {
        e.preventDefault();
        return;
      }
    };

    // 4. Cursor Leave Detection
    const handleMouseLeave = () => {
      if (!violationWarning) {
        handleViolation("Cursor left the secure exam browser window.");
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isStarted, isSubmitted, violationWarning, violationsCount, violationsList]);

  const handleViolation = (reason) => {
    const timestamp = new Date().toISOString();
    const currentCount = violationsCount + 1;
    setViolationsCount(currentCount);

    const updatedViolations = [...violationsList, { reason, timestamp, severity: "HIGH" }];
    setViolationsList(updatedViolations);

    if (currentCount >= 3) {
      setViolationWarning({ reason: `${reason} (Proctoring strike limit reached. Auto-submitting...)`, count: currentCount });
      handleSubmit(reason, updatedViolations, currentCount);
    } else {
      setViolationWarning({ reason, count: currentCount });
      setResumeCountdown(60);
    }
  };

  const enforceFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request blocked by browser:", err.message);
    }
  };

  const gracefullyExit = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
  };

  const handleSubmit = (forcedViolationReason = null, currentViolations = violationsList, currentCount = violationsCount) => {
    let violationReason = null;
    if (forcedViolationReason && typeof forcedViolationReason === 'string') {
      violationReason = forcedViolationReason;
    }

    let score = 0, correct = 0, wrong = 0, unattempted = 0;
    mockQuestions.forEach((q, i) => {
       if (answers[i] !== undefined) {
         if (String(answers[i]) === String(q.correct_answer)) { score += 4; correct++; }
         else { score -= 1; wrong++; }
       } else unattempted++;
    });

    const finalViolations = [...currentViolations];
    if (violationReason && !finalViolations.some(v => v.reason === violationReason)) {
      finalViolations.push({
        reason: violationReason,
        timestamp: new Date().toISOString(),
        severity: "CRITICAL"
      });
    }

    const payload = {
      testId: dbTestId || id,
      userId: user?.id || null,
      email: user?.email || 'student@ikshatests.com',
      score: score,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: unattempted,
      answers: answers,
      proctoring: {
        seb_verified: false,
        seb_bypassed: false,
        video_proctored: false,
        violations_count: currentCount,
        violations: finalViolations
      }
    };

    axios.post(`${API_URL}/api/submissions`, payload)
      .then(res => {
        console.log("Submission successful:", res.data);
      })
      .catch(err => {
        console.error("Submission error:", err);
      });

    stopWebcam();
    setIsSubmitted(true);
    gracefullyExit();
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateStatus = (index, newStatus) => {
    setStatus(prev => {
      const newArr = [...prev];
      newArr[index] = newStatus;
      return newArr;
    });
  };

  const handleSaveAndNext = () => {
    if (answers[currentQ] !== undefined) updateStatus(currentQ, 'ANSWERED');
    else updateStatus(currentQ, 'NOT_ANSWERED');
    goNext();
  };

  const handleClear = () => {
    const newAnswers = {...answers};
    delete newAnswers[currentQ];
    setAnswers(newAnswers);
    updateStatus(currentQ, 'NOT_ANSWERED');
  };

  const handleMarkReview = () => {
    if (answers[currentQ] !== undefined) updateStatus(currentQ, 'ANSWERED_MARKED');
    else updateStatus(currentQ, 'MARKED');
    goNext();
  };

  const goNext = () => {
    if (currentQ < mockQuestions.length - 1) {
      const nextQ = currentQ + 1;
      if (status[nextQ] === 'NOT_VISITED') updateStatus(nextQ, 'NOT_ANSWERED');
      setCurrentQ(nextQ);
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      const prevQ = currentQ - 1;
      if (status[prevQ] === 'NOT_VISITED') updateStatus(prevQ, 'NOT_ANSWERED');
      setCurrentQ(prevQ);
    }
  };

  const jumpToQ = (index) => {
    if (status[index] === 'NOT_VISITED') updateStatus(index, 'NOT_ANSWERED');
    setCurrentQ(index);
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'ANSWERED': return 'bg-[#22c55e] border-[#16a34a] text-white rounded-t-lg rounded-b shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)]';
      case 'NOT_ANSWERED': return 'bg-[#ef4444] border-[#dc2626] text-white rounded-t-lg rounded-b shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)]';
      case 'NOT_VISITED': return 'bg-[#e2e8f0] border-[#cbd5e1] text-[#475569] rounded-sm';
      case 'MARKED': return 'bg-[#9333ea] border-[#7e22ce] text-white rounded-full';
      case 'ANSWERED_MARKED': return 'bg-[#9333ea] border-[#7e22ce] text-white rounded-full relative';
      default: return 'bg-[#e2e8f0] text-[#475569]';
    }
  };

  if (isLoadingTest) return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a] text-white uppercase tracking-widest font-black animate-pulse">Decrypting Payload...</div>;

  if (!isStarted) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0f1d] text-white p-6 overflow-y-auto">
        <div className="absolute top-6 left-6 flex items-center gap-3 z-[101]">
          <button 
            onClick={() => { stopWebcam(); navigate(-1); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700/50 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <button 
            onClick={() => { stopWebcam(); navigate('/'); }} 
            className="flex items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700/50 transition-all cursor-pointer"
            title="Back to Home"
          >
            <HomeIcon size={16} />
          </button>
        </div>

        <div className="max-w-2xl w-full bg-[#131b2e]/90 border border-slate-700/50 p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <h2 className="text-2xl font-black mb-1 uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Exam Security Check
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-semibold">
              Exambot Pro secure proctoring is enabled for this assessment. Please review guidelines below:
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-400 text-sm mt-0.5 font-bold">fullscreen</span>
                <div>
                  <p className="font-bold text-slate-200">Mandatory Fullscreen</p>
                  <p className="text-slate-400 text-[10px]">The exam will automatically request fullscreen. Exiting fullscreen results in a strike.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-400 text-sm mt-0.5 font-bold">visibility_off</span>
                <div>
                  <p className="font-bold text-slate-200">Focus Lock Enforcement</p>
                  <p className="text-slate-400 text-[10px]">Switching windows, tab swapping, or Alt+Tab logs focus loss warnings immediately.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-400 text-sm mt-0.5 font-bold">gavel</span>
                <div>
                  <p className="font-bold text-slate-200">3 Strike Rule</p>
                  <p className="text-slate-400 text-[10px] text-red-400 font-bold">Triggering 3 security violations will immediately auto-submit your exam.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {isLocked && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <span className="material-symbols-outlined text-amber-400 text-xl">lock_clock</span>
                <div>
                  <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Exam Scheduled</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Opens on{' '}
                    <span className="text-amber-200 font-bold">
                      {scheduledAt?.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </p>
                </div>
              </div>
            )}
            <button
              disabled={isLocked}
              onClick={async () => {
                if (isLocked) return;
                await enforceFullscreen();
                setIsStarted(true);
              }}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLocked
                  ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/40'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-indigo-500/20 cursor-pointer'
              }`}
            >
              {isLocked ? (
                <>
                  <span className="material-symbols-outlined text-lg">lock</span>
                  Starts in {formatCountdown(countdown)}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  Start Exam
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    let score = 0, correct = 0, wrong = 0, unattempted = 0;
    mockQuestions.forEach((q, i) => {
       if (answers[i] !== undefined) {
         if (String(answers[i]) === String(q.correct_answer)) { score += 4; correct++; }
         else { score -= 1; wrong++; }
       } else unattempted++;
    });

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white text-center p-6">
        <h2 className="text-4xl font-black mb-4">Exam Completed</h2>
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-[#334155] mb-8 w-full max-w-lg">
           <h3 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] mb-8">{score}</h3>
           <div className="grid grid-cols-3 gap-4 border-t border-[#334155] pt-6 uppercase tracking-widest text-[10px] font-black">
             <div><p className="text-[#22c55e] text-2xl font-bold">{correct}</p>Correct</div>
             <div><p className="text-[#ef4444] text-2xl font-bold">{wrong}</p>Wrong</div>
             <div><p className="text-[#cbd5e1] text-2xl font-bold">{unattempted}</p>Skipped</div>
           </div>
        </div>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const q = mockQuestions[currentQ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col text-[#334155] bg-white font-sans text-base select-none">
      
      {/* 1. Strike Warning Lock Overlay */}
      {violationWarning && !isSubmitted && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center text-center p-6 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#131b2e] border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight text-red-500">Security Violation</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              {violationWarning.reason}
            </p>
            
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
              <p className="text-[10px] uppercase tracking-widest font-black text-red-400">Proctoring Strikes</p>
              <p className="text-3xl font-black text-red-500 mt-1">{violationWarning.count} / 3</p>
              <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">
                {violationWarning.count < 2 
                  ? "WARNING: Triggering 3 violations will auto-submit the exam." 
                  : "WARNING: A third violation will auto-submit the exam."}
              </p>
            </div>

            {resumeCountdown !== null && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8 animate-pulse">
                <p className="text-[10px] uppercase tracking-widest font-black text-amber-400">Action Required</p>
                <p className="text-2xl font-black text-amber-500 mt-1">Resume in {resumeCountdown}s</p>
                <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">
                  Exam will auto-submit if not resumed within the 60-second limit.
                </p>
              </div>
            )}

            {violationWarning.count < 3 && (
              <button 
                onClick={async () => {
                  setViolationWarning(null);
                  setResumeCountdown(null);
                  await enforceFullscreen();
                }} 
                className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Resume Exam (Re-verify Fullscreen)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-[64px] z-50 flex items-center justify-between px-6 bg-[#162839] text-white">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg text-white">JEE Main 2024 - Session 1</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">timer</span>
            <span className="font-bold text-xl tracking-wider text-[#e74c3c]">
              Time Left: {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-3 border-l border-white/20 pl-6">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{user?.full_name || user?.email?.split('@')[0] || 'Candidate Name'}</p>
              <p className="text-xs text-white opacity-80">Roll No: {user?.id?.substring(0, 8).toUpperCase() || 'JEE2024001'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-gray-300">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzg4cWNUoKER9Hjt168x5n31uE7HByk3jykb4mj81KsDk17b034T0VWuhKAePBWDJwGxaDzEcxK4bOUxhIsLshOEewTHlsQ9CPpT9q_Dh9O5RktmbxUd0EErB4qjyleqd0b5p-tcjnWVrG7y6uxP3icpt8VApyi4f3EjzyhLQB31yswNn5UR73HckWUmIuuTu0Hd6wgBxAR04GlUkHtso0J53CnayvFqtaRYZGRErCMfuw--rA_7X-7UTUqACK6NsgfaDOg-9A50Wx" alt="Candidate" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 mt-[64px] mb-12 flex overflow-hidden">
        
        {/* Left main content block */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          
          {/* Subject Bar */}
          <div className="bg-white px-6 py-3 flex items-center justify-end border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="material-symbols-outlined text-sm">language</span>
              <span className="text-xs font-semibold">Language: English</span>
            </div>
          </div>

          {/* Question View Area */}
          <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6 border-b-2 border-[#162839] pb-2">
                <h2 className="text-lg font-bold text-[#162839]">Question No. {currentQ + 1}</h2>
                <span className="px-3 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">+4 / -1</span>
              </div>
              <div className="space-y-6">
                <div className="text-base text-gray-800 leading-relaxed font-semibold"><LatexRenderer text={q.text} /></div>
                {q.image_url && (
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 max-w-md mx-auto">
                    <img src={q.image_url} alt="Question Asset" className="w-full h-auto rounded-lg object-contain" />
                  </div>
                )}
                {q.sub_text && (
                  <div className="text-base text-gray-800 leading-relaxed font-semibold">
                    <LatexRenderer text={q.sub_text} />
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4 mt-8">
                  {q.type === 'MCQ' ? (
                    q.options.map((opt, i) => {
                      const isObject = typeof opt === 'object';
                      const rawText = isObject ? opt.text : opt;
                      const textValue = typeof rawText === 'string'
                        ? rawText.replace(/^(?:\(?[1-4a-dA-D]\)\s*|(?:\(?[1-4a-dA-D]\)?\.\s+))/, '')
                        : rawText;
                      const imageUrl = isObject ? opt.image_url : null;

                      return (
                        <label key={i} className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                          answers[currentQ] === i 
                            ? 'bg-[#006397]/10 border-[#006397] ring-1 ring-[#006397]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-4">
                            <input 
                              type="radio" 
                              className="w-4 h-4 text-[#006397] focus:ring-[#006397] cursor-pointer" 
                              name={`q-${currentQ}`} 
                              checked={answers[currentQ] === i} 
                              onChange={() => setAnswers({...answers, [currentQ]: i})} 
                            />
                            <span className="text-sm font-semibold text-gray-800">({String.fromCharCode(65 + i)}) <LatexRenderer text={textValue} /></span>
                          </div>
                          {imageUrl && (
                            <div className="ml-8 mt-2 border rounded-lg overflow-hidden bg-white w-fit max-w-full">
                              <img src={imageUrl} alt={`Option ${i}`} className="max-h-[150px] object-contain p-1" />
                            </div>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <div className="max-w-md">
                      <p className="text-xs font-bold uppercase text-gray-400 mb-2">Numerical Input</p>
                      <input 
                        type="text" 
                        placeholder="Value..." 
                        className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#006397] focus:outline-none text-xl font-bold text-gray-800 shadow-inner"
                        value={answers[currentQ] || ''}
                        onChange={(e) => setAnswers({...answers, [currentQ]: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Question Action Buttons */}
          <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex gap-3">
              <button onClick={handleMarkReview} className="px-6 py-2 border-2 border-[#8e44ad] text-[#8e44ad] font-bold rounded-lg hover:bg-[#8e44ad]/5 transition-colors cursor-pointer text-sm">
                Mark for Review & Next
              </button>
              <button onClick={handleClear} className="px-6 py-2 text-gray-500 hover:text-red-600 transition-colors font-semibold cursor-pointer text-sm">
                Clear Response
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={goPrev} disabled={currentQ === 0} className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 disabled:opacity-30 cursor-pointer text-sm">
                Previous
              </button>
              <button onClick={goNext} disabled={currentQ === mockQuestions.length - 1} className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 disabled:opacity-30 cursor-pointer text-sm">
                Next
              </button>
              <button onClick={handleSaveAndNext} className="px-8 py-2 bg-[#006397] text-white font-bold rounded-lg hover:bg-[#004e78] shadow-md transition-all active:scale-95 cursor-pointer text-sm">
                Save & Next
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-[300px] bg-[#f5f3f4] border-l border-gray-200 flex flex-col shrink-0 z-40">
          
          {/* Candidate Profile Snippet */}
          <div className="p-4 border-b border-gray-200 bg-[#eeeeee] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-20 bg-white border border-gray-300 rounded flex items-center justify-center overflow-hidden shrink-0">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzg4cWNUoKER9Hjt168x5n31uE7HByk3jykb4mj81KsDk17b034T0VWuhKAePBWDJwGxaDzEcxK4bOUxhIsLshOEewTHlsQ9CPpT9q_Dh9O5RktmbxUd0EErB4qjyleqd0b5p-tcjnWVrG7y6uxP3icpt8VApyi4f3EjzyhLQB31yswNn5UR73HckWUmIuuTu0Hd6wgBxAR04GlUkHtso0J53CnayvFqtaRYZGRErCMfuw--rA_7X-7UTUqACK6NsgfaDOg-9A50Wx" alt="Candidate" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#162839] truncate">{user?.full_name || user?.email?.split('@')[0] || 'Candidate Name'}</p>
                <p className="text-xs text-gray-500">Roll No: {user?.id?.substring(0, 8).toUpperCase() || 'JEE2024001'}</p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email || 'student@ikshatests.com'}</p>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#006397]">Section: {q?.subject || 'Physics'}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${violationsCount > 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600"}`}>
                    {violationsCount} / 3 Strikes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Palette title */}
          <div className="bg-[#162839] text-white px-4 py-2 font-bold text-xs flex items-center justify-between shrink-0">
            Choose a Question
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
          </div>

          {/* Palette container */}
          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-5 gap-3">
              {mockQuestions.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => jumpToQ(idx)} 
                  className={`w-10 h-10 flex items-center justify-center text-[12px] font-bold cursor-pointer palette-node transition-transform hover:scale-110 ${
                    idx === currentQ ? 'border-[#162839] border-2 scale-110 shadow-md z-10' : ''
                  } ${
                    status[idx] === 'ANSWERED' ? 'status-answered' :
                    status[idx] === 'NOT_ANSWERED' ? 'status-not-answered' :
                    status[idx] === 'MARKED' ? 'status-review' :
                    status[idx] === 'ANSWERED_MARKED' ? 'status-review-answered' :
                    'status-not-visited'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Legend and auxiliary buttons */}
          <div className="p-4 bg-[#e9e8e9] border-t border-gray-200 space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-semibold text-gray-700">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 status-answered palette-node flex items-center justify-center text-[8px] font-bold">1</div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 status-not-answered palette-node flex items-center justify-center text-[8px] font-bold">2</div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 status-not-visited palette-node flex items-center justify-center text-[8px] font-bold">3</div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 status-review palette-node flex items-center justify-center text-[8px] font-bold">4</div>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="w-5 h-5 status-review-answered palette-node flex items-center justify-center text-[8px] font-bold">5</div>
                <span className="truncate">Answered & Marked</span>
              </div>
            </div>
            <button 
              onClick={() => setShowQuestionPaper(true)}
              className="w-full py-2 bg-[#006397] text-white font-bold rounded-lg text-xs mt-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#004e78] transition-colors"
            >
              Question Paper
              <span className="material-symbols-outlined text-[16px]">description</span>
            </button>
            <button 
              onClick={() => setShowInstructions(true)}
              className="w-full py-2 border border-gray-300 text-gray-700 font-bold rounded-lg text-xs bg-white cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Instructions
            </button>
          </div>
        </aside>
      </div>

      {/* Footer Submission Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-200 flex items-center justify-end px-6 z-50">
        <button 
          onClick={() => handleSubmit()} 
          className="px-10 py-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold rounded uppercase tracking-wider text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          Submit Exam
        </button>
      </footer>

      {/* 2. Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-700">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-[#162839] text-white rounded-t-3xl">
              <h3 className="text-lg font-bold uppercase tracking-wide">Exam Instructions</h3>
              <button 
                onClick={() => setShowInstructions(false)} 
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-white/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-sm leading-relaxed custom-scrollbar">
              <div>
                <h4 className="font-extrabold text-slate-800 text-base mb-2 uppercase border-l-4 border-indigo-600 pl-2">General Information</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Total duration of the examination is <strong>180 minutes (3 hours)</strong>.</li>
                  <li>The clock will be set on the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
                  <li>When the timer reaches zero, the exam will automatically submit and save your current state.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 text-base mb-2 uppercase border-l-4 border-indigo-600 pl-2">Question Palette Legend</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 flex items-center justify-center text-gray-600 bg-[#e2e8f0] border border-gray-300 rounded shadow-sm font-bold shrink-0">1</div>
                    <div>
                      <p className="font-bold text-slate-800">Not Visited</p>
                      <p className="text-[10px] text-slate-500">You have not visited the question yet.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 flex items-center justify-center text-white bg-[#ef4444] rounded-t-lg rounded-b shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] font-bold shrink-0">2</div>
                    <div>
                      <p className="font-bold text-slate-800">Not Answered</p>
                      <p className="text-[10px] text-slate-500">You have visited but not answered the question.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 flex items-center justify-center text-white bg-[#22c55e] rounded-t-lg rounded-b shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] font-bold shrink-0">3</div>
                    <div>
                      <p className="font-bold text-slate-800">Answered</p>
                      <p className="text-[10px] text-slate-500">You have answered the question.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 flex items-center justify-center text-white bg-[#9333ea] rounded-full shadow-sm font-bold shrink-0">4</div>
                    <div>
                      <p className="font-bold text-slate-800">Marked for Review</p>
                      <p className="text-[10px] text-slate-500">You have marked the question for review without answering.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                    <div className="w-8 h-8 flex shrink-0 items-center justify-center text-white bg-[#9333ea] rounded-full relative shadow-sm font-bold"><div className="absolute bottom-0 right-0 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-white"></div>5</div>
                    <div>
                      <p className="font-bold text-slate-800">Answered & Marked for Review</p>
                      <p className="text-[10px] text-slate-500">The question is answered and marked for review. It will be evaluated.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 text-base mb-2 uppercase border-l-4 border-indigo-600 pl-2">Navigating & Submitting</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Click on a question number in the palette to navigate directly to it.</li>
                  <li>Click <strong>Save & Next</strong> to save the answer and proceed.</li>
                  <li>Click <strong>Clear Response</strong> to clear your answered choice.</li>
                  <li>Click <strong>Mark for Review & Next</strong> to mark it and proceed.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 text-base mb-2 uppercase border-l-4 border-indigo-600 pl-2">Proctoring Rules & Security</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Mandatory Fullscreen</strong>: The exam locks if you leave fullscreen mode.</li>
                  <li><strong>Focus Monitoring</strong>: Switching tabs, minimize actions, or Alt+Tab logs a violation.</li>
                  <li><strong>3 Strikes Limit</strong>: Reaching 3 strikes immediately auto-submits your exam.</li>
                  <li>Keyboard shortcuts (copy, paste, reload, developer tools) and right-clicks are disabled.</li>
                </ul>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowInstructions(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Question Paper Modal */}
      {showQuestionPaper && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-700">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-[#162839] text-white rounded-t-3xl">
              <h3 className="text-lg font-bold uppercase tracking-wide">Question Paper Preview</h3>
              <button 
                onClick={() => setShowQuestionPaper(false)} 
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-white/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-8 divide-y divide-slate-100 custom-scrollbar">
              {mockQuestions.map((question, index) => (
                <div key={question.id || index} className={`pt-6 ${index === 0 ? 'pt-0' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                      {question.subject}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Q.{index + 1} ({question.type})
                    </span>
                  </div>
                  
                  <div className="text-sm font-bold text-slate-800 leading-relaxed mb-4">
                    <LatexRenderer text={question.text} />
                  </div>
                  
                  {question.image_url && (
                    <div className="mb-4 p-2 border border-slate-100 rounded-xl bg-slate-50 w-fit max-w-xs">
                      <img src={question.image_url} alt="Question Asset" className="max-h-[120px] object-contain rounded-lg" />
                    </div>
                  )}

                  {question.type === 'MCQ' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {question.options.map((opt, oIdx) => {
                        const isObject = typeof opt === 'object';
                        const rawText = isObject ? opt.text : opt;
                        const textVal = typeof rawText === 'string'
                          ? rawText.replace(/^(?:\(?[1-4a-dA-D]\)\s*|(?:\(?[1-4a-dA-D]\)?\.\s+))/, '')
                          : rawText;
                        const optImg = isObject ? opt.image_url : null;
                        
                        return (
                          <div key={oIdx} className="flex flex-col p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-indigo-600">({String.fromCharCode(65 + oIdx)})</span>
                              <span className="text-slate-700 font-semibold"><LatexRenderer text={textVal} /></span>
                            </div>
                            {optImg && (
                              <img src={optImg} alt={`Option ${oIdx}`} className="max-h-[80px] object-contain mt-1.5 rounded ml-6 border border-slate-100" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-semibold italic bg-slate-50 px-4 py-2 rounded-lg w-fit border border-slate-100">
                      Numerical Value Question (Enter correct numeric value in active console)
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowQuestionPaper(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Question Paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
