import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const dejar = Number(body?.dejar) || 0;

  const cuenta = await prisma.cuentaBancaria.findUnique({
    where: { id: Number(id) },
    include: { movimientos: { select: { tipo: true, monto: true } } },
  });

  if (!cuenta) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const sumaMovimientos = cuenta.movimientos.reduce((acc, m) => {
    return acc + (m.tipo === "CARGA" ? m.monto : -m.monto);
  }, 0);

  const totalActual = cuenta.saldoBase + sumaMovimientos;
  const descargado = totalActual - dejar;

  const updated = await prisma.cuentaBancaria.update({
    where: { id: Number(id) },
    data: {
      saldoBase: cuenta.saldoBase - descargado,
      totalDescargado: cuenta.totalDescargado + descargado,
    },
    include: { operador: { select: { id: true, nombre: true, username: true } } },
  });

  return NextResponse.json({ ...updated, total: dejar, cantidadMovimientos: cuenta.movimientos.length });
}
