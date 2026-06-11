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
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      titulo: true,
      mensaje: true,
      createdAt: true,
      intervaloMinutos: true,
      completadas: { where: { usuarioId: session.id }, select: { completadaAt: true } },
    },
  });

  const ahora = Date.now();
  const pendientes = [];
  const vencidas: number[] = [];

  for (const p of promociones) {
    const completada = p.completadas[0];
    if (!completada) {
      pendientes.push(p);
      continue;
    }
    if (p.intervaloMinutos) {
      const vencimiento = new Date(completada.completadaAt).getTime() + p.intervaloMinutos * 60000;
      if (ahora >= vencimiento) {
        vencidas.push(p.id);
        pendientes.push(p);
      }
    }
  }

  if (vencidas.length > 0) {
    await prisma.promocionCompletada.deleteMany({
      where: { usuarioId: session.id, promocionId: { in: vencidas } },
    });
  }

  return NextResponse.json(
    pendientes.map((p) => ({ id: p.id, titulo: p.titulo, mensaje: p.mensaje, createdAt: p.createdAt }))
  );
}
