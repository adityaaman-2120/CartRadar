const express = require('express');
const router = express.Router();

const { scrape: scrapeBigbasket } = require('../scrapers/bigbasket');
const { scrape: scrapeBlinkit } = require('../scrapers/blinkit');
const { scrape: scrapeZepto } = require('../scrapers/zepto');
const { scrape: scrapeFlipkart } = require('../scrapers/flipkart');
const { scrape: scrapeAmazon } = require('../scrapers/amazon');

function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

router.get('/search', async (req, res) => {
  const { q, pincode } = req.query;

  if (!q || !pincode) {
    return res.status(400).json({ error: 'q and pincode required' });
  }

  console.log(`Searching for "${q}" in ${pincode}`);

  const start = Date.now();

  const [bb, bl, ze, fk, am] = await Promise.allSettled([
    withTimeout(scrapeBigbasket(q, pincode), 30000, 'BigBasket'),
    withTimeout(scrapeBlinkit(q, pincode), 30000, 'Blinkit'),
    withTimeout(scrapeZepto(q, pincode), 30000, 'Zepto'),
    withTimeout(scrapeFlipkart(q, pincode), 30000, 'Flipkart'),
    withTimeout(scrapeAmazon(q, pincode), 30000, 'Amazon'),
  ]);

  const results = [
    { platform: 'bigbasket', products: bb.status === 'fulfilled' ? bb.value : [], error: bb.status === 'rejected' ? bb.reason.message : null },
    { platform: 'blinkit',   products: bl.status === 'fulfilled' ? bl.value : [], error: bl.status === 'rejected' ? bl.reason.message : null },
    { platform: 'zepto',     products: ze.status === 'fulfilled' ? ze.value : [], error: ze.status === 'rejected' ? ze.reason.message : null },
    { platform: 'flipkart',  products: fk.status === 'fulfilled' ? fk.value : [], error: fk.status === 'rejected' ? fk.reason.message : null },
    { platform: 'amazon',    products: am.status === 'fulfilled' ? am.value : [], error: am.status === 'rejected' ? am.reason.message : null },
  ];

  console.log(`Done in ${Date.now() - start}ms`);

  res.json({ query: q, pincode, results, timeTaken: Date.now() - start });
});

module.exports = router;
