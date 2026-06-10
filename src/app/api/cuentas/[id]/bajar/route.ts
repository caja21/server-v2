import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const monto = Number(body?.monto);
  const motivo = body?.motivo as string | undefined;
  const destinoId = body?.destinoId ? Number(body.destinoId) : null;

  if (!monto || monto <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const origen = await prisma.cuentaBancaria.findUnique({
    where: { id: Number(id) },
    include: { movimientos: { select: { tipo: true, monto: true } } },
  });
  if (!origen || origen.estado !== "ACTIVA") {
    return NextResponse.json({ error: "Cuenta origen no encontrada o inactiva" }, { status: 404 });
  }

  const sumaOrigen = origen.movimientos.reduce(
    (acc, m) => acc + (m.tipo === "CARGA" ? m.monto : -m.monto),
    0
  );
  const saldoOrigen = origen.saldoBase + sumaOrigen;
  if (saldoOrigen < monto) {
    return NextResponse.json({ error: `Saldo insuficiente. Solo tiene ${saldoOrigen}` }, { status: 400 });
  }

  let destino;
  if (destinoId) {
    destino = await prisma.cuentaBancaria.findUnique({ where: { id: destinoId } });
    if (!destino || !destino.esSegura || destino.estado !== "ACTIVA") {
      return NextResponse.json({ error: "La cuenta destino no es válida o no es segura" }, { status: 400 });
    }
  } else {
    destino = await prisma.cuentaBancaria.findFirst({
      where: { esSegura: true, estado: "ACTIVA" },
    });
    if (!destino) {
      return NextResponse.json({ error: "No se encontró una cuenta segura activa" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.cuentaBancaria.update({
      where: { id: origen.id },
      data: { saldoBase: { decrement: monto } },
    }),
    prisma.cuentaBancaria.update({
      where: { id: destino.id },
      data: { saldoBase: { increment: monto } },
    }),
    prisma.accountTransfer.create({
      data: {
        monto,
        motivo: motivo || "Bajada manual",
        origenId: origen.id,
        destinoId: destino.id,
        creadoPorId: session.id,
      },
    }),
  ]);

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(
    session.id,
    "TRANSFERENCIA_CUENTA",
    `Transfirió ${monto} de "${origen.nombre}" a "${destino.nombre}"`,
    ip
  );

  return NextResponse.json({ ok: true });
}
