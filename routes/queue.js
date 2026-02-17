const express = require('express');
const Video = require('../models/Video');
const videosService = require('../services/videosService');

const router = express.Router();

// Get all queued videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get videos by status
router.get('/status/:status', async (req, res) => {
  try {
    const videos = await Video.find({ status: req.params.status }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve a video
router.post('/:id/approve', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    video.status = 'approved';
    video.approvedAt = new Date();
    await video.save();

    res.json({ message: 'Video approved', video });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject a video
router.post('/:id/reject', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    video.status = 'rejected';
    video.notes = req.body.reason || 'Rejected by admin';
    await video.save();

    res.json({ message: 'Video rejected', video });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger video generation
router.post('/generate', async (req, res) => {
  try {
    const video = await videosService.generateAndQueueShort();
    res.json({ message: 'Video queued', video });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
