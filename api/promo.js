/**
 * api/promo.js - Promo Code Validation Proxy
 *
 * Validates promo codes against the database.
 * All operations use the service role key server-side.
 *
 * POST /api/promo
 * Body: { action, code, user_id, product_id, product_type, price, code_details, admin_password }
 */

import { createClient } from '@supabase/supabase-js';

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
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { action, code, user_id, price, code_details, admin_password, promo_id } = req.body;
    if (!action) return res.status(400).json({ error: 'Missing action parameter' });

    switch (action) {
      case 'validate': {
        if (!code) return res.status(400).json({ error: 'Missing code' });
        const { data: promo, error } = await supabase.from('promo_codes').select('*').eq('code', code).single();
        if (error || !promo) return res.status(404).json({ valid: false, error: 'Promo code not found' });
        if (new Date(promo.expires_at) < new Date()) return res.status(200).json({ valid: false, error: 'Promo code has expired' });
        if (promo.max_uses !== null && promo.used_count >= promo.max_uses) return res.status(200).json({ valid: false, error: 'Promo code usage limit reached' });
        if (user_id) {
          const { data: existingUse } = await supabase.from('promo_code_uses').select('id').eq('promo_code_id', promo.id).eq('user_id', user_id).maybeSingle();
          if (existingUse) return res.status(200).json({ valid: false, error: 'You have already used this promo code' });
        }
        return res.status(200).json({ valid: true, promo: { id: promo.id, code: promo.code, type: promo.type, cash_amount: promo.cash_amount, discount_pct: promo.discount_pct, applicable_scope: promo.applicable_scope } });
      }

      case 'apply': {
        if (!code || !user_id || price === undefined) return res.status(400).json({ error: 'Missing required fields' });
        const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', code).single();
        if (!promo) return res.status(404).json({ error: 'Promo code not found' });
        if (new Date(promo.expires_at) < new Date()) return res.status(400).json({ error: 'Promo code has expired' });
        if (promo.max_uses !== null && promo.used_count >= promo.max_uses) return res.status(400).json({ error: 'Promo code usage limit reached' });
        const { data: existingUse } = await supabase.from('promo_code_uses').select('id').eq('promo_code_id', promo.id).eq('user_id', user_id).maybeSingle();
        if (existingUse) return res.status(400).json({ error: 'You have already used this promo code' });

        let discountAmount = 0;
        let finalPrice = parseFloat(price);
        if (promo.type === 'cash') { discountAmount = parseFloat(promo.cash_amount); finalPrice = Math.max(0, finalPrice - discountAmount); }
        else if (promo.type === 'discount') { discountAmount = finalPrice * (parseFloat(promo.discount_pct) / 100); finalPrice = Math.max(0, finalPrice - discountAmount); }

        return res.status(200).json({ valid: true, promo_code: promo.code, promo_type: promo.type, original_price: parseFloat(price), discount_amount: discountAmount, final_price: finalPrice });
      }

      case 'list': {
        const { data: promos, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ data: promos });
      }

      case 'create': {
        if (!admin_password || admin_password !== process.env.ADMIN_APPROVE_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        if (!code_details) return res.status(400).json({ error: 'Missing code details' });
        const { data, error } = await supabase.from('promo_codes').insert(code_details).select().single();
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ data });
      }

      case 'delete': {
        if (!admin_password || admin_password !== process.env.ADMIN_APPROVE_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
        if (!promo_id) return res.status(400).json({ error: 'Missing promo_id' });
        const { error } = await supabase.from('promo_codes').delete().eq('id', promo_id);
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Promo proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
