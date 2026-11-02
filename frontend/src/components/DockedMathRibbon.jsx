import React, { useState, useRef, useEffect } from 'react';

// Secondary palettes for "More Symbols" dropdown
const MORE_SYMBOLS = {
  Geometry: [
    { label: 'Angle', glyph: '∠', latex: '\\angle', isTemplate: false },
    { label: 'Triangle', glyph: '△', latex: '\\triangle', isTemplate: false },
    { label: 'Degree', glyph: '°', latex: '^\\circ', isTemplate: false },
    { label: 'Perpendicular', glyph: '⊥', latex: '\\perp', isTemplate: false },
    { label: 'Parallel', glyph: '∥', latex: '\\parallel', isTemplate: false },
    { label: 'Congruent', glyph: '≅', latex: '\\cong', isTemplate: false },
    { label: 'Similar', glyph: '∼', latex: '\\sim', isTemplate: false },
    { label: 'Vector', glyph: 'x⃗', latex: '\\vec{\\placeholder{}}', isTemplate: true },
    { label: 'Segment', glyph: 'x̄', latex: '\\overline{\\placeholder{}}', isTemplate: true },
    { label: 'Ray', glyph: 'x⃗', latex: '\\overrightarrow{\\placeholder{}}', isTemplate: true },
    { label: 'Arc', glyph: '⌒', latex: '\\overparen{\\placeholder{}}', isTemplate: true }
  ],
  Greek: [
    { label: 'alpha', glyph: 'α', latex: '\\alpha', isTemplate: false },
    { label: 'beta', glyph: 'β', latex: '\\beta', isTemplate: false },
    { label: 'gamma', glyph: 'γ', latex: '\\gamma', isTemplate: false },
    { label: 'delta', glyph: 'δ', latex: '\\delta', isTemplate: false },
    { label: 'Delta', glyph: 'Δ', latex: '\\Delta', isTemplate: false },
    { label: 'epsilon', glyph: 'ε', latex: '\\varepsilon', isTemplate: false },
    { label: 'theta', glyph: 'θ', latex: '\\theta', isTemplate: false },
    { label: 'lambda', glyph: 'λ', latex: '\\lambda', isTemplate: false },
    { label: 'mu', glyph: 'μ', latex: '\\mu', isTemplate: false },
    { label: 'pi', glyph: 'π', latex: '\\pi', isTemplate: false },
    { label: 'sigma', glyph: 'σ', latex: '\\sigma', isTemplate: false },
    { label: 'omega', glyph: 'ω', latex: '\\omega', isTemplate: false },
    { label: 'Omega', glyph: 'Ω', latex: '\\Omega', isTemplate: false },
    { label: 'phi', glyph: 'φ', latex: '\\phi', isTemplate: false }
  ],
  Algebra: [
    { label: 'n-th Root', glyph: 'ⁿ√x', latex: '\\sqrt[\\placeholder{}]{\\placeholder{}}', isTemplate: true },
    { label: 'Absolute Value', glyph: '|x|', latex: '\\left|\\placeholder{}\\right|', isTemplate: true },
    { label: 'Logarithm', glyph: 'log', latex: '\\log\\left(\\placeholder{}\\right)', isTemplate: true },
    { label: 'Natural Log', glyph: 'ln', latex: '\\ln\\left(\\placeholder{}\\right)', isTemplate: true },
    { label: 'Not Equal', glyph: '≠', latex: '\\ne', isTemplate: false },
    { label: 'Approximately Equal', glyph: '≈', latex: '\\approx', isTemplate: false },
    { label: 'Proportional To', glyph: '∝', latex: '\\propto', isTemplate: false },
    { label: 'Element Of', glyph: '∈', latex: '\\in', isTemplate: false },
    { label: 'Not Element Of', glyph: '∉', latex: '\\notin', isTemplate: false }
  ],
  Calculus: [
    { label: 'Double Integral', glyph: '∬', latex: '\\iint \\placeholder{} \\, dxdy', isTemplate: true },
    { label: 'Contour Integral', glyph: '∮', latex: '\\oint \\placeholder{} \\, dl', isTemplate: true },
    { label: 'Partial Derivative', glyph: '∂/∂x', latex: '\\frac{\\partial}{\\partial x}\\left(\\placeholder{}\\right)', isTemplate: true },
    { label: '2nd Partial', glyph: '∂²/∂x²', latex: '\\frac{\\partial^2}{\\partial x^2}\\left(\\placeholder{}\\right)', isTemplate: true },
    { label: 'Summation', glyph: '∑', latex: '\\sum_{\\placeholder{}}^{\\placeholder{}} \\placeholder{}', isTemplate: true },
    { label: 'Product', glyph: '∏', latex: '\\prod_{\\placeholder{}}^{\\placeholder{}} \\placeholder{}', isTemplate: true },
    { label: 'Nabla / Del', glyph: '∇', latex: '\\nabla', isTemplate: false },
    { label: 'Laplacian', glyph: 'Δ', latex: '\\Delta', isTemplate: false },
    { label: 'Prime', glyph: "f'(x)", latex: "f'\\left(\\placeholder{}\\right)", isTemplate: true },
    { label: 'Time Derivative', glyph: 'ẋ', latex: '\\dot{\\placeholder{}}', isTemplate: true },
    { label: 'Differential dx', glyph: 'dx', latex: '\\, dx', isTemplate: false },
    { label: 'Differential dt', glyph: 'dt', latex: '\\, dt', isTemplate: false }
  ]
};

