import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuentas = await prisma.cuentaBancaria.findMany({
    orderBy: { id: "desc" },
    include: {
      operador: { select: { id: true, nombre: true, username: true } },
      movimientos: { select: { tipo: true, monto: true } },
    },
  });

  const result = cuentas.map((c) => {
    const sumaMovimientos = c.movimientos.reduce((acc, m) => {
      return acc + (m.tipo === "CARGA" ? m.monto : -m.monto);
    }, 0);
    return {
      id: c.id,
      oficina: c.oficina,
      billetera: c.billetera,
      nombre: c.nombre,
      alias: c.alias,
      cbu: c.cbu,
      estado: c.estado,
      saldoBase: c.saldoBase,
      totalDescargado: c.totalDescargado,
      operadorId: c.operadorId,
      operador: c.operador,
      total: c.saldoBase + sumaMovimientos,
      cantidadMovimientos: c.movimientos.length,
    };
  });

  return NextResponse.json(result);
}
