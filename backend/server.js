const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');
const mammoth = require('mammoth');
const { supabaseAdmin } = require('./config/supabase');

const upload = multer({ storage: multer.memoryStorage() });
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const app = express();

// Standard middleware & CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.netlify\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// -----------------------
// LIVE SUPABASE ROUTES
// -----------------------

// 0. Health Check Ping
app.get('/api/ping', (req, res) => {
  res.json({ status: "ok", message: "IkshaTests API Bridge is ACTIVE" });
});

// 1. Auth Legacy Check (Supabase Auth handles this now on the frontend, 
// but we keep this for backwards compatibility or custom logic if needed)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Legacy login attempt for: ${email}`);
  res.status(410).json({ error: "Please use the Supabase Auth system." });
});

// 2a. Public test listing by category (for JEE/NEET library pages)
app.get('/api/tests', async (req, res) => {
  try {
    const { category } = req.query;
    let query = supabaseAdmin
      .from('tests')
      .select('*, questions(id)')
      .order('created_at', { ascending: false });
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    const testsWithCount = (data || []).map(t => ({
      ...t,
      question_count: t.questions ? t.questions.length : 0
    }));
    res.json(testsWithCount);
  } catch (err) {
    console.error("[LIST_TESTS_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch tests." });
  }
});

// 2. Exam Fetch (LIVE)
app.get('/api/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, try to find the test metadata
    const { data: test, error: testError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .or(`id.eq.${id},title.eq.${id}`) // Allow fetching by UUID or Title
      .single();

    if (testError || !test) {
      // Fallback for demo: if ID is "JEE-MOCK-1", we just return our seeded test
      const { data: fallbackTest } = await supabaseAdmin
        .from('tests')
        .select('*')
        .limit(1)
        .single();
      
      if (!fallbackTest) return res.status(404).json({ error: "No tests found in database." });
      
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('test_id', fallbackTest.id)
        .order('created_at', { ascending: true });

      return res.json({ testId: fallbackTest.id, title: fallbackTest.title, scheduled_at: fallbackTest.scheduled_at || null, questions });
    }

    // Fetch questions for this specific test
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('test_id', test.id)
      .order('created_at', { ascending: true });

    if (qError) throw qError;

    res.json({ testId: test.id, title: test.title, scheduled_at: test.scheduled_at || null, questions });
  } catch (err) {
    console.error("[FETCH_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch test questions." });
  }
});

// 3. Admin Analytics (LIVE)
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Real-time counts from the database
    const { count: studentCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: testCount } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true });
    
    // Calculate average score
    const { data: subData } = await supabaseAdmin.from('submissions').select('score');
    const avgScore = subData.length > 0 
      ? Math.round(subData.reduce((acc, curr) => acc + curr.score, 0) / subData.length)
      : 0;

    res.json({
      activeStudents: studentCount || 0,
      testsSubmitted: testCount || 0,
      avgScore: avgScore
    });
  } catch (err) {
    console.error("[STATS_ERROR]", err.message);
    res.json({ activeStudents: 0, testsSubmitted: 0, avgScore: 0 }); // Fallback
  }
});

// In-memory logs for Exambot proctoring violations
const exambotViolations = [
  { id: 1, email: "rahul.sharma@gmail.com", testTitle: "JEE Ultimate Mock #1", violation: "Tab switch detected", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), severity: "HIGH" },
  { id: 2, email: "priya.patel@gmail.com", testTitle: "NEET Prep Booster #3", violation: "Multiple monitors detected", timestamp: new Date(Date.now() - 3600000).toISOString(), severity: "CRITICAL" },
  { id: 3, email: "amit.verma@outlook.com", testTitle: "JEE Ultimate Mock #1", violation: "SEB integrity verification bypass", timestamp: new Date(Date.now() - 600000).toISOString(), severity: "MEDIUM" }
];

