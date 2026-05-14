import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  const authed = Boolean(token?.sub);
  const isAdmin = token?.role === "ADMIN";

  if (path.startsWith("/admin")) {
    if (!authed || !isAdmin) {
      const url = new URL("/auth/signin", req.url);
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/dashboard") || path.startsWith("/study")) {
    if (!authed) {
      const url = new URL("/auth/signin", req.url);
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/study", "/study/:path*", "/admin", "/admin/:path*"],
};
