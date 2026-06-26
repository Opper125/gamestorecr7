/**
 * api/youtube.js - YouTube Data API v3 Proxy
 *
 * Fetches channel videos, shorts, and posts from YouTube.
 * API key read from Vercel ENV only. Never exposed to the browser.
 *
 * GET /api/youtube?type=videos
 * GET /api/youtube?type=shorts
 * GET /api/youtube?type=posts
 * GET /api/youtube?video_id=xxx  (single video with stats)
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!YOUTUBE_API_KEY || !CHANNEL_ID) return res.status(500).json({ error: 'YouTube API not configured' });

  try {
    const { type, video_id, max_results = 20, page_token } = req.query;

    if (video_id) {
      const url = `${YT_API_BASE}/videos?part=snippet,statistics&id=${encodeURIComponent(video_id)}&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: result.error?.message || 'YouTube API error' });

      const commentsUrl = `${YT_API_BASE}/commentThreads?part=snippet&videoId=${encodeURIComponent(video_id)}&maxResults=10&key=${YOUTUBE_API_KEY}`;
      const commentsRes = await fetch(commentsUrl);
      const commentsResult = await commentsRes.json();

      return res.status(200).json({ data: { video: result.items?.[0] || null, comments: commentsResult.items || [] } });
    }

    if (type === 'videos' || type === 'shorts') {
      const channelUrl = `${YT_API_BASE}/channels?part=contentDetails&id=${encodeURIComponent(CHANNEL_ID)}&key=${YOUTUBE_API_KEY}`;
      const channelRes = await fetch(channelUrl);
      const channelData = await channelRes.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) return res.status(404).json({ error: 'Upload playlist not found' });

      let playlistUrl = `${YT_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${max_results}&key=${YOUTUBE_API_KEY}`;
      if (page_token) playlistUrl += `&pageToken=${encodeURIComponent(page_token)}`;

      const playlistRes = await fetch(playlistUrl);
      const playlistResult = await playlistRes.json();
      if (!playlistRes.ok) return res.status(playlistRes.status).json({ error: playlistResult.error?.message || 'YouTube API error' });

      const items = playlistResult.items || [];
      const videoIds = items.map(item => item.contentDetails?.videoId).filter(Boolean);

      if (videoIds.length > 0) {
        const statsUrl = `${YT_API_BASE}/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json();
        const statsMap = {};
        (statsData.items || []).forEach(v => { statsMap[v.id] = { viewCount: v.statistics?.viewCount || '0', likeCount: v.statistics?.likeCount || '0', commentCount: v.statistics?.commentCount || '0' }; });
        items.forEach(item => { const vid = item.contentDetails?.videoId; if (vid && statsMap[vid]) item.statistics = statsMap[vid]; });
      }

      return res.status(200).json({ data: { items, nextPageToken: playlistResult.nextPageToken || null, prevPageToken: playlistResult.prevPageToken || null } });
    }

    if (type === 'posts') {
      return res.status(200).json({ data: { items: [], note: 'Community posts not available via YouTube Data API v3.' } });
    }

    return res.status(400).json({ error: 'Invalid type parameter. Use: videos, shorts, posts, or provide video_id' });
  } catch (err) {
    console.error('YouTube proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
