const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function getTrendingVideos() {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: 'US',
        maxResults: 50,
        key: YOUTUBE_API_KEY
      }
    });

    return response.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount
    }));
  } catch (error) {
    console.error('Error fetching trending videos:', error.message);
    throw error;
  }
}

async function searchTrendingKeywords() {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        order: 'viewCount',
        maxResults: 30,
        type: 'video',
        videoDuration: 'short',
        key: YOUTUBE_API_KEY
      }
    });

    return response.data.items;
  } catch (error) {
    console.error('Error searching trending keywords:', error.message);
    throw error;
  }
}

module.exports = {
  getTrendingVideos,
  searchTrendingKeywords
};
