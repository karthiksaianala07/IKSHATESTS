/**
 * mathPasteNormalizer.js
 * Universal Mathematical Paste Normalizer
 * Specially engineered for Indian educator workflows:
 * - Microsoft Word (OMML equations & MathML)
 * - MathType (MTEF, TeX translators, MathML translators, nested braces, font macros)
 * - Adobe PageMaker (ASCII linear math, symbol fonts, derivatives, roots, limits)
 * - Web educational sites (Doubtnut, Vedantu, Byju's, Khan Academy, Wikipedia, KaTeX, MathJax)
 * - Standard Unicode math and raw unwrapped LaTeX
 */

// Mapping of Unicode superscripts to standard digits/symbols
const SUPERSCRIPT_MAP = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
  'ⁿ': 'n', 'ⁱ': 'i', 'ˣ': 'x', 'ʸ': 'y'
};

// Mapping of Unicode subscripts
const SUBSCRIPT_MAP = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't'
};

// Common Greek letters
const GREEK_MAP = {
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
  'ε': '\\epsilon', 'ϵ': '\\varepsilon', 'ζ': '\\zeta', 'η': '\\eta',
  'θ': '\\theta', 'ϑ': '\\vartheta', 'ι': '\\iota', 'κ': '\\kappa',
  'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi',
  'π': '\\pi', 'ϖ': '\\varpi', 'ρ': '\\rho', 'ϱ': '\\varrho',
  'σ': '\\sigma', 'ς': '\\varsigma', 'τ': '\\tau', 'υ': '\\upsilon',
  'φ': '\\phi', 'ϕ': '\\varphi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
  'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda',
  'Ξ': '\\Xi', 'Π': '\\Pi', 'Σ': '\\Sigma', 'Υ': '\\Upsilon',
  'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega'
};

// Math symbols and operators
const MATH_SYMBOLS_MAP = {
  '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div',
  '≠': '\\neq', '≤': '\\le', '≥': '\\ge', '≈': '\\approx',
  '≡': '\\equiv', '∝': '\\propto', '∞': '\\infty',
  '→': '\\to', '⟶': '\\to', '⇒': '\\implies', '⟹': '\\implies',
  '⇔': '\\iff', '⟺': '\\iff', '←': '\\gets',
  '∂': '\\partial', '∇': '\\nabla',
  '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
  '∑': '\\sum', '∏': '\\prod',
  '∈': '\\in', '∉': '\\notin', '⊂': '\\subset', '⊆': '\\subseteq',
  '∪': '\\cup', '∩': '\\cap', '∧': '\\land', '∨': '\\lor',
  '¬': '\\neg', '∀': '\\forall', '∃': '\\exists',
  'ℏ': '\\hbar', 'Å': '\\text{\\AA}', '°': '^\\circ',
  '·': '\\cdot', '•': '\\cdot', '…': '\\dots'
};

// Common vulgar fractions
const FRACTION_MAP = {
  '½': '\\frac{1}{2}', '⅓': '\\frac{1}{3}', '¼': '\\frac{1}{4}',
  '¾': '\\frac{3}{4}', '⅔': '\\frac{2}{3}', '⅕': '\\frac{1}{5}',
  '⅖': '\\frac{2}{5}', '⅗': '\\frac{3}{5}', '⅘': '\\frac{4}{5}',
  '⅙': '\\frac{1}{6}', '⅚': '\\frac{5}{6}', '⅛': '\\frac{1}{8}',
  '⅜': '\\frac{3}{8}', '⅝': '\\frac{5}{8}', '⅞': '\\frac{7}{8}'
};

/**
 * Converts a DOM node containing MathML or Word OMML into a clean LaTeX string.
 */
