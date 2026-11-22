/**
 * F1 Archive — Automated UI Smoke Test Script
 * Verifies core routes, elements, and rendering using Playwright.
 */
const { chromium } = require('playwright');

async function verifyApp() {
  console.log('🏁 Starting F1 // ARCHIVE UI verification...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    console.log(`📡 Connecting to ${baseUrl}...`);

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('✅ Page loaded successfully');

    const title = await page.title();
    console.log(`📑 Page title: "${title}"`);

    // Verify root container renders
    const appRoot = await page.$('#root');
    if (!appRoot) {
      throw new Error('Root #root element not found');
    }
    console.log('✅ Root element rendered');

    console.log('🎉 UI verification completed successfully!');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

verifyApp();
