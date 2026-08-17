import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication (Dashboard, Productions, etc.)
  const isProtectedRoute = pathname === '/' || pathname.startsWith('/productions');
  // Public Auth / Onboarding routes (Login & Signup)
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  // If trying to access a protected route without refresh token, redirect to login
  if (isProtectedRoute && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access login page, redirect to home
  if (isAuthRoute && refreshToken) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
