const fs = require('fs');
const path = require('path');

const stopWords = new Set([
  'be', 'is', 'of', 'in', 'at', 'to', 'or', 'by', 'if', 'an', 'on', 'as', 'so', 'do', 'no', 'we', 'he', 'it', 'me', 'my', 'us', 'go',
  'the', 'and', 'for', 'but', 'yet', 'nor', 'all', 'any', 'are', 'was', 'were', 'has', 'had', 'have', 'out', 'our', 'his', 'her', 'its',
  'not', 'can', 'may', 'new', 'old', 'one', 'two', 'few', 'who', 'how', 'why', 'she', 'him', 'you', 'then', 'than', 'this', 'that', 'with'
]);

const tokenRegex = /(\\[a-zA-Z]+|[a-zA-Z]+|[0-9+=\-<>/*.,()\[\]]+|\s+|.)/g;

const isMathKeyword = (word) => {
  const keywords = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'lim', 'min', 'max', 'deg', 'exp', 'det', 'div', 'grad', 'curl']);
  return keywords.has(word.toLowerCase());
};

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

function autoWrapMath(text) {
  if (!text) return text;
  let normalized = text.replace(/\\n(?![a-z])|\\n(?=(?:[ivx]+|[a-d])\))/g, '\n');
  const parts = normalized.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  const processedParts = parts.map((part, idx) => {
    if (idx % 2 === 1) return part;
    const tokens = part.match(tokenRegex) || [];
    const blocks = [];
    let i = 0;
    while (i < tokens.length) {
      if (isMathCompatible(tokens[i])) {
        let j = i;
        let hasTrigger = false;
        while (j < tokens.length && isMathCompatible(tokens[j])) {
          if (isMathTrigger(tokens[j])) hasTrigger = true;
          j++;
        }
        const blockTokens = tokens.slice(i, j);
        let startIdx = 0;
        while (startIdx < blockTokens.length && /^\s+$/.test(blockTokens[startIdx])) {
          startIdx++;
        }
        let endIdx = blockTokens.length;
        while (endIdx > startIdx && /^\s+$/.test(blockTokens[endIdx - 1])) {
          endIdx--;
        }
        const trimmedBlock = blockTokens.slice(startIdx, endIdx);
        const trimmedHasTrigger = trimmedBlock.some(t => isMathTrigger(t));
        if (trimmedHasTrigger && trimmedBlock.length > 0) {
          for (let k = 0; k < startIdx; k++) {
            blocks.push({ text: blockTokens[k], isMath: false });
          }
          const mathText = trimmedBlock.join('');
          blocks.push({ text: '$' + mathText + '$', isMath: true });
          for (let k = endIdx; k < blockTokens.length; k++) {
            blocks.push({ text: blockTokens[k], isMath: false });
          }
        } else {
          for (let k = i; k < j; k++) {
            blocks.push({ text: tokens[k], isMath: false });
          }
        }
        i = j;
      } else {
        blocks.push({ text: tokens[i], isMath: false });
        i++;
      }
    }
    return blocks.map(b => b.text).join('');
  });
  return processedParts.join('');
}

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../cached_questions.json'), 'utf8'));
console.log(`Processing ${questions.length} questions...`);

let count = 0;
for (const q of questions) {
  const original = q.text;
  const wrapped = autoWrapMath(original);
  if (original !== wrapped) {
    count++;
    if (count <= 10) {
      console.log(`\n--- Match ${count} ---`);
      console.log('Original:', original);
      console.log('Wrapped :', wrapped);
    }
  }
}
console.log(`\nTotal modified texts: ${count}`);