// 5. Generate and download Safe Exam Browser (.seb) config file
app.get('/api/seb/config', (req, res) => {
  const testId = req.query.testId || '';
  const referer = req.headers.referer || 'http://localhost:5173/';
  let origin = 'http://localhost:5173/';
  try {
    const parsedUrl = new URL(referer);
    origin = parsedUrl.origin;
  } catch (e) {
    console.error("[SEB_CONFIG] Failed to parse referer:", referer, e.message);
  }
  if (!origin.endsWith('/')) {
    origin += '/';
  }
  const targetUrl = testId ? `${origin}test/${testId}` : origin;
  
  // Generate a standard unencrypted plist XML for SEB
  // Note: All keys inside the <dict> block MUST be sorted alphabetically for SEB to parse them correctly.
  const sebConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>allowPreferencesWindow</key>
	<false/>
	<key>allowQuit</key>
	<true/>
	<key>allowSwitchToApplications</key>
	<false/>
	<key>allowVirtualMachine</key>
	<false/>
	<key>browserWindowWebView</key>
	<integer>3</integer>
	<key>originatorVersion</key>
	<string>SEB_Win_3.3.2</string>
	<key>prohibitScreenshot</key>
	<true/>
	<key>quitURL</key>
	<string>${origin}</string>
	<key>sendBrowserExamKey</key>
	<true/>
	<key>startURL</key>
	<string>${targetUrl}</string>
</dict>
</plist>`;

  res.setHeader('Content-Disposition', 'attachment; filename="ikshatests.seb"');
  res.setHeader('Content-Type', 'application/x-safeexambrowser-config');
  res.send(sebConfigXml);
});

// 6. Submit Exam Results and Log Violations
app.post('/api/submissions', async (req, res) => {
  try {
    const { testId, userId, email, score, correctCount, wrongCount, skippedCount, answers, proctoring } = req.body;
    
    console.log(`[SUBMISSION] Received test submission for ${email || 'Anonymous'}, Score: ${score}`);
    
    let profileId = userId;
    if (!profileId) {
      // Find matching profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email || 'karthiksaianala@gmail.com')
        .limit(1)
        .single();
      if (profile) {
        profileId = profile.id;
      } else {
        const { data: anyProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .limit(1)
          .single();
        profileId = anyProfile ? anyProfile.id : null;
      }
    }
    
    let submissionResult = null;
    if (profileId) {
      const { data, error } = await supabaseAdmin
        .from('submissions')
        .insert({
          user_id: profileId,
          test_id: testId,
          score: score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          skipped_count: skippedCount,
          answers: { 
            responses: answers,
            proctoring: proctoring || {}
          }
        })
        .select()
        .single();
        
      if (error) {
        console.error("[SUBMISSION_DB_ERROR]", error.message);
      } else {
        submissionResult = data;
      }
    }
    
    // Log violations to Exambot
    if (proctoring && proctoring.violations && proctoring.violations.length > 0) {
      const { data: test } = await supabaseAdmin
        .from('tests')
        .select('title')
        .eq('id', testId)
        .single();
        
      const testTitle = test ? test.title : "Mock Exam";
      
      proctoring.violations.forEach(v => {
        exambotViolations.unshift({
          id: exambotViolations.length + 1,
          email: email || "student@ikshatests.com",
          testTitle: testTitle,
          violation: v.reason || "Proctoring Alert",
          timestamp: v.timestamp || new Date().toISOString(),
          severity: v.severity || "HIGH"
        });
      });
    }
    
    res.json({ success: true, submission: submissionResult });
  } catch (err) {
    console.error("[SUBMISSION_POST_ERROR]", err.message);
    res.status(500).json({ error: "Failed to process test submission." });
  }
});

// 7. Get live proctoring violations for Admin Feed
app.get('/api/admin/violations', (req, res) => {
  res.json(exambotViolations);
});

// 7.5 Get all questions (Admin only, bypasses RLS, supports pagination)
app.get('/api/admin/questions', async (req, res) => {
  try {
    const { paginate, page, limit, search, subject, chapter } = req.query;

    if (paginate === 'true') {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      
      let query = supabaseAdmin
        .from('questions')
        .select('*', { count: 'exact' });

      if (subject && subject !== 'All') {
        query = query.eq('subject', subject);
      }

      if (chapter && chapter !== 'All') {
        query = query.eq('chapter', chapter);
      }

      if (search) {
        query = query.ilike('text', `%${search}%`);
      }

      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return res.json({
        questions: data || [],
        total: count || 0,
        page: pageNum,
        totalPages: Math.ceil((count || 0) / limitNum)
      });
    }

    // Default unpaginated query (for backwards compatibility)
    let query = supabaseAdmin
      .from('questions')
      .select('*');
    if (subject && subject !== 'All') {
      query = query.eq('subject', subject);
    }
    if (chapter && chapter !== 'All') {
      query = query.eq('chapter', chapter);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("[GET_QUESTIONS_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch question repository" });
  }
});

// 7.6 Add single or bulk questions (Admin only, bypasses RLS)
app.post('/api/admin/questions', async (req, res) => {
  try {
    const payload = req.body;
    
    // Fetch default test if test_id is not provided
    const { data: test, error: testError } = await supabaseAdmin.from('tests').select('id').limit(1).single();
    if (testError || !test) {
      return res.status(400).json({ error: "Please ensure a test exists in the database first!" });
    }

    let result;
    if (Array.isArray(payload)) {
      const formatted = payload.map(q => ({
        subject: q.subject,
        chapter: q.chapter || null,
        type: q.type || 'MCQ',
        text: q.text,
        options: q.options || [],
        correct_answer: String(q.correct_answer),
        image_url: q.image_url || null,
        sub_text: q.sub_text || null,
        test_id: test.id
      }));
      const { data, error } = await supabaseAdmin.from('questions').insert(formatted).select();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin.from('questions').insert({
        subject: payload.subject,
        chapter: payload.chapter || null,
        type: payload.type || 'MCQ',
        text: payload.text,
        options: payload.options || [],
        correct_answer: String(payload.correct_answer),
        image_url: payload.image_url || null,
        sub_text: payload.sub_text || null,
        test_id: test.id
      }).select().single();
      if (error) throw error;
      result = data;
    }
    
    res.json({ success: true, result });
  } catch (err) {
    console.error("[ADD_QUESTION_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to save question to database" });
  }
});

// 7.7 Get all tests (Admin only, bypasses RLS)
app.get('/api/admin/tests', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tests')
      .select('*, questions(id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Map questions array to a count
    const testsWithCount = (data || []).map(t => ({
      ...t,
      question_count: t.questions ? t.questions.length : 0
    }));
    
    res.json(testsWithCount);
  } catch (err) {
    console.error("[GET_ADMIN_TESTS_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

// 7.7 Extract questions from PDF Images (Admin only)
app.post('/api/admin/extract-pdf', async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    // Fast-path bypass using pre-extracted cache file to avoid rate limits (only during integration testing)
    const fs = require('fs');
    const path = require('path');
    const cachePath = path.join(__dirname, 'cached_questions.json');
    if (req.headers['x-use-cache'] === 'true' && fs.existsSync(cachePath)) {
      console.log("[EXTRACT_PDF] Serving questions from local cached_questions.json...");
      try {
        const cachedData = fs.readFileSync(cachePath, 'utf8');
        const parsedQuestions = JSON.parse(cachedData);
        return res.json({ success: true, questions: parsedQuestions });
      } catch (cacheErr) {
        console.error("[EXTRACT_PDF] Error reading cached questions:", cacheErr);
      }
    }

    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const prompt = `
You are an expert STEM document parser. 
Attached is a high-resolution image snapshot of a page from a PDF test paper.

Return ONLY a valid JSON object matching this schema (do not include markdown formatting like \`\`\`json or backticks, return raw JSON string):
{
  "questions": [
    // A JSON array of question objects extracted from this page. If there are no questions, return an empty array [].
    // Each question object must strictly match this schema:
    {
      "question_number": "51", // The question number if explicitly written next to the question (e.g., "51.", "(51)"), else null
      "subject": "Physics", // Infer subject if possible (Physics, Chemistry, Mathematics, Biology), else "Physics"
      "chapter": "Inferred standard NCERT Class 11/12 Chapter name (e.g. 'Motion in a Plane', 'Electrochemistry', 'Integrals', 'Human Reproduction') matching the subject, or null if uncertain",
      "type": "mcq", // MUST BE EXACTLY "mcq", "integer", or "numerical"
      "text": "The main question text BEFORE the diagram or image, with LaTeX for math like $\\int x^2 dx$ or $\\frac{1}{2}$",
      "sub_text": "Any optional question text or follow-up question that appears AFTER the diagram or image, with LaTeX if applicable, or null if there is no text below the diagram",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer": "", // Leave empty if not explicitly found in the text
      "diagram_bbox": [ymin, xmin, ymax, xmax] // If this specific question contains or refers to an associated visual diagram, graph, circuit, structure, or illustration on the page image, return its bounding box coordinates normalized to a 0-1000 scale. If no diagram exists for this question, return null.
    }
  ],
  "answer_key": {
    // If the page contains a table, grid, list, or sheet of correct answers/keys (e.g. "51)2  52)2" or a mapping of question numbers to their correct answers), extract it as a key-value map here. 
    // Example: { "51": "2", "52": "2", "71": "26", "75": "14" }
    // If no answer key or answer grid is present on the page, return an empty object {}.
  }
}
`;

    const allQuestions = [];
    const allAnswers = {};

    for (let idx = 0; idx < images.length; idx++) {
      const base64 = images[idx];
      const contentsArr = [
        { inlineData: { data: base64, mimeType: "image/jpeg" } },
        prompt
      ];

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
      let responseText = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        let retries = 3;
        while (retries > 0) {
          try {
            console.log(`[EXTRACT_PDF] Page ${idx + 1}/${images.length} - Trying model: ${modelName} (Attempt ${4 - retries}/3)...`);
            const res = await ai.models.generateContent({
              model: modelName,
              contents: contentsArr,
              config: {
                responseMimeType: "application/json"
              }
            });
            if (res && res.text) {
              console.log(`[EXTRACT_PDF] Page ${idx + 1}/${images.length} - Success with model: ${modelName}`);
              responseText = res.text;
              break;
            }
          } catch (err) {
            console.warn(`[EXTRACT_PDF] Page ${idx + 1}/${images.length} - Model ${modelName} failed:`, err.message);
            lastError = err;
            
            if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota')) {
              console.log(`[EXTRACT_PDF] Rate limit or service unavailable detected. Waiting 5s before retry...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
              retries--;
            } else {
              break;
            }
          }
        }
        if (responseText) break;
      }

      // Fallback to OpenAI gpt-4o-mini if Gemini failed and OpenAI is configured
      if (!responseText && openaiClient) {
        try {
          console.log(`[EXTRACT_PDF] Page ${idx + 1}/${images.length} - Trying OpenAI gpt-4o-mini fallback...`);
          const res = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64}`
                    }
                  }
                ]
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 4096
          });
          if (res && res.choices && res.choices[0] && res.choices[0].message) {
            console.log(`[EXTRACT_PDF] Page ${idx + 1}/${images.length} - Success with OpenAI gpt-4o-mini`);
            responseText = res.choices[0].message.content;
          }
        } catch (err) {
          console.warn(`[EXTRACT_PDF] Page ${idx + 1}/${images.length} - OpenAI fallback failed:`, err.message);
          lastError = err;
        }
      }

      if (!responseText) {
        throw new Error(`Failed to extract page ${idx + 1}. Last error: ${lastError?.message || 'Unknown error'}`);
      }

      let rawJson = responseText || '';
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();

      // Sanitize rawJson: escape any unescaped backslashes that are part of LaTeX or math macros
      rawJson = rawJson.replace(/(?<!\\)\\(?!["\\]|u[0-9a-fA-F]{4})/g, '\\\\');

      try {
        let parsed = null;
        try {
          parsed = JSON.parse(rawJson);
        } catch (pe) {
          // Attempt regex match if direct JSON parse fails
          const matchArr = rawJson.match(/\[[\s\S]*\]/);
          const matchObj = rawJson.match(/\{[\s\S]*\}/);
          if (matchArr) {
            parsed = JSON.parse(matchArr[0]);
          } else if (matchObj) {
            parsed = JSON.parse(matchObj[0]);
          } else {
            throw pe;
          }
        }

        if (Array.isArray(parsed)) {
          const mapped = parsed.map(q => ({
            ...q,
            page_index: idx
          }));
          allQuestions.push(...mapped);
          console.log(`[EXTRACT_PDF] Page ${idx + 1} - Extracted ${mapped.length} questions (fallback array format).`);
        } else if (parsed && typeof parsed === 'object') {
          let questionsFound = false;
          let answerKeyFound = false;

          if (parsed.questions && Array.isArray(parsed.questions)) {
            const mapped = parsed.questions.map(q => ({
              ...q,
              page_index: idx
            }));
            allQuestions.push(...mapped);
            questionsFound = true;
            console.log(`[EXTRACT_PDF] Page ${idx + 1} - Extracted ${mapped.length} questions.`);
          }

          if (parsed.answer_key && typeof parsed.answer_key === 'object') {
            const ansCount = Object.keys(parsed.answer_key).length;
            if (ansCount > 0) {
              Object.assign(allAnswers, parsed.answer_key);
              answerKeyFound = true;
              console.log(`[EXTRACT_PDF] Page ${idx + 1} - Extracted ${ansCount} answer key entries.`);
            }
          }

          // Legacy FORMAT A support
          if (parsed.type === 'answer_key' && parsed.answers) {
            const ansCount = Object.keys(parsed.answers).length;
            if (ansCount > 0) {
              Object.assign(allAnswers, parsed.answers);
              answerKeyFound = true;
              console.log(`[EXTRACT_PDF] Page ${idx + 1} - Extracted ${ansCount} answer key entries (fallback legacy format).`);
            }
          }

          if (!questionsFound && !answerKeyFound) {
            console.warn(`[EXTRACT_PDF] Page ${idx + 1} returned empty/unknown JSON structure:`, rawJson);
          }
        } else {
          console.warn(`[EXTRACT_PDF] Page ${idx + 1} returned unknown JSON structure:`, rawJson);
        }
      } catch (parseError) {
        console.error(`[EXTRACT_PDF] Page ${idx + 1} JSON parse/extraction error:`, parseError, rawJson);
        throw new Error(`AI failed to format the output into valid JSON on page ${idx + 1}.`);
      }

      if (idx < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    if (Object.keys(allAnswers).length > 0) {
      console.log(`[EXTRACT_PDF] Merging ${Object.keys(allAnswers).length} answers into ${allQuestions.length} questions...`);
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
              console.log(`[EXTRACT_PDF] Question ${qNum} mapped to MCQ label ${optionsMap[mappedIndex]} (answer: ${ansVal})`);
            } else {
              q.correct_answer = ansVal;
              console.log(`[EXTRACT_PDF] Question ${qNum} mapped to correct_answer: ${ansVal}`);
            }
          } else {
            // Numerical/Integer
            q.correct_answer = ansVal;
            console.log(`[EXTRACT_PDF] Numerical Question ${qNum} mapped to literal: ${ansVal}`);
          }
        }
      }
    }

    res.json({ success: true, questions: allQuestions });
  } catch (err) {
    console.error("[EXTRACT_PDF_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to extract PDF" });
  }
});

