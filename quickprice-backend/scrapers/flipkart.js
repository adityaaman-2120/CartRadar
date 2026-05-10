const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const MAX_PER_URL = 8;
const TOTAL_MAX = 18;

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
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&marketplace=GROCERY`,
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&marketplace=HYPERLOCAL`,
    ];

    for (const url of searchUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });
      } catch {
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(2000);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(500);

      const products = await page.evaluate((max) => {
        const results = [];
        let cards = document.querySelectorAll('div._1AtVbE');

        if (cards.length === 0) {
          const allDivs = document.querySelectorAll('div');
          const seen = new Set();
          allDivs.forEach((div) => {
            const key = div.textContent.replace(/\s+/g, ' ').trim().substring(0, 100);
            if (seen.has(key)) return;
            const text = div.textContent.replace(/\s+/g, ' ').trim();
            if (
              text.length > 30 &&
              text.length < 500 &&
              text.includes('\u20B9') &&
              div.querySelector('a[href*="/p/"]') &&
              div.querySelector('img')
            ) {
              seen.add(key);
              const cls = typeof div.className === 'string' ? div.className : '';
              if (cls && cls.length > 3) {
                cards = [...cards, div];
              }
            }
          });
        }

        cards.forEach((card) => {
          if (results.length >= max) return;
          const text = card.textContent.replace(/\s+/g, ' ').trim();

          let nameEl =
            card.querySelector('div._4rR01T') ||
            card.querySelector('div.IRpwTa') ||
            card.querySelector('h2 span') ||
            card.querySelector('h2');
          let name = nameEl?.textContent?.trim() || '';

          if (!name) {
            const link = card.querySelector('a[href*="/p/"]');
            if (link) {
              name = link.textContent?.trim() || '';
              name = name.replace(/^Add to Compare/i, '').trim();
            }
          }

          if (!name && text.includes('\u20B9')) {
            const beforePrice = text.split('\u20B9')[0].trim();
            const lines = beforePrice.split('\n').filter(Boolean).map((l) => l.trim());
            for (let i = lines.length - 1; i >= 0; i--) {
              if (lines[i].length > 10 && !lines[i].includes('Add to Compare')) {
                name = lines[i];
                break;
              }
            }
          }

          if (!name) return;

          name = name.replace(/\d+\.\d+.*$/s, '').trim();
          name = name.replace(/[\d,]+ Ratings?.*$/s, '').trim();
          name = name.replace(/\d+\.?\s*$/, '').trim();
          name = name.replace(/Power Consumption.*$/s, '').trim();

          const priceEl = card.querySelector('div._30jeq3') || card.querySelector('div._1_WHN1');
          let price = 0;
          if (priceEl) {
            price = Number((priceEl.textContent || '').replace(/[₹,]/g, ''));
          } else {
            const match = text.match(/₹(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
            if (match) {
              price = Number(match[1].replace(/,/g, ''));
            }
          }

          if (!price) return;

          const mrpEl = card.querySelector('div._3I9_wc') || card.querySelector('div._27UcVY');
          let mrp = 0;
          if (mrpEl) {
            mrp = Number((mrpEl.textContent || '').replace(/[₹,]/g, ''));
          } else {
            const uptoOff = text.split('% off')[0] || text;
            const matches = uptoOff.match(/₹(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g);
            if (matches && matches.length > 1) {
              mrp = Number(matches[1].replace(/[₹,]/g, ''));
            } else if (matches && matches.length === 1) {
              mrp = Number(matches[0].replace(/[₹,]/g, ''));
            }
          }

          const img = card.querySelector('img');
          const imageUrl = img?.getAttribute('src') || '';

          results.push({ name, brand: '', price, mrp: mrp || price, imageUrl });
        });

        return results;
      }, MAX_PER_URL);

      for (const p of products) {
        const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allProducts.push(p);
        }
      }
    }

    if (allProducts.length === 0) {
      await page.screenshot({ path: 'debug-flipkart.png' });
    }

    return allProducts.slice(0, TOTAL_MAX);
  } catch (err) {
    console.error('Flipkart scrape error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrape('mixer grinder', '560001').then(console.log).catch(console.error);
}

module.exports = { scrape };
