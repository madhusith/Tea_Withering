import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets, images, API routes, and favicon to bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Refresh session cookies
  const sessionResponse = await updateSession(request);

  // Check auth user status
  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-anon-key",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // 3. Protected route rules
  const isAuthPage = pathname === "/login" || pathname === "/";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/factory") ||
    pathname.startsWith("/dryers") ||
    pathname.startsWith("/troughs") ||
    pathname.startsWith("/alerts") ||
    pathname.startsWith("/parameters") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/reports");

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
