const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  const title = await page.title();
  console.log('Page title:', title);
  await browser.close();
  console.log('Playwright is working!');
}

test().catch(console.error);
