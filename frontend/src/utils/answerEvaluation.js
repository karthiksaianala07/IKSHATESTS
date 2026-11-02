/**
 * Normalizes an answer key or option identifier into a standardized single character 'A', 'B', 'C', 'D'
 * for MCQs, or a trimmed string for numerical questions.
 */
export const normalizeOptionLetter = (val, type = 'MCQ') => {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (type?.toUpperCase() === 'NUMERICAL' || type?.toUpperCase() === 'INTEGER') {
    return s;
  }
  const upper = s.toUpperCase();
  // Check "Option A", "Option B", etc. or "Option 1", "Option 2"
  const m = upper.match(/OPTION\s*([A-E1-5])/);
  if (m) {
    const char = m[1];
    if (/^[1-5]$/.test(char)) return String.fromCharCode(64 + parseInt(char, 10)); // 1->A, 2->B
    return char;
  }
  // Check 0-based index 0..4 (from legacy test console recordings)
  if (/^[0-4]$/.test(upper)) {
    return String.fromCharCode(65 + parseInt(upper, 10)); // 0->A, 1->B, 2->C, 3->D
  }
  // Single letter A..E
  if (/^[A-E]$/.test(upper)) {
    return upper;
  }
  return upper;
};

/**
 * Universal Answer Comparator
 * Accurately compares student answer against the official key, supporting:
 * - Single letter 'A'..'D'
 * - 'Option A'..'Option D'
 * - 0-based indices 0..3
 * - Numerical / float precision comparison
 */
export const checkAnswer = (studentAnswer, questionOrKey, questionObj = null) => {
  if (studentAnswer === undefined || studentAnswer === null || String(studentAnswer).trim() === '') {
    return false;
  }

  const rawKey = typeof questionOrKey === 'object' && questionOrKey !== null
    ? questionOrKey.correct_answer
    : questionOrKey;

  const qType = (questionObj?.type || questionOrKey?.type || 'MCQ').toUpperCase();
  const sa = String(studentAnswer).trim();
  const ca = String(rawKey || '').trim();

  if (!ca) return false;

  // Direct case-insensitive match
  if (sa.toLowerCase() === ca.toLowerCase()) return true;

  if (qType === 'NUMERICAL' || qType === 'INTEGER') {
    const sNum = parseFloat(sa);
    const cNum = parseFloat(ca);
    if (!isNaN(sNum) && !isNaN(cNum)) {
      return Math.abs(sNum - cNum) < 0.001;
    }
    return sa.toLowerCase() === ca.toLowerCase();
  }

  // MCQ Normalization
  const normStudent = normalizeOptionLetter(sa, 'MCQ');
  const normKey = normalizeOptionLetter(ca, 'MCQ');

  if (normStudent && normKey && normStudent === normKey) {
    return true;
  }

  return false;
};
