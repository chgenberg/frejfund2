import { NextResponse, NextRequest } from 'next/server';

export const config = {
  matcher: ['/vc/:path*']
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const isLogin = url.pathname.startsWith('/vc/login');
  const token = req.cookies.get('vc-session')?.value;

  // If requesting protected VC routes without a cookie → redirect to login
  if (!isLogin && url.pathname.startsWith('/vc') && !token) {
    url.pathname = '/vc/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}


