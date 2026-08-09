const testCases = [
  '{"text": "Statement I \\\\lim_{x\\\\to0}[g(x)\\\\cot x - g(0)\\\\csc x] = f\'\'(0)"}',
  '{"text": "12. Let $f$ and $g$ be real valued functions defined on interval $(-1,1)$ such that $g\'\'(x)$ is continuous, $g(0)\\neq0, g\'(0)=0, g\'\'(0)\\neq0$ and $f(x)=g(x)\\sin x$. Statement I \\lim_{x\\to0}[g(x)\\cot x - g(0)\\csc x] = f\'\'(0) and Statement II $f\'(0)=g(0)$."}',
  '{"text": "If derivative of \\\\tan^{-1}\\\\left(\\\\frac{6x\\\\sqrt{x}}{1-9x^3}\\\\right) is \\\\sqrt{x} \\\\cdot g(x)"}',
  '{"text": "If derivative of \\tan^{-1}\\left(\\frac{6x\\sqrt{x}}{1-9x^3}\\right) is \\sqrt{x} \\cdot g(x)"}'
];

const regex = /(?<!\\)\\(?!["\\]|u[0-9a-fA-F]{4})/g;

testCases.forEach((tc, idx) => {
  console.log(`\n--- Test Case ${idx + 1} ---`);
  console.log('Original:', tc);
  const sanitized = tc.replace(regex, '\\\\');
  console.log('Sanitized:', sanitized);
  try {
    const parsed = JSON.parse(sanitized);
    console.log('Parsed successfully! Text:', parsed.text);
  } catch (err) {
    console.error('Failed to parse:', err.message);
  }
});
