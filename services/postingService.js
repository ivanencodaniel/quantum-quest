const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

async function postToYouTube(videoPath, title, description) {
  try {
    if (!fs.existsSync(videoPath)) {
      console.log(`⚠️ Video file not found at ${videoPath} - skipping YouTube upload`);
      return null;
    }

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: ['trending', 'viral', 'shorts', 'quantum quest']
        },
        status: {
          privacyStatus: 'public'
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    });

    console.log(`✅ Posted to YouTube: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('Error posting to YouTube:', error.message);
    return null;
  }
}

async function postToTikTok(videoPath, title, description) {
  // TikTok API requires OAuth2 - placeholder for when credentials are added
  console.log(`📱 TikTok posting ready (add credentials to enable)`);
  return null;
}

async function postApprovedVideos(slot) {
  try {
    const videos = await Video.find({
      status: 'approved',
      scheduledPost: slot
    });

    if (!videos.length) {
      console.log(`No approved videos for ${slot}`);
      return;
    }

    for (const video of videos) {
      try {
        // Post to YouTube
        const youtubeId = await postToYouTube(video.videoPath, video.title, video.description);
        
        // Post to TikTok
        const tiktokId = await postToTikTok(video.videoPath, video.title, video.description);

        // Update video record
        video.status = 'posted';
        video.youtubeId = youtubeId;
        video.tiktokId = tiktokId;
        video.postedAt = new Date();
        await video.save();

        console.log(`✅ Video posted: ${video.title}`);
      } catch (error) {
        console.error(`Error posting video ${video._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error posting approved videos:', error);
  }
}

module.exports = {
  postToYouTube,
  postToTikTok,
  postApprovedVideos
};
