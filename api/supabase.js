/**
 * api/supabase.js - Supabase Proxy (Server-Side)
 *
 * Provides authenticated database operations via the service role key.
 * No secrets are ever exposed to the browser.
 *
 * POST /api/supabase
 * Body: { action, table, data, filters, ... }
 *
 * Actions:
 *   - query: SELECT with filters
 *   - insert: INSERT row(s)
 *   - update: UPDATE rows with filters
 *   - upsert: INSERT ... ON CONFLICT
 *   - delete: DELETE with filters
 *   - rpc: Call a database function
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

  try {
    const { action, table, data, filters, columns, limit, offset, order, onConflict, params } = req.body;

    if (!action) return res.status(400).json({ error: 'Missing action parameter' });
    if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Supabase not configured' });

    let query;

    switch (action) {
      case 'query': {
        if (!table) return res.status(400).json({ error: 'Missing table' });
        query = supabase.from(table).select(columns || '*');
        if (filters) {
          for (const f of filters) {
            switch (f.method) {
              case 'eq': query = query.eq(f.column, f.value); break;
              case 'neq': query = query.neq(f.column, f.value); break;
              case 'gt': query = query.gt(f.column, f.value); break;
              case 'gte': query = query.gte(f.column, f.value); break;
              case 'lt': query = query.lt(f.column, f.value); break;
              case 'lte': query = query.lte(f.column, f.value); break;
              case 'like': query = query.like(f.column, f.value); break;
              case 'ilike': query = query.ilike(f.column, f.value); break;
              case 'in': query = query.in(f.column, f.value); break;
              case 'is': query = query.is(f.column, f.value); break;
              case 'contains': query = query.contains(f.column, f.value); break;
              case 'overlaps': query = query.overlaps(f.column, f.value); break;
              case 'textSearch': query = query.textSearch(f.column, f.value); break;
            }
          }
        }
        if (order) query = query.order(order.column, { ascending: order.ascending !== false });
        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 100) - 1);
        break;
      }

      case 'insert': {
        if (!table || !data) return res.status(400).json({ error: 'Missing table or data' });
        query = supabase.from(table).insert(data);
        if (columns) query = query.select(columns);
        break;
      }

      case 'upsert': {
        if (!table || !data) return res.status(400).json({ error: 'Missing table or data' });
        query = supabase.from(table).upsert(data, { onConflict: onConflict || 'id' });
        if (columns) query = query.select(columns);
        break;
      }

      case 'update': {
        if (!table || !data) return res.status(400).json({ error: 'Missing table or data' });
        query = supabase.from(table).update(data);
        if (filters) {
          for (const f of filters) {
            if (f.method === 'eq') query = query.eq(f.column, f.value);
            else if (f.method === 'neq') query = query.neq(f.column, f.value);
            else if (f.method === 'in') query = query.in(f.column, f.value);
            else if (f.method === 'is') query = query.is(f.column, f.value);
          }
        }
        if (columns) query = query.select(columns);
        break;
      }

      case 'delete': {
        if (!table) return res.status(400).json({ error: 'Missing table' });
        query = supabase.from(table).delete();
        if (filters) {
          for (const f of filters) {
            if (f.method === 'eq') query = query.eq(f.column, f.value);
            else if (f.method === 'in') query = query.in(f.column, f.value);
            else if (f.method === 'is') query = query.is(f.column, f.value);
          }
        }
        break;
      }

      case 'rpc': {
        if (!params) return res.status(400).json({ error: 'Missing rpc params' });
        query = supabase.rpc(params.functionName, params.args || {});
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const { data: result, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('Supabase proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
