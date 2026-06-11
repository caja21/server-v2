import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

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

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(user.id, "LOGIN", undefined, ip);

  return NextResponse.json({ ok: true });
}
