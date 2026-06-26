/**
 * middleware.mjs - Vercel Edge Middleware for Domain-Based Routing
 *
 * Routes traffic based on domain configuration from Vercel ENV.
 * - USER_DOMAIN    → serves index.html (blocks /admin, /reseller)
 * - ADMIN_DOMAIN   → serves admin.html (blocks /index, /reseller)
 * - RESELLER_DOMAIN → serves reseller.html (blocks /admin, /index)
 *
 * When no domains are configured, all requests pass through normally.
 * This middleware runs on Vercel's Edge Runtime (Web APIs only —
 * no fs, no path, no Node.js built-ins).
 */

const HTML_404 = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>404 — Not Found</title><style>body{background:#FAF9F7;color:#1A1A1A;font-family:Inter,DM Sans,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;margin:0}.c{text-align:center;max-width:480px}.code{font-size:7rem;font-weight:200;color:#9E9E9E;line-height:1;margin-bottom:.5rem;letter-spacing:-.04em}h1{font-size:1.25rem;font-weight:500;color:#6B6B6B;margin-bottom:.75rem}p{font-size:.9rem;color:#9E9E9E;margin-bottom:0;line-height:1.6}a{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.5rem;background:#1A1A1A;color:#FAF9F7;text-decoration:none;border-radius:6px;font-size:.85rem;font-weight:500}</style></head><body><div class="c"><div class="code">404</div><h1>This page is not available</h1><p>The page you are looking for does not exist or you do not have permission to access it.</p><a href="/">← Back to Home</a></div></body></html>';

export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const hostLower = host.split(':')[0].toLowerCase();
  const path = url.pathname.toLowerCase();

  const userDomain = (process.env.USER_DOMAIN || '').toLowerCase();
  const adminDomain = (process.env.ADMIN_DOMAIN || '').toLowerCase();
  const resellerDomain = (process.env.RESELLER_DOMAIN || '').toLowerCase();

  const anyConfigured = userDomain || adminDomain || resellerDomain;

  // If no domains configured, let everything pass through
  if (!anyConfigured) {
    return; // Vercel serves static files normally
  }

  // ── Resolve which dashboard this host maps to ──
  let dashboard = null; // null = unknown domain
  if (hostLower === userDomain) dashboard = 'user';
  else if (hostLower === adminDomain) dashboard = 'admin';
  else if (hostLower === resellerDomain) dashboard = 'reseller';

  // Unknown host → 404
  if (!dashboard) {
    return new Response(HTML_404, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // ── Path access rules per dashboard ──
  switch (dashboard) {
    case 'user': {
      // Block admin/reseller paths on user domain
      if (path.startsWith('/admin') || path.startsWith('/reseller')) {
        return new Response(HTML_404, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      // Allow everything else → Vercel serves index.html
      return;
    }

    case 'admin': {
      // Block user/reseller paths on admin domain
      if (path === '/index.html' || path === '/' || path.startsWith('/reseller')) {
        return new Response(HTML_404, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      // Allow /admin, /admin.html, css/js/api assets
      return;
    }

    case 'reseller': {
      // Block admin/user paths on reseller domain
      if (path.startsWith('/admin') || path === '/index.html') {
        return new Response(HTML_404, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      // Allow /reseller, /reseller.html, css/js/api assets
      return;
    }
  }
}

export const config = {
  matcher: [
    '/((?!api/|css/|js/|assets/|favicon.ico|robots.txt).*)',
  ],
};