export function convertMathMlNodeToLatex(node) {
  if (!node) return '';

  // 1. Text node
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.trim();
  }

  // Only element nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  // Strip XML namespace prefix (e.g. "m:f" -> "f", "m:oMath" -> "omath")
  const rawTagName = node.tagName.toLowerCase();
  const tagName = rawTagName.replace(/^[a-z0-9]+:/i, '');

  // 2. Direct TeX annotation check (KaTeX, MathJax, MathType often provide this)
  if (tagName === 'annotation' || tagName === 'semantics') {
    const encoding = (node.getAttribute('encoding') || '').toLowerCase();
    if (encoding.includes('tex') || encoding.includes('latex')) {
      return node.textContent.trim();
    }
    const annot = node.querySelector('annotation[encoding*="tex"], annotation[encoding*="TeX"], annotation[encoding*="latex"]');
    if (annot) {
      return annot.textContent.trim();
    }
  }

  const children = Array.from(node.childNodes).filter((c) => {
    if (c.nodeType === Node.TEXT_NODE) return c.textContent.trim().length > 0;
    return c.nodeType === Node.ELEMENT_NODE;
  });

  const getChildLatex = (idx) => (children[idx] ? convertMathMlNodeToLatex(children[idx]) : '');
  const getAllChildrenLatex = () => children.map(convertMathMlNodeToLatex).join(' ').trim();
  const findChildByTag = (tag) =>
    children.find((c) => c.nodeName.toLowerCase().replace(/^[a-z0-9]+:/i, '') === tag);

  switch (tagName) {
    // ── ROOT & WRAPPER CONTAINERS ──
    case 'math':
    case 'omath':
    case 'omathpara':
    case 'mrow':
    case 'semantics':
    case 'mstyle':
    case 'mpadded':
    case 'mphantom':
    case 'e':
    case 'num':
    case 'den':
    case 'sub':
    case 'sup':
    case 'deg':
      return getAllChildrenLatex();

    // ── FRACTIONS (MathML & Word OMML) ──
    case 'mfrac': {
      const num = getChildLatex(0) || '1';
      const den = getChildLatex(1) || '1';
      return `\\frac{${num}}{${den}}`;
    }
    case 'f': {
      // Word OMML Fraction (<m:f><m:num>...</m:num><m:den>...</m:den></m:f>)
      const numNode = findChildByTag('num') || children[0];
      const denNode = findChildByTag('den') || children[1];
      const num = numNode ? convertMathMlNodeToLatex(numNode) : '1';
      const den = denNode ? convertMathMlNodeToLatex(denNode) : '1';
      return `\\frac{${num}}{${den}}`;
    }

    // ── RADICALS / ROOTS (MathML & Word OMML) ──
    case 'msqrt':
      return `\\sqrt{${getAllChildrenLatex()}}`;

    case 'mroot': {
      const base = getChildLatex(0);
      const index = getChildLatex(1);
      return `\\sqrt[${index}]{${base}}`;
    }
    case 'rad': {
      // Word OMML Radical (<m:rad><m:deg>...</m:deg><m:e>...</m:e></m:rad>)
      const degNode = findChildByTag('deg');
      const eNode = findChildByTag('e') || children[children.length - 1];
      const base = eNode ? convertMathMlNodeToLatex(eNode) : '';
      const deg = degNode ? convertMathMlNodeToLatex(degNode).trim() : '';
      if (deg) return `\\sqrt[${deg}]{${base}}`;
      return `\\sqrt{${base}}`;
    }

    // ── SUPERSCRIPTS & SUBSCRIPTS (MathML & Word OMML) ──
    case 'msup': {
      const base = getChildLatex(0);
      const sup = getChildLatex(1);
      return `${base}^{${sup}}`;
    }
    case 'ssup': {
      // Word OMML Superscript (<m:sSup><m:e>...</m:e><m:sup>...</m:sup></m:sSup>)
      const baseNode = findChildByTag('e') || children[0];
      const supNode = findChildByTag('sup') || children[1];
      return `${convertMathMlNodeToLatex(baseNode)}^{${convertMathMlNodeToLatex(supNode)}}`;
    }

    case 'msub': {
      const base = getChildLatex(0);
      const sub = getChildLatex(1);
      return `${base}_{${sub}}`;
    }
    case 'ssub': {
      // Word OMML Subscript (<m:sSub><m:e>...</m:e><m:sub>...</m:sub></m:sSub>)
      const baseNode = findChildByTag('e') || children[0];
      const subNode = findChildByTag('sub') || children[1];
      return `${convertMathMlNodeToLatex(baseNode)}_{${convertMathMlNodeToLatex(subNode)}}`;
    }

    case 'msubsup': {
      const base = getChildLatex(0);
      const sub = getChildLatex(1);
      const sup = getChildLatex(2);
      return `${base}_{${sub}}^{${sup}}`;
    }
    case 'ssubsup': {
      // Word OMML SubSup (<m:sSubSup><m:e>...</m:e><m:sub>...</m:sub><m:sup>...</m:sup></m:sSubSup>)
      const baseNode = findChildByTag('e') || children[0];
      const subNode = findChildByTag('sub');
      const supNode = findChildByTag('sup');
      return `${convertMathMlNodeToLatex(baseNode)}_{${convertMathMlNodeToLatex(subNode)}}^{${convertMathMlNodeToLatex(supNode)}}`;
    }

    // ── INTEGRALS, SUMS, N-ARY OPERATORS (MathML & Word OMML) ──
    case 'munder': {
      const base = getChildLatex(0);
      const under = getChildLatex(1);
      return `${base}_{${under}}`;
    }
    case 'munderover': {
      const base = getChildLatex(0);
      const under = getChildLatex(1);
      const over = getChildLatex(2);
      return `${base}_{${under}}^{${over}}`;
    }
    case 'nary': {
      // Word OMML N-ary (<m:nary><m:naryPr><m:chr m:val="∫"/></m:naryPr><m:sub>0</m:sub><m:sup>1</m:sup><m:e>...</m:e></m:nary>)
      const naryPr = findChildByTag('narypr');
      let opChar = '∫';
      if (naryPr) {
        const chrEl = naryPr.querySelector('chr, [val], [m\\:val]');
        if (chrEl) {
          opChar = chrEl.getAttribute('m:val') || chrEl.getAttribute('val') || chrEl.textContent.trim() || opChar;
        }
      }
      let opLatex = '\\int';
      if (opChar === '∑' || opChar.toLowerCase().includes('sum')) opLatex = '\\sum';
      else if (opChar === '∏' || opChar.toLowerCase().includes('prod')) opLatex = '\\prod';
      else if (opChar === '∬') opLatex = '\\iint';
      else if (opChar === '∭') opLatex = '\\iiint';
      else if (opChar === '∮') opLatex = '\\oint';

      const subNode = findChildByTag('sub');
      const supNode = findChildByTag('sup');
      const eNode = findChildByTag('e') || children[children.length - 1];

      const subStr = subNode ? `_{${convertMathMlNodeToLatex(subNode)}}` : '';
      const supStr = supNode ? `^{${convertMathMlNodeToLatex(supNode)}}` : '';
      const eStr = eNode ? convertMathMlNodeToLatex(eNode) : '';
      return `${opLatex}${subStr}${supStr} ${eStr}`.trim();
    }

    // ── DELIMITERS & BRACKETS (MathML & Word OMML) ──
    case 'mfenced': {
      const open = node.getAttribute('open') ?? '(';
      const close = node.getAttribute('close') ?? ')';
      const inner = getAllChildrenLatex();
      const openTex = open ? `\\left${open}` : '';
      const closeTex = close ? `\\right${close}` : '';
      return `${openTex} ${inner} ${closeTex}`;
    }
    case 'd': {
      // Word OMML Delimiter (<m:d><m:dPr><m:begChr m:val="(" /><m:endChr m:val=")" /></m:dPr><m:e>...</m:e></m:d>)
      const dPr = findChildByTag('dpr');
      let begChr = '(';
      let endChr = ')';
      if (dPr) {
        const b = dPr.querySelector('begchr, [val], [m\\:val]');
        const e = dPr.querySelector('endchr, [val], [m\\:val]');
        if (b) begChr = b.getAttribute('m:val') || b.getAttribute('val') || '(';
        if (e) endChr = e.getAttribute('m:val') || e.getAttribute('val') || ')';
      }
      const eNode = findChildByTag('e') || children[0];
      const inner = eNode ? convertMathMlNodeToLatex(eNode) : '';
      if (begChr === '{' || begChr === '}') begChr = '\\' + begChr;
      if (endChr === '{' || endChr === '}') endChr = '\\' + endChr;
      return `\\left${begChr} ${inner} \\right${endChr}`;
    }

    // ── ACCENTS, VECTORS & OVERLINES (MathML & Word OMML) ──
    case 'mover': {
      const base = getChildLatex(0);
      const overNode = children[1];
      const overText = overNode ? overNode.textContent.trim() : '';

      if (overText === '→' || overText === '⟶' || overText === '\\to') return `\\vec{${base}}`;
      if (overText === '^' || overText === '̂') return `\\hat{${base}}`;
      if (overText === '¯' || overText === '_' || overText === '‾') return `\\overline{${base}}`;
      if (overText === '.') return `\\dot{${base}}`;
      if (overText === '..') return `\\ddot{${base}}`;
      return `\\overset{${getChildLatex(1)}}{${base}}`;
    }
    case 'acc': {
      // Word OMML Accent (<m:acc><m:accPr><m:chr m:val="→"/></m:accPr><m:e>...</m:e></m:acc>)
      const accPr = findChildByTag('accpr');
      let chr = '→';
      if (accPr) {
        const c = accPr.querySelector('chr, [val], [m\\:val]');
        if (c) chr = c.getAttribute('m:val') || c.getAttribute('val') || chr;
      }
      const eNode = findChildByTag('e') || children[0];
      const inner = eNode ? convertMathMlNodeToLatex(eNode) : '';
      if (chr === '→' || chr === '⟶') return `\\vec{${inner}}`;
      if (chr === '^' || chr === '̂') return `\\hat{${inner}}`;
      if (chr === '¯' || chr === '_') return `\\bar{${inner}}`;
      if (chr === '.') return `\\dot{${inner}}`;
      if (chr === '..') return `\\ddot{${inner}}`;
      return `\\vec{${inner}}`;
    }
    case 'bar': {
      // Word OMML Bar
      const eNode = findChildByTag('e') || children[0];
      return `\\overline{${convertMathMlNodeToLatex(eNode)}}`;
    }

    // ── LIMITS (Word OMML) ──
    case 'limlow': {
      const eNode = findChildByTag('e');
      const limNode = findChildByTag('lim');
      const lim = limNode ? convertMathMlNodeToLatex(limNode) : '';
      return `\\lim_{${lim}}`;
    }

    // ── MATRICES ──
    case 'mtable':
    case 'm': {
      const rows = children
        .filter((c) => {
          const t = c.nodeName.toLowerCase().replace(/^[a-z0-9]+:/i, '');
          return t === 'mtr' || t === 'mr';
        })
        .map((row) => {
          const cells = Array.from(row.childNodes)
            .filter((cell) => {
              const t = cell.nodeName.toLowerCase().replace(/^[a-z0-9]+:/i, '');
              return t === 'mtd' || t === 'e';
            })
            .map(convertMathMlNodeToLatex);
          return cells.join(' & ');
        });
      return `\\begin{matrix} ${rows.join(' \\\\ ')} \\end{matrix}`;
    }
    case 'mtr':
    case 'mr':
      return children.map(convertMathMlNodeToLatex).join(' & ');
    case 'mtd':
      return getAllChildrenLatex();

    // ── RUNS & TEXT (Word OMML & MathML) ──
    case 'r':
      return getAllChildrenLatex();
    case 't': {
      const txt = node.textContent;
      if (GREEK_MAP[txt.trim()]) return GREEK_MAP[txt.trim()];
      if (MATH_SYMBOLS_MAP[txt.trim()]) return MATH_SYMBOLS_MAP[txt.trim()];
      return txt;
    }

    case 'mi': {
      const text = node.textContent.trim();
      if (GREEK_MAP[text]) return GREEK_MAP[text];
      if (/^(sin|cos|tan|cot|sec|csc|log|ln|lim|exp|det|max|min|deg)$/i.test(text)) {
        return `\\${text.toLowerCase()}`;
      }
      return text;
    }

    case 'mn':
      return node.textContent.trim();

    case 'mo': {
      const op = node.textContent.trim();
      if (op === '−') return '-';
      if (/^(sin|cos|tan|cot|sec|csc|log|ln|lim|exp|det|max|min|sup|inf|deg)$/i.test(op)) {
        return `\\${op.toLowerCase()}`;
      }
      if (MATH_SYMBOLS_MAP[op]) return MATH_SYMBOLS_MAP[op];
      return op;
    }

    case 'mtext': {
      const txt = node.textContent.trim();
      return txt ? `\\text{${txt}}` : '';
    }

    case 'mspace':
      return ' ';

    default:
      return getAllChildrenLatex();
  }
}

