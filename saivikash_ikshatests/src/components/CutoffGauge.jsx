import React from 'react';

export function CutoffGauge({ score = 0, maxScore = 300, cutoff = 92, category = 'JEE' }) {
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const scorePercentage = Math.min(100, Math.max(0, (normalizedScore / maxScore) * 100));
  const cutoffPercentage = Math.min(100, Math.max(0, (cutoff / maxScore) * 100));
  const isCleared = score >= cutoff;
  const margin = score - cutoff;

  return (
    <div className="bg-[#001f54] border border-[#034078]/30 p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#1282a2] text-xl">speed</span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#fefcfb]">Cut-off Indicator</h4>
          </div>
          <p className="text-xs text-[#fefcfb]/70">Target benchmark evaluation for {category}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${
          isCleared ? 'bg-[#034078]/20 text-[#fefcfb] border-[#034078]/50' : 'bg-[#1282a2]/20 text-[#1282a2] border-[#1282a2]/50'
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
          <span className="bg-[#0a1128] text-[#fefcfb] border border-[#034078]/40 text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
            Cutoff: {cutoff}
          </span>
          <div className="w-1.5 h-1.5 bg-[#0a1128] rotate-45 -mt-1 border-r border-b border-[#034078]/40" />
        </div>

        {/* Bar */}
        <div className="h-4 bg-[#0a1128] rounded-full overflow-hidden relative border border-[#034078]/30">
          {/* Target Cutoff Zone fill */}
          <div 
            className="absolute top-0 bottom-0 bg-[#034078]/20 border-r-2 border-[#034078] border-dashed z-10"
            style={{ width: `${cutoffPercentage}%` }}
          />

          {/* Student Score Bar */}
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full shadow-inner ${
              isCleared 
                ? 'bg-gradient-to-r from-[#034078] to-[#1282a2]' 
                : 'bg-gradient-to-r from-[#1282a2] to-[#fefcfb]'
            }`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>

        {/* Score Indicator Pin below bar */}
        <div 
          className="absolute -bottom-2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700"
          style={{ left: `${scorePercentage}%` }}
        >
          <div className="w-3 h-3 bg-[#1282a2] rounded-full ring-4 ring-[#0a1128] shadow-md" />
        </div>
      </div>

      {/* Footer statistics */}
      <div className="flex justify-between items-center text-xs text-[#fefcfb]/70 mt-4 pt-3 border-t border-[#034078]/20 font-medium">
        <span>Min: 0 pts</span>
        <span className="font-bold text-white">Your Score: <span className="text-[#1282a2] font-black">{score}</span> / {maxScore}</span>
        <span>Max: {maxScore} pts</span>
      </div>
    </div>
  );
}
