const fs = require('fs');
const path = require('path');
const cachePath = path.join(__dirname, '../cached_questions.json');

if (fs.existsSync(cachePath)) {
  const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log(`Loaded ${data.length} cached questions.`);
  
  // Print questions 51 to 75 (indexes 50 to 74)
  for (let i = 50; i < data.length; i++) {
    const q = data[i];
    console.log(`Q${i+1} (${q.type}): text: "${q.text.substring(0, 60)}"`);
    console.log(`   Options: ${JSON.stringify(q.options)}`);
    console.log(`   Correct: "${q.correct_answer}"`);
  }
} else {
  console.log("cached_questions.json not found.");
}