// 7.7.5 Extract questions from Word Document (Admin only)
app.post('/api/admin/extract-docx', async (req, res) => {
  try {
    const { docx } = req.body;
    if (!docx) {
      return res.status(400).json({ error: "No Word document provided" });
    }

    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const buffer = Buffer.from(docx, 'base64');

    // Custom image converter that uploads images directly to Supabase storage
    const options = {
      convertImage: mammoth.images.imgElement(async (image) => {
        try {
          const imageBuffer = await image.read();
          const ext = image.contentType.split('/').pop() || 'png';
          const fileName = `extracted_docx_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
          const filePath = `questions/${fileName}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('question-assets')
            .upload(filePath, imageBuffer, {
              contentType: image.contentType,
              upsert: true
            });

          if (uploadError) {
            console.error("[EXTRACT_DOCX] Image upload to Supabase failed:", uploadError.message);
            return { src: "" };
          }

          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('question-assets')
            .getPublicUrl(filePath);

          console.log(`[EXTRACT_DOCX] Successfully uploaded docx image: ${publicUrl}`);
          return { src: publicUrl };
        } catch (imgErr) {
          console.error("[EXTRACT_DOCX] Error converting image:", imgErr);
          return { src: "" };
        }
      })
    };

    console.log("[EXTRACT_DOCX] Extracting text and images from Word document...");
    const mammothResult = await mammoth.convertToHtml({ buffer }, options);
    const htmlContent = mammothResult.value;

    const prompt = `
You are an expert STEM document parser. 
Attached is the HTML content of a Word (.docx) test paper. It contains text, formatting, math equations, and image tags pointing to uploaded diagrams.

Your task is to parse this document and extract all the test questions, options, and answer key.
Return ONLY a valid JSON object matching this schema (do not include markdown formatting like \`\`\`json or backticks, return raw JSON string):
{
  "questions": [
    // A JSON array of question objects extracted from this document. If there are no questions, return an empty array [].
    // Each question object must strictly match this schema:
    {
      "question_number": "51", // The question number if explicitly written next to the question (e.g., "51.", "(51)"), else null
      "subject": "Physics", // Infer subject if possible (Physics, Chemistry, Mathematics, Biology), else "Physics"
      "chapter": "Inferred standard NCERT Class 11/12 Chapter name (e.g. 'Motion in a Plane', 'Electrochemistry', 'Integrals', 'Human Reproduction') matching the subject, or null if uncertain",
      "type": "mcq", // MUST BE EXACTLY "mcq" or "numerical"
      "text": "The main question text BEFORE the diagram or image, with LaTeX for math like $\\int x^2 dx$ or $\\frac{1}{2}$",
      "sub_text": "Any optional question text or follow-up question that appears AFTER the diagram or image, with LaTeX if applicable, or null if there is no text below the diagram",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"], // A list of 4 options if type is "mcq", else an empty array []
      "correct_answer": "", // Leave empty if not explicitly found in the text or answer key
      "image_url": "URL of the diagram or image associated with this question. If an <img> tag is located inside or directly adjacent to this question's text, extract its src URL."
    }
  ],
  "answer_key": {
    // If the document contains a table, grid, list, or sheet of correct answers/keys (e.g. "51)2  52)2" or a mapping of question numbers to their correct answers), extract it as a key-value map here. 
    // Example: { "51": "2", "52": "2", "71": "26", "75": "14" }
    // If no answer key or answer grid is present, return an empty object {}.
  }
}
`;

    const contentsArr = [
      { text: htmlContent },
      prompt
    ];

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let responseText = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`[EXTRACT_DOCX] Trying model: ${modelName} (Attempt ${4 - retries}/3)...`);
          const res = await ai.models.generateContent({
            model: modelName,
            contents: contentsArr,
            config: {
              responseMimeType: "application/json"
            }
          });
          if (res && res.text) {
            console.log(`[EXTRACT_DOCX] Success with model: ${modelName}`);
            responseText = res.text;
            break;
          }
        } catch (err) {
          console.warn(`[EXTRACT_DOCX] Model ${modelName} failed:`, err.message);
          lastError = err;
          
          if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota')) {
            console.log(`[EXTRACT_DOCX] Rate limit or service unavailable detected. Waiting 5s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            retries--;
          } else {
            break;
          }
        }
      }
      if (responseText) break;
    }

    // Fallback to OpenAI gpt-4o-mini if Gemini failed and OpenAI is configured
    if (!responseText && openaiClient) {
      try {
        console.log(`[EXTRACT_DOCX] Trying OpenAI gpt-4o-mini fallback...`);
        const res = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "text", text: htmlContent }
              ]
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4096
        });
        if (res && res.choices && res.choices[0] && res.choices[0].message) {
          console.log(`[EXTRACT_DOCX] Success with OpenAI gpt-4o-mini`);
          responseText = res.choices[0].message.content;
        }
      } catch (err) {
        console.warn(`[EXTRACT_DOCX] OpenAI fallback failed:`, err.message);
        lastError = err;
      }
    }

    if (!responseText) {
      throw new Error(`Failed to extract document content. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    let rawJson = responseText || '';
    rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    rawJson = rawJson.replace(/(?<!\\)\\(?!["\\]|u[0-9a-fA-F]{4})/g, '\\\\'); // sanitize escapes

    let parsed = null;
    try {
      parsed = JSON.parse(rawJson);
    } catch (pe) {
      const matchArr = rawJson.match(/\[[\s\S]*\]/);
      const matchObj = rawJson.match(/\{[\s\S]*\}/);
      if (matchArr) {
        parsed = JSON.parse(matchArr[0]);
      } else if (matchObj) {
        parsed = JSON.parse(matchObj[0]);
      } else {
        throw pe;
      }
    }

    const allQuestions = [];
    const allAnswers = {};

    if (Array.isArray(parsed)) {
      allQuestions.push(...parsed);
    } else if (parsed && typeof parsed === 'object') {
      if (parsed.questions && Array.isArray(parsed.questions)) {
        allQuestions.push(...parsed.questions);
      }
      if (parsed.answer_key && typeof parsed.answer_key === 'object') {
        Object.assign(allAnswers, parsed.answer_key);
      }
    }

    // Merge answers into questions
    if (Object.keys(allAnswers).length > 0) {
      console.log(`[EXTRACT_DOCX] Merging ${Object.keys(allAnswers).length} answers into ${allQuestions.length} questions...`);
      for (const q of allQuestions) {
        let qNum = q.question_number;
        if (!qNum && q.text) {
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
            q.correct_answer = ansVal;
          }
        }
      }
    }

    res.json({ success: true, questions: allQuestions });
  } catch (err) {
    console.error("[EXTRACT_DOCX_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to extract Word document" });
  }
});

// 7.8 Add test (Admin only, bypasses RLS)
app.post('/api/admin/tests', async (req, res) => {
  try {
    const { title, category, duration_minutes, scheduled_at, created_by, questionIds, newQuestions } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required." });
    }
    const { data, error } = await supabaseAdmin
      .from('tests')
      .insert({
        title,
        category,
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : 180,
        scheduled_at: scheduled_at || null,
        created_by: created_by || null
      })
      .select()
      .single();
    if (error) {
      if (error.message?.includes('tests_title_key') || error.code === '23505') {
        throw new Error("A test with this exact title already exists. Please choose a different title.");
      }
      throw error;
    }

    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      const { error: qError } = await supabaseAdmin
        .from('questions')
        .update({ test_id: data.id })
        .in('id', questionIds);
      if (qError) {
        await supabaseAdmin.from('tests').delete().eq('id', data.id); // Rollback
        throw qError;
      }
    }

    if (newQuestions && Array.isArray(newQuestions) && newQuestions.length > 0) {
      const baseTime = Date.now();
      const questionsToInsert = newQuestions.map((q, idx) => ({
        subject: q.subject || 'Physics',
        chapter: q.chapter || null,
        type: (q.type?.toUpperCase() === 'INTEGER' || q.type?.toUpperCase() === 'NUMERICAL') ? 'NUMERICAL' : 'MCQ',
        text: q.text || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer || null,
        image_url: q.image_url || null,
        sub_text: q.sub_text || null,
        test_id: data.id,
        created_at: new Date(baseTime + idx * 1000).toISOString()
      }));
      const { error: newQError } = await supabaseAdmin
        .from('questions')
        .insert(questionsToInsert);
      if (newQError) {
        await supabaseAdmin.from('tests').delete().eq('id', data.id); // Rollback
        throw newQError;
      }
    }

    res.json({ success: true, result: data });
  } catch (err) {
    console.error("[ADD_TEST_ERROR]", err.message);
    res.status(err.message.includes('already exists') ? 409 : 500).json({ error: err.message || "Failed to add test to database" });
  }
});

