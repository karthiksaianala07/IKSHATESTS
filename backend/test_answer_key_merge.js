const assert = require('assert');

// Define the exact merging logic implemented in server.js
function mergeAnswers(allQuestions, allAnswers) {
  if (Object.keys(allAnswers).length > 0) {
    for (const q of allQuestions) {
      let qNum = q.question_number;
      if (!qNum && q.text) {
        // Fallback: search for numbers at start of text, e.g. "51." or "(51)" or "51)"
        const match = q.text.match(/^\s*(?:Q\s*)?\(?(\d+)\)?[\.\)]/i);
        if (match) {
          qNum = match[1];
        }
      }

      if (qNum && allAnswers[qNum]) {
        const ansVal = String(allAnswers[qNum]).trim();
        
        if (q.type?.toLowerCase() === 'mcq') {
          let mappedIndex = null;
          if (/^[1-4]$/.test(ansVal)) {
            mappedIndex = parseInt(ansVal, 10) - 1;
          } else if (/^[A-D]$/i.test(ansVal)) {
            mappedIndex = ansVal.toUpperCase().charCodeAt(0) - 65;
          }
          
          if (mappedIndex !== null && mappedIndex >= 0 && mappedIndex < 4) {
            const optionsMap = ["Option A", "Option B", "Option C", "Option D"];
            q.correct_answer = optionsMap[mappedIndex];
          } else {
            q.correct_answer = ansVal;
          }
        } else {
          // Numerical/Integer
          q.correct_answer = ansVal;
        }
      }
    }
  }
  return allQuestions;
}

// Define test cases
const mockQuestions = [
  {
    question_number: "51",
    type: "mcq",
    text: "Find the value of x...",
    correct_answer: ""
  },
  {
    question_number: "52",
    type: "mcq",
    text: "Discontinuity at...",
    correct_answer: ""
  },
  {
    type: "mcq",
    text: "53. What is dy/dx...", // Uses regex fallback matching
    correct_answer: ""
  },
  {
    question_number: "71",
    type: "numerical",
    text: "Calculate the integer limit...",
    correct_answer: ""
  }
];

const mockAnswers = {
  "51": "2",  // MCQ index: 1 (Option B)
  "52": "D",  // MCQ index: 3 (Option D)
  "53": "3",  // MCQ index: 2 (Option C)
  "71": "26"  // Numerical literal
};

console.log("Running merge validation tests...");

const merged = mergeAnswers(mockQuestions, mockAnswers);

try {
  // Test Case 1: MCQ digit mapping
  assert.strictEqual(merged[0].correct_answer, "Option B", "Q51: '2' should map to MCQ label 'Option B'");
  console.log("✔ Q51 digit-to-label MCQ mapping passed!");

  // Test Case 2: MCQ letter mapping
  assert.strictEqual(merged[1].correct_answer, "Option D", "Q52: 'D' should map to MCQ label 'Option D'");
  console.log("✔ Q52 letter-to-label MCQ mapping passed!");

  // Test Case 3: Regex fallback matching
  assert.strictEqual(merged[2].correct_answer, "Option C", "Q53: '3' should map to MCQ label 'Option C' via regex fallback");
  console.log("✔ Q53 regex fallback question number mapping passed!");

  // Test Case 4: Numerical value mapping
  assert.strictEqual(merged[3].correct_answer, "26", "Q71: should map to literal numerical value '26'");
  console.log("✔ Q71 numerical literal mapping passed!");

  console.log("\nAll unit tests passed successfully!");
} catch (error) {
  console.error("❌ Test validation failed:", error.message);
  process.exit(1);
}
