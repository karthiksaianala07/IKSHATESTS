import React from 'react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#001f54] rounded-2xl border border-[#034078]/40 w-full max-w-lg shadow-[0_0_50px_rgba(10,17,40,0.8)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#034078]/30 flex justify-between items-center bg-[#0a1128]">
          <h3 className="text-xl font-bold font-headline text-white">{title}</h3>
          <button onClick={onClose} className="text-[#fefcfb] hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-[#001f54]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 text-[#fefcfb]">
          {children}
        </div>
      </div>
    </div>
  );
}
