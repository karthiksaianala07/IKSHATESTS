const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERROR: Missing credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockQuestions = [
  { id: 1, subject: "Physics", chapter: "Motion in a Plane", type: "MCQ", text: "A particle is moving in a circle of radius R with a constant speed v. What is the magnitude of average velocity after it has moved by an angle θ?", options: ["2v sin(θ/2) / θ", "v sin(θ)", "v cos(θ)", "v sin(θ/2)"], correct: 0 },
  { id: 2, subject: "Physics", chapter: "Motion in a Straight Line", type: "NUMERICAL", text: "A car accelerates from rest at a constant rate 'a' for some time, after which it decelerates at a constant rate 'b' to come to rest. If total time elapsed is t, what is the maximum velocity acquired by car in terms of a, b, and t?", correct: "12" },
  { id: 3, subject: "Chemistry", chapter: "Organic Chemistry - Some Basic Principles and Techniques", type: "MCQ", text: "Which of the following has the highest dipole moment?", options: ["CH3Cl", "CH2Cl2", "CHCl3", "CCl4"], correct: 0 },
  { id: 4, subject: "Mathematics", chapter: "Integrals", type: "MCQ", text: "The value of ∫ e^x (f(x) + f'(x)) dx is:", options: ["e^x f(x) + C", "e^x f'(x) + C", "e^x/f(x) + C", "None of these"], correct: 0 },
  { id: 5, subject: "Mathematics", chapter: "Relations and Functions", type: "MCQ", text: "If log 2 = 0.3010 and log 3 = 0.4771, the value of log 5 is:", options: ["0.4771", "0.6990", "0.7781", "0.1761"], correct: 1 },
];

async function seedDatabase() {
  console.log("🚀 Starting database seeding...");

  try {
    // 1. Create a default JEE Test metadata
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .upsert({ 
        title: 'JEE Ultimate Mock #1',
        category: 'JEE',
        duration_minutes: 180
      }, { onConflict: 'title' })
      .select()
      .single();

    if (testError) throw testError;

    console.log(`✅ Test Created: ${testData.title} (ID: ${testData.id})`);

    // 2. Map and Insert Questions
    const questionsToInsert = mockQuestions.map(q => ({
      test_id: testData.id,
      subject: q.subject,
      chapter: q.chapter,
      type: q.type || 'MCQ',
      text: q.text,
      options: q.options || [],
      correct_answer: String(q.correct)
    }));

    const { error: qError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (qError) throw qError;

    console.log(`✅ Successfully seeded ${questionsToInsert.length} questions.`);
    console.log("🌟 Seeding Complete!");

  } catch (err) {
    console.error("❌ Seeding Failed:", err.message);
  }
}

seedDatabase();
