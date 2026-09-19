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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0a1128] text-[#fefcfb] border border-[#034078]/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#001f54] p-6 border-b border-[#034078]/30 flex justify-between items-center flex-wrap gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-[#1282a2]/20 text-[#1282a2] border border-[#1282a2]/40 text-[10px] font-black uppercase tracking-widest">
                Re-attempt Inverted Mode
              </span>
              <span className="text-[#fefcfb]/70 text-xs font-semibold">| {testTitle || 'Mock Exam'}</span>
            </div>
            <h3 className="text-xl font-black text-white font-headline">
              Retrying {missedQuestions.length} Missed Questions
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-[#001f54] text-[#fefcfb] hover:text-white hover:bg-[#034078] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {missedQuestions.length === 0 ? (
          <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-[#1282a2] mb-4">stars</span>
            <h4 className="text-2xl font-bold text-white mb-2">Flawless Attempt!</h4>
            <p className="text-[#fefcfb] max-w-md text-sm">
              You scored 100% accuracy on all questions in this test. There are no missed or incorrect questions to retry!
            </p>
            <button 
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Results Banner if submitted */}
            {isSubmitted && (
              <div className="bg-gradient-to-r from-[#001f54] to-[#034078] border-b border-[#034078]/40 p-5 flex flex-wrap justify-between items-center gap-4 shrink-0 animate-in slide-in-from-top-4">
                <div>
                  <h4 className="text-lg font-black text-[#1282a2] flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">workspace_premium</span>
                    Re-attempt Completed!
                  </h4>
                  <p className="text-xs text-[#fefcfb] mt-0.5">
                    You rectified <span className="font-bold text-white">{reattemptCorrect}</span> out of {missedQuestions.length} missed questions.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <p className="text-[10px] text-[#1282a2] font-bold uppercase tracking-wider">Re-attempt Score</p>
                    <p className="text-2xl font-black text-white">{reattemptScore > 0 ? `+${reattemptScore}` : reattemptScore} pts</p>
                  </div>
                  <button 
                    onClick={() => setIsSubmitted(false)} 
                    className="px-4 py-2 bg-[#034078] hover:bg-[#04569e] text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Question Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Question Navigation Bar */}
              <div className="flex justify-between items-center text-xs text-[#fefcfb]/70 font-medium">
                <span>Question <strong className="text-white text-sm">{currentIndex + 1}</strong> of {missedQuestions.length}</span>
                <span className="px-2.5 py-1 rounded-md bg-[#001f54] text-[#fefcfb] font-bold border border-[#034078]/30">
                  {currentQ.subject} {currentQ.chapter ? `• ${currentQ.chapter}` : ''}
                </span>
              </div>

              {/* Question Text */}
              <div className="bg-[#001f54]/80 p-6 rounded-2xl border border-[#034078]/30 space-y-4">
                <p className="text-lg font-medium text-white leading-relaxed font-headline">
                  {currentQ.text}
                </p>
                {currentQ.image_url && (
                  <img 
                    src={currentQ.image_url} 
                    alt="Question Diagram" 
                    className="max-h-64 rounded-xl border border-[#034078]/30 object-contain my-4" 
                  />
                )}
                {currentQ.sub_text && (
                  <p className="text-sm text-[#fefcfb]">{currentQ.sub_text}</p>
                )}
              </div>

              {/* Options or Input */}
              {currentQ.type?.toUpperCase() === 'NUMERICAL' ? (
                <div className="space-y-2">
                  <label className="text-xs text-[#fefcfb] font-bold uppercase tracking-wider">Your Numerical Answer:</label>
                  <input 
                    type="text" 
                    disabled={isSubmitted}
                    value={reattemptAnswers[currentIndex] || ''}
                    onChange={(e) => handleNumericalInput(e.target.value)}
                    placeholder="Enter value..."
                    className="w-full max-w-xs px-4 py-3 bg-[#0a1128] border border-[#034078]/40 rounded-xl text-white font-bold text-lg outline-none focus:ring-2 focus:ring-[#1282a2]"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const isSelected = reattemptAnswers[currentIndex] === optIdx;
                    const isCorrect = isSubmitted && String(optIdx) === String(currentQ.correct_answer);
                    const isWrong = isSubmitted && isSelected && !isCorrect;

                    let bgClass = "bg-[#001f54]/70 border-[#034078]/30 hover:border-[#1282a2]/60 text-[#fefcfb]";
                    if (isSelected) bgClass = "bg-[#1282a2]/20 border-[#1282a2] text-white shadow-md ring-1 ring-[#1282a2]";
                    if (isSubmitted) {
                      if (isCorrect) bgClass = "bg-[#034078]/30 border-[#034078] text-white ring-2 ring-[#034078]";
                      else if (isWrong) bgClass = "bg-red-950/80 border-red-500 text-red-200 ring-2 ring-red-500";
                    }

                    return (
                      <button 
                        key={optIdx}
                        disabled={isSubmitted}
                        onClick={() => handleOptionSelect(optIdx)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${bgClass}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-[#001f54] text-xs font-bold flex items-center justify-center shrink-0 border border-[#034078]/40 text-white">
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
                <div className="bg-[#001f54] p-5 rounded-2xl border border-[#034078]/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[#1282a2] font-bold text-sm">
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
            <div className="bg-[#001f54] p-5 border-t border-[#034078]/30 flex justify-between items-center gap-4 shrink-0">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl bg-[#001f54] hover:bg-[#034078] disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-[#034078]/30"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span> Previous
              </button>

              {!isSubmitted ? (
                <button 
                  onClick={() => setIsSubmitted(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  Submit Re-attempt
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#034078] hover:bg-[#04569e] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Finish Review
                </button>
              )}

              <button 
                disabled={currentIndex === missedQuestions.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-4 py-2.5 rounded-xl bg-[#001f54] hover:bg-[#034078] disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-[#034078]/30"
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
