const { supabaseAdmin } = require('../config/supabase');

(async () => {
  console.log("Fetching recent tests from database...");
  const { data: tests, error: testErr } = await supabaseAdmin
    .from('tests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (testErr) {
    console.error("Error fetching tests:", testErr);
    return;
  }

  console.log("Recent Tests:", tests);
  if (tests && tests.length > 0) {
    for (const test of tests) {
      console.log(`\n--- Test: ${test.title} (${test.id}) ---`);
      const { data: questions, error: qErr } = await supabaseAdmin
        .from('questions')
        .select('id, subject, type, text, options, correct_answer')
        .eq('test_id', test.id)
        .order('created_at', { ascending: true });

      if (qErr) {
        console.error("Error fetching questions:", qErr);
        continue;
      }

      console.log(`Total questions: ${questions.length}`);
      questions.forEach((q, idx) => {
        console.log(`Q${idx + 1} (${q.type}): Text: "${q.text.substring(0, 80)}" -> Correct Answer: "${q.correct_answer}"`);
        if (q.type === 'MCQ' && q.options) {
          console.log(`   Options: ${JSON.stringify(q.options)}`);
        }
      });
    }
  }
})();
