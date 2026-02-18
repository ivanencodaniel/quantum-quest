require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();

app.use(cors());
app.use(express.json());

let videos = [];
let videoId = 1;
let youtubeClient = null;
let trendingCache = [];
let usedVideoIds = new Set();

// Initialize YouTube
function initializeYouTube() {
  try {
    youtubeClient = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    console.log('✅ YouTube initialized');
  } catch (error) {
    console.error('YouTube init error:', error.message);
  }
}

// Fetch trending
async function fetchTrendingVideos() {
  try {
    const response = await youtubeClient.videos.list({
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode: 'US',
      maxResults: 100
    });
    trendingCache = response.data.items || [];
    console.log(`✅ Fetched ${trendingCache.length} videos`);
  } catch (error) {
    console.error('Trending fetch error:', error.message);
  }
}

// API Routes
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

app.post('/api/queue/generate', async (req, res) => {
  try {
    if (trendingCache.length === 0) {
      await fetchTrendingVideos();
    }

    if (trendingCache.length === 0) {
      return res.status(500).json({ error: 'No videos' });
    }

    let selectedVideo = null;
    for (let i = 0; i < 10; i++) {
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
      scheduledPost: Math.random() > 0.5 ? '3am' : '3pm',
      createdAt: new Date()
    };

    videos.push(newVideo);
    res.json({ message: 'Generated', video: newVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', videos: videos.length });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;

initializeYouTube();
fetchTrendingVideos();

setInterval(fetchTrendingVideos, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Running on port ${PORT}`);
});
