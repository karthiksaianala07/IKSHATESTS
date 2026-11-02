import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMathKeyboard } from '../context/MathKeyboardContext';

// Helper to render KaTeX safely inside button badges
function renderMathBadge(latexStr) {
  try {
    return katex.renderToString(latexStr, {
      displayMode: false,
      throwOnError: false
    });
  } catch (e) {
    return latexStr;
  }
}

export default function ContextualMathKeyboard() {
  const {
    isKeyboardOpen,
    closeKeyboard,
    activeTab,
    setActiveTab,
    executeMathCommand
  } = useMathKeyboard();

  const tabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'geometry', label: 'Geometry' },
    { id: 'integrals', label: 'Integrals' },
    { id: 'limits', label: 'Limits' },
    { id: 'derivatives', label: 'Derivatives' }
  ];

  // Helper to trigger insert without losing focus in math-field
  const handleInsert = (latex) => {
    executeMathCommand('insert', latex);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out select-none ${
        isKeyboardOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
      aria-hidden={!isKeyboardOpen}
    >
      <div className="max-w-4xl mx-auto bg-[#001433]/95 backdrop-blur-xl border-t border-x border-[#034078]/80 rounded-t-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
        
        {/* Top Header & Tab Navigation Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#034078]/50 bg-[#001f54]/60 gap-2">
          {/* Scrollable Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1282a2] text-white shadow-md shadow-[#1282a2]/30'
                      : 'text-[#fefcfb]/70 hover:text-white hover:bg-[#034078]/40'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Action & Utility Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              title="Undo"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeMathCommand('undo')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#034078]/50 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
            </button>
            <button
              type="button"
              title="Redo"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeMathCommand('redo')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#034078]/50 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">redo</span>
            </button>
            <button
              type="button"
              title="Backspace"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeMathCommand('deleteBackward')}
              className="px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">backspace</span>
            </button>
            <button
              type="button"
              title="Clear All"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeMathCommand('clear')}
              className="px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              title="Hide Keyboard"
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeKeyboard}
              className="px-2.5 py-1 text-xs font-bold bg-[#034078]/80 hover:bg-[#034078] text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-1"
            >
              <span className="material-symbols-outlined text-sm">keyboard_hide</span>
              <span className="hidden sm:inline">Hide</span>
            </button>
          </div>
        </div>

        {/* Keyboard Body with Active Tab Layout */}
        <div className="p-3 max-h-[220px] overflow-y-auto">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {/* Fraction Button (Visual Numerator / Denominator boxes) */}
              <KeyButton
                label="Fraction"
                math="\\frac{\\square}{\\square}"
                latex="\\frac{#?}{#?}"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton math="+" latex="+" onInsert={handleInsert} />
              <KeyButton math="-" latex="-" onInsert={handleInsert} />
              <KeyButton math="\\times" latex="\\times" onInsert={handleInsert} />
              <KeyButton math="\\div" latex="\\div" onInsert={handleInsert} />
              <KeyButton math="=" latex="=" onInsert={handleInsert} />
              <KeyButton math="\\neq" latex="\\neq" onInsert={handleInsert} />
              <KeyButton math="\\pm" latex="\\pm" onInsert={handleInsert} />
              <KeyButton math="( \\square )" latex="\\left( #? \\right)" onInsert={handleInsert} />
              <KeyButton math="[ \\square ]" latex="\\left[ #? \\right]" onInsert={handleInsert} />

              {/* Number Row 1 */}
              <KeyButton text="7" latex="7" num onInsert={handleInsert} />
              <KeyButton text="8" latex="8" num onInsert={handleInsert} />
              <KeyButton text="9" latex="9" num onInsert={handleInsert} />
              <KeyButton math="<" latex="<" onInsert={handleInsert} />
              <KeyButton math=">" latex=">" onInsert={handleInsert} />
              <KeyButton math="\\le" latex="\\le" onInsert={handleInsert} />
              <KeyButton math="\\ge" latex="\\ge" onInsert={handleInsert} />
              <KeyButton math="\\{ \\square \\}" latex="\\left\\{ #? \\right\\}" onInsert={handleInsert} />
              <KeyButton math="|\\square|" latex="\\left| #? \\right|" onInsert={handleInsert} />
              <NavKey icon="arrow_upward" title="Up/Numerator" action={() => executeMathCommand('moveUp')} />

              {/* Number Row 2 */}
              <KeyButton text="4" latex="4" num onInsert={handleInsert} />
              <KeyButton text="5" latex="5" num onInsert={handleInsert} />
              <KeyButton text="6" latex="6" num onInsert={handleInsert} />
              <KeyButton math="x" latex="x" varKey onInsert={handleInsert} />
              <KeyButton math="y" latex="y" varKey onInsert={handleInsert} />
              <KeyButton math="a" latex="a" varKey onInsert={handleInsert} />
              <KeyButton math="b" latex="b" varKey onInsert={handleInsert} />
              <KeyButton math="c" latex="c" varKey onInsert={handleInsert} />
              <NavKey icon="arrow_back" title="Left" action={() => executeMathCommand('moveLeft')} />
              <NavKey icon="arrow_forward" title="Right" action={() => executeMathCommand('moveRight')} />

              {/* Number Row 3 */}
              <KeyButton text="1" latex="1" num onInsert={handleInsert} />
              <KeyButton text="2" latex="2" num onInsert={handleInsert} />
              <KeyButton text="3" latex="3" num onInsert={handleInsert} />
              <KeyButton text="0" latex="0" num onInsert={handleInsert} />
              <KeyButton text="." latex="." num onInsert={handleInsert} />
              <KeyButton math="\\%" latex="\\%" onInsert={handleInsert} />
              <KeyButton math="\\pi" latex="\\pi" onInsert={handleInsert} />
              <KeyButton math="\\infty" latex="\\infty" onInsert={handleInsert} />
              <NavKey icon="arrow_downward" title="Down/Denominator" action={() => executeMathCommand('moveDown')} />
              <KeyButton
                label="Square"
                math="\\square^2"
                latex="^{2}"
                highlight
                onInsert={handleInsert}
              />
            </div>
          )}

          {activeTab === 'algebra' && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              <KeyButton label="Sqrt" math="\\sqrt{\\square}" latex="\\sqrt{#?}" highlight onInsert={handleInsert} />
              <KeyButton label="Nth Root" math="\\sqrt[n]{\\square}" latex="\\sqrt[#?]{#?}" highlight onInsert={handleInsert} />
              <KeyButton label="Exponent" math="\\square^{\\square}" latex="^{#?}" highlight onInsert={handleInsert} />
              <KeyButton label="Subscript" math="\\square_{\\square}" latex="_{#?}" highlight onInsert={handleInsert} />
              <KeyButton label="Sub & Sup" math="\\square_{\\square}^{\\square}" latex="_{#?}^{#?}" highlight onInsert={handleInsert} />
              <KeyButton label="Abs" math="|\\square|" latex="\\left| #? \\right|" onInsert={handleInsert} />
              <KeyButton label="Log" math="\\log(\\square)" latex="\\log\\left( #? \\right)" onInsert={handleInsert} />
              <KeyButton label="Ln" math="\\ln(\\square)" latex="\\ln\\left( #? \\right)" onInsert={handleInsert} />

              {/* Variables */}
              <KeyButton math="x" latex="x" varKey onInsert={handleInsert} />
              <KeyButton math="y" latex="y" varKey onInsert={handleInsert} />
              <KeyButton math="z" latex="z" varKey onInsert={handleInsert} />
              <KeyButton math="a" latex="a" varKey onInsert={handleInsert} />
              <KeyButton math="b" latex="b" varKey onInsert={handleInsert} />
              <KeyButton math="c" latex="c" varKey onInsert={handleInsert} />
              <KeyButton math="n" latex="n" varKey onInsert={handleInsert} />
              <KeyButton math="t" latex="t" varKey onInsert={handleInsert} />

              <KeyButton math="k" latex="k" varKey onInsert={handleInsert} />
              <KeyButton math="r" latex="r" varKey onInsert={handleInsert} />
              <KeyButton math="\\infty" latex="\\infty" onInsert={handleInsert} />
              <KeyButton math="\\approx" latex="\\approx" onInsert={handleInsert} />
              <KeyButton math="\\propto" latex="\\propto" onInsert={handleInsert} />
              <KeyButton math="\\in" latex="\\in" onInsert={handleInsert} />
              <KeyButton math="\\notin" latex="\\notin" onInsert={handleInsert} />
              <KeyButton math="e" latex="e" onInsert={handleInsert} />
            </div>
          )}

          {activeTab === 'geometry' && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              <KeyButton label="Angle" math="\\angle" latex="\\angle" highlight onInsert={handleInsert} />
              <KeyButton label="Triangle" math="\\triangle" latex="\\triangle" highlight onInsert={handleInsert} />
              <KeyButton label="Degree" math="^\\circ" latex="^\\circ" highlight onInsert={handleInsert} />
              <KeyButton label="Pi" math="\\pi" latex="\\pi" highlight onInsert={handleInsert} />
              <KeyButton label="Perpendicular" math="\\perp" latex="\\perp" onInsert={handleInsert} />
              <KeyButton label="Parallel" math="\\parallel" latex="\\parallel" onInsert={handleInsert} />
              <KeyButton label="Congruent" math="\\cong" latex="\\cong" onInsert={handleInsert} />
              <KeyButton label="Similar" math="\\sim" latex="\\sim" onInsert={handleInsert} />

              {/* Greek Letters used in Geometry / Trig */}
              <KeyButton math="\\theta" latex="\\theta" onInsert={handleInsert} />
              <KeyButton math="\\alpha" latex="\\alpha" onInsert={handleInsert} />
              <KeyButton math="\\beta" latex="\\beta" onInsert={handleInsert} />
              <KeyButton math="\\gamma" latex="\\gamma" onInsert={handleInsert} />
              <KeyButton math="\\phi" latex="\\phi" onInsert={handleInsert} />
              <KeyButton math="\\lambda" latex="\\lambda" onInsert={handleInsert} />
              <KeyButton math="\\omega" latex="\\omega" onInsert={handleInsert} />
              <KeyButton math="\\Delta" latex="\\Delta" onInsert={handleInsert} />

              <KeyButton label="Vector" math="\\vec{\\square}" latex="\\vec{#?}" onInsert={handleInsert} />
              <KeyButton label="Segment Bar" math="\\overline{\\square}" latex="\\overline{#?}" onInsert={handleInsert} />
              <KeyButton label="Unit Hat" math="\\hat{i}" latex="\\hat{#?}" onInsert={handleInsert} />
              <KeyButton math="\\sin" latex="\\sin(#?)" onInsert={handleInsert} />
              <KeyButton math="\\cos" latex="\\cos(#?)" onInsert={handleInsert} />
              <KeyButton math="\\tan" latex="\\tan(#?)" onInsert={handleInsert} />
              <KeyButton math="\\sin^{-1}" latex="\\sin^{-1}(#?)" onInsert={handleInsert} />
              <KeyButton math="\\cos^{-1}" latex="\\cos^{-1}(#?)" onInsert={handleInsert} />
            </div>
          )}

          {activeTab === 'integrals' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <KeyButton
                label="Indefinite Integral"
                math="\\int \\square \\, dx"
                latex="\\int #? \\, dx"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="Definite Integral"
                math="\\int_{\\square}^{\\square} \\square \\, dx"
                latex="\\int_{#?}^{#?} #? \\, dx"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="Double Integral"
                math="\\iint \\square \\, dxdy"
                latex="\\iint #? \\, dxdy"
                onInsert={handleInsert}
              />
              <KeyButton
                label="Contour Integral"
                math="\\oint \\square \\, dl"
                latex="\\oint #? \\, dl"
                onInsert={handleInsert}
              />
              <KeyButton
                label="Summation"
                math="\\sum_{\\square}^{\\square}"
                latex="\\sum_{#?}^{#?} #?"
                onInsert={handleInsert}
              />
              <KeyButton
                label="Product"
                math="\\prod_{\\square}^{\\square}"
                latex="\\prod_{#?}^{#?} #?"
                onInsert={handleInsert}
              />

              {/* Differentials */}
              <KeyButton math="dx" latex="dx" varKey onInsert={handleInsert} />
              <KeyButton math="dy" latex="dy" varKey onInsert={handleInsert} />
              <KeyButton math="dz" latex="dz" varKey onInsert={handleInsert} />
              <KeyButton math="dt" latex="dt" varKey onInsert={handleInsert} />
              <KeyButton math="dr" latex="dr" varKey onInsert={handleInsert} />
              <KeyButton math="d\\theta" latex="d\\theta" varKey onInsert={handleInsert} />

              {/* Common Limits */}
              <KeyButton math="0" latex="0" num onInsert={handleInsert} />
              <KeyButton math="1" latex="1" num onInsert={handleInsert} />
              <KeyButton math="\\pi" latex="\\pi" onInsert={handleInsert} />
              <KeyButton math="2\\pi" latex="2\\pi" onInsert={handleInsert} />
              <KeyButton math="\\infty" latex="\\infty" onInsert={handleInsert} />
              <KeyButton math="-\\infty" latex="-\\infty" onInsert={handleInsert} />
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <KeyButton
                label="Standard Limit"
                math="\\lim_{\\square \\to \\square} \\square"
                latex="\\lim_{#? \\to #?} #?"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="Left-hand Limit"
                math="\\lim_{\\square \\to \\square^-}"
                latex="\\lim_{#? \\to #?^-} #?"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="Right-hand Limit"
                math="\\lim_{\\square \\to \\square^+}"
                latex="\\lim_{#? \\to #?^+} #?"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="x approaching 0"
                math="\\lim_{x \\to 0}"
                latex="\\lim_{x \\to 0} #?"
                onInsert={handleInsert}
              />
              <KeyButton
                label="x approaching inf"
                math="\\lim_{x \\to \\infty}"
                latex="\\lim_{x \\to \\infty} #?"
                onInsert={handleInsert}
              />
              <KeyButton
                label="n approaching inf"
                math="\\lim_{n \\to \\infty}"
                latex="\\lim_{n \\to \\infty} #?"
                onInsert={handleInsert}
              />

              <KeyButton math="\\to" latex="\\to" onInsert={handleInsert} />
              <KeyButton math="x" latex="x" varKey onInsert={handleInsert} />
              <KeyButton math="h" latex="h" varKey onInsert={handleInsert} />
              <KeyButton math="0" latex="0" num onInsert={handleInsert} />
              <KeyButton math="\\infty" latex="\\infty" onInsert={handleInsert} />
              <KeyButton math="-\\infty" latex="-\\infty" onInsert={handleInsert} />
            </div>
          )}

          {activeTab === 'derivatives' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <KeyButton
                label="d/dx"
                math="\\frac{d}{dx}(\\square)"
                latex="\\frac{d}{dx}\\left( #? \\right)"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="d□/d□"
                math="\\frac{d\\square}{d\\square}"
                latex="\\frac{d#?}{d#?}"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="d²/dx²"
                math="\\frac{d^2}{dx^2}(\\square)"
                latex="\\frac{d^2}{dx^2}\\left( #? \\right)"
                onInsert={handleInsert}
              />
              <KeyButton
                label="Partial d/dx"
                math="\\frac{\\partial}{\\partial x}(\\square)"
                latex="\\frac{\\partial}{\\partial x}\\left( #? \\right)"
                highlight
                onInsert={handleInsert}
              />
              <KeyButton
                label="Partial □/□"
                math="\\frac{\\partial \\square}{\\partial \\square}"
                latex="\\frac{\\partial #?}{\\partial #?}"
                onInsert={handleInsert}
              />
              <KeyButton
                label="Partial d²/dx²"
                math="\\frac{\\partial^2}{\\partial x^2}"
                latex="\\frac{\\partial^2}{\\partial x^2}\\left( #? \\right)"
                onInsert={handleInsert}
              />

              {/* Notation */}
              <KeyButton label="f prime" math="f'(\\square)" latex="f'\\left( #? \\right)" onInsert={handleInsert} />
              <KeyButton label="y prime" math="y'" latex="y'" onInsert={handleInsert} />
              <KeyButton label="y double-prime" math="y''" latex="y''" onInsert={handleInsert} />
              <KeyButton label="Time Dot" math="\\dot{x}" latex="\\dot{#?}" onInsert={handleInsert} />
              <KeyButton label="Time Double-Dot" math="\\ddot{x}" latex="\\ddot{#?}" onInsert={handleInsert} />
              <KeyButton label="Nabla Del" math="\\nabla" latex="\\nabla" onInsert={handleInsert} />
              <KeyButton label="Laplacian Delta" math="\\Delta" latex="\\Delta" onInsert={handleInsert} />
              <KeyButton label="Eval Bar" math="\\left. \\square \\right|_{\\square}^{\\square}" latex="\\left. #? \\right|_{#?}^{#?}" onInsert={handleInsert} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Key Button
function KeyButton({
  math,
  text,
  latex,
  highlight = false,
  num = false,
  varKey = false,
  onInsert
}) {
  const renderedBadge = useMemo(() => {
    if (math) return renderMathBadge(math);
    return null;
  }, [math]);

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Don't lose focus in math-field!
      }}
      onClick={() => onInsert(latex)}
      className={`h-10 rounded-lg flex items-center justify-center font-medium transition-all duration-150 cursor-pointer shadow-sm active:scale-95 ${
        highlight
          ? 'bg-[#1282a2]/30 hover:bg-[#1282a2]/50 text-white border border-[#1282a2]/60 hover:border-[#1282a2]'
          : num
          ? 'bg-[#002866]/80 hover:bg-[#003380] text-slate-100 border border-[#034078]/40'
          : varKey
          ? 'bg-[#034078]/50 hover:bg-[#034078] text-amber-200 border border-[#034078]/60 font-serif italic'
          : 'bg-[#001f54]/70 hover:bg-[#034078]/60 text-slate-200 border border-[#034078]/40'
      }`}
    >
      {renderedBadge ? (
        <span
          className="text-sm pointer-events-none"
          dangerouslySetInnerHTML={{ __html: renderedBadge }}
        />
      ) : (
        <span className="text-sm font-semibold">{text}</span>
      )}
    </button>
  );
}

// Navigation / Arrow Key Button
function NavKey({ icon, title, action }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={action}
      className="h-10 rounded-lg flex items-center justify-center bg-[#001f54]/60 hover:bg-[#034078] text-slate-300 hover:text-white border border-[#034078]/40 transition-all cursor-pointer active:scale-95"
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}
