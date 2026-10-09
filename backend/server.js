require('dotenv').config();
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

// Dynamic CORS configuration allowing localhost, process.env.FRONTEND_URL, and cloud deployment domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Dynamically permit onrender.com, vercel.app, netlify.app subdomains
    if (
      origin.endsWith('.onrender.com') || 
      origin.endsWith('.vercel.app') || 
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }

    // Fallback for seamless deployment without CORS blocks
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// -----------------------
// LIVE SUPABASE ROUTES
// -----------------------

// 0. Health Check Root Endpoint for Cloud Deployments (Render / Vercel / Railway)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'IKSHATESTS API is running smoothly!' });
});

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

    // Filter out draft / staged tests from students
    const publishedTests = (data || []).filter(t => {
      if (t.status === 'draft' || t.status === 'staged') return false;
      if (t.category && t.category.includes('__draft')) return false;
      return true;
    });

    const testsWithCount = publishedTests.map(t => ({
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

    // Block students if test is currently staged in draft mode
    if (test.status === 'draft' || (test.category && test.category.includes('__draft'))) {
      return res.status(403).json({ error: "This exam paper is currently staged in draft mode for teacher proofreading and has not been published yet." });
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
        explanation: q.explanation || q.solution || null,
        test_id: test.id
      }));
      let { data, error } = await supabaseAdmin.from('questions').insert(formatted).select();
      if (error && (error.code === '42703' || error.message?.includes('explanation'))) {
        console.warn("[ADD_QUESTION_WARNING] 'explanation' column not found, saving without explanation column.");
        const fallback = formatted.map(({ explanation, ...rest }) => rest);
        const { data: fbData, error: fbError } = await supabaseAdmin.from('questions').insert(fallback).select();
        if (fbError) throw fbError;
        data = fbData;
        error = null;
      }
      if (error) throw error;
      result = data;
    } else {
      const singleQ = {
        subject: payload.subject,
        chapter: payload.chapter || null,
        type: payload.type || 'MCQ',
        text: payload.text,
        options: payload.options || [],
        correct_answer: String(payload.correct_answer),
        image_url: payload.image_url || null,
        sub_text: payload.sub_text || null,
        explanation: payload.explanation || payload.solution || null,
        test_id: test.id
      };
      let { data, error } = await supabaseAdmin.from('questions').insert(singleQ).select().single();
      if (error && (error.code === '42703' || error.message?.includes('explanation'))) {
        console.warn("[ADD_QUESTION_WARNING] 'explanation' column not found, saving without explanation column.");
        const { explanation, ...fbSingle } = singleQ;
        const { data: fbData, error: fbError } = await supabaseAdmin.from('questions').insert(fbSingle).select().single();
        if (fbError) throw fbError;
        data = fbData;
        error = null;
      }
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
    
    // Map questions array to a count and normalize status
    const testsWithCount = (data || []).map(t => {
      const isDraft = t.status === 'draft' || t.status === 'staged' || (t.category && t.category.includes('__draft'));
      const cleanCategory = t.category ? t.category.replace('__draft', '') : t.category;
      return {
        ...t,
        category: cleanCategory,
        status: isDraft ? 'draft' : (t.status || 'published'),
        question_count: t.questions ? t.questions.length : 0
      };
    });
    
    res.json(testsWithCount);
  } catch (err) {
    console.error("[GET_ADMIN_TESTS_ERROR]", err.message);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

// ==========================================
// 7.6A Multi-Tenant Institutions & Subdomain Endpoints
// ==========================================

// Helper: fallback default institution details when DB table is not yet migrated
const DEFAULT_INSTITUTIONS = [
  {
    id: 'sv-institution-id',
    code: 'SV',
    subdomain: 'saivikash',
    name: 'Sai Vikash Educational Institutions',
    logo_url: '/assets/sai-vikash-logo.png',
    brand_theme: {
      primary: '#1282a2',
      secondary: '#034078',
      accent: '#00b4d8'
    },
    status: 'active'
  },
  {
    id: 'ik-central-id',
    code: 'IK',
    subdomain: 'app',
    name: 'IkshaTests Central',
    logo_url: '/assets/Final_Logo.png',
    brand_theme: {
      primary: '#1282a2',
      secondary: '#034078',
      accent: '#00f0ff'
    },
    status: 'active'
  }
];

// Helper to resolve an institution from DB or fallback
async function getInstitutionByCodeOrSubdomain({ code, subdomain, institutionId }) {
  try {
    let query = supabaseAdmin.from('institutions').select('*');
    if (institutionId) {
      query = query.eq('id', institutionId);
    } else if (subdomain) {
      query = query.ilike('subdomain', subdomain);
    } else if (code) {
      query = query.ilike('code', code);
    } else {
      return null;
    }
    const { data, error } = await query.maybeSingle();
    if (!error && data) return data;
  } catch (err) {
    // If table doesn't exist yet, proceed to in-memory fallback
  }

  // Fallback check
  if (subdomain) {
    return DEFAULT_INSTITUTIONS.find(i => i.subdomain.toLowerCase() === subdomain.toLowerCase()) || null;
  }
  if (code) {
    return DEFAULT_INSTITUTIONS.find(i => i.code.toLowerCase() === code.toLowerCase()) || null;
  }
  if (institutionId) {
    return DEFAULT_INSTITUTIONS.find(i => i.id === institutionId) || null;
  }
  return null;
}

// 1. Fetch institution details by subdomain (e.g. GET /api/institutions/by-subdomain/saivikash)
app.get('/api/institutions/by-subdomain/:subdomain', async (req, res) => {
  try {
    const rawSubdomain = req.params.subdomain?.trim().toLowerCase();
    if (!rawSubdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }

    const inst = await getInstitutionByCodeOrSubdomain({ subdomain: rawSubdomain });
    if (!inst) {
      return res.status(404).json({ error: `No active institution found for subdomain "${rawSubdomain}"` });
    }

    res.json({
      success: true,
      institution: {
        id: inst.id,
        code: inst.code,
        subdomain: inst.subdomain,
        name: inst.name,
        logo_url: inst.logo_url,
        brand_theme: inst.brand_theme,
        contact_email: inst.contact_email
      }
    });
  } catch (err) {
    console.error('[INSTITUTION_SUBDOMAIN_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to retrieve institution data' });
  }
});

