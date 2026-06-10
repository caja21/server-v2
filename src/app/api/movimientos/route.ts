import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000);

  const movimientos = await prisma.movimiento.findMany({
    where: { createdAt: { gte: haceUnaHora } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      operador: { select: { nombre: true, username: true, oficina: true } },
      cuenta: { select: { nombre: true, billetera: true, cbu: true } },
    },
  });

  return NextResponse.json(movimientos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { tipo, cliente, titular, monto, bono, cuentaId } = body;

  if (!tipo || !cliente || !monto || !cuentaId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const turnoActivo = await prisma.turno.findFirst({
    where: { operadorId: session.id, estado: "ABIERTO" },
    select: { id: true },
  });

  const movimiento = await prisma.movimiento.create({
    data: {
      tipo,
      cliente,
      titular: titular || null,
      monto: Number(monto),
      bono: bono ? Number(bono) : 0,
      cuentaId: Number(cuentaId),
      operadorId: session.id,
      estado: "ACEPTADO",
      turnoId: turnoActivo?.id || null,
    },
    include: {
      operador: { select: { nombre: true, username: true, oficina: true } },
      cuenta: { select: { nombre: true, billetera: true, cbu: true } },
    },
  });

  return NextResponse.json(movimiento);
}
