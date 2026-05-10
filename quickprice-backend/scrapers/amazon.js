const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const MAX_PER_SEARCH = 8;
const TOTAL_MAX = 14;

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
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const allProducts = [];
    const seenKeys = new Set();

    const searchUrls = [
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}&rh=n%3A2454178031`, // Grocery & Gourmet Foods
    ];

    for (const url of searchUrls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(4000);
      } catch {
        await page.waitForTimeout(3000);
      }

      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1500);

      const products = await page.evaluate((max) => {
        const results = [];
        const cards = document.querySelectorAll('div[data-component-type="s-search-result"]');

        cards.forEach((card) => {
          if (results.length >= max) return;
          const text = card.textContent.replace(/\s+/g, ' ').trim();
          if (!text.includes('\u20B9')) return;

          const nameEl = card.querySelector('h2 span');
          const name = nameEl?.textContent?.trim() || '';
          if (!name) return;

          const priceWholeEl = card.querySelector('span.a-price-whole');
          const priceWhole = priceWholeEl?.textContent?.replace(/[,]/g, '').trim() || '0';
          const price = Number(priceWhole);

          const mrpEl = card.querySelector('span.a-price.a-text-price span.a-offscreen');
          const mrpStr = mrpEl?.textContent?.replace(/[₹,]/g, '').trim() || '';
          const mrp = Number(mrpStr) || price;

          const imgEl = card.querySelector('img.s-image');
          const imageUrl = imgEl?.getAttribute('src') || '';

          const brand = name.split(/\s+/)[0] || '';

          if (name && price > 0) {
            results.push({ name, brand, price, mrp: Math.max(price, mrp), imageUrl });
          }
        });

        return results;
      }, MAX_PER_SEARCH);

      for (const p of products) {
        const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allProducts.push(p);
        }
      }
    }

    if (allProducts.length === 0) {
      await page.screenshot({ path: 'debug-amazon.png' });
    }

    return allProducts.slice(0, TOTAL_MAX);
  } catch (err) {
    console.error('Amazon scrape error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrape('mixer grinder', '700001').then(console.log).catch(console.error);
}

module.exports = { scrape };