// 7.9 Delete test (Admin only, bypasses RLS)
app.delete('/api/admin/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Unlink all questions from this test first to avoid FK constraint issues
    await supabaseAdmin.from('questions').update({ test_id: null }).eq('test_id', id);
    const { error } = await supabaseAdmin.from('tests').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE_TEST_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to delete test" });
  }
});

// 7.10 Update test category/section (Admin only)
app.patch('/api/admin/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, duration_minutes, scheduled_at } = req.body;
    const updates = {};
    if (category) updates.category = category;
    if (title) updates.title = title;
    if (duration_minutes) updates.duration_minutes = duration_minutes;
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at || null;
    const { data, error } = await supabaseAdmin
      .from('tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, test: data });
  } catch (err) {
    console.error("[PATCH_TEST_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to update test" });
  }
});

// 7.11 Migrate legacy JEE/NEET categories → jee-full/neet-full (one-time fix)
app.post('/api/admin/migrate-categories', async (req, res) => {
  try {
    const { data: jeeTests, error: e1 } = await supabaseAdmin
      .from('tests').update({ category: 'jee-full' }).eq('category', 'JEE').select();
    const { data: neetTests, error: e2 } = await supabaseAdmin
      .from('tests').update({ category: 'neet-full' }).eq('category', 'NEET').select();
    if (e1) throw e1;
    if (e2) throw e2;
    res.json({
      success: true,
      migrated: {
        jee: (jeeTests || []).length,
        neet: (neetTests || []).length
      }
    });
  } catch (err) {
    console.error("[MIGRATE_ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7.12 Fetch User Submissions History
app.get('/api/submissions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let query = supabaseAdmin
      .from('submissions')
      .select('*, tests(title, category, duration_minutes)')
      .order('created_at', { ascending: false });

    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("[GET_USER_SUBMISSIONS_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
});

// 7.13 Fetch Detailed Submission Analytics by Submission ID
app.get('/api/submissions/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*, tests(*, questions(*))')
      .eq('id', id)
      .single();

    if (subError || !submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json(submission);
  } catch (err) {
    console.error("[GET_SUBMISSION_DETAIL_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch submission details" });
  }
});

// 8. API 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API Route not found: ${req.originalUrl}` });
});


