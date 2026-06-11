import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const promociones = await prisma.promocion.findMany({
    where: {
      activa: true,
      OR: [{ paraRoles: "todos" }, { paraRoles: { contains: session.rol } }],
      completadas: { none: { usuarioId: session.id } },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, titulo: true, mensaje: true, createdAt: true },
  });

  return NextResponse.json(promociones);
}
