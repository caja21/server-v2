import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const promociones = await prisma.promocion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creadoPor: { select: { nombre: true, username: true } },
      completadas: {
        select: { usuarioId: true, completadaAt: true, usuario: { select: { nombre: true, username: true } } },
      },
    },
  });

  return NextResponse.json(promociones);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { titulo, mensaje, paraRoles } = body;
  if (!titulo || !mensaje) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const promocion = await prisma.promocion.create({
    data: {
      titulo,
      mensaje,
      paraRoles: paraRoles || "OPERADOR",
      creadoPorId: session.id,
    },
  });

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(session.id, "CREAR_PROMOCION", `Creó recordatorio: ${titulo}`, ip);

  return NextResponse.json(promocion);
}
