const stopWords = new Set([
  'be', 'is', 'of', 'in', 'at', 'to', 'or', 'by', 'if', 'an', 'on', 'as', 'so', 'do', 'no', 'we', 'he', 'it', 'me', 'my', 'us', 'go',
  'the', 'and', 'for', 'but', 'yet', 'nor', 'all', 'any', 'are', 'was', 'were', 'has', 'had', 'have', 'out', 'our', 'his', 'her', 'its',
  'not', 'can', 'may', 'new', 'old', 'one', 'two', 'few', 'who', 'how', 'why', 'she', 'him', 'you', 'then', 'than', 'this', 'that', 'with'
]);

function autoWrapMath(text) {
  if (!text) return text;
  let normalized = text.replace(/\\n/g, '\n');
  const parts = normalized.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  console.log('Split parts:', parts);
  const processedParts = parts.map((part, idx) => {
    if (idx % 2 === 1) return part;
    const tokenRegex = /(\\[a-zA-Z]+|[a-zA-Z]+|[0-9_^+=\-<>/*.,()\[\]{}]+|\s+|.)/g;
    const tokens = part.match(tokenRegex) || [];
    const isMathKeyword = (word) => {
      const keywords = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'lim', 'min', 'max', 'deg', 'exp', 'det', 'div', 'grad', 'curl']);
      return keywords.has(word.toLowerCase());
    };
    const isMathCompatible = (token) => {
      if (/^\s+$/.test(token)) return true;
      if (/^[0-9_^+=\-<>/*.,()\[\]{}]+$/.test(token)) return true;
      if (token.startsWith('\\')) return true;
      if (/^[a-zA-Z]+$/.test(token)) {
        const lower = token.toLowerCase();
        return (token.length <= 2 && !stopWords.has(lower)) || isMathKeyword(token);
      }
      if (/^[\^_]$/.test(token)) return true;
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
          blocks.push({ text: '$' + mathText + '$', isMath: true });
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

const dbText = 'For the reaction : $H_{2(g)} + Br_{2(g)} \\\\rightarrow 2HBr_{(g)}$, the experimental data suggests Rate = k[H_2][Br_2]^{1/2}. The molecularity and order of the reaction is';
console.log('Result:', autoWrapMath(dbText));
