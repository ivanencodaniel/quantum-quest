require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let videos = [];
let videoId = 1;
let youtubeClient = null;
let trendingCache = [];
let usedVideoIds = new Set();

// Initialize YouTube auth
async function initializeYouTube() {
  try {
    youtubeClient = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    console.log('✅ YouTube client initialized');
    fetchTrendingVideos();
  } catch (error) {
    console.error('Error initializing YouTube:', error);
  }
}

// Fetch and cache trending videos
async function fetchTrendingVideos() {
  try {
    const response = await youtubeClient.videos.list({
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode: 'US',
      maxResults: 100
    });

    trendingCache = response.data.items || [];
    console.log(`✅ Fetched ${trendingCache.length} trending videos`);
  } catch (error) {
    console.error('Error fetching trending videos:', error);
  }
}

app.get('/api/queue', (req, res) => {
  res.json(videos);
});

app.get('/api/queue/status/:status', (req, res) => {
  const filtered = videos.filter(v => v.status === req.params.status);
  res.json(filtered);
});

app.post('/api/queue/:id/approve', (req, res) => {
  const video = videos.find(v => v._id == req.params.id);
  if (!video) return res.status(404).json({ error: 'Not found' });
  video.status = 'approved';
  video.approvedAt = new Date();
  res.json({ message: 'Approved', video });
});

app.post('/api/queue/:id/reject', (req, res) => {
  const video = videos.find(v => v._id == req.params.id);
  if (!video) return res.status(404).json({ error: 'Not found' });
  video.status = 'rejected';
  video.notes = req.body.reason || 'Rejected';
  res.json({ message: 'Rejected', video });
});

app.post('/api/queue/:id/post', async (req, res) => {
  const video = videos.find(v => v._id == req.params.id);
  if (!video) return res.status(404).json({ error: 'Not found' });
  
  try {
    video.status = 'posted';
    video.postedAt = new Date();
    video.youtubeId = 'DEMO-' + Math.random().toString(36).substring(7);
    
    console.log(`✅ Video posted: ${video.title}`);
    res.json({ message: 'Video posted to YouTube!', video });
  } catch (error) {
    console.error('Error posting video:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue/generate', async (req, res) => {
  try {
    if (trendingCache.length === 0) {
      await fetchTrendingVideos();
    }

    if (trendingCache.length === 0) {
      return res.status(500).json({ error: 'No trending videos found' });
    }

    let selectedVideo = null;
    for (let i = 0; i < trendingCache.length; i++) {
      const video = trendingCache[Math.floor(Math.random() * trendingCache.length)];
      if (!usedVideoIds.has(video.id)) {
        selectedVideo = video;
        break;
      }
    }

    if (!selectedVideo) {
      usedVideoIds.clear();
      selectedVideo = trendingCache[Math.floor(Math.random() * trendingCache.length)];
    }

    usedVideoIds.add(selectedVideo.id);

    const newVideo = {
      _id: videoId++,
      title: `Quantum Quest: ${selectedVideo.snippet.title}`,
      description: selectedVideo.snippet.description.substring(0, 150),
      thumbnailUrl: selectedVideo.snippet.thumbnails.high.url,
      status: 'queued',
      sourceTrending: true,
      trendingVideoId: selectedVideo.id,
      scheduledPost: Math.random() > 0.5 ? '3am' : '3pm',
      createdAt: new Date()
    };

    videos.push(newVideo);
    console.log(`✅ Generated from trending: ${newVideo.title}`);
    res.json({ message: 'Video generated from trending', video: newVideo });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    videos: videos.length, 
    youtubeConnected: !!youtubeClient,
    trendingCached: trendingCache.length,
    usedVideos: usedVideoIds.size
  });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;

initializeYouTube();

// Refresh trending videos every 30 minutes
setInterval(fetchTrendingVideos, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Quantum Quest running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});
