import React from 'react';

export function CutoffGauge({ score = 0, maxScore = 300, cutoff = 92, category = 'JEE' }) {
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const scorePercentage = Math.min(100, Math.max(0, (normalizedScore / maxScore) * 100));
  const cutoffPercentage = Math.min(100, Math.max(0, (cutoff / maxScore) * 100));
  const isCleared = score >= cutoff;
  const margin = score - cutoff;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">speed</span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Cut-off Indicator</h4>
          </div>
          <p className="text-xs text-[#64748b]">Target benchmark evaluation for {category}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${
          isCleared ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className="material-symbols-outlined text-base">
            {isCleared ? 'verified' : 'warning'}
          </span>
          {isCleared ? `Cleared (${margin >= 0 ? `+${margin}` : margin} pts)` : `Needs +${Math.abs(margin)} pts`}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative pt-6 pb-2">
        {/* Cutoff Marker Tooltip */}
        <div 
          className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
          style={{ left: `${cutoffPercentage}%` }}
        >
          <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
            Cutoff: {cutoff}
          </span>
          <div className="w-1.5 h-1.5 bg-zinc-800 rotate-45 -mt-1" />
        </div>

        {/* Bar */}
        <div className="h-4 bg-zinc-100 rounded-full overflow-hidden relative border border-zinc-200">
          {/* Target Cutoff Zone fill */}
          <div 
            className="absolute top-0 bottom-0 bg-emerald-500/10 border-r-2 border-emerald-600 border-dashed z-10"
            style={{ width: `${cutoffPercentage}%` }}
          />

          {/* Student Score Bar */}
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full shadow-inner ${
              isCleared 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                : 'bg-gradient-to-r from-amber-500 to-orange-400'
            }`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>

        {/* Score Indicator Pin below bar */}
        <div 
          className="absolute -bottom-2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700"
          style={{ left: `${scorePercentage}%` }}
        >
          <div className="w-3 h-3 bg-primary rounded-full ring-4 ring-white shadow-md" />
        </div>
      </div>

      {/* Footer statistics */}
      <div className="flex justify-between items-center text-xs text-[#64748b] mt-4 pt-3 border-t border-outline-variant/20 font-medium">
        <span>Min: 0 pts</span>
        <span className="font-bold text-on-surface">Your Score: <span className="text-primary font-black">{score}</span> / {maxScore}</span>
        <span>Max: {maxScore} pts</span>
      </div>
    </div>
  );
}