// 2. Fetch list of all active institutions
app.get('/api/institutions', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('institutions')
      .select('id, code, subdomain, name, logo_url, brand_theme')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return res.json({ success: true, institutions: data });
    }
    return res.json({ success: true, institutions: DEFAULT_INSTITUTIONS });
  } catch (err) {
    return res.json({ success: true, institutions: DEFAULT_INSTITUTIONS });
  }
});

// ==========================================
// 7.6B User Identifier Resolution (Dual Login: User ID or Email + Multi-Tenant Subdomain)
// ==========================================
app.post('/api/auth/resolve-identifier', async (req, res) => {
  try {
    const rawId = req.body?.identifier;
    if (!rawId || typeof rawId !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid User ID or Email address.' });
    }
    const identifier = rawId.trim();

    // Parse potential institute code prefix (e.g., 'SV-STU-1001', 'SV_1001', 'DPS-ADM-01')
    let parsedCode = null;
    const separatorMatch = identifier.match(/^([A-Za-z0-9]{2,6})[-_]/);
    if (separatorMatch) {
      parsedCode = separatorMatch[1].toUpperCase();
    }

    // 0. Check if matching user_id (e.g. 'DBA') or email exists for administrators
    try {
      let adminProfile = null;

      // 0a. Check admin_profiles table
      try {
        const { data, error } = await supabaseAdmin
          .from('admin_profiles')
          .select('id, email, full_name, designation, department, user_id, institution_id, is_super_admin')
          .or(`user_id.ilike.${identifier},email.ilike.${identifier}`)
          .maybeSingle();
        if (!error && data) adminProfile = data;
      } catch (colErr) {
        // Fallback if columns aren't added yet in admin_profiles
        try {
          const { data } = await supabaseAdmin
            .from('admin_profiles')
            .select('id, email, full_name, designation, department, user_id')
            .or(`user_id.ilike.${identifier},email.ilike.${identifier}`)
            .maybeSingle();
          if (data) adminProfile = data;
        } catch (innerColErr) {
          const { data } = await supabaseAdmin
            .from('admin_profiles')
            .select('id, email, full_name, designation, department')
            .ilike('email', identifier)
            .maybeSingle();
          if (data) adminProfile = data;
        }
      }

      // 0b. If not found in table, check auth.users user_metadata for admin user_id (e.g. DBA)
      if (!adminProfile) {
        const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
        const matched = (authList?.users || []).find(u => {
          const uId = u.user_metadata?.user_id?.toLowerCase();
          const uEmail = u.email?.toLowerCase();
          const target = identifier.toLowerCase();
          const isAdmin = u.user_metadata?.role === 'admin' || uEmail === 'karthiksaianala@gmail.com';
          return isAdmin && (uId === target || uEmail === target);
        });

        if (matched) {
          adminProfile = {
            id: matched.id,
            email: matched.email,
            full_name: matched.user_metadata?.full_name || 'Platform Administrator',
            user_id: matched.user_metadata?.user_id || 'DBA',
            designation: 'Administrator / Faculty',
            is_super_admin: true
          };
        }
      }

      if (adminProfile && adminProfile.email) {
        const isSuperAdmin = adminProfile.is_super_admin || 
                             adminProfile.email?.toLowerCase() === 'karthiksaianala@gmail.com' ||
                             adminProfile.user_id?.toUpperCase() === 'DBA';
        
        // Resolve tenant details
        let tenant = null;
        if (adminProfile.institution_id) {
          tenant = await getInstitutionByCodeOrSubdomain({ institutionId: adminProfile.institution_id });
        } else if (parsedCode) {
          tenant = await getInstitutionByCodeOrSubdomain({ code: parsedCode });
        } else if (adminProfile.user_id?.toUpperCase().startsWith('SV')) {
          tenant = await getInstitutionByCodeOrSubdomain({ code: 'SV' });
        }

        return res.json({
          success: true,
          email: adminProfile.email,
          user_id: adminProfile.user_id || 'DBA',
          full_name: adminProfile.full_name,
          role: 'admin',
          designation: adminProfile.designation || 'Administrator / Faculty',
          is_super_admin: isSuperAdmin,
          subdomain: tenant?.subdomain || (isSuperAdmin ? null : null),
          institution: tenant ? {
            id: tenant.id,
            code: tenant.code,
            subdomain: tenant.subdomain,
            name: tenant.name,
            logo_url: tenant.logo_url,
            brand_theme: tenant.brand_theme
          } : null
        });
      }
    } catch (adminErr) {
      console.warn('[RESOLVE_ADMIN_WARN]', adminErr.message);
    }

    // 1. Check if matching user_id or email exists in student profiles
    let profile = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, user_id, full_name, role, institution_id')
        .or(`user_id.ilike.${identifier},email.ilike.${identifier}`)
        .maybeSingle();
      if (!error && data) {
        profile = data;
      }
    } catch (dbErr) {
      // Fallback if institution_id column not yet present
      try {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id, email, user_id, full_name, role')
          .or(`user_id.ilike.${identifier},email.ilike.${identifier}`)
          .maybeSingle();
        if (data) profile = data;
      } catch (innerErr) {
        console.warn('[RESOLVE_IDENTIFIER_DB_WARN]', innerErr.message);
      }
    }

    if (profile && profile.email) {
      const isAdmin = profile.role === 'admin' || profile.email.toLowerCase() === 'karthiksaianala@gmail.com';
      
      // Resolve tenant for student
      let tenant = null;
      if (profile.institution_id) {
        tenant = await getInstitutionByCodeOrSubdomain({ institutionId: profile.institution_id });
      } else if (parsedCode) {
        tenant = await getInstitutionByCodeOrSubdomain({ code: parsedCode });
      } else if (profile.user_id?.toUpperCase().startsWith('SV')) {
        tenant = await getInstitutionByCodeOrSubdomain({ code: 'SV' });
      }

      return res.json({
        success: true,
        email: profile.email,
        user_id: profile.user_id || identifier,
        full_name: profile.full_name,
        role: isAdmin ? 'admin' : (profile.role || 'student'),
        subdomain: tenant?.subdomain || null,
        institution: tenant ? {
          id: tenant.id,
          code: tenant.code,
          subdomain: tenant.subdomain,
          name: tenant.name,
          logo_url: tenant.logo_url,
          brand_theme: tenant.brand_theme
        } : null
      });
    }

    // 2. If not found in profiles but identifier contains '@', allow direct email sign in
    if (identifier.includes('@')) {
      return res.json({
        success: true,
        email: identifier,
        user_id: null,
        subdomain: null,
        institution: null
      });
    }

    // 3. Not found
    return res.status(404).json({
      error: `No registered account found for User ID "${identifier}". Please verify your ID with your administrator.`
    });
  } catch (err) {
    console.error('[RESOLVE_IDENTIFIER_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to verify User ID. Please try again.' });
  }
});

