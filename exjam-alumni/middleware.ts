import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Simple middleware that just passes through for now
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .css, .js, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]*$).*)",
  ],
};
