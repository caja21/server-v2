import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    const ip = req.headers.get("x-forwarded-for");
    await logAudit(session.id, "LOGOUT", undefined, ip);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
