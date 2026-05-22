import { NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from './lib/session';

export const config = {
  // Protège toutes les routes sauf assets Next, favicon, page login et endpoint login.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/login).*)'],
};

export async function middleware(req) {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.APP_SESSION_SECRET;

  // Si l'auth n'est pas configurée, on laisse passer (utile en dev local).
  if (!password || !secret) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(cookie, secret);
  if (payload && payload.ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
