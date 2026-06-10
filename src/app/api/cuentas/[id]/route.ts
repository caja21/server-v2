import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { oficina, billetera, nombre, alias, cbu, estado, operadorId, saldoBase, esSegura } = body;

  const cuenta = await prisma.cuentaBancaria.update({
    where: { id: Number(id) },
    data: {
      ...(oficina !== undefined && { oficina }),
      ...(billetera !== undefined && { billetera }),
      ...(nombre !== undefined && { nombre }),
      ...(alias !== undefined && { alias: alias || null }),
      ...(cbu !== undefined && { cbu: cbu || null }),
      ...(estado !== undefined && { estado }),
      ...(operadorId !== undefined && { operadorId: operadorId === null ? null : Number(operadorId) }),
      ...(saldoBase !== undefined && { saldoBase: Number(saldoBase) }),
      ...(esSegura !== undefined && { esSegura: Boolean(esSegura) }),
    },
    include: { operador: { select: { id: true, nombre: true, username: true } } },
  });

  return NextResponse.json(cuenta);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.cuentaBancaria.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