// ==========================================
// 7.6C Student Account Management (Admin Provisioning)
// ==========================================

// Get all enrolled students
app.get('/api/admin/students', async (req, res) => {
  try {
    // 1. Fetch student profiles
    let profiles = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      if (!error && data) {
        profiles = data;
      } else {
        // Fallback to basic columns if extended columns aren't migrated
        const { data: fbData } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false });
        profiles = fbData || [];
      }
    } catch (pErr) {
      console.error('[GET_STUDENTS_PROFILES_ERROR]', pErr.message);
    }

    // 2. Count test submissions for each student
    const { data: subs } = await supabaseAdmin
      .from('submissions')
      .select('user_id');

    const subCounts = {};
    (subs || []).forEach(s => {
      subCounts[s.user_id] = (subCounts[s.user_id] || 0) + 1;
    });

    const students = profiles.map(p => ({
      id: p.id,
      user_id: p.user_id || p.roll_number || (p.email ? p.email.split('@')[0] : 'N/A'),
      roll_number: p.roll_number || p.user_id || 'N/A',
      email: p.email,
      full_name: p.full_name || 'Enrolled Student',
      class_cohort: p.class_cohort || 'Class 12',
      target_exam: p.target_exam || 'JEE',
      phone_number: p.phone_number || null,
      batch_name: p.batch_name || 'General',
      is_active: p.is_active !== false,
      created_at: p.created_at,
      tests_taken: subCounts[p.id] || 0
    }));

    res.json({ success: true, students });
  } catch (err) {
    console.error('[GET_STUDENTS_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to retrieve enrolled students.' });
  }
});

// Get administrator / faculty staff profiles (from dedicated admin_profiles)
app.get('/api/admin/staff', async (req, res) => {
  try {
    let staff = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        staff = data;
      } else {
        // Fallback to profiles table where role = 'admin' or email matches
        const { data: legacyAdmins } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, created_at')
          .or(`role.eq.admin,email.eq.karthiksaianala@gmail.com`);
        staff = (legacyAdmins || []).map(a => ({
          ...a,
          designation: 'Administrator / Faculty',
          department: 'Academics'
        }));
      }
    } catch (e) {
      console.warn('[GET_STAFF_WARN]', e.message);
    }
    res.json({ success: true, staff });
  } catch (err) {
    console.error('[GET_STAFF_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to retrieve staff profiles.' });
  }
});

// Enroll a new student (Creates Auth credentials + Profile)
app.post('/api/admin/students', async (req, res) => {
  try {
    const { fullName, userId, email, password, classCohort, targetExam, phoneNumber, batchName } = req.body || {};

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Student full name is required.' });
    }
    if (!userId || !userId.trim()) {
      return res.status(400).json({ error: 'Student User ID is required.' });
    }
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUserId = userId.trim();
    const cleanFullName = fullName.trim();
    const cleanPassword = password.trim();
    const cleanExam = targetExam || 'JEE';
    const cleanClass = classCohort || 'Class 12';
    const cleanPhone = phoneNumber ? phoneNumber.trim() : null;
    const cleanBatch = batchName ? batchName.trim() : 'General';

    // Auto-generate institutional email if custom email is not provided
    const cleanEmail = (email && email.trim()) 
      ? email.trim().toLowerCase() 
      : `${cleanUserId.toLowerCase().replace(/[^a-z0-9]/g, '')}@ikshatests.com`;

    // Check if user_id or email already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, email')
      .or(`user_id.ilike.${cleanUserId},email.ilike.${cleanEmail}`)
      .maybeSingle();

    if (existingProfile) {
      const matchType = (existingProfile.user_id?.toLowerCase() === cleanUserId.toLowerCase()) ? 'User ID' : 'Email address';
      return res.status(409).json({ error: `A student with this ${matchType} (${cleanUserId}) already exists.` });
    }

    // 1. Create User in Supabase Auth via Admin Service Role (Auto-confirmed, instant login)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanFullName,
        user_id: cleanUserId,
        role: 'student',
        roll_number: cleanUserId,
        class_cohort: cleanClass,
        target_exam: cleanExam,
        phone_number: cleanPhone
      }
    });

    if (authError) {
      console.error('[AUTH_ADMIN_CREATE_USER_ERROR]', authError.message);
      return res.status(400).json({ error: authError.message || 'Failed to create student authentication credentials.' });
    }

    const newId = authUser.user.id;

    // 2. Populate extended columns in public.profiles table
    const profilePayload = {
      id: newId,
      user_id: cleanUserId,
      email: cleanEmail,
      full_name: cleanFullName,
      role: 'student',
      roll_number: cleanUserId,
      class_cohort: cleanClass,
      target_exam: cleanExam,
      phone_number: cleanPhone,
      batch_name: cleanBatch,
      is_active: true
    };

    let profileResult = profilePayload;
    try {
      const { data: pData, error: pErr } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload)
        .select()
        .single();
      if (!pErr && pData) {
        profileResult = pData;
      } else {
        // Fallback for missing columns
        const { user_id, roll_number, class_cohort, target_exam, phone_number, batch_name, is_active, ...basicPayload } = profilePayload;
        await supabaseAdmin.from('profiles').upsert(basicPayload);
      }
    } catch (saveErr) {
      console.warn('[PROFILE_EXTENDED_SAVE_WARN]', saveErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Student account enrolled successfully!',
      student: {
        ...profileResult,
        id: newId,
        user_id: cleanUserId,
        full_name: cleanFullName,
        email: cleanEmail,
        class_cohort: cleanClass,
        target_exam: cleanExam,
        phone_number: cleanPhone
      },
      credentials: {
        fullName: cleanFullName,
        userId: cleanUserId,
        email: cleanEmail,
        password: cleanPassword,
        classCohort: cleanClass,
        targetExam: cleanExam
      }
    });
  } catch (err) {
    console.error('[ENROLL_STUDENT_ERROR]', err.message);
    res.status(500).json({ error: err.message || 'Internal server error while enrolling student.' });
  }
});

