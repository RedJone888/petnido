export const dynamic = "force-dynamic";
export const runtime = "nodejs";
//NextAuth server路由
import { handlers } from "@/server/auth/auth";
export const { GET, POST } = handlers;
