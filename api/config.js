/**
 * api/config.js - Public Configuration Endpoint
 *
 * Returns public-facing configuration values from server-side ENV.
 * No secrets (service role keys, API keys) are exposed.
 * The Supabase anon key is safe for public use (RLS-protected).
 *
 * GET /api/config
 *
 * Response: {
 *   supabaseUrl: string,
 *   supabaseAnonKey: string,
 *   userDomain: string,
 *   adminDomain: string,
 *   resellerDomain: string,
 *   siteConfigured: boolean
 * }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    userDomain: process.env.USER_DOMAIN || '',
    adminDomain: process.env.ADMIN_DOMAIN || '',
    resellerDomain: process.env.RESELLER_DOMAIN || '',
    siteConfigured: !!(supabaseUrl && supabaseAnonKey),
  });
}