// Admin resets a student password
app.post('/api/admin/students/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password.trim()
    });

    if (updateError) {
      console.error('[RESET_STUDENT_PASSWORD_ERROR]', updateError.message);
      return res.status(400).json({ error: updateError.message || 'Failed to update student password.' });
    }

    res.json({
      success: true,
      message: 'Student password updated successfully! The student can now log in with the new password.'
    });
  } catch (err) {
    console.error('[RESET_PASSWORD_ENDPOINT_ERROR]', err.message);
    res.status(500).json({ error: err.message || 'Failed to reset password.' });
  }
});

// Admin deletes a student account
app.delete('/api/admin/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete from auth (cascades to profiles and submissions via ON DELETE CASCADE)
    const { error: authDelError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDelError) {
      console.warn('[AUTH_DELETE_WARN]', authDelError.message);
    }

    await supabaseAdmin.from('profiles').delete().eq('id', id);

    res.json({ success: true, message: 'Student account deleted successfully.' });
  } catch (err) {
    console.error('[DELETE_STUDENT_ERROR]', err.message);
    res.status(500).json({ error: err.message || 'Failed to delete student account.' });
  }
});

// 7.7b Get comprehensive live student and exam analytics (Admin only, bypasses RLS)
app.get('/api/admin/student-analytics', async (req, res) => {
  try {
    const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('*');
    if (pErr) throw pErr;

    const { data: tests, error: tErr } = await supabaseAdmin.from('tests').select('*, questions(*)').order('created_at', { ascending: false });
    if (tErr) throw tErr;

    const { data: submissions, error: sErr } = await supabaseAdmin.from('submissions').select('*').order('created_at', { ascending: true });
    if (sErr) throw sErr;

    const testMap = {};
    (tests || []).forEach(t => { testMap[t.id] = t; });

    const studentSubMap = {};
    (submissions || []).forEach(s => {
      if (!studentSubMap[s.user_id]) studentSubMap[s.user_id] = [];
      studentSubMap[s.user_id].push(s);
    });

    // 1. Process Student Profiles
    const rawStudents = (profiles || []).map((p, idx) => {
      const subs = studentSubMap[p.id] || [];
      const rollMatch = p.email?.match(/^([0-9]+)/);
      const rollNo = rollMatch ? rollMatch[1] : ('IK-' + (1100 + idx));
      const name = p.full_name || p.email.split('@')[0];

      let totalMarksScored = 0;
      let totalMaxMarks = 0;
      let totalCorrect = 0;
      let totalQuestionsAttempted = 0;
      const subjectAggMap = {};

      const testHistory = subs.map(sub => {
        const test = testMap[sub.test_id] || { title: 'Practice Test', questions: [] };
        const qList = test.questions || [];
        const responses = sub.answers?.responses || {};

        const subjScoresMap = {};
        qList.forEach((q, qIdx) => {
          const subj = q.subject || 'General';
          if (!subjScoresMap[subj]) subjScoresMap[subj] = { score: 0, maxScore: 0, correct: 0, wrong: 0, skipped: 0 };
          subjScoresMap[subj].maxScore += 4;

          const resp = responses[String(qIdx)] !== undefined ? responses[String(qIdx)] : responses[q.id];
          if (resp !== undefined && resp !== null) {
            const isCorrect = String(resp) === String(q.correct_answer) || (typeof q.correct_answer === 'string' && q.correct_answer.toLowerCase().includes(String(resp).toLowerCase()));
            if (isCorrect) {
              subjScoresMap[subj].score += 4;
              subjScoresMap[subj].correct += 1;
            } else {
              subjScoresMap[subj].score -= 1;
              subjScoresMap[subj].wrong += 1;
            }
          } else {
            subjScoresMap[subj].skipped += 1;
          }
        });

        // If no questions in test, fallback to sub.score
        if (qList.length === 0) {
          subjScoresMap['General'] = { score: sub.score, maxScore: 100, correct: sub.correct_count || 0, wrong: sub.wrong_count || 0, skipped: sub.skipped_count || 0 };
        }

        const subjectScores = Object.keys(subjScoresMap).map(s => {
          const item = subjScoresMap[s];
          if (!subjectAggMap[s]) subjectAggMap[s] = { totalScore: 0, totalMax: 0, correct: 0, wrong: 0 };
          subjectAggMap[s].totalScore += item.score;
          subjectAggMap[s].totalMax += item.maxScore;
          subjectAggMap[s].correct += item.correct;
          subjectAggMap[s].wrong += item.wrong;
          return {
            subject: s,
            score: item.score,
            maxScore: item.maxScore || 100
          };
        });

        totalMarksScored += sub.score;
        const testMax = qList.length > 0 ? qList.length * 4 : 100;
        totalMaxMarks += testMax;
        const subCorrect = sub.correct_count || 0;
        const subWrong = sub.wrong_count || 0;
        totalCorrect += subCorrect;
        totalQuestionsAttempted += (subCorrect + subWrong);

        const accuracy = (subCorrect + subWrong) > 0 ? Math.round((subCorrect / (subCorrect + subWrong)) * 100) : 0;

        return {
          id: sub.id,
          testId: sub.test_id,
          title: test.title,
          date: sub.created_at ? sub.created_at.slice(0, 10) : '2026-09-01',
          score: sub.score,
          max: testMax,
          accuracy: accuracy + '%',
          cutoffCleared: sub.score >= 0,
          status: sub.score >= 0 ? 'Cleared' : 'Needs Review',
          subjectScores
        };
      });

      const avgScore = subs.length > 0 ? Math.round(totalMarksScored / subs.length) : 0;
      const overallAcc = totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : (subs.length > 0 ? 50 : 0);

      // Compute subjects breakdown
      const subjects = Object.keys(subjectAggMap).map(s => {
        const agg = subjectAggMap[s];
        const acc = (agg.correct + agg.wrong) > 0 ? Math.round((agg.correct / (agg.correct + agg.wrong)) * 100) : 0;
        return {
          name: s,
          score: Math.max(0, agg.totalScore),
          maxScore: agg.totalMax || 100,
          accuracy: acc,
          avgTimePerQ: '1.2m'
        };
      });

      if (subjects.length === 0) {
        subjects.push(
          { name: 'Physics', score: 0, maxScore: 100, accuracy: 0, avgTimePerQ: '0.0m' },
          { name: 'Chemistry', score: 0, maxScore: 100, accuracy: 0, avgTimePerQ: '0.0m' },
          { name: 'Mathematics', score: 0, maxScore: 100, accuracy: 0, avgTimePerQ: '0.0m' }
        );
      }

      const stream = subs.some(s => testMap[s.test_id]?.category?.toLowerCase().includes('neet')) ? 'NEET' : 'JEE';
      const classCohort = stream === 'NEET' ? 'Class 11' : (p.email?.includes('12') || subs.some(s => testMap[s.test_id]?.category?.toLowerCase().includes('jee-full')) ? 'Class 12' : 'Class 11');

      return {
        id: p.id,
        rollNo,
        name,
        email: p.email,
        classCohort,
        stream,
        testsAttempted: subs.length,
        avgScore,
        maxScore: subs.length > 0 ? Math.round(totalMaxMarks / subs.length) : (stream === 'NEET' ? 720 : 300),
        accuracy: overallAcc,
        pacingSec: subs.length > 0 ? 48 : 0,
        cutoffClearedRate: subs.length > 0 ? `${Math.round((subs.filter(s => s.score >= 0).length / subs.length) * 100)}%` : '0%',
        status: subs.length > 0 ? (avgScore >= 0 ? 'Active Performer' : 'Needs Support') : 'Enrolled',
        streak: subs.length > 0 ? `${subs.length * 3} Days` : '0 Days',
        subjects,
        topicDiagnostics: {
          strong: subjects.filter(s => s.accuracy >= 50).map(s => ({ topic: `${s.name} Core Fundamentals`, subject: s.name, accuracy: `${s.accuracy}%`, speed: 'Optimal' })),
          careless: subjects.filter(s => s.accuracy > 0 && s.accuracy < 50).map(s => ({ topic: `${s.name} Question Accuracy`, subject: s.name, accuracy: `${s.accuracy}%`, impact: '-1 pt leak' })),
          weak: subjects.filter(s => s.accuracy === 0).map(s => ({ topic: `${s.name} Practice Drills`, subject: s.name, accuracy: '0%', status: 'Not Attempted' }))
        },
        testHistory
      };
    });

    // Rank students by avgScore
    rawStudents.sort((a, b) => b.avgScore - a.avgScore);
    const students = rawStudents.map((s, i) => ({ ...s, classRank: i + 1 }));

    // 2. Process Real Exams
    const exams = (tests || []).map(t => {
      const qList = t.questions || [];
      const testSubs = (submissions || []).filter(s => s.test_id === t.id);
      const totalSubs = testSubs.length;

      const scores = testSubs.map(s => s.score);
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      scores.sort((a, b) => a - b);
      const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;
      const cutoff = Math.max(0, Math.round(qList.length * 4 * 0.35));
      const cutoffClearedCount = testSubs.filter(s => s.score >= 0).length;
      const cutoffClearanceRate = totalSubs > 0 ? `${Math.round((cutoffClearedCount / totalSubs) * 100)}%` : '0%';

      // Subject breakdown for this test
      const subjMap = {};
      qList.forEach(q => {
        const subj = q.subject || 'General';
        if (!subjMap[subj]) subjMap[subj] = { count: 0, max: 0 };
        subjMap[subj].count += 1;
        subjMap[subj].max += 4;
      });
      const subjectBreakdown = Object.keys(subjMap).map(s => ({
        name: s,
        avgScore: Math.round(subjMap[s].max * 0.5),
        max: subjMap[s].max,
        accuracy: 65.0
      }));

      // Attendees rank table
      testSubs.sort((a, b) => b.score - a.score);
      const attendees = testSubs.map((sub, rIdx) => {
        const studentInfo = students.find(s => s.id === sub.user_id) || {
          name: 'Student',
          rollNo: 'IK-0000',
          email: 'student@example.com'
        };

        const responses = sub.answers?.responses || {};
        const qMatrix = qList.map((q, qIdx) => {
          const resp = responses[String(qIdx)] !== undefined ? responses[String(qIdx)] : responses[q.id];
          let status = 'skipped';
          if (resp !== undefined && resp !== null) {
            const isCorrect = String(resp) === String(q.correct_answer) || (typeof q.correct_answer === 'string' && q.correct_answer.toLowerCase().includes(String(resp).toLowerCase()));
            status = isCorrect ? 'correct' : 'wrong';
          }
          return {
            qNum: qIdx + 1,
            status,
            studentTime: '1m 20s',
            topperTime: '1m 10s',
            subject: q.subject || 'General',
            topic: q.chapter || `${q.subject} Problem`
          };
        });

        const correct = sub.correct_count || 0;
        const wrong = sub.wrong_count || 0;
        const total = correct + wrong;
        const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

        return {
          id: studentInfo.id,
          rollNo: studentInfo.rollNo,
          name: studentInfo.name,
          email: studentInfo.email,
          score: sub.score,
          accuracy: acc,
          timeTaken: '45m',
          rank: rIdx + 1,
          percentile: `${Math.max(50, Math.round(100 - (rIdx / (totalSubs || 1)) * 100))} %ile`,
          proctorStatus: sub.answers?.proctoring?.violations_count > 0 ? 'FLAGGED' : 'CLEARED',
          timeWastage: '2m 15s',
          subjects: subjectBreakdown.map(sb => ({
            name: sb.name,
            score: Math.round(sub.score / (subjectBreakdown.length || 1)),
            max: sb.max,
            correct: 1,
            wrong: 0,
            skipped: 0
          })),
          questionMatrix: qMatrix
        };
      });

      return {
        id: t.id,
        title: t.title,
        category: t.category,
        duration_minutes: t.duration_minutes || 180,
        maxScore: qList.length > 0 ? qList.length * 4 : 100,
        cutoff,
        date: t.created_at ? t.created_at.slice(0, 10) : '2026-08-01',
        totalSubmissions: totalSubs,
        highestScore,
        avgScore,
        medianScore,
        cutoffClearanceRate,
        scoreDistribution: [
          { range: '< 0 (Negative)', count: testSubs.filter(s => s.score < 0).length, color: 'bg-rose-500/40' },
          { range: '0 - 20', count: testSubs.filter(s => s.score >= 0 && s.score <= 20).length, color: 'bg-amber-500/40' },
          { range: '21 - 50', count: testSubs.filter(s => s.score > 20 && s.score <= 50).length, color: 'bg-primary/50' },
          { range: '51 - 100', count: testSubs.filter(s => s.score > 50).length, color: 'bg-emerald-500/60' }
        ],
        subjectBreakdown,
        attendees
      };
    });

    res.json({
      success: true,
      students,
      exams
    });
  } catch (err) {
    console.error("[GET_STUDENT_ANALYTICS_ERROR]", err.message);
    res.status(500).json({ error: "Failed to generate student analytics from database." });
  }
});

