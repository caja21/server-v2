import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTotalBalance } from "@/lib/balance";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const turno = await prisma.turno.findFirst({
    where: { operadorId: session.id, estado: "ABIERTO" },
  });
  if (!turno) return NextResponse.json({ error: "No hay turno abierto" }, { status: 404 });

  const movimientos = await prisma.movimiento.findMany({
    where: { turnoId: turno.id },
    select: { tipo: true, monto: true },
  });

  const totalCargas = movimientos
    .filter((m) => m.tipo === "CARGA")
    .reduce((acc, m) => acc + m.monto, 0);
  const totalRetiros = movimientos
    .filter((m) => m.tipo === "RETIRO")
    .reduce((acc, m) => acc + m.monto, 0);

  const teorico = turno.saldoInicial + totalCargas - totalRetiros;
  const real = await getTotalBalance();
  const diferencia = real - teorico;

  const body = await req.json().catch(() => ({}));
  const saldoFinal = Number(body?.saldoFinal) || 0;

  const actualizado = await prisma.turno.update({
    where: { id: turno.id },
    data: {
      estado: "CERRADO",
      endTime: new Date(),
      saldoFinal,
      totalCargas,
      totalRetiros,
      saldoTeoricoCierre: teorico,
      saldoRealCierre: real,
      diferencia,
    },
  });

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(
    session.id,
    "CERRAR_TURNO",
    `Cerró turno. Teórico: ${teorico}, Real: ${real}, Diferencia: ${diferencia}`,
    ip
  );

  return NextResponse.json(actualizado);
}