/**
 * Helper to extract a balanced delimited group starting at `startIdx`.
 */
function extractBalanced(str, startIdx, openChar = '(', closeChar = ')') {
  if (str[startIdx] !== openChar) return null;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIdx + 1, i), endIdx: i };
      }
    }
  }
  return null;
}

/**
 * Strips MathType header/footer comments, MTEF headers, and normalizes MathType LaTeX quirks.
 */
export function cleanMathType(text) {
  if (!text) return '';
  let res = text;

  // 1. Strip MathType HTML comments and delimiters
  res = res.replace(/<!--\s*MathType@[\s\S]*?-->/gi, '');
  res = res.replace(/«MathType@[\s\S]*?»/gi, '');

  // Strip ALL MathType MTEF / Translator % comment blocks (including continuation lines starting with %)
  if (/MathType!/i.test(res)) {
    res = res.replace(/^[ \t]*%[^\r\n]*(?:\r?\n|$)/gm, '');
  }
  res = res.replace(/(?:^|\n)\s*MathType!(?:MTEF|Translator)![^\r\n]*(?:\r?\n|$)/gi, '\n');

  // 2. Safely collapse simple MathType double braces: e.g. \frac{{1}}{{n}} -> \frac{1}{n}
  res = res.replace(/\\frac\{\{([^{}]+)\}\}\{\{([^{}]+)\}\}/g, '\\frac{$1}{$2}');
  res = res.replace(/\\sqrt\s*\{\{([^{}]+)\}\}/g, '\\sqrt{$1}');

  // 3. Convert MathType font macros
  res = res.replace(/\{\\rm\{([^}]+)\}\}/g, '\\mathrm{$1}');
  res = res.replace(/\{\\rm\s+([^}]+)\}/g, '\\mathrm{$1}');
  res = res.replace(/\{\\bf\{([^}]+)\}\}/g, '\\mathbf{$1}');
  res = res.replace(/\{\\bf\s+([^}]+)\}/g, '\\mathbf{$1}');
  res = res.replace(/\{\\it\{([^}]+)\}\}/g, '\\mathit{$1}');
  res = res.replace(/\{\\it\s+([^}]+)\}/g, '\\mathit{$1}');

  // 4. Remove MathType \hfill and trailing/redundant spaces
  res = res.replace(/\\hfill/g, ' ');

  return res.trim();
}

const NON_MATH_SLASH_UNITS = new Set([
  'km/h', 'm/s', 'cm/s', 'mm/s', 'rad/s', 'rev/min', 'j/mol', 'kg/m',
  'and/or', 'or/and', 'w/o', 'c/o', 'n/a', 'yes/no', 'true/false'
]);

