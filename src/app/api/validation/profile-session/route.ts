import { NextResponse } from "next/server";

import {
  validationProfileCookie,
  validationProfileEnabled,
} from "@/server/validation/profile-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (
    !validationProfileEnabled() ||
    !token ||
    token !== process.env.VALIDATION_TEST_TOKEN
  ) {
    return new NextResponse(null, { status: 404 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(validationProfileCookie, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30,
  });
  return response;
}
