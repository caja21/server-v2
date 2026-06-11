import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.promocionCompletada.upsert({
    where: { promocionId_usuarioId: { promocionId: Number(id), usuarioId: session.id } },
    update: {},
    create: { promocionId: Number(id), usuarioId: session.id },
  });

  return NextResponse.json({ ok: true });
}