function findMatchingLeftParen(str, closeIdx) {
  let depth = 0;
  for (let i = closeIdx; i >= 0; i--) {
    if (str[i] === ')') depth++;
    else if (str[i] === '(') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingRightParen(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function stripOuterParens(expr) {
  const s = expr.trim();
  if (s.startsWith('\\left(') && s.endsWith('\\right)')) {
    const innerClose = findMatchingRightParen(s, 5);
    if (innerClose === s.length - 7) {
      return s.slice(6, -7).trim();
    }
  }
  if (s.startsWith('(') && s.endsWith(')')) {
    const matchClose = findMatchingRightParen(s, 0);
    if (matchClose === s.length - 1) {
      return s.slice(1, -1).trim();
    }
  }
  return s;
}

/**
 * Converts linear algebraic fractions inside a formula context into \frac{...}{...}.
 * Supports nested parentheses, \left(...\right), factorials (8!/x!(8-x)!), and exponents.
 */
function convertLinearFractionsInMath(expr) {
  if (!expr || !expr.includes('/')) return expr;
  if (/https?:\/\//i.test(expr)) return expr;

  let out = expr;

  for (let pass = 0; pass < 15; pass++) {
    // Collect candidate '/' positions sorted by deepest nesting depth first so inner fractions resolve before outer ones
    const candidates = [];
    let parenDepth = 0;
    let braceDepth = 0;
    for (let i = 0; i < out.length; i++) {
      const ch = out[i];
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
      else if (ch === '{') braceDepth++;
      else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
      else if (ch === '/') {
        // Ignore // or \/
        if (out[i - 1] === '\\' || out[i - 1] === '/' || out[i + 1] === '/') continue;
        candidates.push({ idx: i, depth: parenDepth + braceDepth });
      }
    }

    if (candidates.length === 0) break;
    // Sort deepest nesting first, then left-to-right
    candidates.sort((a, b) => b.depth - a.depth || a.idx - b.idx);

    let replacedThisPass = false;

    for (const { idx: slashIdx } of candidates) {
      // 1. Scan LEFT operand
      let leftEnd = slashIdx - 1;
      while (leftEnd >= 0 && /\s/.test(out[leftEnd])) leftEnd--;
      if (leftEnd < 0) continue;

      let leftStart = leftEnd;
      if (out[leftEnd] === ')') {
        const openIdx = findMatchingLeftParen(out, leftEnd);
        if (openIdx === -1) continue;
        leftStart = openIdx;
        if (out.slice(0, leftStart).endsWith('\\left')) {
          leftStart -= 5;
        }
      } else {
        // Scan backwards over token / factorial / braced exponent / \command
        let i = leftEnd;
        while (i >= 0) {
          const c = out[i];
          if (c === '}') {
            let bd = 0;
            while (i >= 0) {
              if (out[i] === '}') bd++;
              else if (out[i] === '{') {
                bd--;
                if (bd === 0) break;
              }
              i--;
            }
            i--;
          } else if (c === ')') {
            const o = findMatchingLeftParen(out, i);
            if (o === -1) break;
            i = o - 1;
          } else if (/[a-zA-Z0-9_^\\!]/.test(c)) {
            i--;
          } else {
            break;
          }
        }
        leftStart = i + 1;
        // Trim stray leading ^ or _
        while (leftStart <= leftEnd && (out[leftStart] === '^' || out[leftStart] === '_')) leftStart++;
      }

      const rawNum = out.slice(leftStart, leftEnd + 1).trim();
      if (!rawNum) continue;

      // 2. Scan RIGHT operand
      let rightStart = slashIdx + 1;
      while (rightStart < out.length && /\s/.test(out[rightStart])) rightStart++;
      if (rightStart >= out.length) continue;

      let rightEnd = rightStart;
      if (out.startsWith('\\left(', rightStart)) {
        const closeIdx = findMatchingRightParen(out, rightStart + 5);
        if (closeIdx === -1) continue;
        rightEnd = closeIdx;
        // Include trailing ! or ^{...}
        let j = rightEnd + 1;
        while (j < out.length && (out[j] === '!' || out[j] === '^' || out[j] === '_')) {
          if (out[j] === '!') {
            rightEnd = j;
            j++;
          } else if (out[j + 1] === '{') {
            let bd = 0;
            let k = j + 1;
            while (k < out.length) {
              if (out[k] === '{') bd++;
              else if (out[k] === '}') {
                bd--;
                if (bd === 0) break;
              }
              k++;
            }
            rightEnd = k;
            j = k + 1;
          } else if (/[a-zA-Z0-9]/.test(out[j + 1] || '')) {
            rightEnd = j + 1;
            j += 2;
          } else break;
        }
      } else if (out[rightStart] === '(') {
        const closeIdx = findMatchingRightParen(out, rightStart);
        if (closeIdx === -1) continue;
        rightEnd = closeIdx;
        let j = rightEnd + 1;
        while (j < out.length && (out[j] === '!' || out[j] === '^' || out[j] === '_')) {
          if (out[j] === '!') {
            rightEnd = j;
            j++;
          } else if (out[j + 1] === '{') {
            let bd = 0;
            let k = j + 1;
            while (k < out.length) {
              if (out[k] === '{') bd++;
              else if (out[k] === '}') {
                bd--;
                if (bd === 0) break;
              }
              k++;
            }
            rightEnd = k;
            j = k + 1;
          } else if (/[a-zA-Z0-9]/.test(out[j + 1] || '')) {
            rightEnd = j + 1;
            j += 2;
          } else break;
        }
      } else {
        // Read contiguous term including factorials, braced args, and attached parenthesized factors like x!(8-x)!
        let j = rightStart;
        while (j < out.length) {
          const c = out[j];
          if (c === '{') {
            let bd = 0;
            while (j < out.length) {
              if (out[j] === '{') bd++;
              else if (out[j] === '}') {
                bd--;
                if (bd === 0) break;
              }
              j++;
            }
            j++;
          } else if (c === '(') {
            const closeIdx = findMatchingRightParen(out, j);
            if (closeIdx === -1) break;
            j = closeIdx + 1;
          } else if (/[a-zA-Z0-9_^\\!]/.test(c)) {
            j++;
          } else {
            break;
          }
        }
        rightEnd = j - 1;
      }

      if (rightEnd < rightStart) continue;
      const rawDen = out.slice(rightStart, rightEnd + 1).trim();
      if (!rawDen) continue;

      const lowerPair = `${rawNum}/${rawDen}`.toLowerCase();
      if (NON_MATH_SLASH_UNITS.has(lowerPair)) continue;

      // Strip redundant wrapping parens when inside \frac{num}{den}
      const cleanNum = stripOuterParens(rawNum);
      const cleanDen = stripOuterParens(rawDen);

      out = out.slice(0, leftStart) + `\\frac{${cleanNum}}{${cleanDen}}` + out.slice(rightEnd + 1);
      replacedThisPass = true;
      break;
    }

    if (!replacedThisPass) break;
  }

  return out;
}

/**
 * Upgrades (...) that encloses tall math operators (\frac, \sum, \int, \prod, \sqrt) to \left( ... \right).
 */
function upgradeTallParens(expr) {
  let result = '';
  let i = 0;
  while (i < expr.length) {
    if (
      expr[i] === '(' &&
      !expr.slice(Math.max(0, i - 5), i).endsWith('\\left') &&
      expr[i - 1] !== '^' &&
      expr[i - 1] !== '_'
    ) {
      const grp = extractBalanced(expr, i, '(', ')');
      if (grp) {
        const innerConverted = upgradeTallParens(grp.content);
        if (/\\(?:frac|sum|int|prod|sqrt)\b/.test(innerConverted)) {
          result += `\\left(${innerConverted.trim()}\\right)`;
        } else {
          result += `(${innerConverted})`;
        }
        i = grp.endIdx + 1;
        continue;
      }
    }
    result += expr[i];
    i++;
  }
  return result;
}

/**
 * Converts Microsoft Word / MathType UnicodeMath linear format into LaTeX:
 * - Under-scripts with ┬ (e.g. "(\lim)┬(n→∞)", "lim┬(x→0)", "∑┬(i=1)^n")
 * - Over-scripts with ┴ (e.g. "expr┴(upper)")
 * - White lenticular grouping brackets 〖 ... 〗 (e.g. "〖(1+1/n)^n 〗")
 * - Parenthesized exponents/subscripts e.g. x^(n+1), a_(i+1)
 */
export function convertWordUnicodeMathToLatex(text) {
  if (!text) return '';
  let res = text;

  // 1. Handle Word under-script operator ┬ (U+252C)
  // Clean accidental $...$ around subscript if pasted partially formatted: ┬$(n \to \infty)$ -> ┬(n \to \infty)
  res = res.replace(/┬\s*\$([^$]+)\$/g, '┬$1');

  let safety = 0;
  while (res.includes('┬') && safety++ < 40) {
    const idx = res.indexOf('┬');
    const before = res.slice(0, idx);
    const after = res.slice(idx + 1);

    // Match the operator/base immediately before ┬
    const baseMatch = before.match(/(\(\s*\\?(?:lim|sum|prod|int|iint|oint|max|min|sup|inf|∑|∏|∫)\s*\)|\\(?:lim|sum|prod|int|iint|oint|max|min|sup|inf)|(?:\b(?:lim|sum|prod|int|max|min|sup|inf))|[∑∏∫]|\\?[a-zA-Z0-9]+|\([^()]+\))\s*$/);
    let baseReplacement = '';
    let cutBeforeLen = 0;

    if (baseMatch) {
      cutBeforeLen = baseMatch[0].length;
      let rawBase = baseMatch[1].trim();
      if (rawBase.startsWith('(') && rawBase.endsWith(')')) {
        const inner = rawBase.slice(1, -1).trim();
        if (/^\\?(?:lim|sum|prod|int|iint|oint|max|min|sup|inf)$/i.test(inner)) {
          rawBase = inner.startsWith('\\') ? inner : `\\${inner.toLowerCase()}`;
        } else if (inner === '∑') rawBase = '\\sum';
        else if (inner === '∏') rawBase = '\\prod';
        else if (inner === '∫') rawBase = '\\int';
      } else if (/^(?:lim|sum|prod|int|max|min|sup|inf)$/i.test(rawBase)) {
        rawBase = `\\${rawBase.toLowerCase()}`;
      } else if (rawBase === '∑') rawBase = '\\sum';
      else if (rawBase === '∏') rawBase = '\\prod';
      else if (rawBase === '∫') rawBase = '\\int';
      baseReplacement = rawBase;
    }

    // Match the subscript immediately after ┬
    const trimmedAfter = after.replace(/^\s+/, '');
    const leadingSpaces = after.length - trimmedAfter.length;
    let subContent = '';
    let cutAfterLen = 0;

    if (trimmedAfter.startsWith('(')) {
      const grp = extractBalanced(trimmedAfter, 0, '(', ')');
      if (grp) {
        subContent = grp.content.trim();
        cutAfterLen = leadingSpaces + grp.endIdx + 1;
      }
    } else if (trimmedAfter.startsWith('{')) {
      const grp = extractBalanced(trimmedAfter, 0, '{', '}');
      if (grp) {
        subContent = grp.content.trim();
        cutAfterLen = leadingSpaces + grp.endIdx + 1;
      }
    } else {
      const tokMatch = trimmedAfter.match(/^([^\s^_〖〗()]+)/);
      if (tokMatch) {
        subContent = tokMatch[1].trim();
        cutAfterLen = leadingSpaces + tokMatch[0].length;
      }
    }

    if (baseReplacement && subContent) {
      res =
        before.slice(0, before.length - cutBeforeLen) +
        `${baseReplacement}_{${subContent}}` +
        after.slice(cutAfterLen);
    } else {
      // Fallback: avoid infinite loop if malformed
      res = before + '_' + after;
    }
  }

  // 2. Handle Word over-script operator ┴ (U+2534)
  safety = 0;
  while (res.includes('┴') && safety++ < 40) {
    const idx = res.indexOf('┴');
    const before = res.slice(0, idx);
    const after = res.slice(idx + 1).replace(/^\s+/, '');
    let supContent = '';
    let cutAfterLen = 0;

    if (after.startsWith('(')) {
      const grp = extractBalanced(after, 0, '(', ')');
      if (grp) {
        supContent = grp.content.trim();
        cutAfterLen = grp.endIdx + 1;
      }
    } else {
      const tokMatch = after.match(/^([^\s^_〖〗()]+)/);
      if (tokMatch) {
        supContent = tokMatch[1].trim();
        cutAfterLen = tokMatch[0].length;
      }
    }
    res = before + (supContent ? `^{${supContent}}` : '^') + after.slice(cutAfterLen);
  }

  // 2.5. Convert parenthesized exponents/subscripts BEFORE fraction/bracket processing: x^(5/6) -> x^{5/6}
  res = res.replace(/([a-zA-Z0-9)\]}])\^\(([^()]+)\)/g, '$1^{$2}');
  res = res.replace(/([a-zA-Z0-9)\]}])_\(([^()]+)\)/g, '$1_{$2}');

  // 3. Handle Word white lenticular brackets 〖 ... 〗 (U+3016 / U+3017)
  // Strip any accidental inner $...$ inside 〖...〗
  safety = 0;
  while (res.includes('〖') && safety++ < 40) {
    const openIdx = res.indexOf('〖');
    const grp = extractBalanced(res, openIdx, '〖', '〗');
    if (grp) {
      let inner = grp.content.trim();
      // Remove any partial $...$ inside 〖...〗 so the whole equation wraps cleanly as one unit
      inner = inner.replace(/\$([^$]+)\$/g, '$1').trim();
      inner = convertLinearFractionsInMath(inner);
      inner = upgradeTallParens(inner);
      res = res.slice(0, openIdx) + ` ${inner} ` + res.slice(grp.endIdx + 1);
    } else {
      res = res.replace('〖', '');
    }
  }
  res = res.replace(/[〖〗]/g, '');

  // 4. Clean standalone Word operator parens: (\lim) -> \lim, (\sin) -> \sin
  res = res.replace(/\(\s*\\?(lim|sin|cos|tan|cot|sec|csc|log|ln|sum|int|prod|det|max|min|sup|inf)\s*\)/g, '\\$1');

  return res;
}

