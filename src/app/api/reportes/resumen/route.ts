import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // lunes como inicio de semana
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

async function totales(desde: Date) {
  const movimientos = await prisma.movimiento.findMany({
    where: { createdAt: { gte: desde } },
    select: { tipo: true, monto: true, bono: true },
  });

  const cargas = movimientos.filter((m) => m.tipo === "CARGA");
  const retiros = movimientos.filter((m) => m.tipo === "RETIRO");

  return {
    cargas: {
      cantidad: cargas.length,
      total: cargas.reduce((acc, m) => acc + m.monto, 0),
      totalBono: cargas.reduce((acc, m) => acc + m.bono, 0),
    },
    retiros: {
      cantidad: retiros.length,
      total: retiros.reduce((acc, m) => acc + m.monto, 0),
    },
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();

  const [hoy, semana, mes] = await Promise.all([
    totales(startOfDay(now)),
    totales(startOfWeek(now)),
    totales(startOfMonth(now)),
  ]);

  return NextResponse.json({ hoy, semana, mes });
}