// AUTO-MIGRATION: Ensure scheduled_at column exists on the tests table
async function runMigrations() {
  try {
    // Probe: try selecting the scheduled_at column - if it errors, column is missing
    const { error } = await supabaseAdmin
      .from('tests')
      .select('scheduled_at')
      .limit(1);

    if (error && (error.message?.includes('scheduled_at') || error.code === '42703')) {
      // Column is missing – run ALTER TABLE via Supabase SQL REST endpoint
      console.log('[MIGRATION] scheduled_at column missing. Running ALTER TABLE...');
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

      // Use the pg-level endpoint: POST to /rest/v1/rpc/exec_sql if function exists,
      // otherwise fall back to the direct SQL API
      const res = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ query: 'ALTER TABLE tests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;' })
      });

      if (res.ok) {
        console.log('[MIGRATION] ✅ scheduled_at column added successfully.');
      } else {
        const text = await res.text();
        console.warn('[MIGRATION] pg/query not available, trying RPC...');
        // Fallback: try via the information_schema check + supabase admin insert trick
        // We'll log the manual step instead
        console.warn('[MIGRATION] ⚠️  Please run this SQL in your Supabase dashboard SQL Editor:');
        console.warn('  ALTER TABLE tests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;');
      }
    } else if (!error) {
      console.log('[MIGRATION] ✅ scheduled_at column already exists. No migration needed.');
    } else {
      console.warn('[MIGRATION] Could not probe column:', error.message);
    }
  } catch (err) {
    console.warn('[MIGRATION] Auto-migration check failed:', err.message);
  }
}

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 IkshaTests Backend API running on http://127.0.0.1:${PORT}`);
  await runMigrations();
});