/**
 * Converts PageMaker ASCII linear math, derivatives, roots, and limits into valid LaTeX.
 */
export function convertPageMakerAndAsciiMath(text) {
  if (!text) return '';
  let res = text;

  // 1. Derivatives: dy/dx -> \frac{dy}{dx}, d/dx(...) -> \frac{d}{dx}(...)
  res = res.replace(/\bd\^2y\/dx\^2\b/gi, '\\frac{d^2y}{dx^2}');
  res = res.replace(/\bdy\/dx\b/gi, '\\frac{dy}{dx}');
  res = res.replace(/\bd\/dx\s*\(([^)]+)\)/gi, '\\frac{d}{dx}($1)');
  res = res.replace(/\bd\/dt\s*\(([^)]+)\)/gi, '\\frac{d}{dt}($1)');

  // 2. Linear square roots: sqrt(x^2 + 1) -> \sqrt{x^2 + 1}
  res = res.replace(/\bsqrt\[([^\]]+)\]\(([^)]+)\)/gi, '\\sqrt[$1]{$2}');
  res = res.replace(/\bsqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
  res = res.replace(/\bsqrt\{([^}]+)\}/gi, '\\sqrt{$1}');

  // 3. Linear limits: lim_(x->0) or lim_(x -> 0) -> \lim_{x \to 0}
  res = res.replace(/\blim_\(([a-zA-Z0-9]+)\s*(?:->|→)\s*([^)]+)\)/gi, '\\lim_{$1 \\to $2}');
  res = res.replace(/\blim_\{\s*([a-zA-Z0-9]+)\s*(?:->|→)\s*([^}]+)\}/gi, '\\lim_{$1 \\to $2}');
  res = res.replace(/\blim\s*\(([a-zA-Z0-9]+)\s*(?:->|→)\s*([^)]+)\)/gi, '\\lim_{$1 \\to $2}');

  // 4. Linear integrals: int_0^1 or int_a^b
  res = res.replace(/\bint_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/gi, '\\int_{$1}^{$2}');

  // 5. Linear sums: sum_(i=1)^n
  res = res.replace(/\bsum_\(([^)]+)\)\^([a-zA-Z0-9]+)/gi, '\\sum_{$1}^{$2}');

  // 6. Linear fractions in math context: (a + b)/(c + d) -> \frac{a + b}{c + d}, 1/n -> \frac{1}{n}
  res = res.replace(/(?<=[=<>+\-*(\s]|^)\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
  if (/\\(?:lim|sum|int|prod|sqrt|frac|to|infty|alpha|beta|gamma|theta|pi)\b|[\^_]/.test(res)) {
    res = convertLinearFractionsInMath(res);
    res = upgradeTallParens(res);
  }

  // 7. Plus-minus and arrows from PageMaker
  res = res.replace(/\+-/g, '\\pm');
  res = res.replace(/<->|<=>/g, '\\iff');
  res = res.replace(/->|-->/g, '\\to');
  res = res.replace(/=>|==>/g, '\\implies');

  return res;
}

/**
 * Extracts and translates math equations found in clipboard HTML into LaTeX.
 * Handles:
 * - Word OMML (<m:oMath>, <m:oMathPara>, and MSO conditional XML comments)
 * - MathML (<math ...>) from Microsoft Word, Office 365, LibreOffice
 * - KaTeX annotations (<span class="katex">...<annotation encoding="application/x-tex">...)
 * - MathJax containers (<span class="MathJax">...<script type="math/tex">...)
 * - MathType HTML translations
 * - <sup> and <sub> tags
 */
export function extractMathFromHtml(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return '';

  try {
    let processedHtml = htmlString;

    // 0. Extract any Word OMML embedded in conditional comments e.g. <!--[if gte mso 9]><xml>...<m:oMath>
    const msoOmmlRegex = /<m:oMath[\s\S]*?<\/m:oMath>|<m:oMathPara[\s\S]*?<\/m:oMathPara>/gi;
    processedHtml = processedHtml.replace(msoOmmlRegex, (match) => {
      try {
        const xmlDoc = new DOMParser().parseFromString(`<root xmlns:m="http://schemas.microsoft.com/office/2004/12/omml">${match}</root>`, 'text/html');
        const node = xmlDoc.body.firstChild || xmlDoc.querySelector('omath, [xmlns\\:m]');
        if (node) {
          const latex = convertMathMlNodeToLatex(node);
          if (latex) return ` $${latex}$ `;
        }
      } catch (err) {
        console.warn('[MathPasteNormalizer] MSO OMML comment parsing warning:', err);
      }
      return match;
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(processedHtml, 'text/html');

    // 1. Process KaTeX containers
    const katexContainers = doc.querySelectorAll('.katex');
    katexContainers.forEach((container) => {
      const annot = container.querySelector('annotation[encoding*="tex"], annotation[encoding*="TeX"], annotation[encoding*="latex"]');
      let latex = '';
      if (annot && annot.textContent.trim()) {
        latex = annot.textContent.trim();
      } else {
        const mathNode = container.querySelector('math');
        if (mathNode) {
          latex = convertMathMlNodeToLatex(mathNode);
        }
      }

      if (latex) {
        const replacement = doc.createTextNode(` $${latex}$ `);
        container.parentNode?.replaceChild(replacement, container);
      }
    });

    // 2. Process MathJax containers
    const mathJaxNodes = doc.querySelectorAll('.MathJax, [data-mathml]');
    mathJaxNodes.forEach((node) => {
      const script = node.querySelector('script[type*="math/tex"]');
      if (script && script.textContent.trim()) {
        const latex = script.textContent.trim();
        const replacement = doc.createTextNode(` $${latex}$ `);
        node.parentNode?.replaceChild(replacement, node);
        return;
      }

      const mathNode = node.querySelector('math');
      if (mathNode) {
        const latex = convertMathMlNodeToLatex(mathNode);
        if (latex) {
          const replacement = doc.createTextNode(` $${latex}$ `);
          node.parentNode?.replaceChild(replacement, node);
        }
      }
    });

    // 3. Process raw MathML (<math>) and Word OMML (<m:oMath>, <oMath>) anywhere in document
    const allMathElements = Array.from(doc.getElementsByTagName('*')).filter((el) => {
      const name = el.nodeName.toLowerCase();
      return name === 'math' || name.endsWith('omath') || name.endsWith('omathpara');
    });

    allMathElements.forEach((node) => {
      if (!node.isConnected) return;
      const latex = convertMathMlNodeToLatex(node);
      if (latex) {
        const replacement = doc.createTextNode(` $${latex}$ `);
        node.parentNode?.replaceChild(replacement, node);
      }
    });

    // 4. Convert <sup> and <sub> tags
    doc.querySelectorAll('sup').forEach((sup) => {
      const content = sup.textContent.trim();
      sup.parentNode?.replaceChild(doc.createTextNode(`^{${content}}`), sup);
    });
    doc.querySelectorAll('sub').forEach((sub) => {
      const content = sub.textContent.trim();
      sub.parentNode?.replaceChild(doc.createTextNode(`_{${content}}`), sub);
    });

    // 5. Convert <br> and <p> to newlines
    doc.querySelectorAll('br').forEach((br) => {
      br.parentNode?.replaceChild(doc.createTextNode('\n'), br);
    });
    doc.querySelectorAll('p, div').forEach((block) => {
      block.appendChild(doc.createTextNode('\n'));
    });

    // Extract text content with math tags preserved
    const result = doc.body.textContent || '';
    return result;
  } catch (err) {
    console.warn('[MathPasteNormalizer] HTML extraction failed:', err);
    return '';
  }
}

/**
 * Converts Unicode math characters (superscripts, subscripts, roots, Greek letters)
 * to standard LaTeX representations.
 */
export function convertUnicodeMathToLatex(text) {
  if (!text) return '';

  let res = text;

  // 1. Replace vulgar fractions (½ -> \frac{1}{2})
  for (const [char, rep] of Object.entries(FRACTION_MAP)) {
    if (res.includes(char)) {
      res = res.replaceAll(char, ` ${rep} `);
    }
  }

  // 2. Replace roots with parenthesis or identifier: √(x + 1) -> \sqrt{x + 1}, √x -> \sqrt{x}
  res = res.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  res = res.replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');
  res = res.replace(/√/g, '\\sqrt{}');

  // 3. Unicode superscripts: e.g. x² -> x^{2}, 10⁻³ -> 10^{-3}
  const supChars = Object.keys(SUPERSCRIPT_MAP).join('');
  const supRegex = new RegExp(`([a-zA-Z0-9)\]}])([${supChars}]+)`, 'g');
  res = res.replace(supRegex, (match, base, sups) => {
    const converted = sups
      .split('')
      .map((c) => SUPERSCRIPT_MAP[c] || c)
      .join('');
    return `${base}^{${converted}}`;
  });

  // Isolated superscripts e.g. "²"
  const isolatedSupRegex = new RegExp(`([${supChars}]+)`, 'g');
  res = res.replace(isolatedSupRegex, (match, sups) => {
    const converted = sups
      .split('')
      .map((c) => SUPERSCRIPT_MAP[c] || c)
      .join('');
    return `^{${converted}}`;
  });

  // 4. Unicode subscripts: e.g. x₁ -> x_{1}, v₀ -> v_{0}
  const subChars = Object.keys(SUBSCRIPT_MAP).join('');
  const subRegex = new RegExp(`([a-zA-Z0-9)\]}])([${subChars}]+)`, 'g');
  res = res.replace(subRegex, (match, base, subs) => {
    const converted = subs
      .split('')
      .map((c) => SUBSCRIPT_MAP[c] || c)
      .join('');
    return `${base}_{${converted}}`;
  });

  // 5. Greek characters
  for (const [char, rep] of Object.entries(GREEK_MAP)) {
    if (res.includes(char)) {
      res = res.replaceAll(char, ` ${rep} `);
    }
  }

  // 6. Math symbols & operators
  for (const [char, rep] of Object.entries(MATH_SYMBOLS_MAP)) {
    if (res.includes(char)) {
      if (char === '°') {
        res = res.replace(/([0-9a-zA-Z]+)°/g, '$1^\\circ');
        res = res.replaceAll('°', '^\\circ');
      } else {
        res = res.replaceAll(char, ` ${rep} `);
      }
    }
  }

  return res;
}

/**
 * Normalizes standard LaTeX delimiters to $...$ and $$...$$:
 * - \( ... \) -> $ ... $
 * - \[ ... \] -> $$ ... $$
 * - \begin{equation} ... \end{equation} -> $$ ... $$
 * - \begin{align*} ... \end{align*} -> \begin{aligned} ... \end{aligned} inside $$ ... $$
 */
export function normalizeLatexDelimiters(text) {
  if (!text) return '';

  let res = text;

  // Fix doubled backslashes from JSON or escaping: \\frac -> \frac, \\sqrt -> \sqrt
  res = res.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // Convert \[ ... \] to $ ... $ so pasted formulas blend inline with text while retaining \displaystyle stacked formatting
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, (match, inner) => {
    const clean = inner.trim();
    if (/\\begin\{(?:aligned|cases|matrix|pmatrix|bmatrix|vmatrix)/.test(clean)) {
      return `$$${clean}$$`;
    }
    return `$${clean}$`;
  });

  // Convert inline math \( ... \) to $ ... $
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (match, inner) => `$${inner.trim()}$`);

  // Convert \begin{equation}...\end{equation} to $$...$$
  res = res.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (match, inner) => `\n$$${inner.trim()}$$\n`);

  // Convert \begin{align}...\end{align} to \begin{aligned}...\end{aligned} inside $$...$$
  res = res.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (match, inner) => `\n$$\\begin{aligned}${inner.trim()}\\end{aligned}$$\n`);

  // Convert [eq]...[/eq] or similar forum/Word BBCode tags
  res = res.replace(/\[eq\]([\s\S]*?)\[\/eq\]/gi, (match, inner) => `$${inner.trim()}$`);

  return res;
}

