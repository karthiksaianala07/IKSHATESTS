const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizeOptionLetter(val) {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  if (!s) return '';
  if (/^[a-dA-D]$/.test(s)) return s.toUpperCase();
  const match = s.match(/option\s*([a-dA-D1-4])/i);
  if (match) {
    const char = match[1].toUpperCase();
    if (/^[1-4]$/.test(char)) return String.fromCharCode(64 + parseInt(char, 10));
    return char;
  }
  if (/^[0-3]$/.test(s)) return String.fromCharCode(65 + parseInt(s, 10));
  if (/^[1-4]$/.test(s)) return String.fromCharCode(64 + parseInt(s, 10));
  return s;
}

function checkAnswer(studentAnswer, q) {
  if (studentAnswer === undefined || studentAnswer === null || String(studentAnswer).trim() === '') return false;
  const rawSa = String(studentAnswer).trim();
  const rawCa = String(q.correct_answer || '').trim();

  if (rawSa.toLowerCase() === rawCa.toLowerCase()) return true;

  const isMCQ = (q.type?.toUpperCase() !== 'INTEGER' && q.type?.toUpperCase() !== 'NUMERICAL') || (Array.isArray(q.options) && q.options.length > 0);
  if (isMCQ) {
    const normSa = normalizeOptionLetter(rawSa);
    const normCa = normalizeOptionLetter(rawCa);
    if (normSa && normCa && normSa === normCa) return true;
  }

  const numSa = parseFloat(rawSa);
  const numCa = parseFloat(rawCa);
  if (!isNaN(numSa) && !isNaN(numCa) && Math.abs(numSa - numCa) < 0.0001) return true;

  return false;
}

async function run() {
  console.log("==========================================");
  console.log("STARTING OPTION NORMALIZATION & RE-GRADING");
  console.log("==========================================");

  // STEP 1: Normalize all questions in DB
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, test_id, type, options, correct_answer');

  if (qErr) {
    console.error("Error fetching questions:", qErr);
    process.exit(1);
  }

  console.log(`Fetched ${questions.length} total questions from database.`);
  let questionsUpdated = 0;

  for (const q of questions) {
    const isMCQ = (q.type?.toUpperCase() !== 'INTEGER' && q.type?.toUpperCase() !== 'NUMERICAL') || (Array.isArray(q.options) && q.options.length > 0);
    if (isMCQ && q.correct_answer) {
      const normalized = normalizeOptionLetter(q.correct_answer);
      if (normalized && normalized !== q.correct_answer) {
        const { error: upErr } = await supabase
          .from('questions')
          .update({ correct_answer: normalized })
          .eq('id', q.id);

        if (upErr) {
          console.error(`Failed to update question ${q.id}:`, upErr.message);
        } else {
          questionsUpdated++;
        }
      }
    }
  }

  console.log(`Successfully normalized ${questionsUpdated} questions to single characters A/B/C/D.`);

  // STEP 2: Re-grade all submissions
  const { data: submissions, error: sErr } = await supabase
    .from('submissions')
    .select('id, user_id, test_id, score, correct_count, wrong_count, skipped_count, answers, created_at, profiles(email, full_name)');

  if (sErr) {
    console.error("Error fetching submissions:", sErr);
    process.exit(1);
  }

  console.log(`\nFound ${submissions.length} submissions to re-grade.`);
  const report = [];

  for (const sub of submissions) {
    const { data: testQuestions, error: tqErr } = await supabase
      .from('questions')
      .select('id, test_id, type, options, correct_answer, created_at')
      .eq('test_id', sub.test_id)
      .order('created_at', { ascending: true });

    if (tqErr || !testQuestions || testQuestions.length === 0) {
      console.warn(`Submission ${sub.id}: could not find questions for test ${sub.test_id}`);
      continue;
    }

    const responses = sub.answers?.responses || {};
    let newScore = 0;
    let newCorrect = 0;
    let newWrong = 0;
    let newSkipped = 0;

    testQuestions.forEach((q, idx) => {
      const ans = responses[idx];
      const isSkipped = ans === undefined || ans === null || String(ans).trim() === '';
      if (isSkipped) {
        newSkipped++;
      } else if (checkAnswer(ans, q)) {
        newScore += 4;
        newCorrect++;
      } else {
        newScore -= 1;
        newWrong++;
      }
    });

    // Update submission in DB
    const { error: subUpErr } = await supabase
      .from('submissions')
      .update({
        score: newScore,
        correct_count: newCorrect,
        wrong_count: newWrong,
        skipped_count: newSkipped
      })
      .eq('id', sub.id);

    if (subUpErr) {
      console.error(`Failed to update submission ${sub.id}:`, subUpErr.message);
    } else {
      const studentName = sub.profiles?.full_name || sub.profiles?.email || 'Unknown';
      report.push({
        id: sub.id.substring(0, 8) + '...',
        student: studentName,
        oldScore: sub.score,
        newScore: newScore,
        oldCorrect: sub.correct_count,
        newCorrect: newCorrect,
        oldWrong: sub.wrong_count,
        newWrong: newWrong,
        newSkipped: newSkipped
      });
    }
  }

  console.log("\n================ RE-GRADING SUMMARY REPORT ================");
  console.table(report);
  console.log("===========================================================");
  console.log("ALL SUBMISSIONS RE-GRADED AND DATABASE CONSISTENCY RESTORED!");
}

run().catch(console.error);
