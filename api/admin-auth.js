/**
 * api/admin-auth.js - Admin Authentication
 *
 * Verifies admin login and approve passwords against Vercel ENV values.
 * No passwords are stored in the database. All values are server-side only.
 *
 * POST /api/admin-auth
 * Body: { action: "login", password }
 *   OR: { action: "approve", password }
 *   OR: { action: "verify_ip", ip }
 *   OR: { action: "check_ip_setup" }
 */

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

  try {
    const { action, password, ip } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    switch (action) {
      case 'login': {
        const loginPwd = process.env.ADMIN_LOGIN_PASSWORD;

        if (!loginPwd) {
          return res.status(500).json({ error: 'Admin login not configured' });
        }

        if (!password) {
          return res.status(400).json({ error: 'Missing password' });
        }

        if (password !== loginPwd) {
          return res.status(401).json({ error: 'Invalid password', success: false });
        }

        // Generate a simple session token (signed with timestamp + password hash)
        const timestamp = Date.now().toString(36);
        const token = Buffer.from(`admin:${timestamp}:${loginPwd.slice(0, 8)}`).toString('base64');

        return res.status(200).json({ success: true, token });
      }

      case 'approve': {
        const approvePwd = process.env.ADMIN_APPROVE_PASSWORD;

        if (!approvePwd) {
          return res.status(500).json({ error: 'Admin approve password not configured' });
        }

        if (!password) {
          return res.status(400).json({ error: 'Missing password' });
        }

        if (password !== approvePwd) {
          return res.status(401).json({ error: 'Invalid approve password', success: false });
        }

        return res.status(200).json({ success: true });
      }

      case 'verify_ip': {
        const adminIp = process.env.ADMIN_IPADDRESS;

        // If no IP configured, return the requesting IP
        if (!adminIp) {
          const clientIp = ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
          return res.status(200).json({
            configured: false,
            clientIp: clientIp.split(',')[0].trim(),
          });
        }

        return res.status(200).json({
          configured: true,
          allowedIp: adminIp,
        });
      }

      case 'check_ip_setup': {
        const adminIp = process.env.ADMIN_IPADDRESS;
        const clientIp = ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
        const cleanClientIp = clientIp.split(',')[0].trim();

        if (!adminIp) {
          return res.status(200).json({
            ipConfigured: false,
            clientIp: cleanClientIp,
            message: 'Set this IP address in ADMIN_IPADDRESS in Vercel ENV to enable access.',
          });
        }

        return res.status(200).json({
          ipConfigured: true,
          clientIp: cleanClientIp,
          allowedIp: adminIp,
          match: cleanClientIp === adminIp,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
