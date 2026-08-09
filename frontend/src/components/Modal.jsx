import React from 'react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#334155] flex justify-between items-center bg-[#0f172a]">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-[#334155]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
