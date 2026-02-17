const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnailUrl: String,
  videoPath: String,
  sourceTrending: Boolean,
  status: {
    type: String,
    enum: ['queued', 'approved', 'posted', 'rejected'],
    default: 'queued'
  },
  scheduledPost: {
    type: String,
    enum: ['3am', '3pm'],
    default: '3pm'
  },
  youtubeId: String,
  tiktokId: String,
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  postedAt: Date,
  notes: String
});

module.exports = mongoose.model('Video', videoSchema);
