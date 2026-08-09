const { chromium } = require('playwright-chromium');
const path = require('path');

(async () => {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  // Route backend extraction API requests to include testing cache header
  await page.route('**/api/admin/extract-pdf', route => {
    const headers = {
      ...route.request().headers(),
      'x-use-cache': 'true'
    };
    route.continue({ headers });
  });

  // Print page console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5174/login');

  console.log('Logging in as admin...');
  await page.fill('input[type="email"]', 'karthiksaianala@gmail.com');
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(1000); // Wait for transition
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button:has-text("Sign In")');

  console.log('Waiting for navigation to admin panel...');
  await page.waitForURL('**/admin');

  console.log('Navigating to Add Test page...');
  await page.goto('http://localhost:5174/admin/add-test');

  console.log('Filling test identity...');
  await page.fill('input[placeholder*="JEE Full Mock Paper"]', 'JEE Mock Test ' + Date.now());
  
  console.log('Selecting PDF Auto-Generate tab...');
  await page.click('button:has-text("PDF Auto-Generate")');

  console.log('Uploading PDF file...');
  // Find the hidden input type file
  const fileInput = await page.locator('input[type="file"]');
  const pdfPath = 'C:/Users/KARTHIK SAI ANALA/Downloads/+2 JEE MAINS Q.P (02.06.26).pdf';
  await fileInput.setInputFiles(pdfPath);
  console.log('PDF file selected.');

  console.log('Clicking Extract Now...');
  await page.click('button:has-text("Extract Now")');

  console.log('Waiting for extraction (this can take 30+ seconds)...');
  // Wait for the text "Staged Questions (75)" to appear on the page
  await page.waitForSelector('text=Staged Questions (75)', { timeout: 120000 });
  console.log('Staged Questions (75) text found!');

  // Take screenshot of the extracted questions list
  const screenshotPath = 'C:/Users/KARTHIK SAI ANALA/.gemini/antigravity-ide/brain/3ca49147-ecfd-414c-aeed-d91ae916be0c/extracted_questions.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot of extracted questions saved to:', screenshotPath);

  console.log('Clicking Publish Test...');
  await page.click('button:has-text("Publish Test")');

  console.log('Waiting for redirect to dashboard...');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('Redirected to dashboard!');

  // Take final screenshot of the dashboard
  const finalScreenshotPath = 'C:/Users/KARTHIK SAI ANALA/.gemini/antigravity-ide/brain/3ca49147-ecfd-414c-aeed-d91ae916be0c/final_dashboard.png';
  await page.screenshot({ path: finalScreenshotPath, fullPage: true });
  console.log('Final dashboard screenshot saved to:', finalScreenshotPath);

  await browser.close();
  console.log('Browser closed. Test completed successfully!');
})().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