// Helper to ensure 'question-assets' storage bucket exists in Supabase
async function ensureQuestionBucket() {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (!error && buckets) {
      const exists = buckets.some(b => b.name === 'question-assets');
      if (!exists) {
        await supabaseAdmin.storage.createBucket('question-assets', {
          public: true,
          fileSizeLimit: 10485760
        });
        console.log("[STORAGE] Created 'question-assets' public storage bucket.");
      }
    }
  } catch (e) {
    console.warn("[STORAGE] Bucket check/create warning:", e.message);
  }
}

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
      "explanation": "Step-by-step solution, mathematical proof, or rationale if present on page, else null",
      "diagram_bbox": [ymin, xmin, ymax, xmax] // CRITICAL: If this question has ANY associated visual diagram, graph, circuit, pulley, ray diagram, chemical reaction scheme, benzene/organic structure, chart, apparatus, or biological illustration on the page image, return its tight bounding box coordinates as integers normalized to a 0-1000 scale [ymin, xmin, ymax, xmax]. If no diagram exists for this question, return null.
    }
  ],
  "answer_key": {
    // If the page contains a table, grid, list, or sheet of correct answers/keys (e.g. "51)2  52)2" or a mapping of question numbers to their correct answers), extract it as a key-value map here. 
    // Example: { "51": "2", "52": "2", "71": "26", "75": "14" }
    // If no answer key or answer grid is present on the page, return an empty object {}.
  }
}

