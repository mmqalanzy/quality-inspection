import { NextResponse } from "next/server";
import { sessionCookieName } from "@/server/auth/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0
  });
  return response;
}
