import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const operadorId = params.get("operadorId");
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const page = Math.max(1, Number(params.get("page") || "1"));
  const pageSize = 50;

  const where: Record<string, unknown> = { accion: "LOGIN" };
  if (operadorId) where.usuarioId = Number(operadorId);
  if (desde || hasta) {
    const createdAt: Record<string, Date> = {};
    if (desde) createdAt.gte = new Date(desde);
    if (hasta) createdAt.lte = new Date(`${hasta}T23:59:59.999`);
    where.createdAt = createdAt;
  }

  const [sesiones, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { usuario: { select: { nombre: true, username: true, rol: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ sesiones, total, page, pageSize });
}
