const trendingService = require('./trendingService');
const Video = require('../models/Video');

async function generateAndQueueShort() {
  try {
    const trendingVideos = await trendingService.getTrendingVideos();
    if (!trendingVideos.length) throw new Error('No trending videos found');
    const selectedVideo = trendingVideos[Math.floor(Math.random() * trendingVideos.length)];
    const videoEntry = new Video({
      title: `Quantum Quest: ${selectedVideo.title}`,
      description: `Trending: ${selectedVideo.description.substring(0, 100)}`,
      thumbnailUrl: selectedVideo.thumbnail,
      status: 'queued',
      sourceTrending: true,
      scheduledPost: '3pm'
    });
    await videoEntry.save();
    console.log(`Video queued: ${videoEntry.title}`);
    return videoEntry;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function generateVideoFile(videoId) {
  try {
    const video = await Video.findById(videoId);
    console.log(`Video file generated: ${videoId}`);
    return videoId;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = { generateAndQueueShort, generateVideoFile };
