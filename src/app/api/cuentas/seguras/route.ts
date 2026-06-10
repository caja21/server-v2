import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuentas = await prisma.cuentaBancaria.findMany({
    where: { esSegura: true, estado: "ACTIVA" },
    select: { id: true, nombre: true, alias: true },
  });

  return NextResponse.json(cuentas);
}
