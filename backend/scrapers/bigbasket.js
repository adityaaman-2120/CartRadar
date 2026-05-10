const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrape(query, pincode) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    const url = `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);

    const products = await page.evaluate(() => {
      const containers = document.querySelectorAll('.SKUDeck___StyledDiv-sc-1e5d9gk-0');
      const results = [];

      const max = Math.min(containers.length, 8);
      for (let i = 0; i < max; i++) {
        const el = containers[i];

        const brandEl = el.querySelector('span[class*="BrandName"]');
        const nameEl = el.querySelector('h3.block');
        const priceEl = el.querySelector('.sc-ihgnxF');
        const mrpEl = el.querySelector('[class*="Pricing___StyledLabel2"]');
        const imgEl = el.querySelector('img[src]');

        const brand = brandEl?.textContent?.trim() || '';
        const rawName = nameEl?.textContent?.trim() || '';
        const priceStr = priceEl?.textContent?.trim() || '';
        const mrpStr = mrpEl?.textContent?.trim() || '';
        const imageUrl = imgEl?.getAttribute('src') || '';

        const price = Number(priceStr.replace(/[₹,]/g, ''));
        const mrp = Number(mrpStr.replace(/[₹,]/g, ''));

        // Clean name: remove brand prefix and trailing quantity suffix
        let name = rawName;
        if (brand && name.startsWith(brand)) {
          name = name.slice(brand.length).trim();
        }
        // Remove trailing text that looks like a quantity suffix
        name = name.replace(/\d+\s*(pc|unit|pcs|kg|g|ml|l|jar|jars)$/i, '').trim();
        // Clean up trailing dash/separator
        name = name.replace(/\s*[-–—]\s*$/, '').trim();

        if (name && price) {
          results.push({ name, brand, price, mrp, imageUrl });
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
