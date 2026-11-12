import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'mathlive';
import DockedMathRibbon from './DockedMathRibbon';
import { normalizePastedMath } from '../utils/mathPasteNormalizer';
import { API_URL } from '../config/api';

/**
 * Strip leading \displaystyle when reading LaTeX back so stored DB text stays clean.
 */
function stripDisplayStyle(latex) {
  if (!latex) return '';
  return latex.replace(/^\\displaystyle\s*/, '').trim();
}

/**
 * Prefix \displaystyle when displaying in MathLive so limits, sums, integrals, and fractions stack vertically.
 */
function withDisplayStyle(latex) {
  const clean = stripDisplayStyle(latex);
  if (!clean) return '';
  return `\\displaystyle ${clean}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders a LaTeX formula to KaTeX HTML using \displaystyle so fractions,
 * limits, integrals, and sums preserve their full stacked multiline proportions
 * while blending naturally inline inside the text box.
 */
function renderAtomHtml(latex) {
  let clean = stripDisplayStyle(latex || '');
  if (!clean) {
    return '<span style="opacity:0.5;font-style:italic;font-size:0.85em;">[formula]</span>';
  }
  clean = clean
    .replace(/\\begin\{align\*?\}/g, '\\begin{aligned}')
    .replace(/\\end\{align\*?\}/g, '\\end{aligned}');

  const displayLatex =
    clean.startsWith('\\displaystyle') || clean.startsWith('\\textstyle')
      ? clean
      : `\\displaystyle ${clean}`;
  try {
    return katex.renderToString(displayLatex, { displayMode: false, throwOnError: false });
  } catch (e) {
    return escapeHtml(clean);
  }
}

/**
 * Creates a non-editable inline DOM math atom blended smoothly with surrounding text.
 */
function createMathAtomNode(doc, latex, isBlock = false, isEditing = false) {
  const span = doc.createElement('span');
  span.setAttribute('contenteditable', 'false');
  span.dataset.math = '1';
  span.dataset.latex = stripDisplayStyle(latex);
  if (isBlock) span.dataset.display = 'block';
  span.className = `smart-math-atom inline-block align-middle mx-0.5 px-1 py-0.5 rounded transition-colors cursor-pointer select-none ${
    isEditing
      ? 'bg-[#1282a2]/25 ring-1 ring-[#1282a2]'
      : 'hover:bg-[#1282a2]/15'
  }`;
  span.title = 'Click to edit formula visually';
  span.innerHTML = renderAtomHtml(latex);
  return span;
}

/**
 * Splits a mixed string into plain text and math segments.
 */
function parseSegments(text) {
  if (!text) return [];
  const segments = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
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
    let innerLatex = '';
    let isBlock = false;
    if (rawMatch.startsWith('$$')) {
      innerLatex = rawMatch.slice(2, -2).trim();
      isBlock = /\\begin\{(?:aligned|cases|matrix|pmatrix|bmatrix|vmatrix)/.test(innerLatex);
    } else if (rawMatch.startsWith('$')) {
      innerLatex = rawMatch.slice(1, -1).trim();
    } else if (rawMatch.startsWith('\\[')) {
      innerLatex = rawMatch.slice(2, -2).trim();
      isBlock = /\\begin\{(?:aligned|cases|matrix|pmatrix|bmatrix|vmatrix)/.test(innerLatex);
    } else if (rawMatch.startsWith('\\(')) {
      innerLatex = rawMatch.slice(2, -2).trim();
    }

    segments.push({
      type: 'math',
      content: innerLatex,
      isBlock,
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
}

/**
 * Builds DOM nodes from a mixed text + LaTeX string inside a container element.
 */
function populateElementFromValue(container, text) {
  const doc = container.ownerDocument || document;
  container.innerHTML = '';
  if (!text) return;

  const segs = parseSegments(text);
  segs.forEach((seg) => {
    if (seg.type === 'math') {
      container.appendChild(createMathAtomNode(doc, seg.content, seg.isBlock));
    } else {
      const lines = seg.content.split('\n');
      lines.forEach((line, i) => {
        if (i > 0) container.appendChild(doc.createElement('br'));
        if (line.length > 0) {
          container.appendChild(doc.createTextNode(line));
        }
      });
    }
  });
}

/**
 * Serializes the contentEditable DOM back into standard plain text + $...$ / $$...$$ LaTeX.
 */
function serializeDomToValue(root) {
  if (!root) return '';
  let out = '';

  const walk = (node, isFirstRootChild = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node.textContent || '').replace(/\u200B/g, '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node;
    if (el.dataset && el.dataset.math === '1') {
      const latex = stripDisplayStyle(el.dataset.latex || '');
      const isBlock = el.dataset.display === 'block';
      if (latex) {
        out += isBlock ? `$$${latex}$$` : `$${latex}$`;
      }
      return;
    }

    const tag = el.tagName;
    if (tag === 'BR') {
      out += '\n';
      return;
    }

    if (tag === 'DIV' || tag === 'P') {
      if (!isFirstRootChild && out.length > 0 && !out.endsWith('\n')) {
        out += '\n';
      }
      const children = Array.from(el.childNodes);
      if (
        children.length === 1 &&
        children[0].nodeType === Node.ELEMENT_NODE &&
        children[0].tagName === 'BR'
      ) {
        if (isFirstRootChild) out += '\n';
        return;
      }
      children.forEach((child) => walk(child, false));
      return;
    }

    Array.from(el.childNodes).forEach((child) => walk(child, false));
  };

  Array.from(root.childNodes).forEach((child, idx) => walk(child, idx === 0));
  return out;
}

/**
 * MathTextEditor (SmartMathInput)
 * Unified, natural inline WYSIWYG math and text editor.
 * - Formulas blend naturally inline with text inside a single text box
 * - Retains stacked multiline formatting (\displaystyle) for fractions, limits, integrals, and sums
 * - Click any formula to edit its visual MathLive boxes in place
 */
export default function MathTextEditor({
  value = '',
  onChange,
  placeholder = 'Type question here...',
  label = '',
  minHeight = '90px',
  mode = 'rich',
  onImagePasted = null
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [viewSource, setViewSource] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [editingMathLatex, setEditingMathLatex] = useState(null);

  const editorRef = useRef(null);
  const rawTextareaRef = useRef(null);
  const mathfieldRef = useRef(null);
  const inlineMathEditorRef = useRef(null);

  const editingAtomElRef = useRef(null);
  const savedRangeRef = useRef(null);
  const latestValueRef = useRef(value);
  const lastSerializedRef = useRef(null);
  const optionLastEmittedRef = useRef(null);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Sync value to math-field if in option mode
  useEffect(() => {
    if (mode === 'option' && mathfieldRef.current) {
      const cleanIncoming = stripDisplayStyle(value || '');
      const currentVal = stripDisplayStyle(
        mathfieldRef.current.getValue?.('latex') || mathfieldRef.current.value || ''
      );
      if (cleanIncoming !== optionLastEmittedRef.current && cleanIncoming !== currentVal) {
        optionLastEmittedRef.current = cleanIncoming;
        mathfieldRef.current.setValue(withDisplayStyle(cleanIncoming), { format: 'latex' });
      }
    }
  }, [value, mode]);

  // Sync external `value` changes into the contentEditable box without disrupting active typing cursor
  useEffect(() => {
    if (mode !== 'rich' || viewSource || !editorRef.current) return;
    if (value !== lastSerializedRef.current) {
      lastSerializedRef.current = value;
      populateElementFromValue(editorRef.current, value || '');
      editingAtomElRef.current = null;
      setEditingMathLatex(null);
    }
  }, [value, mode, viewSource]);

  // Sync in-place MathLive editor when an equation atom is clicked
  useEffect(() => {
    if (editingMathLatex !== null && inlineMathEditorRef.current) {
      const mf = inlineMathEditorRef.current;
      mf.setValue(withDisplayStyle(editingMathLatex), { format: 'latex' });
      setTimeout(() => {
        try {
          mf.focus();
        } catch (e) {}
      }, 30);
    }
  }, [editingMathLatex !== null]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const emitDomChange = useCallback(() => {
    if (!editorRef.current) return;
    const serialized = serializeDomToValue(editorRef.current);
    lastSerializedRef.current = serialized;
    onChange(serialized);
  }, [onChange]);

  const extractClipboardImage = (clipboardData, htmlText) => {
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) return { file: f, dataUrl: null };
        }
      }
    }
    const files = clipboardData.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type && files[i].type.startsWith('image/')) {
          return { file: files[i], dataUrl: null };
        }
      }
    }
    if (htmlText) {
      const dataUriMatch = htmlText.match(/<img[^>]+src=["'](data:image\/[^"']+)["']/i);
      if (dataUriMatch && dataUriMatch[1]) {
        return { file: null, dataUrl: dataUriMatch[1] };
      }
    }
    return null;
  };

  const hasUsableMathOrText = (plainText, htmlText) => {
    const cleanPlain = (plainText || '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^[ \t]*%[^\r\n]*(?:\r?\n|$)/gm, '')
      .trim();
    if (cleanPlain.length > 0) return true;
    if (
      htmlText &&
      (htmlText.includes('<math') ||
        htmlText.includes('m:oMath') ||
        htmlText.includes('omath') ||
        htmlText.includes('class="katex') ||
        htmlText.includes('class="MathJax'))
    ) {
      return true;
    }
    return false;
  };

  const processFormulaImage = async (imgSource, onSuccessLatex, onFallbackUrl) => {
    const runWithBase64 = async (base64Data) => {
      let finalUrl = base64Data;
      try {
        const uploadRes = await axios.post(`${API_URL}/api/admin/upload-image`, {
          base64Data,
          filename: `pasted_formula_${Date.now()}.png`
        });
        if (uploadRes.data?.publicUrl) {
          finalUrl = uploadRes.data.publicUrl;
        }
      } catch (upErr) {
        console.warn('[MathTextEditor] Image upload warning:', upErr.message);
      }

      let transcribedLatex = null;
      try {
        const ocrRes = await axios.post(`${API_URL}/api/admin/ocr-formula`, {
          image: finalUrl
        });
        if (ocrRes.data?.success && ocrRes.data?.latex) {
          transcribedLatex = ocrRes.data.latex.trim();
        }
      } catch (ocrErr) {
        console.log('[MathTextEditor] OCR transcription skipped:', ocrErr.message);
      }

      if (transcribedLatex) {
        onSuccessLatex(transcribedLatex, finalUrl);
      } else {
        if (typeof onImagePasted === 'function') {
          onImagePasted(finalUrl);
        }
        onFallbackUrl(finalUrl);
      }
    };

    if (imgSource.dataUrl) {
      await runWithBase64(imgSource.dataUrl);
    } else if (imgSource.file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64Data = evt.target?.result;
        if (base64Data) await runWithBase64(base64Data);
      };
      reader.readAsDataURL(imgSource.file);
    }
  };

  const insertNormalizedAtCaret = useCallback((textWithLatex) => {
    const editor = editorRef.current;
    if (!editor) return;
    const doc = editor.ownerDocument || document;

    let range = savedRangeRef.current;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
    }

    const frag = doc.createDocumentFragment();
    const segs = parseSegments(textWithLatex);
    let lastInsertedNode = null;

    segs.forEach((seg) => {
      if (seg.type === 'math') {
        const atom = createMathAtomNode(doc, seg.content, seg.isBlock);
        frag.appendChild(atom);
        lastInsertedNode = atom;
      } else {
        const lines = seg.content.split('\n');
        lines.forEach((line, i) => {
          if (i > 0) {
            const br = doc.createElement('br');
            frag.appendChild(br);
            lastInsertedNode = br;
          }
          if (line.length > 0) {
            const tn = doc.createTextNode(line);
            frag.appendChild(tn);
            lastInsertedNode = tn;
          }
        });
      }
    });

    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(frag);
    } else {
      editor.appendChild(frag);
    }

    if (lastInsertedNode && sel) {
      const newRange = doc.createRange();
      newRange.setStartAfter(lastInsertedNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    }

    emitDomChange();
  }, [emitDomChange]);

  const handleVisualEditorPaste = useCallback(async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const plainText = clipboardData.getData('text/plain') || '';
    const htmlText = clipboardData.getData('text/html') || '';
    const clipboardImage = extractClipboardImage(clipboardData, htmlText);

    if (hasUsableMathOrText(plainText, htmlText)) {
      const normalized = normalizePastedMath(plainText, htmlText, { mode: 'rich' });
      if (normalized && normalized.trim().length > 0) {
        e.preventDefault();
        e.stopPropagation();
        saveSelection();
        insertNormalizedAtCaret(normalized);
        return;
      }
    }

    if (clipboardImage) {
      e.preventDefault();
      e.stopPropagation();
      saveSelection();
      const editor = editorRef.current;
      const doc = editor?.ownerDocument || document;
      const placeholderSpan = doc.createElement('span');
      placeholderSpan.textContent = ' ⏳ [Transcribing Formula...] ';
      placeholderSpan.className = 'text-amber-300 text-xs font-mono';

      const sel = window.getSelection();
      if (savedRangeRef.current && editor?.contains(savedRangeRef.current.commonAncestorContainer)) {
        savedRangeRef.current.deleteContents();
        savedRangeRef.current.insertNode(placeholderSpan);
      } else {
        editor?.appendChild(placeholderSpan);
      }
      setIsTranscribing(true);

      await processFormulaImage(
        clipboardImage,
        (latex) => {
          setIsTranscribing(false);
          const clean = stripDisplayStyle(latex.replace(/^\$+|\$+$/g, '').trim());
          const atom = createMathAtomNode(doc, clean, false);
          if (placeholderSpan.parentNode) {
            placeholderSpan.parentNode.replaceChild(atom, placeholderSpan);
          } else {
            editor?.appendChild(atom);
          }
          if (sel) {
            const nr = doc.createRange();
            nr.setStartAfter(atom);
            nr.collapse(true);
            sel.removeAllRanges();
            sel.addRange(nr);
            savedRangeRef.current = nr.cloneRange();
          }
          emitDomChange();
        },
        (url) => {
          setIsTranscribing(false);
          const fallbackNode = doc.createTextNode(`\n![Formula](${url})\n`);
          if (placeholderSpan.parentNode) {
            placeholderSpan.parentNode.replaceChild(fallbackNode, placeholderSpan);
          }
          emitDomChange();
        }
      );
    }
  }, [saveSelection, insertNormalizedAtCaret, emitDomChange]);

  const handleRawTextareaPaste = useCallback(async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const plainText = clipboardData.getData('text/plain') || '';
    const htmlText = clipboardData.getData('text/html') || '';
    const clipboardImage = extractClipboardImage(clipboardData, htmlText);

    if (hasUsableMathOrText(plainText, htmlText)) {
      const normalized = normalizePastedMath(plainText, htmlText, { mode: 'rich' });
      if (normalized && normalized.trim().length > 0) {
        e.preventDefault();
        const textarea = rawTextareaRef.current || e.target;
        const curVal = latestValueRef.current || '';
        const start = textarea ? (textarea.selectionStart ?? curVal.length) : curVal.length;
        const end = textarea ? (textarea.selectionEnd ?? curVal.length) : curVal.length;
        onChange(curVal.substring(0, start) + normalized + curVal.substring(end));
        return;
      }
    }

    if (clipboardImage) {
      e.preventDefault();
      const textarea = rawTextareaRef.current || e.target;
      const curVal = latestValueRef.current || '';
      const start = textarea ? (textarea.selectionStart ?? curVal.length) : curVal.length;
      const end = textarea ? (textarea.selectionEnd ?? curVal.length) : curVal.length;
      const placeholderMarker = `⏳ [Transcribing Formula...]`;
      onChange(curVal.substring(0, start) + placeholderMarker + curVal.substring(end));
      setIsTranscribing(true);

      await processFormulaImage(
        clipboardImage,
        (latex) => {
          setIsTranscribing(false);
          const latest = latestValueRef.current || '';
          onChange(
            latest.includes(placeholderMarker)
              ? latest.replace(placeholderMarker, ` ${latex} `)
              : latest + ` ${latex} `
          );
        },
        (url) => {
          setIsTranscribing(false);
          const latest = latestValueRef.current || '';
          onChange(
            latest.includes(placeholderMarker)
              ? latest.replace(placeholderMarker, `\n![Formula](${url})\n`)
              : latest + `\n![Formula](${url})\n`
          );
        }
      );
    }
  }, [onChange]);

  const handleOptionPaste = useCallback(async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const plainText = clipboardData.getData('text/plain') || '';
    const htmlText = clipboardData.getData('text/html') || '';
    const clipboardImage = extractClipboardImage(clipboardData, htmlText);

    if (hasUsableMathOrText(plainText, htmlText)) {
      const normalized = normalizePastedMath(plainText, htmlText, { mode: 'option' });
      if (normalized && normalized.trim().length > 0) {
        e.preventDefault();
        e.stopPropagation();
        const mf = mathfieldRef.current;
        if (mf) {
          if (typeof mf.insert === 'function') {
            mf.insert(normalized, { mode: 'math', format: 'latex' });
          } else {
            mf.setValue(withDisplayStyle(normalized), { format: 'latex' });
          }
          mf.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          onChange(normalized);
        }
        return;
      }
    }

    if (clipboardImage) {
      e.preventDefault();
      e.stopPropagation();
      setIsTranscribing(true);
      await processFormulaImage(
        clipboardImage,
        (latex) => {
          setIsTranscribing(false);
          let clean = stripDisplayStyle(latex.trim());
          if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length >= 4) clean = clean.slice(2, -2).trim();
          else if (clean.startsWith('$') && clean.endsWith('$') && clean.length >= 2) clean = clean.slice(1, -1).trim();
          const mf = mathfieldRef.current;
          if (mf) {
            if (typeof mf.insert === 'function') mf.insert(clean, { mode: 'math', format: 'latex' });
            else mf.setValue(withDisplayStyle(clean), { format: 'latex' });
            mf.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            onChange(clean);
          }
        },
        () => setIsTranscribing(false)
      );
    }
  }, [onChange]);

  const handleEditorClick = useCallback((e) => {
    const atomEl = e.target.closest?.('[data-math="1"]');
    if (atomEl && editorRef.current?.contains(atomEl)) {
      e.preventDefault();
      if (editingAtomElRef.current && editingAtomElRef.current !== atomEl) {
        editingAtomElRef.current.classList.remove('bg-[#1282a2]/25', 'ring-1', 'ring-[#1282a2]');
        editingAtomElRef.current.classList.add('hover:bg-[#1282a2]/15');
      }
      editingAtomElRef.current = atomEl;
      atomEl.classList.remove('hover:bg-[#1282a2]/15');
      atomEl.classList.add('bg-[#1282a2]/25', 'ring-1', 'ring-[#1282a2]');
      setEditingMathLatex(atomEl.dataset.latex || '');
    } else {
      if (editingAtomElRef.current) {
        editingAtomElRef.current.classList.remove('bg-[#1282a2]/25', 'ring-1', 'ring-[#1282a2]');
        editingAtomElRef.current.classList.add('hover:bg-[#1282a2]/15');
        editingAtomElRef.current = null;
        setEditingMathLatex(null);
      }
      saveSelection();
    }
  }, [saveSelection]);

  const finishEditingMathAtom = useCallback(() => {
    const atomEl = editingAtomElRef.current;
    if (atomEl) {
      atomEl.classList.remove('bg-[#1282a2]/25', 'ring-1', 'ring-[#1282a2]');
      atomEl.classList.add('hover:bg-[#1282a2]/15');
      if (editorRef.current) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.setStartAfter(atomEl);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
        savedRangeRef.current = range.cloneRange();
        editorRef.current.focus();
      }
    }
    editingAtomElRef.current = null;
    setEditingMathLatex(null);
  }, []);

  const deleteEditingMathAtom = useCallback(() => {
    const atomEl = editingAtomElRef.current;
    if (atomEl && atomEl.parentNode) {
      atomEl.parentNode.removeChild(atomEl);
      emitDomChange();
    }
    editingAtomElRef.current = null;
    setEditingMathLatex(null);
    editorRef.current?.focus();
  }, [emitDomChange]);

  const handleInsert = useCallback(({ latex, isTemplate, symbol }) => {
    if (mode === 'option') {
      const mf = mathfieldRef.current;
      if (mf) {
        mf.focus();
        if (typeof mf.insert === 'function') {
          mf.insert(latex, {
            mode: 'math',
            selectionMode: isTemplate ? 'placeholder' : 'after',
            format: 'latex'
          });
          mf.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      return;
    }

    if (!viewSource && editingAtomElRef.current && inlineMathEditorRef.current) {
      const mf = inlineMathEditorRef.current;
      mf.focus();
      if (typeof mf.insert === 'function') {
        mf.insert(latex, {
          mode: 'math',
          selectionMode: isTemplate ? 'placeholder' : 'after',
          format: 'latex'
        });
        mf.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }

    if (viewSource) {
      const textarea = rawTextareaRef.current;
      const insertText = isTemplate ? `$${latex}$` : (symbol || latex);
      const curVal = latestValueRef.current || '';
      const start = textarea ? (textarea.selectionStart ?? curVal.length) : curVal.length;
      const end = textarea ? (textarea.selectionEnd ?? curVal.length) : curVal.length;
      onChange(curVal.substring(0, start) + insertText + curVal.substring(end));
      return;
    }

    if (isTemplate) {
      const editor = editorRef.current;
      if (!editor) return;
      const doc = editor.ownerDocument || document;
      const atom = createMathAtomNode(doc, latex, false, true);

      const sel = window.getSelection();
      let range = savedRangeRef.current;
      if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        range = sel.getRangeAt(0);
      }

      if (range && editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(atom);
      } else {
        editor.appendChild(atom);
      }

      if (editingAtomElRef.current && editingAtomElRef.current !== atom) {
        editingAtomElRef.current.classList.remove('bg-[#1282a2]/25', 'ring-1', 'ring-[#1282a2]');
      }
      editingAtomElRef.current = atom;
      setEditingMathLatex(latex);
      emitDomChange();
      return;
    }

    const cleanSym = symbol || latex;
    insertNormalizedAtCaret(cleanSym);
    editorRef.current?.focus();
  }, [mode, viewSource, onChange, emitDomChange, insertNormalizedAtCaret]);

  const handleRibbonAction = useCallback((action) => {
    if (mode === 'option') {
      const mf = mathfieldRef.current;
      if (!mf) return;
      if (action === 'clear') {
        mf.setValue('');
        optionLastEmittedRef.current = '';
        onChange('');
      } else if (action === 'undo' && typeof mf.executeCommand === 'function') {
        mf.executeCommand(['undo']);
      }
      return;
    }

    if (action === 'clear') {
      if (editorRef.current) editorRef.current.innerHTML = '';
      editingAtomElRef.current = null;
      savedRangeRef.current = null;
      setEditingMathLatex(null);
      lastSerializedRef.current = '';
      onChange('');
    } else if (action === 'undo') {
      if (editingMathLatex !== null && inlineMathEditorRef.current?.executeCommand) {
        inlineMathEditorRef.current.executeCommand(['undo']);
      } else {
        document.execCommand('undo');
        emitDomChange();
      }
    }
  }, [mode, editingMathLatex, onChange, emitDomChange]);

  const mathLiveCleanStyles = (
    <style>{`
      math-field::part(virtual-keyboard-toggle),
      math-field::part(menu-toggle) {
        display: none !important;
      }
      .smart-math-atom .katex {
        font-size: 1.08em;
      }
    `}</style>
  );

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
        {mathLiveCleanStyles}
        {isFocused && (
          <DockedMathRibbon
            onInsert={handleInsert}
            onAction={handleRibbonAction}
          />
        )}

        <div className="p-1">
          <math-field
            ref={mathfieldRef}
            style={{
              display: 'block',
              width: '100%',
              minHeight: '42px',
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
              border: 'none',
              background: 'transparent'
            }}
            onInput={(e) => {
              const raw = e.target.getValue ? e.target.getValue('latex') : e.target.value;
              const clean = stripDisplayStyle(raw || '');
              optionLastEmittedRef.current = clean;
              onChange(clean);
            }}
            onPaste={handleOptionPaste}
          />
        </div>

        {!value && !isFocused && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none italic">
            {placeholder}
          </span>
        )}
      </div>
    );
  }

  const isEmpty = !value || value.trim().length === 0;

  return (
    <div
      className={`w-full flex flex-col rounded-xl border transition-all duration-200 ${
        isFocused || editingMathLatex !== null
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
      {mathLiveCleanStyles}

      <div className="flex flex-col">
        {label && (
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-xs font-bold uppercase text-[#fefcfb]/70 border-b border-[#034078]/30">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1282a2]"></span>
              {label}
              {isTranscribing && (
                <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1 animate-pulse ml-2">
                  <span className="material-symbols-outlined text-xs">auto_awesome</span>
                  Transcribing Formula Image...
                </span>
              )}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setViewSource(!viewSource)}
              className="text-[10px] text-[#1282a2] hover:text-white lowercase font-mono cursor-pointer transition-colors"
            >
              {viewSource ? 'visual text mode' : 'view raw latex'}
            </button>
          </div>
        )}

        <DockedMathRibbon
          onInsert={handleInsert}
          onAction={handleRibbonAction}
        />
      </div>

      <div className="relative p-3">
        {viewSource ? (
          <textarea
            ref={rawTextareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handleRawTextareaPaste}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full bg-slate-950/60 p-2.5 rounded-lg border border-[#034078]/50 text-white font-mono text-xs focus:outline-none focus:border-[#1282a2] resize-y leading-relaxed"
          />
        ) : (
          <div className="relative">
            {isEmpty && !isFocused && (
              <div className="absolute top-0 left-0 text-sm text-slate-400 pointer-events-none select-none">
                {placeholder}
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={emitDomChange}
              onClick={handleEditorClick}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              onPaste={handleVisualEditorPaste}
              style={{ minHeight }}
              className="w-full bg-transparent text-white text-sm focus:outline-none leading-loose whitespace-pre-wrap break-words"
            />
          </div>
        )}
      </div>

      {!viewSource && editingMathLatex !== null && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-[#00122e] border border-[#1282a2]/60 flex items-center gap-2 shadow-inner animate-in fade-in duration-150">
          <span className="text-[10px] font-mono uppercase text-cyan-300 shrink-0">
            Edit Formula:
          </span>
          <div className="flex-1 min-w-[80px] overflow-x-auto">
            <math-field
              ref={inlineMathEditorRef}
              style={{
                display: 'block',
                width: '100%',
                minHeight: '36px',
                padding: '2px 6px',
                color: '#ffffff',
                fontSize: '1.08rem',
                outline: 'none',
                border: 'none',
                background: 'transparent'
              }}
              onInput={(e) => {
                const raw = e.target.getValue ? e.target.getValue('latex') : e.target.value;
                const clean = stripDisplayStyle(raw || '');
                const atomEl = editingAtomElRef.current;
                if (atomEl) {
                  atomEl.dataset.latex = clean;
                  atomEl.innerHTML = renderAtomHtml(clean);
                  emitDomChange();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.preventDefault();
                  finishEditingMathAtom();
                }
              }}
            />
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteEditingMathAtom}
            title="Remove this formula"
            className="px-2 py-1 rounded text-[10px] font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer transition-colors"
          >
            Remove
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={finishEditingMathAtom}
            className="px-2.5 py-1 rounded bg-[#1282a2] hover:bg-[#159cc2] text-[#0a1128] text-[10px] font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