INSTRUCTIONS FOR DIAGRAM AND IMAGE DETECTION:
1. Examine each question carefully. If it refers to "figure", "graph", "diagram", "circuit", "chart", "table", "as shown below", or visually contains a diagram/illustration, identify the exact visual diagram area.
2. Provide the bounding box in "diagram_bbox" as [ymin, xmin, ymax, xmax] where 0 is the top/left edge of the page image, and 1000 is the bottom/right edge.
3. Keep the bounding box focused on the diagram/illustration and its immediate labels/axes without including the question text or options.
`;

    const allQuestions = [];
    const allAnswers = {};

    for (let idx = 0; idx < images.length; idx++) {
      const base64 = images[idx];
      const contentsArr = [
        { inlineData: { data: base64, mimeType: "image/jpeg" } },
        prompt
      ];

      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash'
      ];
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
            
            if (err.message?.includes('PerDay') || (err.message?.includes('quota') && err.message?.includes('exceeded'))) {
              console.log(`[EXTRACT_PDF] Daily quota reached for ${modelName}. Switching immediately to next model...`);
              break;
            } else if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('RESOURCE_EXHAUSTED')) {
              console.log(`[EXTRACT_PDF] Rate limit or service busy on ${modelName}. Waiting 3s before retry...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
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

// 7.7.4 Upload Question Asset Image (Admin only)
app.post('/api/admin/upload-image', async (req, res) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "No image data provided" });
    }

    await ensureQuestionBucket();

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = filename || `extracted_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const filePath = `questions/${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('question-assets')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.warn("[UPLOAD_IMAGE] Storage upload warning:", uploadError.message);
      // Fallback: return dataUrl so frontend never loses the image
      const fallbackUrl = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${cleanBase64}`;
      return res.json({ success: true, publicUrl: fallbackUrl });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('question-assets')
      .getPublicUrl(filePath);

    return res.json({ success: true, publicUrl });
  } catch (err) {
    console.error("[UPLOAD_IMAGE_ERROR]", err.message);
    const fallbackUrl = req.body?.base64Data || null;
    return res.json({ success: true, publicUrl: fallbackUrl });
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

    await ensureQuestionBucket();

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

    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash'
    ];
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
          
          if (err.message?.includes('PerDay') || (err.message?.includes('quota') && err.message?.includes('exceeded'))) {
            console.log(`[EXTRACT_DOCX] Daily quota reached for ${modelName}. Switching immediately to next model...`);
            break;
          } else if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            console.log(`[EXTRACT_DOCX] Rate limit or service busy on ${modelName}. Waiting 3s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
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
    const { title, category, duration_minutes, scheduled_at, created_by, questionIds, newQuestions, status } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required." });
    }

    // Default to 'draft' so teachers can proofread before publishing
    const isDraft = status === 'draft' || status === 'staged' || status === undefined;
    const baseCat = category.replace('__draft', '');
    const effectiveCategory = isDraft ? `${baseCat}__draft` : baseCat;

    let testPayload = {
      title,
      category: effectiveCategory,
      duration_minutes: duration_minutes ? parseInt(duration_minutes) : 180,
      scheduled_at: scheduled_at || null,
      created_by: created_by || null,
      status: isDraft ? 'draft' : 'published'
    };

    let { data, error } = await supabaseAdmin
      .from('tests')
      .insert(testPayload)
      .select()
      .single();

    if (error && (error.code === '42703' || error.message?.includes('status'))) {
      console.warn("[ADD_TEST_WARNING] 'status' column not found in 'tests' table. Using category tag fallback for draft staging...");
      const { status: _, ...payloadWithoutStatus } = testPayload;
      const { data: fbData, error: fbError } = await supabaseAdmin
        .from('tests')
        .insert(payloadWithoutStatus)
        .select()
        .single();
      if (fbError) throw fbError;
      data = fbData;
      error = null;
    }

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
        explanation: q.explanation || q.solution || null,
        test_id: data.id,
        created_at: new Date(baseTime + idx * 1000).toISOString()
      }));

      let { error: newQError } = await supabaseAdmin
        .from('questions')
        .insert(questionsToInsert);

      // Graceful fallback if 'explanation' column is not yet migrated in Supabase
      if (newQError && (newQError.code === '42703' || newQError.message?.includes('explanation'))) {
        console.warn("[ADD_TEST_WARNING] 'explanation' column not found in 'questions' table. Retrying insert without explanation column...");
        const fallbackQuestions = questionsToInsert.map(({ explanation, ...rest }) => rest);
        const { error: fallbackErr } = await supabaseAdmin
          .from('questions')
          .insert(fallbackQuestions);
        newQError = fallbackErr;
      }

      if (newQError) {
        await supabaseAdmin.from('tests').delete().eq('id', data.id); // Rollback
        throw newQError;
      }
    }

    // Attach normalized clean category & status to return response
    const cleanCat = (data.category || '').replace('__draft', '');
    const finalData = {
      ...data,
      category: cleanCat,
      status: isDraft ? 'draft' : 'published'
    };

    res.json({ success: true, result: finalData });
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

