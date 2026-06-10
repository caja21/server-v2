import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const where = session.rol === "ADMIN" ? { estado: "CERRADO" } : { estado: "CERRADO", operadorId: session.id };

  const turnos = await prisma.turno.findMany({
    where,
    orderBy: { startTime: "desc" },
    take: 50,
    include: { operador: { select: { nombre: true, username: true } } },
  });

  return NextResponse.json(turnos);
}
