import React, { useState } from 'react';

const SYMBOL_CATEGORIES = {
  Basic: [
    { label: 'Fraction', latex: '\\frac{}{}', display: 'a/b' },
    { label: 'Exponent', latex: '^{}', display: 'x^y' },
    { label: 'Subscript', latex: '_{}', display: 'x_y' },
    { label: 'Square Root', latex: '\\sqrt{}', display: '√x' },
    { label: 'Nth Root', latex: '\\sqrt[]{}', display: 'ⁿ√x' },
    { label: 'Pi', latex: '\\pi', display: 'π' },
    { label: 'Theta', latex: '\\theta', display: 'θ' },
    { label: 'Plus-Minus', latex: '\\pm', display: '±' },
    { label: 'Multiply', latex: '\\times', display: '×' },
    { label: 'Divide', latex: '\\div', display: '÷' },
    { label: 'Infinity', latex: '\\infty', display: '∞' },
    { label: 'Log', latex: '\\log_{}()', display: 'log_b(x)' },
    { label: 'Natural Log', latex: '\\ln()', display: 'ln(x)' },
    { label: 'Percent', latex: '\\%', display: '%' }
  ],
  Calculus: [
    { label: 'Derivative', latex: '\\frac{d}{dx}', display: 'd/dx' },
    { label: 'Partial Dev', latex: '\\frac{\\partial}{\\partial x}', display: '∂/∂x' },
    { label: 'Integral', latex: '\\int {} dx', display: '∫ dx' },
    { label: 'Def Integral', latex: '\\int_{}^{} {} dx', display: '∫_a^b dx' },
    { label: 'Limit', latex: '\\lim_{x \\to {}}', display: 'lim' },
    { label: 'Summation', latex: '\\sum_{}^{}', display: '∑' },
    { label: 'Product', latex: '\\prod_{}^{}', display: '∏' },
    { label: 'Delta', latex: '\\Delta', display: 'Δ' }
  ],
  Symbols: [
    { label: 'Alpha', latex: '\\alpha', display: 'α' },
    { label: 'Beta', latex: '\\beta', display: 'β' },
    { label: 'Gamma', latex: '\\gamma', display: 'γ' },
    { label: 'Delta (lower)', latex: '\\delta', display: 'δ' },
    { label: 'Lambda', latex: '\\lambda', display: 'λ' },
    { label: 'Mu', latex: '\\mu', display: 'μ' },
    { label: 'Sigma', latex: '\\sigma', display: 'σ' },
    { label: 'Omega', latex: '\\omega', display: 'ω' },
    { label: 'Phi', latex: '\\phi', display: 'φ' },
    { label: 'Approx', latex: '\\approx', display: '≈' },
    { label: 'Not Equal', latex: '\\neq', display: '≠' },
    { label: 'Less Equal', latex: '\\le', display: '≤' },
    { label: 'Greater Equal', latex: '\\ge', display: '≥' },
    { label: 'Right Arrow', latex: '\\rightarrow', display: '→' }
  ],
  Trig: [
    { label: 'Sin', latex: '\\sin()', display: 'sin' },
    { label: 'Cos', latex: '\\cos()', display: 'cos' },
    { label: 'Tan', latex: '\\tan()', display: 'tan' },
    { label: 'Csc', latex: '\\csc()', display: 'csc' },
    { label: 'Sec', latex: '\\sec()', display: 'sec' },
    { label: 'Cot', latex: '\\cot()', display: 'cot' },
    { label: 'Arcsin', latex: '\\sin^{-1}()', display: 'sin⁻¹' },
    { label: 'Arccos', latex: '\\cos^{-1}()', display: 'cos⁻¹' },
    { label: 'Arctan', latex: '\\tan^{-1}()', display: 'tan⁻¹' }
  ]
};

export default function MathKeypad({ targetRef, value, setValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Basic');

  const handleInsertSymbol = (symbol) => {
    if (!targetRef || !targetRef.current) return;
    const textarea = targetRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newValue = before + symbol + after;
    setValue(newValue);

    // Calculate cursor position offset
    const emptyBraceIdx = symbol.indexOf('{}');
    const emptyParenIdx = symbol.indexOf('()');
    const emptyBracketIdx = symbol.indexOf('[]');

    let cursorOffset;
    if (emptyBraceIdx !== -1) {
      cursorOffset = emptyBraceIdx + 1;
    } else if (emptyParenIdx !== -1) {
      cursorOffset = emptyParenIdx + 1;
    } else if (emptyBracketIdx !== -1) {
      cursorOffset = emptyBracketIdx + 1;
    } else {
      cursorOffset = symbol.length;
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  return (
    <div className="w-full select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-xs font-bold text-primary active:scale-[0.98] transition-all cursor-pointer shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px] font-bold">keyboard</span>
        {isOpen ? 'Hide Math Keyboard' : 'Show Math Keyboard'}
      </button>

      {isOpen && (
        <div className="mt-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-3 duration-300">
          {/* Category Tabs */}
          <div className="flex border-b border-outline-variant/20 gap-1 pb-2 mb-3 overflow-x-auto">
            {Object.keys(SYMBOL_CATEGORIES).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === cat
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symbol Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {SYMBOL_CATEGORIES[activeTab].map((sym) => (
              <button
                key={sym.label}
                type="button"
                onClick={() => handleInsertSymbol(sym.latex)}
                className="py-2.5 px-1 bg-surface-container-low hover:bg-primary hover:text-white border border-outline-variant/10 rounded-lg text-xs font-mono font-black transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer text-center truncate flex flex-col items-center justify-center gap-1 shadow-sm"
                title={sym.label}
              >
                <span className="text-sm font-semibold">{sym.display}</span>
                <span className="text-[8px] opacity-60 font-sans tracking-wide block truncate max-w-full px-1">{sym.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
