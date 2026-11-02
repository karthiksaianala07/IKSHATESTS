import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Preset JEE/NEET formulas for 1-click novice insertion
const EXAM_PRESETS = [
  {
    category: 'Physics',
    items: [
      { name: 'Kinetic Energy', latex: 'K = \\frac{1}{2}mv^2' },
      { name: "Newton's Gravity", latex: 'F = G\\frac{m_1 m_2}{r^2}' },
      { name: "Coulomb's Law", latex: 'F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}' },
      { name: "Ohm's Law", latex: 'V = IR' },
      { name: 'De Broglie Wavelength', latex: '\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2mE}}' },
      { name: 'Lens Formula', latex: '\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}' },
      { name: 'Simple Harmonic Motion', latex: 'T = 2\\pi\\sqrt{\\frac{L}{g}}' },
      { name: 'Capacitor Energy', latex: 'U = \\frac{1}{2}CV^2 = \\frac{Q^2}{2C}' },
      { name: 'Carnot Efficiency', latex: '\\eta = 1 - \\frac{T_2}{T_1}' },
      { name: 'Bohr Radius Orbit', latex: 'r_n = \\frac{n^2 h^2 \\varepsilon_0}{\\pi m e^2}' }
    ]
  },
  {
    category: 'Mathematics',
    items: [
      { name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { name: 'Binomial Theorem', latex: '(x + a)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} a^k' },
      { name: 'Pythagorean Identity', latex: '\\sin^2\\theta + \\cos^2\\theta = 1' },
      { name: 'Double Angle Sin', latex: '\\sin 2\\theta = 2\\sin\\theta\\cos\\theta' },
      { name: 'Double Angle Cos', latex: '\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta' },
      { name: 'Standard Derivative (xⁿ)', latex: '\\frac{d}{dx}(x^n) = n x^{n-1}' },
      { name: 'Integration by Parts', latex: '\\int u\\,dv = uv - \\int v\\,du' },
      { name: 'Limit of (sin x)/x', latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
      { name: 'Distance in 3D', latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}' },
      { name: '2x2 Determinant', latex: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc' }
    ]
  },
  {
    category: 'Chemistry',
    items: [
      { name: 'Ideal Gas Law', latex: 'PV = nRT' },
      { name: 'Arrhenius Equation', latex: 'k = A e^{-\\frac{E_a}{RT}}' },
      { name: 'pH Definition', latex: '\\text{pH} = -\\log_{10}[\\text{H}^+]' },
      { name: "Henderson-Hasselbalch", latex: '\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}' },
      { name: "Nernst Equation", latex: 'E = E^\\circ - \\frac{RT}{nF}\\ln Q' },
      { name: "Radioactive Decay", latex: 'N(t) = N_0 e^{-\\lambda t}' },
      { name: "Equilibrium Arrow", latex: 'A + B \\rightleftharpoons C + D' },
      { name: "Enthalpy Change", latex: '\\Delta H = \\Delta U + \\Delta n_g RT' }
    ]
  }
];

// Rich palettes of individual symbols rendered with KaTeX
const SYMBOL_PALETTES = {
  'Greek': [
    { label: 'alpha', latex: '\\alpha' },
    { label: 'beta', latex: '\\beta' },
    { label: 'gamma', latex: '\\gamma' },
    { label: 'delta', latex: '\\delta' },
    { label: 'epsilon', latex: '\\varepsilon' },
    { label: 'theta', latex: '\\theta' },
    { label: 'lambda', latex: '\\lambda' },
    { label: 'mu', latex: '\\mu' },
    { label: 'pi', latex: '\\pi' },
    { label: 'rho', latex: '\\rho' },
    { label: 'sigma', latex: '\\sigma' },
    { label: 'tau', latex: '\\tau' },
    { label: 'phi', latex: '\\phi' },
    { label: 'omega', latex: '\\omega' },
    { label: 'Delta', latex: '\\Delta' },
    { label: 'Omega', latex: '\\Omega' },
    { label: 'Sigma', latex: '\\Sigma' },
    { label: 'Lambda', latex: '\\Lambda' },
    { label: 'Pi', latex: '\\Pi' },
    { label: 'Theta', latex: '\\Theta' }
  ],
  'Operators': [
    { label: 'plus-minus', latex: '\\pm' },
    { label: 'minus-plus', latex: '\\mp' },
    { label: 'times', latex: '\\times' },
    { label: 'divide', latex: '\\div' },
    { label: 'cdot', latex: '\\cdot' },
    { label: 'approx', latex: '\\approx' },
    { label: 'neq', latex: '\\neq' },
    { label: 'leq', latex: '\\le' },
    { label: 'geq', latex: '\\ge' },
    { label: 'propto', latex: '\\propto' },
    { label: 'equiv', latex: '\\equiv' },
    { label: 'infinity', latex: '\\infty' },
    { label: 'partial', latex: '\\partial' },
    { label: 'nabla', latex: '\\nabla' }
  ],
  'Arrows': [
    { label: 'rightarrow', latex: '\\rightarrow' },
    { label: 'leftarrow', latex: '\\leftarrow' },
    { label: 'leftrightarrow', latex: '\\leftrightarrow' },
    { label: 'Rightarrow', latex: '\\Rightarrow' },
    { label: 'Leftarrow', latex: '\\Leftarrow' },
    { label: 'Leftrightarrow', latex: '\\Leftrightarrow' },
    { label: 'equilibrium', latex: '\\rightleftharpoons' },
    { label: 'mapsto', latex: '\\mapsto' },
    { label: 'uparrow', latex: '\\uparrow' },
    { label: 'downarrow', latex: '\\downarrow' }
  ],
  'Units & Physics': [
    { label: 'degree C', latex: '^\\circ\\text{C}' },
    { label: 'degree', latex: '^\\circ' },
    { label: 'Angstrom', latex: '\\text{\\AA}' },
    { label: 'hbar', latex: '\\hbar' },
    { label: 'eps0', latex: '\\varepsilon_0' },
    { label: 'mu0', latex: '\\mu_0' },
    { label: 'micro', latex: '\\mu\\text{m}' },
    { label: 'microfarad', latex: '\\mu\\text{F}' },
    { label: 'electron volt', latex: '\\text{eV}' },
    { label: 'mega electron volt', latex: '\\text{MeV}' },
    { label: 'ohm', latex: '\\Omega' },
    { label: 'mol', latex: '\\text{mol}' }
  ]
};

// Safe KaTeX HTML string generator
function getKaTeXHtml(latexStr, displayMode = false) {
  try {
    return katex.renderToString(latexStr || '', {
      displayMode,
      throwOnError: false
    });
  } catch (err) {
    return `<span class="text-rose-400 font-mono text-xs">...</span>`;
  }
}

export default function MathTypeVisualBuilder({ isOpen, onClose, onInsert, initialLatex = '' }) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'presets' | 'freehand'
  const [activeTemplate, setActiveTemplate] = useState('fraction');
  const [symbolTab, setSymbolTab] = useState('Greek');

  // Slot states for various visual templates
  const [fractionSlots, setFractionSlots] = useState({ num: '2x + 1', den: 'x^2 - 4' });
  const [radicalSlots, setRadicalSlots] = useState({ rad: 'x^2 + y^2', index: '' });
  const [powerSlots, setPowerSlots] = useState({ base: 'x', power: '2', sub: '' });
  const [integralSlots, setIntegralSlots] = useState({ isDefinite: true, lower: '0', upper: '\\pi', integrand: '\\sin x', diffVar: 'x' });
  const [sumSlots, setSumSlots] = useState({ lower: 'i=1', upper: 'n', expr: 'x_i^2' });
  const [limitSlots, setLimitSlots] = useState({ varName: 'x', toVal: '0', expr: '\\frac{\\sin x}{x}' });
  const [derivativeSlots, setDerivativeSlots] = useState({ isPartial: false, func: 'y', withRespectTo: 'x', order: '' });
  const [vectorSlots, setVectorSlots] = useState({ type: 'vec', sym: 'v' });
  const [bracketSlots, setBracketSlots] = useState({ type: 'round', content: '\\frac{a}{b}' });
  const [matrixDim, setMatrixDim] = useState('2x2');
  const [matrixCells, setMatrixCells] = useState([
    ['a', 'b'],
    ['c', 'd']
  ]);
  const [nuclearSlots, setNuclearSlots] = useState({ mass: '238', atomic: '92', element: 'U' });

  // Freehand composite editor state
  const [freehandLatex, setFreehandLatex] = useState(initialLatex || '');
  const [activeSlotTarget, setActiveSlotTarget] = useState(null); // ref or name of slot to insert symbol into

  // Computed LaTeX from current visual template
  const computeCurrentTemplateLatex = () => {
    switch (activeTemplate) {
      case 'fraction':
        return `\\frac{${fractionSlots.num || 'a'}}{${fractionSlots.den || 'b'}}`;
      case 'radical':
        return radicalSlots.index?.trim() 
          ? `\\sqrt[${radicalSlots.index}]{${radicalSlots.rad || 'x'}}`
          : `\\sqrt{${radicalSlots.rad || 'x'}}`;
      case 'power':
        if (powerSlots.sub?.trim() && powerSlots.power?.trim()) {
          return `${powerSlots.base || 'x'}_{${powerSlots.sub}}^{${powerSlots.power}}`;
        }
        if (powerSlots.power?.trim()) {
          return `${powerSlots.base || 'x'}^{${powerSlots.power}}`;
        }
        if (powerSlots.sub?.trim()) {
          return `${powerSlots.base || 'x'}_{${powerSlots.sub}}`;
        }
        return powerSlots.base || 'x';
      case 'integral':
        if (integralSlots.isDefinite) {
          return `\\int_{${integralSlots.lower || 'a'}}^{${integralSlots.upper || 'b'}} ${integralSlots.integrand || 'f(x)'} \\, d${integralSlots.diffVar || 'x'}`;
        }
        return `\\int ${integralSlots.integrand || 'f(x)'} \\, d${integralSlots.diffVar || 'x'}`;
      case 'sum':
        return `\\sum_{${sumSlots.lower || 'i=1'}}^{${sumSlots.upper || 'n'}} ${sumSlots.expr || 'x_i'}`;
      case 'limit':
        return `\\lim_{${limitSlots.varName || 'x'} \\to ${limitSlots.toVal || '0'}} ${limitSlots.expr || 'f(x)'}`;
      case 'derivative':
        const dSym = derivativeSlots.isPartial ? '\\partial' : 'd';
        const orderPart = derivativeSlots.order ? `^{${derivativeSlots.order}}` : '';
        return `\\frac{${dSym}${orderPart} ${derivativeSlots.func || 'y'}}{${dSym} ${derivativeSlots.withRespectTo || 'x'}${orderPart}}`;
      case 'vector':
        if (vectorSlots.type === 'hat') return `\\hat{${vectorSlots.sym || 'i'}}`;
        if (vectorSlots.type === 'bar') return `\\bar{${vectorSlots.sym || 'x'}}`;
        if (vectorSlots.type === 'dot') return `\\dot{${vectorSlots.sym || 'x'}}`;
        return `\\vec{${vectorSlots.sym || 'v'}}`;
      case 'brackets':
        if (bracketSlots.type === 'square') return `\\left[ ${bracketSlots.content || 'x'} \\right]`;
        if (bracketSlots.type === 'curly') return `\\left\\{ ${bracketSlots.content || 'x'} \\right\\}`;
        if (bracketSlots.type === 'abs') return `\\left| ${bracketSlots.content || 'x'} \\right|`;
        if (bracketSlots.type === 'norm') return `\\left\\| ${bracketSlots.content || 'x'} \\right\\|`;
        return `\\left( ${bracketSlots.content || 'x'} \\right)`;
      case 'matrix':
        const rows = matrixCells.map(row => row.join(' & ')).join(' \\\\ ');
        return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
      case 'nuclear':
        return `_{${nuclearSlots.atomic || 'Z'}}^{${nuclearSlots.mass || 'A'}}\\text{${nuclearSlots.element || 'X'}}`;
      default:
        return 'x';
    }
  };

  // The active LaTeX displayed in the preview canvas
  const currentOutputLatex = activeTab === 'freehand' 
    ? freehandLatex 
    : computeCurrentTemplateLatex();

  // Change matrix dimensions dynamically
  const handleMatrixDimChange = (dim) => {
    setMatrixDim(dim);
    if (dim === '2x2') {
      setMatrixCells([['a', 'b'], ['c', 'd']]);
    } else if (dim === '3x3') {
      setMatrixCells([
        ['a_{11}', 'a_{12}', 'a_{13}'],
        ['a_{21}', 'a_{22}', 'a_{23}'],
        ['a_{31}', 'a_{32}', 'a_{33}']
      ]);
    } else if (dim === '1x3') {
      setMatrixCells([['x', 'y', 'z']]);
    } else if (dim === '3x1') {
      setMatrixCells([['x'], ['y'], ['z']]);
    }
  };

  const handleMatrixCellChange = (rIdx, cIdx, val) => {
    const next = matrixCells.map(r => [...r]);
    next[rIdx][cIdx] = val;
    setMatrixCells(next);
  };

  // Inserting a symbol into the active slot or freehand editor
  const insertSymbol = (symLatex) => {
    if (activeTab === 'freehand') {
      setFreehandLatex(prev => prev ? `${prev} ${symLatex}` : symLatex);
      return;
    }

    // Append to currently active template slot
    if (activeTemplate === 'fraction') {
      setFractionSlots(prev => ({ ...prev, num: prev.num + symLatex }));
    } else if (activeTemplate === 'radical') {
      setRadicalSlots(prev => ({ ...prev, rad: prev.rad + symLatex }));
    } else if (activeTemplate === 'integral') {
      setIntegralSlots(prev => ({ ...prev, integrand: prev.integrand + symLatex }));
    } else if (activeTemplate === 'brackets') {
      setBracketSlots(prev => ({ ...prev, content: prev.content + symLatex }));
    } else {
      // Fallback: switch to freehand and append
      setFreehandLatex(computeCurrentTemplateLatex() + ' ' + symLatex);
      setActiveTab('freehand');
    }
  };

  const handleApplyPreset = (presetLatex) => {
    setFreehandLatex(presetLatex);
    setActiveTab('freehand');
  };

  const handleInsertToQuestion = () => {
    if (!currentOutputLatex.trim()) {
      onClose();
      return;
    }
    // Standard format: wrap in $ ... $
    const formatted = `$${currentOutputLatex.trim()}$`;
    onInsert(formatted);
    onClose();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`$${currentOutputLatex.trim()}$`);
    alert("Copied equation LaTeX to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#001433] border border-[#034078] rounded-2xl shadow-2xl overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* MathType Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#034078]/80 bg-[#000f26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1282a2] to-[#034078] flex items-center justify-center shadow-md font-serif font-black text-white text-lg">
              &radic;
            </div>
            <div>
              <h3 className="font-headline font-black text-base tracking-wide flex items-center gap-2">
                MathType Equation Assistant
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Novice Friendly
                </span>
              </h3>
              <p className="text-[11px] text-[#fefcfb]/60">Build clean math formulas visually without typing raw LaTeX code</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Live Equation Preview Canvas (Hero Area) */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#000d20] to-[#00173d] border-b border-[#034078]/80 flex flex-col items-center justify-center min-h-[120px] relative">
          <div className="absolute top-2 left-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#1282a2] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#1282a2] animate-pulse"></span>
            Real-Time MathType Preview
          </div>
          
          <div 
            className="text-xl sm:text-2xl text-white py-3 px-4 max-w-full overflow-x-auto text-center font-serif leading-relaxed"
            dangerouslySetInnerHTML={{ __html: getKaTeXHtml(currentOutputLatex, true) }}
          />

          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#fefcfb]/50 font-mono bg-[#000f26]/80 px-3 py-1 rounded-md border border-[#034078]/40 max-w-full overflow-x-auto">
            <span className="text-[#1282a2] font-bold">LaTeX:</span>
            <code className="truncate max-w-md sm:max-w-xl">${currentOutputLatex}$</code>
          </div>
        </div>

        {/* Main Workspace Navigation Tabs */}
        <div className="flex border-b border-[#034078]/60 bg-[#001a40] px-4 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-[#001433] text-white border-t border-x border-[#034078]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">shapes</span>
            Visual Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-[#001433] text-white border-t border-x border-[#034078]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">bookmark</span>
            JEE & NEET Formula Presets
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'freehand') {
                setFreehandLatex(computeCurrentTemplateLatex());
              }
              setActiveTab('freehand');
            }}
            className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'freehand'
                ? 'bg-[#001433] text-white border-t border-x border-[#034078]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Custom / Composite Code
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {/* Template Selector Ribbon */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#fefcfb]/70 tracking-wider mb-2 block">
                  Select Visual Structure:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-11 gap-1.5">
                  {[
                    { id: 'fraction', name: 'Fraction', math: '\\frac{a}{b}' },
                    { id: 'radical', name: 'Root', math: '\\sqrt{x}' },
                    { id: 'power', name: 'Power/Sub', math: 'x_i^n' },
                    { id: 'integral', name: 'Integral', math: '\\int_a^b' },
                    { id: 'sum', name: 'Sum', math: '\\sum' },
                    { id: 'limit', name: 'Limit', math: '\\lim' },
                    { id: 'derivative', name: 'Deriv', math: '\\frac{dy}{dx}' },
                    { id: 'brackets', name: 'Fences', math: '(x)' },
                    { id: 'vector', name: 'Vector', math: '\\vec{v}' },
                    { id: 'matrix', name: 'Matrix', math: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
                    { id: 'nuclear', name: 'Nuclear', math: '_{Z}^{A}\\text{X}' }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setActiveTemplate(tpl.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        activeTemplate === tpl.id
                          ? 'bg-[#1282a2]/20 border-[#1282a2] ring-1 ring-[#1282a2] text-white'
                          : 'bg-[#001f54]/40 border-[#034078]/60 hover:bg-[#001f54] text-slate-300'
                      }`}
                    >
                      <div 
                        className="text-sm h-6 flex items-center justify-center pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: getKaTeXHtml(tpl.math, false) }}
                      />
                      <span className="text-[9px] font-bold mt-1 tracking-tight truncate w-full text-center">
                        {tpl.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Fill-in-the-Blank Slots for Chosen Template */}
              <div className="bg-[#001a40] p-4 rounded-xl border border-[#034078]/80 space-y-4">
                <div className="flex items-center justify-between border-b border-[#034078]/60 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1282a2] flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Configure {activeTemplate.toUpperCase()} Template Slots
                  </h4>
                  <span className="text-[10px] text-slate-400">Fill in the values below; math renders automatically</span>
                </div>

                {/* 1. Fraction */}
                {activeTemplate === 'fraction' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Numerator (Top &bull; a)</label>
                      <input
                        type="text"
                        value={fractionSlots.num}
                        onChange={e => setFractionSlots({ ...fractionSlots, num: e.target.value })}
                        placeholder="e.g. 2x + 1"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Denominator (Bottom &bull; b)</label>
                      <input
                        type="text"
                        value={fractionSlots.den}
                        onChange={e => setFractionSlots({ ...fractionSlots, den: e.target.value })}
                        placeholder="e.g. x^2 - 4"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Radical */}
                {activeTemplate === 'radical' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Radicand (Inside the Root &bull; x)</label>
                      <input
                        type="text"
                        value={radicalSlots.rad}
                        onChange={e => setRadicalSlots({ ...radicalSlots, rad: e.target.value })}
                        placeholder="e.g. x^2 + y^2"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Root Index (Optional for &radic;[n], leave empty for &radic;)</label>
                      <input
                        type="text"
                        value={radicalSlots.index}
                        onChange={e => setRadicalSlots({ ...radicalSlots, index: e.target.value })}
                        placeholder="e.g. 3 for cube root"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Power / Subscript */}
                {activeTemplate === 'power' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Base Variable (x)</label>
                      <input
                        type="text"
                        value={powerSlots.base}
                        onChange={e => setPowerSlots({ ...powerSlots, base: e.target.value })}
                        placeholder="e.g. x"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Superscript / Power (xⁿ)</label>
                      <input
                        type="text"
                        value={powerSlots.power}
                        onChange={e => setPowerSlots({ ...powerSlots, power: e.target.value })}
                        placeholder="e.g. 2 or -1"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Subscript (xᵢ)</label>
                      <input
                        type="text"
                        value={powerSlots.sub}
                        onChange={e => setPowerSlots({ ...powerSlots, sub: e.target.value })}
                        placeholder="e.g. 1 or i"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm focus:border-[#1282a2] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Integral */}
                {activeTemplate === 'integral' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={integralSlots.isDefinite}
                          onChange={() => setIntegralSlots({ ...integralSlots, isDefinite: true })}
                        />
                        Definite Integral (&int; from a to b)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!integralSlots.isDefinite}
                          onChange={() => setIntegralSlots({ ...integralSlots, isDefinite: false })}
                        />
                        Indefinite Integral (&int;)
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {integralSlots.isDefinite && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-300">Lower Bound (a)</label>
                            <input
                              type="text"
                              value={integralSlots.lower}
                              onChange={e => setIntegralSlots({ ...integralSlots, lower: e.target.value })}
                              placeholder="e.g. 0"
                              className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-300">Upper Bound (b)</label>
                            <input
                              type="text"
                              value={integralSlots.upper}
                              onChange={e => setIntegralSlots({ ...integralSlots, upper: e.target.value })}
                              placeholder="e.g. \pi or \infty"
                              className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                            />
                          </div>
                        </>
                      )}
                      <div className={`space-y-1 ${integralSlots.isDefinite ? 'col-span-2' : 'col-span-3'}`}>
                        <label className="text-[11px] font-bold text-slate-300">Integrand Expression f(x)</label>
                        <input
                          type="text"
                          value={integralSlots.integrand}
                          onChange={e => setIntegralSlots({ ...integralSlots, integrand: e.target.value })}
                          placeholder="e.g. \sin x"
                          className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Variable (d?)</label>
                        <input
                          type="text"
                          value={integralSlots.diffVar}
                          onChange={e => setIntegralSlots({ ...integralSlots, diffVar: e.target.value })}
                          placeholder="x"
                          className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Summation */}
                {activeTemplate === 'sum' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Lower Bound (e.g. i=1)</label>
                      <input
                        type="text"
                        value={sumSlots.lower}
                        onChange={e => setSumSlots({ ...sumSlots, lower: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Upper Bound (e.g. n)</label>
                      <input
                        type="text"
                        value={sumSlots.upper}
                        onChange={e => setSumSlots({ ...sumSlots, upper: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Expression</label>
                      <input
                        type="text"
                        value={sumSlots.expr}
                        onChange={e => setSumSlots({ ...sumSlots, expr: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Limits */}
                {activeTemplate === 'limit' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Variable (x)</label>
                      <input
                        type="text"
                        value={limitSlots.varName}
                        onChange={e => setLimitSlots({ ...limitSlots, varName: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Approaches Value (to &rarr;)</label>
                      <input
                        type="text"
                        value={limitSlots.toVal}
                        onChange={e => setLimitSlots({ ...limitSlots, toVal: e.target.value })}
                        placeholder="e.g. 0 or \infty"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Expression</label>
                      <input
                        type="text"
                        value={limitSlots.expr}
                        onChange={e => setLimitSlots({ ...limitSlots, expr: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 7. Derivative */}
                {activeTemplate === 'derivative' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Type</label>
                      <select
                        value={derivativeSlots.isPartial ? 'partial' : 'ordinary'}
                        onChange={e => setDerivativeSlots({ ...derivativeSlots, isPartial: e.target.value === 'partial' })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs cursor-pointer font-bold"
                      >
                        <option value="ordinary">Ordinary (d/dx)</option>
                        <option value="partial">Partial (&part;/&part;x)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Function (y or f)</label>
                      <input
                        type="text"
                        value={derivativeSlots.func}
                        onChange={e => setDerivativeSlots({ ...derivativeSlots, func: e.target.value })}
                        className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">W.r.t Variable (x)</label>
                      <input
                        type="text"
                        value={derivativeSlots.withRespectTo}
                        onChange={e => setDerivativeSlots({ ...derivativeSlots, withRespectTo: e.target.value })}
                        className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Order (optional, e.g. 2 for d&sup2;y/dx&sup2;)</label>
                      <input
                        type="text"
                        value={derivativeSlots.order}
                        onChange={e => setDerivativeSlots({ ...derivativeSlots, order: e.target.value })}
                        placeholder="e.g. 2"
                        className="w-full p-2 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 8. Brackets */}
                {activeTemplate === 'brackets' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Bracket Style</label>
                      <select
                        value={bracketSlots.type}
                        onChange={e => setBracketSlots({ ...bracketSlots, type: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs font-bold cursor-pointer"
                      >
                        <option value="round">( ... ) Parentheses</option>
                        <option value="square">[ ... ] Square Brackets</option>
                        <option value="curly">&#123; ... &#125; Curly Braces</option>
                        <option value="abs">| ... | Absolute Value</option>
                        <option value="norm">&Verbar; ... &Verbar; Norm</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Enclosed Content</label>
                      <input
                        type="text"
                        value={bracketSlots.content}
                        onChange={e => setBracketSlots({ ...bracketSlots, content: e.target.value })}
                        placeholder="e.g. \frac{a}{b}"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 9. Vector */}
                {activeTemplate === 'vector' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Accent Type</label>
                      <select
                        value={vectorSlots.type}
                        onChange={e => setVectorSlots({ ...vectorSlots, type: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-xs font-bold cursor-pointer"
                      >
                        <option value="vec">Vector Arrow (&rarr;)</option>
                        <option value="hat">Unit Vector Hat (^)</option>
                        <option value="bar">Overbar (&oline;)</option>
                        <option value="dot">Time Derivative Dot (&middot;)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Variable / Symbol</label>
                      <input
                        type="text"
                        value={vectorSlots.sym}
                        onChange={e => setVectorSlots({ ...vectorSlots, sym: e.target.value })}
                        placeholder="e.g. v or i"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 10. Matrix */}
                {activeTemplate === 'matrix' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-300">Dimensions:</label>
                      {['2x2', '3x3', '1x3', '3x1'].map((dim) => (
                        <button
                          key={dim}
                          type="button"
                          onClick={() => handleMatrixDimChange(dim)}
                          className={`px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                            matrixDim === dim
                              ? 'bg-[#1282a2] border-[#1282a2] text-white'
                              : 'bg-[#001433] border-[#034078] text-slate-300'
                          }`}
                        >
                          {dim}
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-[#001433] rounded-lg border border-[#034078]/60 inline-block">
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${matrixCells[0].length}, minmax(0, 1fr))` }}>
                        {matrixCells.map((row, rIdx) =>
                          row.map((val, cIdx) => (
                            <input
                              key={`${rIdx}-${cIdx}`}
                              type="text"
                              value={val}
                              onChange={e => handleMatrixCellChange(rIdx, cIdx, e.target.value)}
                              className="w-16 p-2 rounded border border-[#034078] bg-[#000f26] text-white text-center text-xs font-bold"
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. Nuclear Chemistry */}
                {activeTemplate === 'nuclear' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Mass Number (A &bull; Top)</label>
                      <input
                        type="text"
                        value={nuclearSlots.mass}
                        onChange={e => setNuclearSlots({ ...nuclearSlots, mass: e.target.value })}
                        placeholder="e.g. 238"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Atomic Number (Z &bull; Bottom)</label>
                      <input
                        type="text"
                        value={nuclearSlots.atomic}
                        onChange={e => setNuclearSlots({ ...nuclearSlots, atomic: e.target.value })}
                        placeholder="e.g. 92"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Element Symbol (X)</label>
                      <input
                        type="text"
                        value={nuclearSlots.element}
                        onChange={e => setNuclearSlots({ ...nuclearSlots, element: e.target.value })}
                        placeholder="e.g. U"
                        className="w-full p-2.5 rounded-lg border border-[#034078] bg-[#001433] text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* MathType Symbol Ribbon Insertion Palette */}
              <div className="bg-[#001433] p-3 rounded-xl border border-[#034078]/80 space-y-2">
                <div className="flex items-center justify-between border-b border-[#034078]/50 pb-2">
                  <span className="text-[10px] uppercase font-bold text-[#fefcfb]/70 tracking-wider">
                    Quick MathType Symbols (Click to insert):
                  </span>
                  <div className="flex gap-1 overflow-x-auto">
                    {Object.keys(SYMBOL_PALETTES).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSymbolTab(cat)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          symbolTab === cat
                            ? 'bg-[#1282a2] text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {SYMBOL_PALETTES[symbolTab].map(sym => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => insertSymbol(sym.latex)}
                      title={sym.label}
                      className="p-1.5 rounded-lg bg-[#001f54]/60 hover:bg-[#1282a2] border border-[#034078]/50 text-white flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <span 
                        className="text-xs pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: getKaTeXHtml(sym.latex, false) }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preset Library Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-300">
                Click any standard JEE/NEET formula below to load it into the preview and insert it directly into your question.
              </p>
              {EXAM_PRESETS.map((group) => (
                <div key={group.category} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1282a2] border-b border-[#034078]/50 pb-1">
                    {group.category} Standard Formulas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.items.map((preset) => (
                      <div
                        key={preset.name}
                        onClick={() => handleApplyPreset(preset.latex)}
                        className="p-3 rounded-xl bg-[#001a40] hover:bg-[#002459] border border-[#034078] transition-all cursor-pointer flex flex-col gap-1.5 hover:border-[#1282a2] shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white">{preset.name}</span>
                          <span className="text-[10px] text-[#1282a2] font-bold group-hover:underline flex items-center gap-1">
                            Use Formula &rarr;
                          </span>
                        </div>
                        <div 
                          className="text-sm font-serif text-slate-300 pt-1 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: getKaTeXHtml(preset.latex, false) }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Freehand / Composite Code Tab */}
          {activeTab === 'freehand' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">
                  Composite LaTeX Formula Editor (Combines multiple templates):
                </label>
                <textarea
                  value={freehandLatex}
                  onChange={e => setFreehandLatex(e.target.value)}
                  placeholder="e.g. \frac{1}{2}mv^2 + mgh = E"
                  rows={4}
                  className="w-full p-3 rounded-xl border border-[#034078] bg-[#000f26] text-white font-mono text-sm focus:border-[#1282a2] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Symbol Palette for freehand insertion */}
              <div className="bg-[#001433] p-3 rounded-xl border border-[#034078]/80 space-y-2">
                <div className="flex items-center justify-between border-b border-[#034078]/50 pb-2">
                  <span className="text-[10px] uppercase font-bold text-[#fefcfb]/70 tracking-wider">
                    Click to append symbol to editor:
                  </span>
                  <div className="flex gap-1 overflow-x-auto">
                    {Object.keys(SYMBOL_PALETTES).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSymbolTab(cat)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          symbolTab === cat
                            ? 'bg-[#1282a2] text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {SYMBOL_PALETTES[symbolTab].map(sym => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => insertSymbol(sym.latex)}
                      title={sym.label}
                      className="p-1.5 rounded-lg bg-[#001f54]/60 hover:bg-[#1282a2] border border-[#034078]/50 text-white flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <span 
                        className="text-xs pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: getKaTeXHtml(sym.latex, false) }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="px-5 py-3.5 border-t border-[#034078]/80 bg-[#000f26] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg border border-[#034078] hover:bg-white/5 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy LaTeX
            </button>
            <button
              type="button"
              onClick={() => {
                setFractionSlots({ num: '', den: '' });
                setRadicalSlots({ rad: '', index: '' });
                setFreehandLatex('');
              }}
              className="px-3 py-1.5 rounded-lg border border-[#034078] hover:bg-white/5 text-xs font-bold text-slate-400 transition-colors cursor-pointer"
            >
              Clear Slots
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertToQuestion}
              className="px-5 py-2.5 bg-gradient-to-r from-[#1282a2] to-[#006397] hover:brightness-110 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-[#81c3d7]/30"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Insert Formula into Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
