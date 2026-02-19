export const dynamic = "force-dynamic";
export const runtime = "nodejs";
//NextAuth server路由
import { handlers } from "@/server/auth/auth";
import { NextRequest } from "next/server";
export async function GET(req: NextRequest) {
  return handlers.GET(req);
}
export async function POST(req: NextRequest) {
  return handlers.POST(req);
}
// export const { GET, POST } = handlers;
