/**
 * api/g2bulk-v1.js - G2Bulk Game Topup API Proxy (v1)
 *
 * Proxies all Game Topup requests to G2Bulk v1 API.
 * API key and base URL read from Vercel ENV only.
 *
 * POST /api/g2bulk-v1
 * Body: { endpoint, method, data }
 */

const G2BULK_API_KEY = process.env.G2BULK_API_KEY;
const G2BULK_BASE_URL = process.env.G2BULK_BASE_URL || 'https://api.g2bulk.com/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!G2BULK_API_KEY) return res.status(500).json({ error: 'G2Bulk API key not configured' });

  try {
    const { endpoint, method = 'GET', data = {} } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint parameter' });

    const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${G2BULK_API_KEY}` };
    let url;
    const fetchOptions = { headers };

    switch (endpoint) {
      case 'games': {
        url = `${G2BULK_BASE_URL}/games`;
        fetchOptions.method = 'GET';
        if (data.game_code) url += `/${encodeURIComponent(data.game_code)}`;
        break;
      }
      case 'games/fields': {
        url = `${G2BULK_BASE_URL}/games/fields`;
        fetchOptions.method = 'POST';
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ game_code: data.game_code });
        break;
      }
      case 'games/servers': {
        if (!data.game_code) return res.status(400).json({ error: 'Missing game_code' });
        url = `${G2BULK_BASE_URL}/games/${encodeURIComponent(data.game_code)}/servers`;
        fetchOptions.method = 'GET';
        break;
      }
      case 'games/check-player': {
        url = `${G2BULK_BASE_URL}/games/checkPlayerId`;
        fetchOptions.method = 'POST';
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ game_code: data.game_code, player_id: data.player_id, server_id: data.server_id || null });
        break;
      }
      case 'games/catalogue': {
        if (!data.game_code) return res.status(400).json({ error: 'Missing game_code' });
        url = `${G2BULK_BASE_URL}/games/${encodeURIComponent(data.game_code)}/catalogue`;
        fetchOptions.method = 'GET';
        break;
      }
      case 'games/eta': {
        url = `${G2BULK_BASE_URL}/games/eta`;
        fetchOptions.method = 'POST';
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ game_code: data.game_code, package_id: data.package_id });
        break;
      }
      case 'games/order': {
        if (!data.game_code) return res.status(400).json({ error: 'Missing game_code' });
        url = `${G2BULK_BASE_URL}/games/${encodeURIComponent(data.game_code)}/order`;
        fetchOptions.method = 'POST';
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ package_id: data.package_id, player_id: data.player_id, server_id: data.server_id || null, quantity: data.quantity || 1, idempotency_key: data.idempotency_key });
        break;
      }
      case 'orders/delivery': {
        if (!data.order_id) return res.status(400).json({ error: 'Missing order_id' });
        url = `${G2BULK_BASE_URL}/orders/${encodeURIComponent(data.order_id)}/delivery`;
        fetchOptions.method = 'GET';
        break;
      }
      case 'orders/status': {
        if (!data.order_id) return res.status(400).json({ error: 'Missing order_id' });
        url = `${G2BULK_BASE_URL}/orders/${encodeURIComponent(data.order_id)}`;
        fetchOptions.method = 'GET';
        break;
      }
      case 'balance': {
        url = `${G2BULK_BASE_URL}/balance`;
        fetchOptions.method = 'GET';
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
    }

    const response = await fetch(url, fetchOptions);
    const result = await response.json();

    if (!response.ok) {
      console.error('G2Bulk V1 error:', result);
      return res.status(response.status).json({ error: result.message || result.error || 'G2Bulk API error', details: result });
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('G2Bulk V1 proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
