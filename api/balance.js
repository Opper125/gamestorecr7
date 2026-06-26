/**
 * api/balance.js - Balance Credit/Debit (Server-Side Only)
 *
 * All balance changes go through this serverless function using
 * the Supabase service role key, which bypasses RLS.
 * Direct balance editing via the browser is impossible.
 *
 * POST /api/balance
 * Body: { action: "credit", user_id, amount, note }
 *   OR: { action: "debit", user_id, amount, note }
 *   OR: { action: "approve_deposit", deposit_id }
 *   OR: { action: "refund_order", order_id }
 *   OR: { action: "get_balance", user_id }
 * Headers: { Authorization: "Bearer <admin_token>" }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminApprovePwd = process.env.ADMIN_APPROVE_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { action, user_id, amount, note, deposit_id, order_id, admin_password } = req.body;
    if (!action) return res.status(400).json({ error: 'Missing action parameter' });

    // Verify admin password for all mutation actions
    if (action !== 'get_balance' && action !== 'check') {
      if (!admin_password || admin_password !== adminApprovePwd) {
        return res.status(401).json({ error: 'Unauthorized: invalid admin password' });
      }
    }

    switch (action) {
      case 'credit': {
        if (!user_id || !amount || amount <= 0) return res.status(400).json({ error: 'Missing or invalid user_id or amount' });
        const { error } = await supabase.rpc('credit_user_balance', { p_user_id: user_id, p_amount: parseFloat(amount), p_note: note || null });
        if (error) { console.error('Credit error:', error); return res.status(400).json({ error: error.message }); }
        return res.status(200).json({ success: true, message: `Credited ${amount} MMK` });
      }

      case 'debit': {
        if (!user_id || !amount || amount <= 0) return res.status(400).json({ error: 'Missing or invalid user_id or amount' });
        const { error } = await supabase.rpc('debit_user_balance', { p_user_id: user_id, p_amount: parseFloat(amount), p_note: note || null });
        if (error) { console.error('Debit error:', error); return res.status(400).json({ error: error.message }); }
        return res.status(200).json({ success: true, message: `Debited ${amount} MMK` });
      }

      case 'approve_deposit': {
        if (!deposit_id) return res.status(400).json({ error: 'Missing deposit_id' });
        const { error } = await supabase.rpc('approve_deposit', { p_deposit_id: deposit_id });
        if (error) { console.error('Approve deposit error:', error); return res.status(400).json({ error: error.message }); }
        return res.status(200).json({ success: true, message: 'Deposit approved' });
      }

      case 'refund_order': {
        if (!order_id) return res.status(400).json({ error: 'Missing order_id' });
        const { error } = await supabase.rpc('refund_g2bulk_order', { p_order_id: order_id });
        if (error) { console.error('Refund error:', error); return res.status(400).json({ error: error.message }); }
        return res.status(200).json({ success: true, message: 'Order refunded' });
      }

      case 'get_balance': {
        if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
        const { data, error } = await supabase.from('users').select('id, username, game_balance').eq('id', user_id).single();
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Balance proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
