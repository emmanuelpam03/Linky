import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/login", "/signup", "/verify"];
const protectedRoutes = [
  "/chats",
  "/groups",
  "/friends",
  "/requests",
  "/settings",
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isLoggedIn = !!session?.user;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/chats", request.url));
  }

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
