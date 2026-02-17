import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [videos, setVideos] = useState([]);
  const [filter, setFilter] = useState('queued');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [filter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/queue/status/${filter}`);
      const data = await res.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveVideo = async (id) => {
    try {
      const res = await fetch(`/api/queue/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      setVideos(videos.filter(v => v._id !== id));
      alert('Video approved! ✅');
    } catch (error) {
      alert('Error approving video');
    }
  };

  const rejectVideo = async (id) => {
    try {
      const reason = prompt('Reason for rejection:');
      if (reason) {
        const res = await fetch(`/api/queue/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        setVideos(videos.filter(v => v._id !== id));
        alert('Video rejected ❌');
      }
    } catch (error) {
      alert('Error rejecting video');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Quantum Quest Dashboard</h1>
        <p>AI-powered YouTube Shorts & TikTok Generator</p>
      </header>

      <div className="filters">
        {['queued', 'approved', 'posted', 'rejected'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Loading...</div>}

      <div className="video-grid">
        {videos.length === 0 ? (
          <div className="empty">No videos in {filter} status</div>
        ) : (
          videos.map(video => (
            <div key={video._id} className="video-card">
              <img src={video.thumbnailUrl} alt={video.title} className="thumbnail" />
              <div className="content">
                <h3>{video.title}</h3>
                <p className="description">{video.description}</p>
                <div className="meta">
                  <span className={`badge ${video.scheduledPost}`}>{video.scheduledPost}</span>
                  <span className="date">{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {filter === 'queued' && (
                <div className="actions">
                  <button className="btn btn-approve" onClick={() => approveVideo(video._id)}>
                    ✅ Approve
                  </button>
                  <button className="btn btn-reject" onClick={() => rejectVideo(video._id)}>
                    ❌ Reject
                  </button>
                </div>
              )}

              {filter === 'posted' && (
                <div className="posted-info">
                  <p>✓ YouTube: {video.youtubeId ? '✅' : '❌'}</p>
                  <p>✓ TikTok: {video.tiktokId ? '✅' : '❌'}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
