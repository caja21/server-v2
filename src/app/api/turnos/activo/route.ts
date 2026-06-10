import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTotalBalance } from "@/lib/balance";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const turno = await prisma.turno.findFirst({
    where: { operadorId: session.id, estado: "ABIERTO" },
  });

  if (!turno) return NextResponse.json(null);

  const teorico = turno.saldoInicial + turno.totalCargas - turno.totalRetiros;
  const real = await getTotalBalance();
  const diferencia = real - teorico;

  return NextResponse.json({
    ...turno,
    saldoTeorico: teorico,
    saldoReal: real,
    diferencia,
  });
}
