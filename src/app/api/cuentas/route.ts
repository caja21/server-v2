import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuentas = await prisma.cuentaBancaria.findMany({
    orderBy: { id: "desc" },
    include: { operador: { select: { id: true, nombre: true, username: true } } },
  });

  return NextResponse.json(cuentas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { oficina, billetera, nombre, alias, cbu } = body;

  if (!oficina || !billetera || !nombre) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const cuenta = await prisma.cuentaBancaria.create({
    data: {
      oficina,
      billetera,
      nombre,
      alias: alias || null,
      cbu: cbu || null,
      estado: "ACTIVA",
    },
    include: { operador: { select: { id: true, nombre: true, username: true } } },
  });

  return NextResponse.json(cuenta);
}
