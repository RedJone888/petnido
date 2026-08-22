//NextAuth server路由
import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/modules/auth";
import { hasValidProfileValidationToken, validationProfileUserId } from "@/server/validation/profile-session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/session") && hasValidProfileValidationToken(request)) {
    return NextResponse.json({
      user: { id: validationProfileUserId, email: "profile-e2e@petnido.invalid", name: "Profile E2E" },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }
  return handlers.GET(request);
}

export const POST = handlers.POST;
// export const runtime = "nodejs";
