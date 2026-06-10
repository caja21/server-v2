import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  const { nombre, rol, oficina, activo, password } = body;

  const usuario = await prisma.usuario.update({
    where: { id: Number(id) },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(rol !== undefined && { rol: rol === "ADMIN" ? "ADMIN" : "OPERADOR" }),
      ...(oficina !== undefined && { oficina: oficina || null }),
      ...(activo !== undefined && { activo }),
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
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
