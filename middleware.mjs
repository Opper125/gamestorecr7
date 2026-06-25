/**
 * middleware.mjs - Domain-Based Routing & Admin IP Guard
 *
 * Reads USER_DOMAIN, ADMIN_DOMAIN, RESELLER_DOMAIN, ADMIN_IPADDRESS
 * from Vercel Environment Variables.
 *
 * - USER_DOMAIN    -> serves index.html only
 * - ADMIN_DOMAIN   -> serves admin.html only + IP guard
 * - RESELLER_DOMAIN -> serves reseller.html only
 *
 * Any domain mismatch returns 404 immediately.
 * Admin IP guard blocks non-matching IPs at the edge.
 */

export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

  const userDomain = process.env.USER_DOMAIN?.toLowerCase() || '';
  const adminDomain = process.env.ADMIN_DOMAIN?.toLowerCase() || '';
  const resellerDomain = process.env.RESELLER_DOMAIN?.toLowerCase() || '';
  const adminIp = process.env.ADMIN_IPADDRESS || '';
  const adminLoginPwd = process.env.ADMIN_LOGIN_PASSWORD || '';

  const path = url.pathname.toLowerCase();
  const hostLower = host.split(':')[0].toLowerCase();

  // ──────────────────────────────────────────────
  // USER DOMAIN
  // ──────────────────────────────────────────────
  if (hostLower === userDomain) {
    if (path.startsWith('/admin') || path.startsWith('/reseller')) {
      return new Response(null, {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      });
    }
    return serveFile('index.html', request);
  }

  // ──────────────────────────────────────────────
  // RESELLER DOMAIN
  // ──────────────────────────────────────────────
  if (hostLower === resellerDomain) {
    if (path.startsWith('/admin') || path.startsWith('/index')) {
      return new Response(null, {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      });
    }
    return serveFile('reseller.html', request);
  }

  // ──────────────────────────────────────────────
  // ADMIN DOMAIN
  // ──────────────────────────────────────────────
  if (hostLower === adminDomain) {
    if (path.startsWith('/index') || path.startsWith('/reseller')) {
      return new Response(null, {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Admin IP Guard
    if (adminIp) {
      const requestIp = clientIp.split(',')[0].trim();
      if (requestIp !== adminIp) {
        return new Response(null, {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
          },
        });
      }
    }

    return serveFile('admin.html', request);
  }

  // ──────────────────────────────────────────────
  // NO MATCH -> 404
  // ──────────────────────────────────────────────
  return new Response(null, {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Serve an HTML file from the root of the project.
 */
async function serveFile(filename, request) {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const filePath = path.join(process.cwd(), filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export const config = {
  matcher: [
    '/((?!api/|css/|js/|assets/|favicon.ico|robots.txt).*)',
  ],
};