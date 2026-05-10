const { chromium } = require('playwright');

async function scrape(query, pincode) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewportSize({ width: 1280, height: 800 });

    const url = `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('li[qa="product-detail"], [class*="prod-view"]');
      const results = [];

      const max = Math.min(items.length, 8);
      for (let i = 0; i < max; i++) {
        const el = items[i];

        const nameEl =
          el.querySelector('span[qa="prd-name"]') ||
          el.querySelector('[class*="prod-name"]');
        const priceEl =
          el.querySelector('span[qa="discnt-price"]') ||
          el.querySelector('[class*="discnt-price"]');
        const mrpEl =
          el.querySelector('span[qa="mrp"]') ||
          el.querySelector('[class*="mrp-blk"]');

        const name = nameEl?.textContent?.trim() || '';
        const priceStr = priceEl?.textContent?.trim() || '';
        const mrpStr = mrpEl?.textContent?.trim() || '';

        const price = Number(priceStr.replace(/[₹,]/g, ''));
        const mrp = Number(mrpStr.replace(/[₹,]/g, ''));

        if (name && price) {
          results.push({ name, brand: '', price, mrp, imageUrl: '' });
        }
      }
      return results;
    });

    if (products.length === 0) {
      await page.screenshot({ path: 'debug-bigbasket.png' });
    }

    return products;
  } catch (err) {
    console.error('BigBasket scrape error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrape('mixer grinder', '700001').then(console.log).catch(console.error);
}

module.exports = { scrape };
