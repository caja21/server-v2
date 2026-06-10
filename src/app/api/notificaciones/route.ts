import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const notificaciones = await prisma.notificacion.findMany({
    where: {
      OR: [{ paraRoles: "todos" }, { paraRoles: { contains: session.rol } }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      leidas: { where: { usuarioId: session.id }, select: { usuarioId: true } },
    },
  });

  const result = notificaciones.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    paraRoles: n.paraRoles,
    createdAt: n.createdAt,
    leida: n.leidas.length > 0,
  }));

  return NextResponse.json(result);
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

  const notificacion = await prisma.notificacion.create({
    data: {
      titulo,
      mensaje,
      paraRoles: paraRoles || "todos",
      creadoPorId: session.id,
    },
  });

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(session.id, "CREAR_NOTIFICACION", `Creó notificación: ${titulo}`, ip);

  return NextResponse.json(notificacion);
}
