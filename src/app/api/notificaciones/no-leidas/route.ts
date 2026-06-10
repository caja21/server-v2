import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const notificaciones = await prisma.notificacion.findMany({
    where: {
      OR: [{ paraRoles: "todos" }, { paraRoles: { contains: session.rol } }],
    },
    select: {
      id: true,
      leidas: { where: { usuarioId: session.id }, select: { usuarioId: true } },
    },
  });

  const count = notificaciones.filter((n) => n.leidas.length === 0).length;

  return NextResponse.json({ count });
}
