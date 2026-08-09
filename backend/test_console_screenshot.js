const { chromium } = require('playwright-chromium');
const path = require('path');

(async () => {
  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  console.log('Logging in...');
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', 'karthiksaianala@gmail.com');
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(1000);
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button:has-text("Sign In")');

  console.log('Waiting for login...');
  await page.waitForURL('**/admin');

  console.log('Navigating to test console...');
  const { supabaseAdmin } = require('./config/supabase');
  const { data: test } = await supabaseAdmin.from('tests').select('id').limit(1).single();
  if (!test) {
    console.error("No tests found in database!");
    await browser.close();
    process.exit(1);
  }
  const testId = test.id;
  await page.goto(`http://localhost:5174/test/${testId}`);

  console.log('Waiting for exam security check...');
  await page.waitForSelector('button:has-text("Start Exam")');
  await page.click('button:has-text("Start Exam")');

  console.log('Exam started. Waiting for question container...');
  await page.waitForSelector('text=Question No. 1');

  // Take screenshot of Q1 (Math)
  const brainDir = 'C:/Users/KARTHIK SAI ANALA/.gemini/antigravity-ide/brain/3ca49147-ecfd-414c-aeed-d91ae916be0c';
  await page.screenshot({ path: path.join(brainDir, 'q1_math.png') });
  console.log('Q1 screenshot saved.');

  // Jump to Q33 (Physics diagram)
  console.log('Jumping to Question 33...');
  await page.click('button:has-text("33")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(brainDir, 'q33_physics.png') });
  console.log('Q33 screenshot saved.');

  // Jump to Q65 (Chemistry reaction equations)
  console.log('Jumping to Question 65...');
  await page.click('button:has-text("65")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(brainDir, 'q65_chemistry.png') });
  console.log('Q65 screenshot saved.');

  await browser.close();
  console.log('Done!');
})().catch(err => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
