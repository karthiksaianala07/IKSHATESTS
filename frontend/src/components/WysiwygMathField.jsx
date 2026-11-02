import React, { useEffect, useRef, useId, useState } from 'react';
import 'mathlive';
import { useMathKeyboard } from '../context/MathKeyboardContext';

/**
 * WysiwygMathField
 * Interactive WYSIWYG Math input powered by MathLive custom element.
 *
 * Props:
 * - value: string (LaTeX representation)
 * - onChange: (latex: string) => void
 * - placeholder: string (optional placeholder)
 * - className: string (extra styling)
 * - autoFocus: boolean
 * - readOnly: boolean
 * - minHeight: string (default: 42px)
 */
export default function WysiwygMathField({
  value = '',
  onChange,
  placeholder = 'Click to enter formula...',
  className = '',
  autoFocus = false,
  readOnly = false,
  minHeight = '42px'
}) {
  const mfRef = useRef(null);
  const internalId = useId();
  const { setActiveField, registerField, isKeyboardOpen, openKeyboard } = useMathKeyboard();
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal MathLive value with external prop if different
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    if (mf.value !== (value || '')) {
      mf.setValue(value || '', { format: 'latex' });
    }
  }, [value]);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // Suppress default OS/system virtual keyboard in favor of our contextual keyboard
    mf.mathVirtualKeyboardPolicy = 'manual';

    // Register with context
    registerField(internalId, mf);

    const handleInput = (ev) => {
      const val = ev.target.value;
      if (onChange) {
        onChange(val);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      setActiveField(internalId, mf);
    };

    const handleBlur = (e) => {
      // Small timeout to allow virtual keyboard clicks to process without immediate closure
      setTimeout(() => {
        if (document.activeElement !== mf) {
          setIsFocused(false);
        }
      }, 150);
    };

    mf.addEventListener('input', handleInput);
    mf.addEventListener('focus', handleFocus);
    mf.addEventListener('blur', handleBlur);

    if (autoFocus) {
      setTimeout(() => mf.focus(), 50);
    }

    return () => {
      mf.removeEventListener('input', handleInput);
      mf.removeEventListener('focus', handleFocus);
      mf.removeEventListener('blur', handleBlur);
    };
  }, [internalId, onChange, setActiveField, registerField, autoFocus]);

  return (
    <div
      className={`relative rounded-lg transition-all duration-200 ${
        isFocused
          ? 'ring-2 ring-[#1282a2] border-transparent shadow-lg shadow-[#1282a2]/20'
          : 'border border-[#034078]/60 hover:border-[#1282a2]/60'
      } bg-[#001f54]/70 ${className}`}
      style={{ minHeight }}
    >
      <math-field
        ref={mfRef}
        read-only={readOnly ? '' : undefined}
        style={{
          display: 'block',
          width: '100%',
          minHeight,
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '1rem',
          outline: 'none',
          cursor: 'text',
          border: 'none',
          background: 'transparent'
        }}
      >
        {value}
      </math-field>

      {/* Floating Keyboard Trigger Indicator */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          if (mfRef.current) {
            mfRef.current.focus();
            openKeyboard();
          }
        }}
        title="Open Visual Math Keyboard"
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-xs transition-opacity cursor-pointer ${
          isFocused ? 'text-[#1282a2] opacity-100' : 'text-slate-400 opacity-40 hover:opacity-100'
        }`}
      >
        <span className="material-symbols-outlined text-base">keyboard</span>
      </button>

      {/* Empty State visual hint */}
      {!value && !isFocused && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none italic">
          {placeholder}
        </span>
      )}
    </div>
  );
}
