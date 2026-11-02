import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import MathTypeVisualBuilder from './MathTypeVisualBuilder';

// Rich MathType categories with visual rendered math
const MATHTYPE_CATEGORIES = {
  Templates: [
    { label: 'Fraction', latex: '\\frac{a}{b}', template: '\\frac{}{}', displayMath: '\\frac{a}{b}' },
    { label: 'Square Root', latex: '\\sqrt{x}', template: '\\sqrt{}', displayMath: '\\sqrt{x}' },
    { label: 'Nth Root', latex: '\\sqrt[n]{x}', template: '\\sqrt[]{}', displayMath: '\\sqrt[n]{x}' },
    { label: 'Power', latex: 'x^y', template: '^{}', displayMath: 'x^y' },
    { label: 'Subscript', latex: 'x_i', template: '_{}', displayMath: 'x_i' },
    { label: 'Sub & Super', latex: 'x_i^n', template: '_{}^{}', displayMath: 'x_i^n' },
    { label: 'Parentheses', latex: '(x)', template: '\\left( {} \\right)', displayMath: '(x)' },
    { label: 'Square Brackets', latex: '[x]', template: '\\left[ {} \\right]', displayMath: '[x]' },
    { label: 'Curly Braces', latex: '{x}', template: '\\left\\{ {} \\right\\}', displayMath: '\\{x\\}' },
    { label: 'Absolute Value', latex: '|x|', template: '\\left| {} \\right|', displayMath: '|x|' },
    { label: 'Vector Arrow', latex: '\\vec{v}', template: '\\vec{}', displayMath: '\\vec{v}' },
    { label: 'Unit Vector Hat', latex: '\\hat{i}', template: '\\hat{}', displayMath: '\\hat{i}' },
    { label: 'Overbar', latex: '\\bar{x}', template: '\\bar{}', displayMath: '\\bar{x}' },
    { label: '2x2 Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', template: '\\begin{pmatrix}  &  \\\\  &  \\end{pmatrix}', displayMath: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' }
  ],
  Calculus: [
    { label: 'Derivative', latex: '\\frac{d}{dx}', template: '\\frac{d}{dx}', displayMath: '\\frac{d}{dx}' },
    { label: 'Partial Dev', latex: '\\frac{\\partial}{\\partial x}', template: '\\frac{\\partial}{\\partial x}', displayMath: '\\frac{\\partial}{\\partial x}' },
    { label: 'Indef Integral', latex: '\\int f(x)dx', template: '\\int {} dx', displayMath: '\\int dx' },
    { label: 'Def Integral', latex: '\\int_a^b f(x)dx', template: '\\int_{}^{} {} dx', displayMath: '\\int_a^b dx' },
    { label: 'Limit', latex: '\\lim_{x \\to 0}', template: '\\lim_{x \\to {}}', displayMath: '\\lim_{x \\to 0}' },
    { label: 'Summation', latex: '\\sum_{i=1}^n', template: '\\sum_{i=1}^{n}', displayMath: '\\sum_{i=1}^n' },
    { label: 'Product', latex: '\\prod_{i=1}^n', template: '\\prod_{i=1}^{n}', displayMath: '\\prod_{i=1}^n' },
    { label: 'Delta', latex: '\\Delta', template: '\\Delta', displayMath: '\\Delta' },
    { label: 'Nabla (Gradient)', latex: '\\nabla', template: '\\nabla', displayMath: '\\nabla' }
  ],
  Greek: [
    { label: 'alpha', latex: '\\alpha', template: '\\alpha', displayMath: '\\alpha' },
    { label: 'beta', latex: '\\beta', template: '\\beta', displayMath: '\\beta' },
    { label: 'gamma', latex: '\\gamma', template: '\\gamma', displayMath: '\\gamma' },
    { label: 'delta', latex: '\\delta', template: '\\delta', displayMath: '\\delta' },
    { label: 'theta', latex: '\\theta', template: '\\theta', displayMath: '\\theta' },
    { label: 'lambda', latex: '\\lambda', template: '\\lambda', displayMath: '\\lambda' },
    { label: 'mu', latex: '\\mu', template: '\\mu', displayMath: '\\mu' },
    { label: 'pi', latex: '\\pi', template: '\\pi', displayMath: '\\pi' },
    { label: 'sigma', latex: '\\sigma', template: '\\sigma', displayMath: '\\sigma' },
    { label: 'omega', latex: '\\omega', template: '\\omega', displayMath: '\\omega' },
    { label: 'phi', latex: '\\phi', template: '\\phi', displayMath: '\\phi' },
    { label: 'epsilon', latex: '\\varepsilon', template: '\\varepsilon', displayMath: '\\varepsilon' },
    { label: 'Delta', latex: '\\Delta', template: '\\Delta', displayMath: '\\Delta' },
    { label: 'Omega', latex: '\\Omega', template: '\\Omega', displayMath: '\\Omega' },
    { label: 'Sigma', latex: '\\Sigma', template: '\\Sigma', displayMath: '\\Sigma' },
    { label: 'Theta', latex: '\\Theta', template: '\\Theta', displayMath: '\\Theta' }
  ],
  Operators: [
    { label: 'plus-minus', latex: '\\pm', template: '\\pm', displayMath: '\\pm' },
    { label: 'minus-plus', latex: '\\mp', template: '\\mp', displayMath: '\\mp' },
    { label: 'multiply', latex: '\\times', template: '\\times', displayMath: '\\times' },
    { label: 'divide', latex: '\\div', template: '\\div', displayMath: '\\div' },
    { label: 'cdot', latex: '\\cdot', template: '\\cdot', displayMath: '\\cdot' },
    { label: 'approx', latex: '\\approx', template: '\\approx', displayMath: '\\approx' },
    { label: 'not equal', latex: '\\neq', template: '\\neq', displayMath: '\\neq' },
    { label: 'less-equal', latex: '\\le', template: '\\le', displayMath: '\\le' },
    { label: 'greater-equal', latex: '\\ge', template: '\\ge', displayMath: '\\ge' },
    { label: 'rightarrow', latex: '\\rightarrow', template: '\\rightarrow', displayMath: '\\rightarrow' },
    { label: 'infty', latex: '\\infty', template: '\\infty', displayMath: '\\infty' },
    { label: 'proportional', latex: '\\propto', template: '\\propto', displayMath: '\\propto' },
    { label: 'degree', latex: '^\\circ', template: '^\\circ', displayMath: '^\\circ' },
    { label: 'belongs to', latex: '\\in', template: '\\in', displayMath: '\\in' }
  ],
  'Physics & Chem': [
    { label: 'degree C', latex: '^\\circ\\text{C}', template: '^\\circ\\text{C}', displayMath: '^\\circ\\text{C}' },
    { label: 'equilibrium', latex: '\\rightleftharpoons', template: '\\rightleftharpoons', displayMath: '\\rightleftharpoons' },
    { label: 'hbar', latex: '\\hbar', template: '\\hbar', displayMath: '\\hbar' },
    { label: 'Angstrom', latex: '\\text{\\AA}', template: '\\text{\\AA}', displayMath: '\\text{\\AA}' },
    { label: 'eps0', latex: '\\varepsilon_0', template: '\\varepsilon_0', displayMath: '\\varepsilon_0' },
    { label: 'microfarad', latex: '\\mu\\text{F}', template: '\\mu\\text{F}', displayMath: '\\mu\\text{F}' },
    { label: 'eV', latex: '\\text{eV}', template: '\\text{eV}', displayMath: '\\text{eV}' },
    { label: 'ohm', latex: '\\Omega', template: '\\Omega', displayMath: '\\Omega' },
    { label: 'nuclear isotope', latex: '_{Z}^{A}\\text{X}', template: '_{Z}^{A}\\text{X}', displayMath: '_{Z}^{A}\\text{X}' }
  ]
};

// Safe KaTeX renderer for button labels
function getButtonKaTeX(mathStr) {
  try {
    return katex.renderToString(mathStr || '', {
      displayMode: false,
      throwOnError: false
    });
  } catch (err) {
    return mathStr;
  }
}

export default function MathKeypad({ targetRef, value, setValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(false);

  // Filter symbols based on user search
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) {
      return MATHTYPE_CATEGORIES[activeTab] || [];
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = [];
    Object.values(MATHTYPE_CATEGORIES).forEach(list => {
      list.forEach(item => {
        if (
          item.label.toLowerCase().includes(q) ||
          item.latex.toLowerCase().includes(q)
        ) {
          if (!matches.some(m => m.label === item.label)) {
            matches.push(item);
          }
        }
      });
    });
    return matches;
  }, [searchQuery, activeTab]);

  const handleInsertCode = (templateCode) => {
    if (!targetRef || !targetRef.current) return;
    const textarea = targetRef.current;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const currentVal = textarea.value || '';

    // If template has braces, smart position inside the first brace
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end, currentVal.length);
    const newValue = before + templateCode + after;
    setValue(newValue);

    const emptyBraceIdx = templateCode.indexOf('{}');
    const emptyParenIdx = templateCode.indexOf('()');
    const emptyBracketIdx = templateCode.indexOf('[]');

    let cursorOffset;
    if (emptyBraceIdx !== -1) {
      cursorOffset = emptyBraceIdx + 1;
    } else if (emptyParenIdx !== -1) {
      cursorOffset = emptyParenIdx + 1;
    } else if (emptyBracketIdx !== -1) {
      cursorOffset = emptyBracketIdx + 1;
    } else {
      cursorOffset = templateCode.length;
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 40);
  };

  const handleVisualBuilderInsert = (formulaWithDollars) => {
    if (!targetRef || !targetRef.current) {
      setValue(prev => (prev ? `${prev} ${formulaWithDollars}` : formulaWithDollars));
      return;
    }
    const textarea = targetRef.current;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const currentVal = textarea.value || '';

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end, currentVal.length);
    const insertion = (before.length > 0 && !before.endsWith(' ') ? ' ' : '') + formulaWithDollars + (after.length > 0 && !after.startsWith(' ') ? ' ' : '');
    const newValue = before + insertion + after;
    setValue(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + insertion.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 40);
  };

  return (
    <div className="w-full select-none mt-1">
      {/* MathType Bar Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsVisualBuilderOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#1282a2] to-[#034078] hover:brightness-110 active:scale-[0.98] border border-[#81c3d7]/40 rounded-lg text-xs font-black text-white shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px] font-bold">auto_awesome</span>
          MathType Visual Assistant
          <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-sans uppercase tracking-tight">Novice</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001f54]/70 hover:bg-[#001f54] border border-[#034078]/60 rounded-lg text-xs font-bold text-slate-200 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-[#1282a2]">keyboard</span>
          {isOpen ? 'Close Math Ribbon' : 'MathType Ribbon Toolbar'}
        </button>
      </div>

      {/* MathType Ribbon Panel */}
      {isOpen && (
        <div className="mt-2.5 bg-[#001433] border border-[#034078] rounded-xl p-3.5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Header Row: Tabs & Quick Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#034078]/70 pb-2.5 mb-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {Object.keys(MATHTYPE_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveTab(cat);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === cat && !searchQuery
                      ? 'bg-[#1282a2] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#001f54]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Filter Search */}
            <div className="relative min-w-[170px]">
              <span className="material-symbols-outlined absolute left-2 top-1.5 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search symbol (e.g. theta, sqrt)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-[#034078] bg-[#000f26] text-white placeholder-slate-400 focus:outline-none focus:border-[#1282a2]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Symbol Buttons Grid with Rendered KaTeX */}
          <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 gap-2 max-h-[165px] overflow-y-auto pr-1">
            {filteredSymbols.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleInsertCode(item.template)}
                title={item.label}
                className="p-2 bg-[#001f54]/60 hover:bg-[#1282a2] hover:text-white border border-[#034078]/60 rounded-xl text-white transition-all hover:scale-[1.04] active:scale-[0.96] cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm group min-h-[48px]"
              >
                <div 
                  className="text-sm font-serif pointer-events-none flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: getButtonKaTeX(item.displayMath) }}
                />
                <span className="text-[8px] opacity-60 font-sans tracking-tight block truncate max-w-full px-0.5 group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            ))}

            {filteredSymbols.length === 0 && (
              <div className="col-span-full py-4 text-center text-xs text-slate-400">
                No symbols found for "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Visual Formula Builder Modal */}
      <MathTypeVisualBuilder
        isOpen={isVisualBuilderOpen}
        onClose={() => setIsVisualBuilderOpen(false)}
        onInsert={handleVisualBuilderInsert}
        initialLatex=""
      />
    </div>
  );
}
