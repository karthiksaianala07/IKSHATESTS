const { supabaseAdmin } = require('../config/supabase');

async function checkQuestions() {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('subject, type, text, correct_answer')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching questions:", error.message);
  } else {
    console.log("Questions in DB (last 5):", data);
  }
}

checkQuestions();
