const express = require('express');
const trendingService = require('../services/trendingService');

const router = express.Router();

// Get current trending videos
router.get('/', async (req, res) => {
  try {
    const trending = await trendingService.getTrendingVideos();
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for trending keywords
router.get('/search', async (req, res) => {
  try {
    const results = await trendingService.searchTrendingKeywords();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