// 7.10 Update test category/section/status (Admin only)
app.patch('/api/admin/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, duration_minutes, scheduled_at, status } = req.body;
    
    // Fetch existing test to determine current category and draft state
    const { data: currentTest, error: curErr } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    if (curErr) throw curErr;

    const baseCategory = (category || currentTest.category || '').replace('__draft', '');
    const isDraft = status !== undefined ? (status === 'draft' || status === 'staged') : (currentTest.status === 'draft' || currentTest.category?.includes('__draft'));
    const effectiveCategory = isDraft ? `${baseCategory}__draft` : baseCategory;

    const updates = { category: effectiveCategory };
    if (title) updates.title = title;
    if (duration_minutes) updates.duration_minutes = duration_minutes;
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at || null;
    if (status !== undefined) updates.status = isDraft ? 'draft' : 'published';

    let { data, error } = await supabaseAdmin
      .from('tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.code === '42703' || error.message?.includes('status'))) {
      const { status: _, ...updatesWithoutStatus } = updates;
      const { data: fbData, error: fbErr } = await supabaseAdmin
        .from('tests')
        .update(updatesWithoutStatus)
        .eq('id', id)
        .select()
        .single();
      if (fbErr) throw fbErr;
      data = fbData;
      error = null;
    }

    if (error) throw error;

    const cleanCat = (data.category || '').replace('__draft', '');
    res.json({
      success: true,
      test: {
        ...data,
        category: cleanCat,
        status: isDraft ? 'draft' : 'published'
      }
    });
  } catch (err) {
    console.error("[PATCH_TEST_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to update test" });
  }
});

// 7.10b Publish test (Approve and make live for students)
app.post('/api/admin/tests/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: currentTest, error: curErr } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    if (curErr) throw curErr;

    const cleanCategory = (currentTest.category || '').replace('__draft', '');
    const updates = { category: cleanCategory, status: 'published' };

    let { data, error } = await supabaseAdmin
      .from('tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.code === '42703' || error.message?.includes('status'))) {
      const { status: _, ...fbUpdates } = updates;
      const { data: fbData, error: fbErr } = await supabaseAdmin
        .from('tests')
        .update(fbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (fbErr) throw fbErr;
      data = fbData;
      error = null;
    }

    if (error) throw error;
    res.json({
      success: true,
      test: { ...data, category: cleanCategory, status: 'published' },
      message: "Test paper approved & published successfully! It is now live for students."
    });
  } catch (err) {
    console.error("[PUBLISH_TEST_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to publish test" });
  }
});

