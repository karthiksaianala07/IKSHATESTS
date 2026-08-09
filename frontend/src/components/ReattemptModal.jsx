import React, { useState } from 'react';

export function ReattemptModal({ testTitle, questions = [], originalAnswers = {}, onClose }) {
  // Filter questions that were incorrect or unattempted in original attempt
  const missedQuestions = questions.filter((q, idx) => {
    const studentAns = originalAnswers[idx];
    if (studentAns === undefined || studentAns === null || String(studentAns).trim() === '') {
      return true; // Unattempted
    }
    return String(studentAns) !== String(q.correct_answer); // Wrong answer
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reattemptAnswers, setReattemptAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQ = missedQuestions[currentIndex];

  const handleOptionSelect = (optionIdx) => {
    if (isSubmitted) return;
    setReattemptAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIdx
    }));
  };

  const handleNumericalInput = (val) => {
    if (isSubmitted) return;
    setReattemptAnswers(prev => ({
      ...prev,
      [currentIndex]: val
    }));
  };

  // Calculate results on reattempt submit
  let reattemptScore = 0;
  let reattemptCorrect = 0;
  let reattemptWrong = 0;
  let reattemptSkipped = 0;

  if (isSubmitted) {
    missedQuestions.forEach((q, idx) => {
      const ans = reattemptAnswers[idx];
      if (ans !== undefined && ans !== null && String(ans).trim() !== '') {
        if (String(ans) === String(q.correct_answer)) {
          reattemptScore += 4;
          reattemptCorrect++;
        } else {
          reattemptScore -= 1;
          reattemptWrong++;
        }
      } else {
        reattemptSkipped++;
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0f172a] text-white border border-[#334155] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1e293b] p-6 border-b border-[#334155] flex justify-between items-center flex-wrap gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/40 text-[10px] font-black uppercase tracking-widest">
                Re-attempt Inverted Mode
              </span>
              <span className="text-[#94a3b8] text-xs font-semibold">| {testTitle || 'Mock Exam'}</span>
            </div>
            <h3 className="text-xl font-black text-white font-headline">
              Retrying {missedQuestions.length} Missed Questions
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {missedQuestions.length === 0 ? (
          <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-emerald-400 mb-4">stars</span>
            <h4 className="text-2xl font-bold text-white mb-2">Flawless Attempt!</h4>
            <p className="text-slate-400 max-w-md text-sm">
              You scored 100% accuracy on all questions in this test. There are no missed or incorrect questions to retry!
            </p>
            <button 
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Results Banner if submitted */}
            {isSubmitted && (
              <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-b border-emerald-500/30 p-5 flex flex-wrap justify-between items-center gap-4 shrink-0 animate-in slide-in-from-top-4">
                <div>
                  <h4 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">workspace_premium</span>
                    Re-attempt Completed!
                  </h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    You rectified <span className="font-bold text-white">{reattemptCorrect}</span> out of {missedQuestions.length} missed questions.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Re-attempt Score</p>
                    <p className="text-2xl font-black text-white">{reattemptScore > 0 ? `+${reattemptScore}` : reattemptScore} pts</p>
                  </div>
                  <button 
                    onClick={() => setIsSubmitted(false)} 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Question Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Question Navigation Bar */}
              <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Question <strong className="text-white text-sm">{currentIndex + 1}</strong> of {missedQuestions.length}</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-purple-300 font-bold border border-slate-700">
                  {currentQ.subject} {currentQ.chapter ? `• ${currentQ.chapter}` : ''}
                </span>
              </div>

              {/* Question Text */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-lg font-medium text-slate-100 leading-relaxed font-headline">
                  {currentQ.text}
                </p>
                {currentQ.image_url && (
                  <img 
                    src={currentQ.image_url} 
                    alt="Question Diagram" 
                    className="max-h-64 rounded-xl border border-slate-700 object-contain my-4" 
                  />
                )}
                {currentQ.sub_text && (
                  <p className="text-sm text-slate-300">{currentQ.sub_text}</p>
                )}
              </div>

              {/* Options or Input */}
              {currentQ.type?.toUpperCase() === 'NUMERICAL' ? (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Numerical Answer:</label>
                  <input 
                    type="text" 
                    disabled={isSubmitted}
                    value={reattemptAnswers[currentIndex] || ''}
                    onChange={(e) => handleNumericalInput(e.target.value)}
                    placeholder="Enter value..."
                    className="w-full max-w-xs px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-lg outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const isSelected = reattemptAnswers[currentIndex] === optIdx;
                    const isCorrect = isSubmitted && String(optIdx) === String(currentQ.correct_answer);
                    const isWrong = isSubmitted && isSelected && !isCorrect;

                    let bgClass = "bg-slate-900/80 border-slate-800 hover:border-purple-500/60";
                    if (isSelected) bgClass = "bg-purple-900/30 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500";
                    if (isSubmitted) {
                      if (isCorrect) bgClass = "bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500";
                      else if (isWrong) bgClass = "bg-red-950/80 border-red-500 text-red-200 ring-2 ring-red-500";
                    }

                    return (
                      <button 
                        key={optIdx}
                        disabled={isSubmitted}
                        onClick={() => handleOptionSelect(optIdx)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${bgClass}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-700">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm font-medium pt-0.5">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Solution breakdown if submitted */}
              {isSubmitted && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Correct Answer: {
                      currentQ.type?.toUpperCase() === 'NUMERICAL'
                        ? currentQ.correct_answer
                        : `Option ${String.fromCharCode(65 + parseInt(currentQ.correct_answer))}`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="bg-[#1e293b] p-5 border-t border-[#334155] flex justify-between items-center gap-4 shrink-0">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span> Previous
              </button>

              {!isSubmitted ? (
                <button 
                  onClick={() => setIsSubmitted(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  Submit Re-attempt
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Finish Review
                </button>
              )}

              <button 
                disabled={currentIndex === missedQuestions.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                Next <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
