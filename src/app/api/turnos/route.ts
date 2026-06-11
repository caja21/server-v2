import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const operadorIdParam = req.nextUrl.searchParams.get("operadorId");

  let where: Record<string, unknown>;
  if (session.rol === "ADMIN") {
    where = operadorIdParam ? { operadorId: Number(operadorIdParam) } : { estado: "CERRADO" };
  } else {
    where = { estado: "CERRADO", operadorId: session.id };
  }

  const turnos = await prisma.turno.findMany({
    where,
    orderBy: { startTime: "desc" },
    take: 50,
    include: { operador: { select: { nombre: true, username: true } } },
  });

  return NextResponse.json(turnos);
}
