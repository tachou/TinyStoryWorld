import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Public routes
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/seed');

  if (isPublicRoute) return NextResponse.next();

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based route protection
  const teacherRoutes = ['/dashboard'];
  const studentRoutes = [
    '/portal',
    '/silly-sentences',
    '/battle-stories',
    '/stories',
    '/reader',
  ];
  const parentRoutes = ['/family'];

  if (
    teacherRoutes.some((r) => pathname.startsWith(r)) &&
    role !== 'teacher' &&
    role !== 'admin'
  ) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  if (
    parentRoutes.some((r) => pathname.startsWith(r)) &&
    role !== 'parent' &&
    role !== 'admin'
  ) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
