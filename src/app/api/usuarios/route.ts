import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const usuarios = await prisma.usuario.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      username: true,
      nombre: true,
      rol: true,
      oficina: true,
      activo: true,
      createdAt: true,
    },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, nombre, rol, oficina } = body;

  if (!username || !password || !nombre) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      username,
      password: hashed,
      nombre,
      rol: rol === "ADMIN" ? "ADMIN" : "OPERADOR",
      oficina: oficina || null,
    },
    select: {
      id: true,
      username: true,
      nombre: true,
      rol: true,
      oficina: true,
      activo: true,
      createdAt: true,
    },
  });

  return NextResponse.json(usuario);
}
