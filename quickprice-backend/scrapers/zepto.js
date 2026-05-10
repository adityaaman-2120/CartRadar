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

    const url = `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);

    // Handle location prompt via "Select Location" button
    const selectLocationBtn = await page.$('[data-testid="user-address"]');
    if (selectLocationBtn) {
      await selectLocationBtn.click();
      await page.waitForTimeout(2000);

      const addrInput = await page.$('input[placeholder*="Search a new address"]');
      if (addrInput) {
        await addrInput.click();
        await addrInput.fill(pincode);
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);
      }
    }

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);

    const products = await page.evaluate(() => {
      const nameSlots = document.querySelectorAll('[data-slot-id="ProductName"]');
      const results = [];
      const seen = new Set();

      nameSlots.forEach((nameSlot) => {
        if (results.length >= 8) return;

        const name = nameSlot.textContent?.trim() || '';
        if (!name || seen.has(name)) return;
        seen.add(name);

        // Walk up to find the card container that wraps all slots
        let card = nameSlot;
        for (let i = 0; i < 8; i++) {
          const parent = card.parentElement;
          if (!parent) break;
          const hasImg = parent.querySelector('[data-slot-id="ProductImageWrapper"]');
          if (hasImg) {
            card = parent;
            break;
          }
          card = parent;
        }

        const imgWrapper = card.querySelector('[data-slot-id="ProductImageWrapper"]');
        const priceContainer = card.querySelector('[data-slot-id="EdlpPrice"]');
        const imgEl = imgWrapper?.querySelector('img');

        const imageUrl = imgEl?.getAttribute('src') || '';

        let price = 0;
        let mrp = 0;

        if (priceContainer) {
          const spans = priceContainer.querySelectorAll('span');
          const priceTexts = [];
          spans.forEach((s) => {
            const t = s.textContent.trim();
            if (t.includes('\u20B9')) priceTexts.push(t);
          });
          price = Number((priceTexts[0] || '').replace(/[₹,]/g, ''));
          mrp = Number((priceTexts[1] || '').replace(/[₹,]/g, ''));
        }

        if (name && price) {
          results.push({ name, brand: '', price, mrp: mrp || price, imageUrl });
        }
      });

      return results;
    });

    if (products.length === 0) {
      await page.screenshot({ path: 'debug-zepto.png' });
    }

    return products;
  } catch (err) {
    console.error('Zepto scrape error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrape('mixer grinder', '700001').then(console.log).catch(console.error);
}

module.exports = { scrape };
