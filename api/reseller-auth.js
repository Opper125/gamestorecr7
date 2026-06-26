/**
 * api/reseller-auth.js - Reseller Dashboard Password Verification
 *
 * Verifies the reseller's dashboard password against the stored
 * bcrypt hash in the reseller_accounts table.
 *
 * POST /api/reseller-auth
 * Body: { user_id, password }
 *
 * Response: { success: true/false, error?: string }
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ error: 'Missing user_id or password' });
    }

    // Fetch reseller account with dashboard password hash
    const { data: accounts, error } = await supabase
      .from('reseller_accounts')
      .select('dashboard_password_hash')
      .eq('user_id', user_id)
      .limit(1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const account = accounts?.[0];

    // If no dashboard password is set, allow access
    if (!account || !account.dashboard_password_hash) {
      return res.status(200).json({ success: true, noPassword: true });
    }

    // Verify password against bcrypt hash
    const isValid = await bcrypt.compare(password, account.dashboard_password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid dashboard password' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Reseller auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