// Stop words that clearly delimit English prose from math expressions
const STOP_WORDS = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'and', 'or', 'but', 'nor', 'yet', 'so',
  'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which', 'whose',
  'for', 'with', 'without', 'within', 'by', 'at', 'in', 'on', 'of', 'to', 'from', 'into', 'onto',
  'find', 'calculate', 'determine', 'evaluate', 'solve', 'given', 'let', 'assume', 'show', 'prove',
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'such', 'that', 'as', 'than', 'more', 'less', 'equal', 'equals', 'between', 'among',
  'each', 'every', 'both', 'all', 'any', 'some', 'no', 'none', 'neither', 'either',
  'question', 'option', 'answer', 'value', 'roots', 'root', 'ratio', 'product', 'sum', 'difference'
]);

/**
 * Scans text for bare, unwrapped LaTeX expressions and wraps them into $...$.
 */
export function autoDetectAndWrapLatex(text) {
  if (!text) return '';

  // 1. First split by existing $...$ and $$...$$ blocks so we NEVER double-wrap!
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  const processed = parts.map((part, idx) => {
    // If it's already an existing math block, return unchanged
    if (idx % 2 === 1) return part;

    const segment = part;

    // Fast check: if no backslash, no caret, no underscore, return unchanged
    if (!/(\\[a-zA-Z]+|\\[^a-zA-Z\s]|[\^_])/.test(segment)) {
      return segment;
    }

    const lines = segment.split('\n');
    const processedLines = lines.map((line) => {
      if (!/(\\[a-zA-Z]+|\\[^a-zA-Z\s]|[\^_])/.test(line)) return line;

      // Tokenize line preserving LaTeX commands, escaped chars, braces, words, numbers, math operators, whitespace
      const tokenRegex = /(\\[a-zA-Z]+|\\[^a-zA-Z\s]|[a-zA-Z]+|[0-9+=\-<>/*.,()\[\]{}\^_|!]+|\s+|.)/g;
      const tokens = line.match(tokenRegex) || [];

      const isCommandTrigger = (t) => {
        if (!t.startsWith('\\')) return false;
        if (t.length === 2 && !/[a-zA-Z0-9\s]/.test(t[1])) return true; // \, \{ \} \| etc.
        const cmd = t.slice(1).split(/[^a-zA-Z]/)[0].toLowerCase();
        if (['n', 't', 'r', 'b'].includes(cmd)) return false;
        return true;
      };

      const isSubSupTrigger = (t) => /[\^_]/.test(t);

      const isStopWord = (t) => STOP_WORDS.has(t.toLowerCase());

      // Precompute brace depth at each token so anything inside { ... } is never broken by stop words or prose rules
      const braceDepthAt = new Array(tokens.length).fill(0);
      let curDepth = 0;
      for (let idxTok = 0; idxTok < tokens.length; idxTok++) {
        braceDepthAt[idxTok] = curDepth;
        const t = tokens[idxTok];
        for (let c = 0; c < t.length; c++) {
          if (t[c] === '{') curDepth++;
          else if (t[c] === '}' && curDepth > 0) curDepth--;
        }
      }

      const isAdjacentMathToken = (tokIdx) => {
        // Look left skipping whitespace
        let l = tokIdx - 1;
        while (l >= 0 && /^\s+$/.test(tokens[l])) l--;
        let r = tokIdx + 1;
        while (r < tokens.length && /^\s+$/.test(tokens[r])) r++;
        const leftTok = l >= 0 ? tokens[l] : '';
        const rightTok = r < tokens.length ? tokens[r] : '';
        const mathAdjRe = /^(\\|[0-9+=\-<>/*()\[\]{}\^_|]+)$/;
        return (
          (leftTok && (leftTok.startsWith('\\') || /[+=\-<>/*()\[\]{}\^_]/.test(leftTok) || mathAdjRe.test(leftTok))) ||
          (rightTok && (rightTok.startsWith('\\') || /[+=\-<>/*()\[\]{}\^_]/.test(rightTok) || mathAdjRe.test(rightTok)))
        );
      };

      const isMathWord = (t, tokIdx) => {
        const lower = t.toLowerCase();
        if (lower === 'a' || lower === 'i') {
          return braceDepthAt[tokIdx] > 0 || isAdjacentMathToken(tokIdx);
        }
        if (t.length === 1 && /^[a-zA-Z]$/.test(t)) return true;
        const mathFns = new Set([
          'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'exp', 'det', 'max', 'min', 'deg',
          'sup', 'inf', 'dx', 'dy', 'dt', 'dz', 'dr', 'dp', 'dq', 'dv', 'dw'
        ]);
        return mathFns.has(lower);
      };

      const isMathCompatible = (t, tokIdx) => {
        if (braceDepthAt[tokIdx] > 0) return true;
        if (/^\s+$/.test(t)) return true;
        if (t.startsWith('\\')) return isCommandTrigger(t);
        if (/^[0-9+=\-<>/*()\[\]{}\^_|!]+$/.test(t)) return true;
        if (t === ',' || t === '.') return true;
        if (/^[a-zA-Z]+$/.test(t)) {
          if (isStopWord(t)) {
            return (t.toLowerCase() === 'a' || t.toLowerCase() === 'i') && isAdjacentMathToken(tokIdx);
          }
          return isMathWord(t, tokIdx);
        }
        return false;
      };

      // Find math spans
      const blocks = [];
      let i = 0;
      while (i < tokens.length) {
        if (isMathCompatible(tokens[i], i)) {
          let j = i;
          while (j < tokens.length && isMathCompatible(tokens[j], j)) {
            j++;
          }

          const candidate = tokens.slice(i, j);

          let startIdx = 0;
          while (startIdx < candidate.length && /^\s+$/.test(candidate[startIdx])) {
            startIdx++;
          }
          let endIdx = candidate.length;
          while (
            endIdx > startIdx &&
            (/^\s+$/.test(candidate[endIdx - 1]) || candidate[endIdx - 1] === '.' || candidate[endIdx - 1] === ',')
          ) {
            endIdx--;
          }

          const trimmed = candidate.slice(startIdx, endIdx);
          const trimmedHasTrigger = trimmed.some((t) => isCommandTrigger(t) || isSubSupTrigger(t));

          if (trimmedHasTrigger && trimmed.length > 0) {
            for (let k = 0; k < startIdx; k++) {
              blocks.push(candidate[k]);
            }
            const mathStr = trimmed.join('').replace(/\s{2,}/g, ' ').trim();
            blocks.push(`$${mathStr}$`);
            for (let k = endIdx; k < candidate.length; k++) {
              blocks.push(candidate[k]);
            }
          } else {
            for (let k = i; k < j; k++) {
              blocks.push(tokens[k]);
            }
          }
          i = j;
        } else {
          blocks.push(tokens[i]);
          i++;
        }
      }

      return blocks.join('');
    });

    return processedLines.join('\n');
  });

  return processed.join('');
}

/**
 * Master Paste Normalizer function.
 * Called when pasting text or HTML into Question / Option / Explanation inputs.
 *
 * @param {string} plainText - Raw text from clipboardData.getData('text/plain')
 * @param {string} htmlText - Raw HTML from clipboardData.getData('text/html')
 * @param {object} options - { mode: 'rich' | 'option' | 'plain' }
 * @returns {string} Normalized string with proper LaTeX formatting
 */
export function normalizePastedMath(plainText = '', htmlText = '', options = {}) {
  const { mode = 'rich' } = options;

  let candidateText = '';

  // 1. If HTML or Plain Text clipboard contains MathML, Word OMML, or KaTeX/MathJax, extract from HTML/XML
  const htmlToTest = htmlText || '';
  const plainToTest = plainText || '';

  if (
    htmlToTest &&
    (htmlToTest.includes('<math') ||
      htmlToTest.includes('m:oMath') ||
      htmlToTest.includes('omath') ||
      htmlToTest.includes('class="katex') ||
      htmlToTest.includes('class="MathJax') ||
      htmlToTest.includes('MathType') ||
      htmlToTest.includes('<sup>') ||
      htmlToTest.includes('<sub>'))
  ) {
    const extracted = extractMathFromHtml(htmlToTest);
    if (extracted && extracted.trim().length > 0) {
      candidateText = extracted;
    }
  } else if (
    plainToTest &&
    (plainToTest.includes('<math') ||
      plainToTest.includes('m:oMath') ||
      plainToTest.includes('xmlns:m=') ||
      plainToTest.includes('xmlns="http://www.w3.org/1998/Math/MathML"'))
  ) {
    const extracted = extractMathFromHtml(plainToTest);
    if (extracted && extracted.trim().length > 0) {
      candidateText = extracted;
    }
  }

  // 2. Fallback to plain text if HTML was absent or empty
  if (!candidateText) {
    candidateText = plainText || '';
  }

  // 3. Clean MathType headers, MTEF and formatting quirks
  let normalized = cleanMathType(candidateText);

  // 4. Convert Unicode math characters (arrows, symbols, superscripts, subscripts, Greek)
  // Converting arrows & symbols first allows Word UnicodeMath parser to see \to, \infty, etc.
  normalized = convertUnicodeMathToLatex(normalized);

  // 5. Convert Microsoft Word & MathType UnicodeMath linear notation (┬, ┴, 〖...〗, (\lim), 1/n)
  normalized = convertWordUnicodeMathToLatex(normalized);

  // 6. Convert PageMaker ASCII linear math (derivatives, roots, limits, fractions)
  normalized = convertPageMakerAndAsciiMath(normalized);

  // 7. Normalize LaTeX delimiters (\(..\) -> $..$, \[..\] -> $$..$$)
  normalized = normalizeLatexDelimiters(normalized);

  // 8. In Option mode (MCQ option input):
  // MathLive expects pure math without enclosing $ signs.
  if (mode === 'option') {
    let clean = normalized.trim();
    if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('$') && clean.endsWith('$') && clean.length >= 2) {
      clean = clean.slice(1, -1).trim();
    }
    return clean;
  }

  // 9. In Rich mode (Question text, explanation):
  // Detect unwrapped LaTeX and wrap cleanly in $...$ so equations blend inline while keeping multiline stacked rendering
  normalized = autoDetectAndWrapLatex(normalized);

  // 10. Clean up extra spaces around dollar signs: e.g. "$   \frac{1}{2}   $" -> "$\frac{1}{2}$"
  normalized = normalized.replace(/(?<!\$)\$\s+([^$]+?)\s+\$(?!\$)/g, '$$$1$$');

  // 11. Convert $$...$$ from MathType/TeX to inline-blended $...$ unless it is a multi-row environment
  normalized = normalized.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner) => {
    const clean = inner.trim();
    if (/\\begin\{(?:aligned|cases|matrix|pmatrix|bmatrix|vmatrix)/.test(clean)) {
      return `$$${clean}$$`;
    }
    return `$${clean}$`;
  });

  return normalized;
}

export default normalizePastedMath;
