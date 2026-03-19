import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';
import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if admin route (with or without locale prefix)
  const isAdminRoute = pathname.match(/^(\/[a-z]{2})?\/admin/);

  if (isAdminRoute) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
