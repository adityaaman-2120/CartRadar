const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrape(query, pincode) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      geolocation: { latitude: 22.5726, longitude: 88.3639 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const url = `https://blinkit.com/s/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Dismiss location modal by clicking "Detect my location"
    const detectBtn = await page.$('button:has-text("Detect my location")');
    if (detectBtn) {
      await detectBtn.click();
      await page.waitForTimeout(5000);
    }

    const products = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        'div[class*="tw-h-full"][class*="tw-flex-col"]'
      );
      const results = [];

      const max = Math.min(cards.length, 8);
      for (let i = 0; i < max; i++) {
        const card = cards[i];
        const text = card.textContent.replace(/\s+/g, ' ').trim();
        if (!text.includes('\u20B9') || !text.includes('ADD')) continue;

        const nameEl = card.querySelector('div.tw-text-300.tw-font-semibold.tw-line-clamp-2');
        const priceEl = card.querySelector('div.tw-text-200.tw-font-semibold');
        const mrpEl = card.querySelector('span');
        const imgEl = card.querySelector('img');

        const name = nameEl?.textContent?.trim() || '';
        const priceStr = priceEl?.textContent?.trim() || '';
        const mrpStr = mrpEl?.textContent?.trim() || '';
        const imageUrl = imgEl?.getAttribute('src') || '';

        const price = Number(priceStr.replace(/[₹,]/g, ''));
        const mrp = Number(mrpStr.replace(/[₹,]/g, ''));

        if (name && price) {
          results.push({ name, brand: '', price, mrp: mrp || price, imageUrl });
        }
      }
      return results;
    });

    if (products.length === 0) {
      await page.screenshot({ path: 'debug-blinkit.png' });
    }

    return products;
  } catch (err) {
    console.error('Blinkit scrape error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrape('mixer grinder', '700001').then(console.log).catch(console.error);
}

module.exports = { scrape };
