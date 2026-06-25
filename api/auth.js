/**
 * api/auth.js - Authentication with bcrypt Password Hashing
 *
 * POST /api/auth
 * Body: { action: "signup", username, gmail, password, pin }
 *   OR:  { action: "login", username, password }
 *
 * Passwords are hashed with bcrypt before storage and verified
 * with bcrypt.compare on login. Never stored in plaintext.
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SALT_ROUNDS = 12;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { action, username, gmail, password, pin } = req.body;
    if (!action) return res.status(400).json({ error: 'Missing action' });

    switch (action) {
      case 'signup': {
        if (!username || !gmail || !password || !pin) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check duplicate username
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        if (existingUser) return res.status(409).json({ error: 'Username already exists' });

        // Check duplicate email
        const { data: existingEmail } = await supabase
          .from('users')
          .select('id')
          .eq('gmail', gmail)
          .maybeSingle();
        if (existingEmail) return res.status(409).json({ error: 'Gmail already registered' });

        // Hash password and PIN with bcrypt
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

        // Insert user with hashed credentials
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            username,
            gmail,
            password_hash: passwordHash,
            pin_hash: pinHash,
            game_balance: 0,
          })
          .select('id, username, gmail, game_balance, profile_icon_url, role')
          .single();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(201).json({
          success: true,
          message: `Welcome! Successfully signed up, ${newUser.username}!`,
          user: newUser,
        });
      }

      case 'login': {
        if (!username || !password) {
          return res.status(400).json({ error: 'Missing username or password' });
        }

        // Fetch user
        const { data: user, error } = await supabase
          .from('users')
          .select('id, username, gmail, game_balance, profile_icon_url, role, is_banned, password_hash')
          .eq('username', username)
          .single();

        if (error || !user) {
          return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        if (user.is_banned) {
          return res.status(403).json({ success: false, error: 'Your account has been banned.' });
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        // Remove hash from response
        const { password_hash, ...safeUser } = user;

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${user.username}!`,
          user: safeUser,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
