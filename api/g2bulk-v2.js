/**
 * api/g2bulk-v2.js - G2Bulk Gift Cards API Proxy (v2 / SMM)
 *
 * Proxies all Gift Card requests to G2Bulk SMM v2 API.
 * API key and SMM URL read from Vercel ENV only.
 *
 * POST /api/g2bulk-v2
 * Body: { action, data }
 *
 * Actions:
 *   services    -> List available services
 *   add         -> Place an order
 *   status      -> Check order status
 *   balance     -> Check account balance
 */

const fetch = require('node-fetch');

const G2BULK_API_KEY = process.env.G2BULK_API_KEY;
const G2BULK_SMM_URL = process.env.G2BULK_SMM_URL || 'https://api.g2bulk.com/api/v2';

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

  if (!G2BULK_API_KEY) {
    return res.status(500).json({ error: 'G2Bulk API key not configured' });
  }

  try {
    const { action, data = {} } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const payload = {
      api_key: G2BULK_API_KEY,
      action,
      ...data,
    };

    const response = await fetch(G2BULK_SMM_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('G2Bulk V2 error:', result);
      return res.status(response.status).json({
        error: result.message || result.error || 'G2Bulk SMM API error',
        details: result,
      });
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('G2Bulk V2 proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