/**
 * DockedMathRibbon
 * Sleek ~42px horizontal toolbar docked directly above an active input.
 * Crisp, clean HTML/Unicode badges with real visual spatial placeholders.
 */
export default function DockedMathRibbon({ onInsert, onAction, className = '' }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownTab, setDropdownTab] = useState('Geometry');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const handleKeyInsert = (latex, isTemplate = false, symbol = '') => {
    if (onInsert) {
      onInsert({ latex, isTemplate, symbol: symbol || latex });
    }
  };

  return (
    <div
      className={`relative flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[#001433]/95 border-b border-[#034078]/70 rounded-t-lg select-none text-xs text-white z-20 ${className}`}
      onMouseDown={(e) => {
        // Prevent stealing focus from the active input
        e.preventDefault();
      }}
    >
      {/* Primary 1-Click High-Frequency Math Templates */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Fraction */}
        <RibbonButton
          title="Fraction (Click to enter numerator & denominator boxes)"
          highlight
          onClick={() => handleKeyInsert('\\frac{\\placeholder{}}{\\placeholder{}}', true)}
        >
          <div className="flex flex-col items-center justify-center leading-none py-0.5">
            <span className="w-2.5 h-1.5 border border-current border-dashed rounded-[1px] opacity-90"></span>
            <span className="w-3.5 h-[1.5px] bg-current my-[1px]"></span>
            <span className="w-2.5 h-1.5 border border-current border-dashed rounded-[1px] opacity-90"></span>
          </div>
        </RibbonButton>

        {/* Square Root */}
        <RibbonButton
          title="Square Root (Click to enter value in radical box)"
          highlight
          onClick={() => handleKeyInsert('\\sqrt{\\placeholder{}}', true)}
        >
          <div className="flex items-center leading-none font-serif text-xs">
            <span className="text-sm font-light">√</span>
            <span className="w-2.5 h-2.5 border border-current border-dashed rounded-[1px] opacity-90 ml-0.5 border-t-2"></span>
          </div>
        </RibbonButton>

        {/* Power / Exponent */}
        <RibbonButton
          title="Power / Exponent box"
          highlight
          onClick={() => handleKeyInsert('^{\\placeholder{}}', true)}
        >
          <div className="flex items-start leading-none font-serif text-xs">
            <span className="italic">x</span>
            <span className="w-2 h-2 border border-current border-dashed rounded-[1px] opacity-90 ml-0.5 -mt-1"></span>
          </div>
        </RibbonButton>

        {/* Subscript */}
        <RibbonButton
          title="Subscript box"
          highlight
          onClick={() => handleKeyInsert('_{\\placeholder{}}', true)}
        >
          <div className="flex items-end leading-none font-serif text-xs">
            <span className="italic">x</span>
            <span className="w-2 h-2 border border-current border-dashed rounded-[1px] opacity-90 ml-0.5 -mb-0.5"></span>
          </div>
        </RibbonButton>

        {/* Parentheses */}
        <RibbonButton
          title="Parentheses"
          onClick={() => handleKeyInsert('\\left(\\placeholder{}\\right)', true)}
        >
          <div className="flex items-center leading-none font-serif text-xs">
            <span className="text-sm font-light">(</span>
            <span className="w-2 h-2.5 border border-current border-dashed rounded-[1px] opacity-90 mx-0.5"></span>
            <span className="text-sm font-light">)</span>
          </div>
        </RibbonButton>

        <div className="w-[1px] h-5 bg-[#034078]/80 mx-0.5 shrink-0" />

        {/* Definite Integral */}
        <RibbonButton
          title="Definite Integral with limit boxes"
          onClick={() => handleKeyInsert('\\int_{\\placeholder{}}^{\\placeholder{}} \\placeholder{} \\, dx', true)}
        >
          <div className="flex items-center leading-none font-serif">
            <span className="text-base font-light italic leading-none">∫</span>
            <div className="flex flex-col justify-between h-3.5 ml-0.5 text-[7px] leading-none">
              <span className="w-1.5 h-1 border border-current border-dashed rounded-[1px] opacity-90"></span>
              <span className="w-1.5 h-1 border border-current border-dashed rounded-[1px] opacity-90"></span>
            </div>
          </div>
        </RibbonButton>

        {/* Limit */}
        <RibbonButton
          title="Limit with variable and target boxes"
          onClick={() => handleKeyInsert('\\lim_{\\placeholder{} \\to \\placeholder{}} \\placeholder{}', true)}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] font-bold font-serif">lim</span>
            <span className="text-[7px] opacity-80 -mt-0.5 font-mono">x→0</span>
          </div>
        </RibbonButton>

        {/* Derivative */}
        <RibbonButton
          title="Derivative"
          onClick={() => handleKeyInsert('\\frac{d}{dx}\\left(\\placeholder{}\\right)', true)}
        >
          <div className="flex flex-col items-center justify-center leading-none font-serif text-[9px]">
            <span className="font-semibold italic">d</span>
            <span className="w-3.5 h-[1px] bg-current my-[1px]"></span>
            <span className="font-semibold italic">dx</span>
          </div>
        </RibbonButton>

        <div className="w-[1px] h-5 bg-[#034078]/80 mx-0.5 shrink-0" />

        {/* Common Quick Symbols */}
        <RibbonButton title="Plus-minus (±)" onClick={() => handleKeyInsert('\\pm', false, '±')}>
          <span className="text-sm font-semibold">±</span>
        </RibbonButton>
        <RibbonButton title="Multiply (×)" onClick={() => handleKeyInsert('\\times', false, '×')}>
          <span className="text-sm font-bold">×</span>
        </RibbonButton>
        <RibbonButton title="Divide (÷)" onClick={() => handleKeyInsert('\\div', false, '÷')}>
          <span className="text-sm font-bold">÷</span>
        </RibbonButton>
        <RibbonButton title="Less than or equal (≤)" onClick={() => handleKeyInsert('\\le', false, '≤')}>
          <span className="text-sm font-semibold">≤</span>
        </RibbonButton>
        <RibbonButton title="Greater than or equal (≥)" onClick={() => handleKeyInsert('\\ge', false, '≥')}>
          <span className="text-sm font-semibold">≥</span>
        </RibbonButton>
        <RibbonButton title="Pi (π)" onClick={() => handleKeyInsert('\\pi', false, 'π')}>
          <span className="text-sm font-serif italic">π</span>
        </RibbonButton>
        <RibbonButton title="Theta (θ)" onClick={() => handleKeyInsert('\\theta', false, 'θ')}>
          <span className="text-sm font-serif italic">θ</span>
        </RibbonButton>
        <RibbonButton title="Degree (°)" onClick={() => handleKeyInsert('^\\circ', false, '°')}>
          <span className="text-sm font-bold">°</span>
        </RibbonButton>
        <RibbonButton title="Infinity (∞)" onClick={() => handleKeyInsert('\\infty', false, '∞')}>
          <span className="text-sm font-light">∞</span>
        </RibbonButton>
      </div>

      {/* Right Controls: More Symbols dropdown & Undo/Clear */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2" ref={dropdownRef}>
        {/* More Symbols Dropdown Trigger */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`h-7 px-2.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
            dropdownOpen
              ? 'bg-[#1282a2] text-white border-[#1282a2]'
              : 'bg-[#001f54]/80 hover:bg-[#034078] text-slate-200 border-[#034078]/70'
          }`}
          title="Geometry, Greek, Algebra, and Calculus symbols"
        >
          <span>More Symbols</span>
          <span className="material-symbols-outlined text-xs">
            {dropdownOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {onAction && (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAction('undo')}
              className="h-7 w-7 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#034078]/60 transition-colors cursor-pointer"
              title="Undo"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAction('clear')}
              className="h-7 px-2 rounded text-[10px] font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
              title="Clear math"
            >
              Clear
            </button>
          </>
        )}

        {/* Dropdown Menu Popover */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#001433] border border-[#034078] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Category tabs */}
            <div className="flex items-center gap-1 border-b border-[#034078]/60 pb-2 mb-2.5">
              {Object.keys(MORE_SYMBOLS).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setDropdownTab(tab)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    dropdownTab === tab
                      ? 'bg-[#1282a2] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#001f54]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid of symbols for active tab */}
            <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
              {MORE_SYMBOLS[dropdownTab]?.map((sym, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  title={sym.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleKeyInsert(sym.latex, sym.isTemplate, sym.glyph);
                    setDropdownOpen(false);
                  }}
                  className="h-9 rounded-lg bg-[#001f54]/90 hover:bg-[#1282a2]/40 hover:border-[#1282a2] border border-[#034078]/50 flex flex-col items-center justify-center transition-all cursor-pointer text-white p-1 group"
                >
                  <span className="text-sm font-serif">{sym.glyph}</span>
                  <span className="text-[9px] text-slate-400 group-hover:text-cyan-200 truncate w-full text-center leading-none mt-0.5">
                    {sym.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual sleek button in the ribbon
function RibbonButton({ children, title, highlight = false, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-7 px-2.5 rounded shrink-0 flex items-center justify-center transition-all cursor-pointer text-xs font-medium active:scale-95 ${
        highlight
          ? 'bg-[#1282a2]/30 hover:bg-[#1282a2]/50 text-cyan-200 border border-[#1282a2]/60 shadow-xs'
          : 'bg-[#001f54]/80 hover:bg-[#034078] text-slate-200 border border-[#034078]/50 hover:border-[#1282a2]/50'
      }`}
    >
      {children}
    </button>
  );
}