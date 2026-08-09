const { chromium } = require('playwright-chromium');
const path = require('path');
const { supabaseAdmin } = require('./config/supabase');

(async () => {
  console.log('Clearing database tests to start fresh...');
  await supabaseAdmin.from('tests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Database cleared.');

  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  console.log('Logging in as admin...');
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', 'karthiksaianala@gmail.com');
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(1000);
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button:has-text("Sign In")');

  console.log('Waiting for admin dashboard redirect...');
  await page.waitForURL('**/admin');

  console.log('Navigating to Add Test page...');
  await page.goto('http://localhost:5174/admin/add-test');

  console.log('Filling test metadata...');
  await page.fill('input[placeholder*="JEE Full Mock Paper"]', 'Manual Staging Verification Test');

  console.log('Clicking "Add Manually" tab...');
  await page.click('button:has-text("Add Manually")');

  console.log('Creating manual MCQ question...');
  // Question text
  await page.fill('textarea[placeholder*="e.g. Find the value"]', 'Find the limit of $\\lim_{x \\to 0} \\frac{\\sin x}{x}$');
  
  // Options
  await page.fill('input[placeholder="Option A"]', '0');
  await page.fill('input[placeholder="Option B"]', '1');
  await page.fill('input[placeholder="Option C"]', 'infinite');
  await page.fill('input[placeholder="Option D"]', 'does not exist');

  // Select Option B (value="1") as correct option
  await page.selectOption('select:has-text("Select Correct Option")', { value: '1' });

  console.log('Clicking "Stage Question to Test"...');
  await page.click('button:has-text("Stage Question to Test")');

  console.log('Waiting for question to appear in staged review list...');
  await page.waitForSelector('text=Staged Questions (1)');
  console.log('Staged Questions (1) header is present!');

  // Check question preview is rendered
  const previewText = await page.textContent('.text-sm.text-on-surface.leading-relaxed');
  console.log('Staged Question Preview Text:', previewText.trim());

  // Take a screenshot of the manual staging state
  const brainDir = 'C:/Users/KARTHIK SAI ANALA/.gemini/antigravity-ide/brain/3ca49147-ecfd-414c-aeed-d91ae916be0c';
  await page.screenshot({ path: path.join(brainDir, 'manual_staged_question.png'), fullPage: true });
  console.log('Screenshot saved: manual_staged_question.png');

  console.log('Publishing Test...');
  await page.click('button:has-text("Publish Test")');

  console.log('Waiting for 3s to capture results...');
  await page.waitForTimeout(3000);

  // Check for any visible error message container
  const hasErrorContainer = await page.locator('div.bg-red-50').isVisible().catch(() => false);
  if (hasErrorContainer) {
    const errorMsg = await page.textContent('div.bg-red-50');
    console.error('❌ UI ERROR CONTAINER FOUND:', errorMsg.trim());
  }

  await page.screenshot({ path: path.join(brainDir, 'manual_publish_result.png'), fullPage: true });
  console.log('Screenshot of publish result saved: manual_publish_result.png');

  console.log('Waiting for dashboard redirect...');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('Successfully published and redirected to dashboard!');

  await browser.close();

  // Validate database entry
  console.log('Querying Supabase database for the manual test question...');
  const { data: tests } = await supabaseAdmin.from('tests').select('*').eq('title', 'Manual Staging Verification Test');
  console.log('Tests in DB:', tests);

  if (tests && tests.length > 0) {
    const { data: questions } = await supabaseAdmin.from('questions').select('*').eq('test_id', tests[0].id);
    console.log('Questions in DB for published test:', questions);
  } else {
    console.error('Test was not found in DB!');
  }

  console.log('All validations complete!');
})().catch(err => {
  console.error('Manual validation failed with error:', err);
  process.exit(1);
});
