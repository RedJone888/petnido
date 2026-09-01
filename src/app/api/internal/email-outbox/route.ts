import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import { processEmailOutboxBatch } from "@/server/domains/notification/email-outbox-v2";
import { prisma } from "@/server/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.EMAIL_WORKER_SECRET;
  if (!secret) return NextResponse.json({ error: "WORKER_NOT_CONFIGURED" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const result = await processEmailOutboxBatch(prisma, {
    send: sendEmail,
    baseUrl: process.env.APP_URL || "http://localhost:3000",
  });
  return NextResponse.json(result);
}
