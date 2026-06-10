import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.notificacionLeida.deleteMany({ where: { notificacionId: Number(id) } });
  await prisma.notificacion.delete({ where: { id: Number(id) } });

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(session.id, "ELIMINAR_NOTIFICACION", `Eliminó notificación ID ${id}`, ip);

  return NextResponse.json({ ok: true });
}
