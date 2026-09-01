import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { auth } from "@/modules/auth/server/auth";
import { AuthPolicyError } from "@/modules/auth/server/errors";
import {
  createOAuthConnectIntent,
  oauthConnectCookie,
  oauthConnectCookiePath,
  type ConnectableOAuthProvider,
} from "@/modules/auth/server/oauth-connect";

export const dynamic = "force-dynamic";

function isConnectableProvider(value: string): value is ConnectableOAuthProvider {
  return value === "google" || value === "line";
}

export async function POST(
  _request: Request,
  { params }: { params: { provider: string } },
) {
  if (!isConnectableProvider(params.provider)) {
    return NextResponse.json({ error: "PROVIDER_NOT_SUPPORTED" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const token = await createOAuthConnectIntent(
      prisma,
      session.user.id,
      params.provider,
    );
    const response = NextResponse.json({ started: true });
    response.cookies.set(oauthConnectCookie(params.provider), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: oauthConnectCookiePath(params.provider),
      maxAge: 5 * 60,
    });
    return response;
  } catch (error) {
    const code = error instanceof AuthPolicyError ? error.code : "AUTH_OPERATION_FAILED";
    return NextResponse.json(
      { error: code },
      { status: code === "PROVIDER_ALREADY_LINKED" ? 409 : 400 },
    );
  }
}
