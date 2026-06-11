import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { getTotalBalance } from "@/lib/balance";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const user = await prisma.usuario.findUnique({ where: { username } });
  if (!user || !user.activo) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  await setSessionCookie({
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    oficina: user.oficina,
  });

  const turnoExistente = await prisma.turno.findFirst({
    where: { operadorId: user.id, estado: "ABIERTO" },
  });
  if (!turnoExistente) {
    const saldoInicial = await getTotalBalance();
    await prisma.turno.create({ data: { operadorId: user.id, saldoInicial } });
  }

  return NextResponse.json({ ok: true });
}
