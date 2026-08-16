import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';
import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMINISTRATOR_COOKIE_NAME, verifyAdministratorSession } from '@/lib/administrator-auth';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if tenant app route (with or without locale prefix)
  const isAppRoute = pathname.match(/^(\/[a-z]{2})?\/app(\/|$)/);

  if (isAppRoute) {
    const isSecure = req.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';
    const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, salt: cookieName, cookieName });
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check if SaaS administrator route (with or without locale prefix), excluding the login page itself
  const isAdministratorRoute = pathname.match(/^(\/[a-z]{2})?\/administrator(\/|$)/);
  const isAdministratorLoginRoute = pathname.match(/^(\/[a-z]{2})?\/administrator\/login\/?$/);

  if (isAdministratorRoute && !isAdministratorLoginRoute) {
    const sessionToken = req.cookies.get(ADMINISTRATOR_COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyAdministratorSession(sessionToken) : null;
    if (!session) {
      const loginUrl = new URL('/administrator/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
