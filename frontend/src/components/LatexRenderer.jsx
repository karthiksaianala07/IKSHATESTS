import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Preprocessor to detect math formulas that are not wrapped in $ and wrap them.
function autoWrapMath(text) {
  if (!text) return text;
  
  // Normalize newline literals safely without touching LaTeX commands starting with \n
  let normalized = text.replace(/\\n(?![a-z])|\\n(?=(?:[ivx]+|[a-d])\))/g, '\n');
  
  // Split by existing math blocks ($ or $$) so we don't modify them
  const parts = normalized.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  
  const processedParts = parts.map((part, idx) => {
    // If it's already a math block, keep it as is
    if (idx % 2 === 1) return part;
    
    // Contiguous token-based math scanner
    // Split text into tokens: commands, words, symbols, spaces
    const tokenRegex = /(\\[a-zA-Z]+|[a-zA-Z]+|[0-9+=\-<>/*.,()\[\]]+|\s+|.)/g;
    const tokens = part.match(tokenRegex) || [];
    
    const isMathKeyword = (word) => {
      const keywords = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'lim', 'min', 'max', 'deg', 'exp', 'det', 'div', 'grad', 'curl']);
      return keywords.has(word.toLowerCase());
    };
    
    const stopWords = new Set([
      'be', 'is', 'of', 'in', 'at', 'to', 'or', 'by', 'if', 'an', 'on', 'as', 'so', 'do', 'no', 'we', 'he', 'it', 'me', 'my', 'us', 'go',
      'the', 'and', 'for', 'but', 'yet', 'nor', 'all', 'any', 'are', 'was', 'were', 'has', 'had', 'have', 'out', 'our', 'his', 'her', 'its',
      'not', 'can', 'may', 'new', 'old', 'one', 'two', 'few', 'who', 'how', 'why', 'she', 'him', 'you', 'then', 'than', 'this', 'that', 'with'
    ]);
    
    const isMathCompatible = (token) => {
      if (/^\s+$/.test(token)) return true;
      if (/^[0-9+=\-<>/*.,()\[\]]+$/.test(token)) return true;
      if (token.startsWith('\\')) return true;
      if (/^[a-zA-Z]+$/.test(token)) {
        const lower = token.toLowerCase();
        return (token.length <= 2 && !stopWords.has(lower)) || isMathKeyword(token);
      }
      if (/^[\^_\\{}]$/.test(token)) return true;
      return false;
    };
    
    const isMathTrigger = (token) => {
      if (token.startsWith('\\') && token !== '\\n' && token !== '\\t' && token !== '\\r') return true;
      if (/^[\^_]$/.test(token)) return true;
      return false;
    };
    
    const tokenInfos = tokens.map(t => ({
      text: t,
      isCompatible: isMathCompatible(t),
      isTrigger: isMathTrigger(t)
    }));
    
    const blocks = [];
    let i = 0;
    while (i < tokenInfos.length) {
      if (tokenInfos[i].isCompatible) {
        let j = i;
        let hasTrigger = false;
        while (j < tokenInfos.length && tokenInfos[j].isCompatible) {
          if (tokenInfos[j].isTrigger) hasTrigger = true;
          j++;
        }
        
        const blockTokens = tokenInfos.slice(i, j);
        
        let startIdx = 0;
        while (startIdx < blockTokens.length && /^\s+$/.test(blockTokens[startIdx].text)) {
          startIdx++;
        }
        let endIdx = blockTokens.length;
        while (endIdx > startIdx && /^\s+$/.test(blockTokens[endIdx - 1].text)) {
          endIdx--;
        }
        
        const trimmedBlock = blockTokens.slice(startIdx, endIdx);
        const trimmedHasTrigger = trimmedBlock.some(t => t.isTrigger);
        
        if (trimmedHasTrigger && trimmedBlock.length > 0) {
          for (let k = 0; k < startIdx; k++) {
            blocks.push({ text: blockTokens[k].text, isMath: false });
          }
          const mathText = trimmedBlock.map(t => t.text).join('');
          blocks.push({ text: `$${mathText}$`, isMath: true });
          for (let k = endIdx; k < blockTokens.length; k++) {
            blocks.push({ text: blockTokens[k].text, isMath: false });
          }
        } else {
          for (let k = i; k < j; k++) {
            blocks.push({ text: tokenInfos[k].text, isMath: false });
          }
        }
        i = j;
      } else {
        blocks.push({ text: tokenInfos[i].text, isMath: false });
        i++;
      }
    }
    
    return blocks.map(b => b.text).join('');
  });
  
  return processedParts.join('');
}

export default function LatexRenderer({ text = '', className = '' }) {
  if (!text) return null;

  // Preprocess text to wrap missing math blocks in $
  const formattedText = autoWrapMath(text);

  // Split text by block math ($$) and inline math ($)
  const parts = formattedText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-3 overflow-x-auto animate-in fade-in" />;
          } catch (e) {
            console.error("KaTeX block math render error:", e);
            return <span key={index}>{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="animate-in fade-in" />;
          } catch (e) {
            console.error("KaTeX inline math render error:", e);
            return <span key={index}>{part}</span>;
          }
        }
        
        // Render raw text with line breaks preserved
        return (
          <span key={index}>
            {part.split('\n').map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </span>
  );
}
