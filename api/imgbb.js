/**
 * api/imgbb.js - ImgBB Image Upload Proxy
 *
 * Accepts base64-encoded image data, uploads to ImgBB API,
 * and returns the public URL. The ImgBB API key is read from
 * Vercel ENV and never exposed to the browser.
 *
 * POST /api/imgbb
 * Body: { image: "<base64 data>" }
 *   OR: { image: "<base64>", name: "optional_filename" }
 *
 * Response: { url: "https://i.ibb.co/..." }
 */

const fetch = require('node-fetch');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!IMGBB_API_KEY) {
    return res.status(500).json({ error: 'ImgBB API key not configured' });
  }

  try {
    const { image, name } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', image);
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      console.error('ImgBB upload error:', result.error);
      return res.status(400).json({ error: result.error?.message || 'Image upload failed' });
    }

    return res.status(200).json({
      url: result.data.url,
      display_url: result.data.display_url,
      delete_url: result.data.delete_url,
      thumb: result.data.thumb?.url || null,
      medium: result.data.medium?.url || null,
    });
  } catch (err) {
    console.error('ImgBB proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