// 7.10c Unpublish test (Revert to draft for further proofreading)
app.post('/api/admin/tests/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: currentTest, error: curErr } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    if (curErr) throw curErr;

    const baseCategory = (currentTest.category || '').replace('__draft', '');
    const draftCategory = `${baseCategory}__draft`;
    const updates = { category: draftCategory, status: 'draft' };

    let { data, error } = await supabaseAdmin
      .from('tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.code === '42703' || error.message?.includes('status'))) {
      const { status: _, ...fbUpdates } = updates;
      const { data: fbData, error: fbErr } = await supabaseAdmin
        .from('tests')
        .update(fbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (fbErr) throw fbErr;
      data = fbData;
      error = null;
    }

    if (error) throw error;
    res.json({
      success: true,
      test: { ...data, category: baseCategory, status: 'draft' },
      message: "Test paper reverted to draft. It is now hidden from students for proofreading."
    });
  } catch (err) {
    console.error("[UNPUBLISH_TEST_ERROR]", err.message);
    res.status(500).json({ error: err.message || "Failed to unpublish test" });
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

// ----------------------------------------------------
// 7.14 Exam Series CRUD and Management System
// ----------------------------------------------------
const fs = require('fs');
const path = require('path');
const seriesFilePath = path.join(__dirname, 'custom_series.json');

const DEFAULT_SERIES = [
  {
    id: 'series-jee',
    key: 'jee',
    title: 'IIT JEE Series',
    categoryType: 'Engineering',
    description: 'Premier mock exams for JEE Main and JEE Advanced engineering aspirants.',
    icon: 'architecture',
    color: '#882D2D',
    badgeColor: 'border-red-500/30 bg-red-950/40 text-red-400',
    isDefault: true,
    sections: [
      { id: 'full', label: 'Full-Length Mocks', icon: 'assignment' },
      { id: 'pyq', label: 'Previous Year Papers', icon: 'history_edu' },
      { id: 'chapter', label: 'Subject-wise Tests', icon: 'category' }
    ]
  },
  {
    id: 'series-neet',
    key: 'neet',
    title: 'NEET (UG) Series',
    categoryType: 'Medical',
    description: 'Comprehensive testing and diagnostic blueprints for medical aspirants.',
    icon: 'biotech',
    color: '#4EC6D7',
    badgeColor: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400',
    isDefault: true,
    sections: [
      { id: 'full', label: 'Full-Length Mocks', icon: 'assignment' },
      { id: 'pyq', label: 'Previous Year Papers', icon: 'history_edu' },
      { id: 'chapter', label: 'Subject-wise Tests', icon: 'biotech' }
    ]
  }
];

function getStoredSeries() {
  try {
    if (fs.existsSync(seriesFilePath)) {
      const data = fs.readFileSync(seriesFilePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[SERIES_STORAGE] Failed to read custom series:', err.message);
  }
  return DEFAULT_SERIES;
}

function saveStoredSeries(seriesList) {
  try {
    fs.writeFileSync(seriesFilePath, JSON.stringify(seriesList, null, 2), 'utf8');
  } catch (err) {
    console.error('[SERIES_STORAGE] Failed to write custom series:', err.message);
  }
}

// Get all exam series with aggregated metrics
app.get('/api/admin/series', async (req, res) => {
  try {
    const seriesList = getStoredSeries();
    
    // Fetch all tests with questions count to aggregate per series
    const { data: tests, error } = await supabaseAdmin
      .from('tests')
      .select('id, category, duration_minutes, scheduled_at, questions(id)');
    
    const allTests = tests || [];
    
    const enhancedSeries = seriesList.map(s => {
      const matchingTests = allTests.filter(t => {
        if (!t.category) return false;
        const cat = t.category.toLowerCase();
        return cat.startsWith(`${s.key.toLowerCase()}-`) || cat === s.key.toLowerCase();
      });
      
      const totalQuestions = matchingTests.reduce((acc, t) => acc + (t.questions ? t.questions.length : 0), 0);
      
      return {
        ...s,
        testCount: matchingTests.length,
        questionCount: totalQuestions
      };
    });
    
    res.json(enhancedSeries);
  } catch (err) {
    console.error('[GET_SERIES_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch exam series' });
  }
});

// Create new Exam Series
app.post('/api/admin/series', async (req, res) => {
  try {
    const { title, key, categoryType, description, icon, color, sections } = req.body;
    if (!title || !key) {
      return res.status(400).json({ error: 'Series title and unique key are required.' });
    }
    
    const currentList = getStoredSeries();
    const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    
    if (currentList.some(s => s.key === cleanKey)) {
      return res.status(409).json({ error: `An exam series with key "${cleanKey}" already exists.` });
    }
    
    const newSeries = {
      id: `series-${Date.now()}`,
      key: cleanKey,
      title: title.trim(),
      categoryType: categoryType || 'General',
      description: description || '',
      icon: icon || 'quiz',
      color: color || '#E7CF29',
      badgeColor: 'border-amber-500/30 bg-amber-950/40 text-amber-400',
      isDefault: false,
      sections: sections && Array.isArray(sections) && sections.length > 0 ? sections : [
        { id: 'full', label: 'Full-Length Mocks', icon: 'assignment' },
        { id: 'pyq', label: 'Previous Year Papers', icon: 'history_edu' },
        { id: 'chapter', label: 'Subject-wise Tests', icon: 'category' }
      ]
    };
    
    currentList.push(newSeries);
    saveStoredSeries(currentList);
    
    res.json({ success: true, series: newSeries });
  } catch (err) {
    console.error('[POST_SERIES_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to create exam series' });
  }
});

// Update Exam Series
app.patch('/api/admin/series/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryType, icon, color, sections } = req.body;
    
    const currentList = getStoredSeries();
    const idx = currentList.findIndex(s => s.id === id || s.key === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Exam series not found' });
    }
    
    const existing = currentList[idx];
    const updated = {
      ...existing,
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      categoryType: categoryType !== undefined ? categoryType : existing.categoryType,
      icon: icon !== undefined ? icon : existing.icon,
      color: color !== undefined ? color : existing.color,
      sections: sections !== undefined ? sections : existing.sections
    };
    
    currentList[idx] = updated;
    saveStoredSeries(currentList);
    
    res.json({ success: true, series: updated });
  } catch (err) {
    console.error('[PATCH_SERIES_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to update exam series' });
  }
});

// Delete Exam Series
app.delete('/api/admin/series/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentList = getStoredSeries();
    const target = currentList.find(s => s.id === id || s.key === id);
    if (!target) {
      return res.status(404).json({ error: 'Exam series not found' });
    }
    if (target.isDefault) {
      return res.status(400).json({ error: 'Default core series (IIT JEE / NEET UG) cannot be deleted.' });
    }
    
    const filtered = currentList.filter(s => s.id !== id && s.key !== id);
    saveStoredSeries(filtered);
    
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE_SERIES_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to delete exam series' });
  }
});

// 7.15 Fetch Full Test with all questions & solutions for Test Paper PDF & Quick Question View
app.get('/api/admin/tests/:id/full', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: test, error: testError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .or(`id.eq.${id},title.eq.${id}`)
      .single();
      
    if (testError || !test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('test_id', test.id)
      .order('created_at', { ascending: true });
      
    if (qError) throw qError;
    
    const isDraft = (test.status === 'draft') || (test.category && test.category.includes('__draft'));
    const cleanCategory = (test.category || '').replace('__draft', '');
    const normalizedTest = {
      ...test,
      category: cleanCategory,
      status: isDraft ? 'draft' : (test.status || 'published')
    };

    res.json({
      test: normalizedTest,
      questions: questions || []
    });
  } catch (err) {
    console.error('[GET_TEST_FULL_ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch full test blueprint' });
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

    // Check if dedicated admin_profiles table exists
    const { error: adminTableErr } = await supabaseAdmin.from('admin_profiles').select('id').limit(1);
    if (!adminTableErr) {
      console.log('[MIGRATION] ✅ Dedicated admin_profiles table is active.');
    } else {
      console.log('[MIGRATION] ℹ️  Dedicated admin_profiles table pending SQL creation. Run script from supabase_schema.sql');
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
