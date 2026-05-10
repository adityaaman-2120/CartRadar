const express = require('express');
const router = express.Router();

router.get('/search', (req, res) => {
  const { q, pincode } = req.query;

  if (!q || !pincode) {
    return res.status(400).json({ error: 'q and pincode required' });
  }

  res.json({ query: q, pincode, results: [] });
});

module.exports = router;
