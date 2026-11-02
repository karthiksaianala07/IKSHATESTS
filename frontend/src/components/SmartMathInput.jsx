import React, { useState, useRef, useEffect, useCallback } from 'react';
import 'mathlive';
import DockedMathRibbon from './DockedMathRibbon';
import LatexRenderer from './LatexRenderer';

/**
 * SmartMathInput
 * Unified, zero-friction math and text editor.
 * Replaces raw LaTeX text typing with true WYSIWYG visual spatial boxes.
 *
 * Props:
 * - value: string (LaTeX / mixed text string)
 * - onChange: (newValue: string) => void
 * - placeholder: string
 * - label: string (optional)
 * - minHeight: string
 * - mode: 'rich' (for questions & explanations) | 'option' (for MCQ options / single formulas)
 */
export default function SmartMathInput({
  value = '',
  onChange,
  placeholder = 'Type question here...',
  label = '',
  minHeight = '90px',
  mode = 'rich'
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [viewSource, setViewSource] = useState(false);
  
  // Interactive Visual Math Canvas for rich mode
  const [activeFormulaBox, setActiveFormulaBox] = useState(null); // { latex: string, mathIdx: number | null, insertPos: number }
  
  const textareaRef = useRef(null);
  const mathfieldRef = useRef(null);
  const formulaComposerRef = useRef(null);

  // Sync value to math-field if in option mode
  useEffect(() => {
    if (mode === 'option' && mathfieldRef.current) {
      if (mathfieldRef.current.value !== (value || '')) {
        mathfieldRef.current.setValue(value || '', { format: 'latex' });
      }
    }
  }, [value, mode]);

  // Sync active formula to formula composer mathfield when opened
  useEffect(() => {
    if (activeFormulaBox && formulaComposerRef.current) {
      formulaComposerRef.current.setValue(activeFormulaBox.latex || '', { format: 'latex' });
      // Give focus to the first placeholder box
      setTimeout(() => {
        if (formulaComposerRef.current) {
          formulaComposerRef.current.focus();
        }
      }, 50);
    }
  }, [activeFormulaBox]);

  // Parse text into segments for interactive visual formula chips
  const parseSegments = useCallback((text) => {
    if (!text) return [];
    const segments = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        segments.push({
          type: 'text',
          content: text.substring(lastIdx, match.index)
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
        raw: rawMatch
      });
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIdx)
      });
    }

    return segments;
  }, []);

  const segments = parseSegments(value);

  // Insert a math template or symbol
  const handleInsert = useCallback(({ latex, isTemplate, symbol }) => {
    if (mode === 'option') {
      // Option mode: Direct insertion into MathLive field with visual blank boxes
      const mf = mathfieldRef.current;
      if (mf) {
        mf.focus();
        if (typeof mf.insert === 'function') {
          mf.insert(latex, {
            mode: 'math',
            selectionMode: isTemplate ? 'placeholder' : 'after',
            format: 'latex'
          });
        }
      }
      return;
    }

    // Rich Question mode:
    // If the interactive formula box is already open, insert directly into that formula
    if (activeFormulaBox && formulaComposerRef.current) {
      const mf = formulaComposerRef.current;
      mf.focus();
      if (typeof mf.insert === 'function') {
        mf.insert(latex, {
          mode: 'math',
          selectionMode: isTemplate ? 'placeholder' : 'after',
          format: 'latex'
        });
      }
      return;
    }

    // If clicking a template (Fraction, Root, Power, Integral, Limit, Derivative, etc.):
    // Open the Interactive Visual Math Box with real blank boxes!
    if (isTemplate) {
      const textarea = textareaRef.current;
      const startPos = textarea ? (textarea.selectionStart ?? value.length) : value.length;
      setActiveFormulaBox({
        latex: latex,
        mathIdx: null, // creating a new formula
        insertPos: startPos
      });
      return;
    }

    // If clicking a simple symbol (±, ×, ÷, ≤, ≥, π, θ, °, ∞):
    // Insert the clean visual character directly at the cursor in the text area!
    const textarea = textareaRef.current;
    const cleanSym = symbol || latex;
    if (!textarea) {
      onChange(value ? `${value} ${cleanSym}` : cleanSym);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + cleanSym + after;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + cleanSym.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 30);
  }, [mode, activeFormulaBox, value, onChange]);

  // Apply formula from visual composer box into the question
  const handleApplyFormula = useCallback(() => {
    if (!activeFormulaBox || !formulaComposerRef.current) return;
    const mf = formulaComposerRef.current;
    let formulaLatex = mf.getValue('latex') || '';

    // If completely empty, just close
    if (!formulaLatex.trim()) {
      setActiveFormulaBox(null);
      return;
    }

    // Clean up empty placeholders to avoid broken rendering
    formulaLatex = formulaLatex.replace(/\\placeholder\{\}/g, '');

    if (activeFormulaBox.mathIdx !== null) {
      // Updating an existing formula chip
      let currentMathCount = 0;
      const updated = segments
        .map((seg) => {
          if (seg.type === 'math') {
            if (currentMathCount === activeFormulaBox.mathIdx) {
              currentMathCount++;
              return `$${formulaLatex.trim()}$`;
            }
            currentMathCount++;
            return seg.raw;
          }
          return seg.content;
        })
        .join('');
      onChange(updated);
    } else {
      // Inserting a new formula at insertPos
      const pos = activeFormulaBox.insertPos ?? value.length;
      const before = value.substring(0, pos);
      const after = value.substring(pos);
      const formattedFormula = `$${formulaLatex.trim()}$`;
      const needsSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
      const prefix = needsSpaceBefore ? ' ' : '';
      const newValue = before + prefix + formattedFormula + (after.startsWith(' ') ? '' : ' ') + after;
      onChange(newValue);
    }

    setActiveFormulaBox(null);
  }, [activeFormulaBox, segments, value, onChange]);

  // Cancel formula composer
  const handleCancelFormula = useCallback(() => {
    setActiveFormulaBox(null);
  }, []);

  // Open an existing formula chip in the visual blank-box composer
  const handleEditFormulaChip = useCallback((mathIdx, latex) => {
    setActiveFormulaBox({
      latex: latex,
      mathIdx: mathIdx,
      insertPos: value.length
    });
  }, [value.length]);

  // Remove a single formula chip
  const handleDeleteFormulaChip = useCallback((mathIdx) => {
    let currentMathCount = 0;
    const updated = segments
      .filter((seg) => {
        if (seg.type === 'math') {
          if (currentMathCount === mathIdx) {
            currentMathCount++;
            return false;
          }
          currentMathCount++;
        }
        return true;
      })
      .map((seg) => (seg.type === 'math' ? seg.raw : seg.content))
      .join('');
    onChange(updated);
  }, [segments, onChange]);

  // Handle ribbon actions (clear, undo)
  const handleRibbonAction = useCallback((action) => {
    if (mode === 'option') {
      const mf = mathfieldRef.current;
      if (!mf) return;
      if (action === 'clear') {
        mf.setValue('');
        onChange('');
      } else if (action === 'undo' && typeof mf.executeCommand === 'function') {
        mf.executeCommand(['undo']);
      }
      return;
    }

    if (activeFormulaBox && formulaComposerRef.current) {
      const mf = formulaComposerRef.current;
      if (action === 'clear') {
        mf.setValue('');
      } else if (action === 'undo' && typeof mf.executeCommand === 'function') {
        mf.executeCommand(['undo']);
      }
      return;
    }

    if (action === 'clear') {
      onChange('');
    } else if (action === 'undo') {
      document.execCommand('undo');
    }
  }, [mode, activeFormulaBox, onChange]);

  // ──────────────────────────────────────────────
  // MODE 1: OPTION / FORMULA INPUT (MCQ Options A, B, C, D)
  // ──────────────────────────────────────────────
  if (mode === 'option') {
    return (
      <div
        className={`relative flex flex-col rounded-lg transition-all duration-200 border ${
          isFocused
            ? 'border-[#1282a2] ring-1 ring-[#1282a2] bg-[#001f54]/90 shadow-md'
            : 'border-[#034078]/60 hover:border-[#1282a2]/50 bg-[#001f54]/70'
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsFocused(false);
          }
        }}
      >
        {/* Docked Ribbon appears on focus */}
        {isFocused && (
          <DockedMathRibbon
            onInsert={handleInsert}
            onAction={handleRibbonAction}
          />
        )}

        {/* Interactive MathLive field with visual spatial boxes */}
        <div className="p-1">
          <math-field
            ref={mathfieldRef}
            style={{
              display: 'block',
              width: '100%',
              minHeight: '38px',
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: '0.95rem',
              outline: 'none',
              border: 'none',
              background: 'transparent'
            }}
            onInput={(e) => onChange(e.target.value)}
          >
            {value}
          </math-field>
        </div>

        {/* Empty state hint */}
        {!value && !isFocused && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none italic">
            {placeholder}
          </span>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // MODE 2: RICH QUESTION & EXPLANATION INPUT
  // ──────────────────────────────────────────────
  return (
    <div
      className={`w-full flex flex-col rounded-xl border transition-all duration-200 ${
        isFocused || activeFormulaBox
          ? 'border-[#1282a2] ring-1 ring-[#1282a2] bg-[#001f54]/85 shadow-lg'
          : 'border-[#034078]/60 hover:border-[#1282a2]/50 bg-[#001f54]/60'
      }`}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocused(false);
        }
      }}
    >
      {/* Top Header with Label & Docked Ribbon */}
      <div className="flex flex-col">
        {label && (
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-xs font-bold uppercase text-[#fefcfb]/70 border-b border-[#034078]/30">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1282a2]"></span>
              {label}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setViewSource(!viewSource)}
              className="text-[10px] text-[#1282a2] hover:text-white lowercase font-mono cursor-pointer transition-colors"
            >
              {viewSource ? 'visual mode' : 'view raw latex'}
            </button>
          </div>
        )}

        {/* Docked Math Ribbon (Always accessible at top of question card) */}
        <DockedMathRibbon
          onInsert={handleInsert}
          onAction={handleRibbonAction}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE VISUAL FORMULA CANVAS (Appears when template selected) */}
      {/* Allows entering values directly in blank boxes!              */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeFormulaBox && (
        <div className="p-3 bg-[#001129] border-y-2 border-[#1282a2] flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <span className="material-symbols-outlined text-sm">widgets</span>
              <span>Visual Formula Canvas (Fill in blank boxes):</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Use arrow keys or click boxes to type values
            </span>
          </div>

          <div className="p-2 bg-[#001f54]/80 rounded-lg border border-[#034078] shadow-inner">
            <math-field
              ref={formulaComposerRef}
              style={{
                display: 'block',
                width: '100%',
                minHeight: '46px',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '1.25rem',
                outline: 'none',
                border: 'none',
                background: 'transparent'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyFormula();
                } else if (e.key === 'Escape') {
                  handleCancelFormula();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelFormula}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#034078]/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyFormula}
              className="px-4 py-1.5 bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>{activeFormulaBox.mathIdx !== null ? 'Update Formula' : 'Insert into Question'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="p-3 space-y-2.5">
        {viewSource ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full bg-slate-950/60 p-2.5 rounded-lg border border-[#034078]/50 text-white font-mono text-xs focus:outline-none focus:border-[#1282a2] resize-y leading-relaxed"
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none resize-y leading-relaxed"
          />
        )}

        {/* Visual In-Place Formula Badges (Click any formula to open visual boxes) */}
        {!viewSource && segments.some((s) => s.type === 'math') && (
          <div className="pt-2 border-t border-[#034078]/40 space-y-2">
            <p className="text-[10px] font-mono font-bold uppercase text-[#1282a2] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">tune</span>
              Visual Formulas in Question (Click any formula to edit in visual boxes):
            </p>
            <div className="flex flex-wrap gap-2">
              {segments.map((seg, idx) => {
                if (seg.type !== 'math') return null;
                const mathIdx = segments.slice(0, idx).filter((s) => s.type === 'math').length;
                const isCurrentlyEditing = activeFormulaBox?.mathIdx === mathIdx;

                return (
                  <div
                    key={idx}
                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all shadow-sm ${
                      isCurrentlyEditing
                        ? 'border-[#1282a2] bg-[#1282a2]/25 ring-1 ring-[#1282a2]'
                        : 'border-[#034078] bg-[#001f54]/90 hover:border-[#1282a2]/80 hover:bg-[#034078]/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleEditFormulaChip(mathIdx, seg.content)}
                      className="cursor-pointer text-white flex items-center gap-1 text-sm leading-relaxed"
                      title="Click to edit formula boxes"
                    >
                      <LatexRenderer text={`$${seg.content}$`} />
                      <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-cyan-300 ml-1">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFormulaChip(mathIdx)}
                      className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                      title="Delete formula"
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
    </div>
  );
}
