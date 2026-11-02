import React, { useState, useRef, useEffect } from 'react';
import WysiwygMathField from './WysiwygMathField';
import LatexRenderer from './LatexRenderer';
import { useMathKeyboard } from '../context/MathKeyboardContext';

/**
 * WysiwygQuestionEditor
 * Hybrid WYSIWYG Question & Explanation Editor.
 * Allows novice users to type plain text naturally and embed visual WYSIWYG Math formulas
 * without ever seeing or typing raw LaTeX syntax.
 *
 * Props:
 * - value: string (e.g. "Calculate the velocity $v = \sqrt{2gh}$")
 * - onChange: (newText: string) => void
 * - placeholder: string
 * - label: string (optional)
 * - minHeight: string
 */
export default function WysiwygQuestionEditor({
  value = '',
  onChange,
  placeholder = 'Type your question here...',
  label = '',
  minHeight = '90px'
}) {
  const { openKeyboard } = useMathKeyboard();
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [currentEditingFormula, setCurrentEditingFormula] = useState('');
  const [formulaIndexToEdit, setFormulaIndexToEdit] = useState(null); // null means creating a new formula
  const [viewMode, setViewMode] = useState('wysiwyg'); // 'wysiwyg' | 'raw'
  const textareaRef = useRef(null);

  // Helper to parse text into segments: text vs formulas
  // Math expressions are delimited by $...$ or $$...$$
  const parseSegments = (rawText) => {
    if (!rawText) return [];
    const segments = [];
    // Regex matching $$...$$ or $...$
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIdx) {
        segments.push({
          type: 'text',
          content: rawText.substring(lastIdx, match.index)
        });
      }
      const rawMatch = match[0];
      const isDisplay = rawMatch.startsWith('$$');
      const innerLatex = isDisplay
        ? rawMatch.slice(2, -2).trim()
        : rawMatch.slice(1, -1).trim();

      segments.push({
        type: 'math',
        content: innerLatex,
        isDisplay,
        raw: rawMatch
      });
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < rawText.length) {
      segments.push({
        type: 'text',
        content: rawText.substring(lastIdx)
      });
    }

    return segments;
  };

  const segments = parseSegments(value);

  // Open the formula composer modal/drawer for creating a new formula
  const handleAddNewFormula = () => {
    setCurrentEditingFormula('');
    setFormulaIndexToEdit(null);
    setIsFormulaModalOpen(true);
    openKeyboard();
  };

  // Open existing formula for visual editing
  const handleEditFormula = (mathIdx, latex) => {
    setCurrentEditingFormula(latex);
    setFormulaIndexToEdit(mathIdx);
    setIsFormulaModalOpen(true);
    openKeyboard();
  };

  // Delete a formula chip
  const handleDeleteFormula = (mathIdx) => {
    let currentMathCount = 0;
    const newSegments = segments.filter((seg) => {
      if (seg.type === 'math') {
        if (currentMathCount === mathIdx) {
          currentMathCount++;
          return false;
        }
        currentMathCount++;
      }
      return true;
    });

    const reconstructed = newSegments
      .map((seg) => (seg.type === 'math' ? `$${seg.content}$` : seg.content))
      .join('');
    onChange(reconstructed);
  };

  // Save changes from formula composer
  const handleSaveFormula = () => {
    if (!currentEditingFormula.trim()) {
      setIsFormulaModalOpen(false);
      return;
    }

    const formattedFormula = `$${currentEditingFormula.trim()}$`;

    if (formulaIndexToEdit === null) {
      // Append formula at the end or at cursor position
      const updated = value ? `${value} ${formattedFormula}` : formattedFormula;
      onChange(updated);
    } else {
      // Replace existing formula
      let currentMathCount = 0;
      const updated = segments
        .map((seg) => {
          if (seg.type === 'math') {
            if (currentMathCount === formulaIndexToEdit) {
              currentMathCount++;
              return formattedFormula;
            }
            currentMathCount++;
            return `$${seg.content}$`;
          }
          return seg.content;
        })
        .join('');
      onChange(updated);
    }

    setIsFormulaModalOpen(false);
    setCurrentEditingFormula('');
    setFormulaIndexToEdit(null);
  };

  // Handle direct text updates in WYSIWYG content editable or textarea
  const handleTextChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full space-y-2">
      {/* Header bar with controls */}
      <div className="flex items-center justify-between">
        {label ? (
          <label className="text-xs font-bold uppercase text-[#fefcfb]/70 flex items-center gap-1.5">
            {label}
          </label>
        ) : <div />}

        <div className="flex items-center gap-2">
          {/* Add Math Formula Button */}
          <button
            type="button"
            onClick={handleAddNewFormula}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1282a2] hover:bg-[#1282a2]/80 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">functions</span>
            <span>+ Add Math Formula</span>
          </button>

          {/* Toggle between WYSIWYG & LaTeX Source for advanced users */}
          <div className="flex items-center bg-[#001f54]/70 p-0.5 rounded-lg border border-[#034078]/50 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('wysiwyg')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'wysiwyg'
                  ? 'bg-[#034078] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-[#034078] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LaTeX
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Canvas */}
      {viewMode === 'raw' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-3 rounded-lg border border-[#034078]/60 bg-[#001f54]/70 text-white placeholder-slate-400 text-sm focus:border-[#1282a2] focus:outline-none leading-relaxed"
        />
      ) : (
        <div className="rounded-lg border border-[#034078]/60 bg-[#001f54]/70 p-3 space-y-2.5 transition-all focus-within:border-[#1282a2]">
          {/* Plain Text input area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none resize-y leading-relaxed"
          />

          {/* Visual Math Chips Section (WYSIWYG Badges) */}
          {segments.some((s) => s.type === 'math') && (
            <div className="pt-2 border-t border-[#034078]/40">
              <p className="text-[10px] font-mono font-bold uppercase text-[#1282a2] mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">tune</span>
                Visual Formulas in Question (Click to edit visually):
              </p>
              <div className="flex flex-wrap gap-2">
                {segments.map((seg, idx) => {
                  if (seg.type !== 'math') return null;
                  const mathIdx = segments.slice(0, idx).filter((s) => s.type === 'math').length;

                  return (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001433] border border-[#1282a2]/40 hover:border-[#1282a2] transition-all shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleEditFormula(mathIdx, seg.content)}
                        className="text-white text-sm cursor-pointer flex items-center gap-1"
                        title="Click to edit formula in visual editor"
                      >
                        <LatexRenderer text={`$${seg.content}$`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFormula(mathIdx)}
                        title="Remove formula"
                        className="text-slate-400 hover:text-red-400 p-0.5 rounded cursor-pointer opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Formula Composer Modal */}
      {isFormulaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#001433] border border-[#034078] rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#034078]/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1282a2]/20 flex items-center justify-center text-[#1282a2]">
                  <span className="material-symbols-outlined text-base">functions</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {formulaIndexToEdit === null ? 'Create Visual Formula' : 'Edit Visual Formula'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Use physical keys or the slide-up keyboard below to build spatial fractions, roots, etc.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormulaModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Interactive WYSIWYG Math Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#1282a2] uppercase tracking-wide">
                Interactive Formula Canvas:
              </label>
              <WysiwygMathField
                value={currentEditingFormula}
                onChange={setCurrentEditingFormula}
                placeholder="Click here and select a template (e.g. Fraction) from keyboard below..."
                minHeight="54px"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#034078]/50">
              <button
                type="button"
                onClick={() => setIsFormulaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#034078]/50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFormula}
                className="px-5 py-2 text-xs font-bold bg-[#1282a2] hover:bg-[#1282a2]/80 text-white rounded-lg shadow-md shadow-[#1282a2]/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>{formulaIndexToEdit === null ? 'Insert Formula' : 'Update Formula'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
