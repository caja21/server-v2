import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const operadores = await prisma.usuario.findMany({
    where: { rol: "OPERADOR" },
    select: {
      id: true,
      nombre: true,
      username: true,
      oficina: true,
      movimientos: {
        where: { tipo: "CARGA" },
        select: { monto: true, bono: true },
      },
    },
  });

  const result = operadores.map((op) => {
    const cantidad = op.movimientos.length;
    const totalMonto = op.movimientos.reduce((acc, m) => acc + m.monto, 0);
    const totalBono = op.movimientos.reduce((acc, m) => acc + m.bono, 0);
    return {
      id: op.id,
      nombre: op.nombre,
      username: op.username,
      oficina: op.oficina,
      cantidadCargas: cantidad,
      totalCargado: totalMonto,
      totalBono,
    };
  });

  return NextResponse.json(result);
}
