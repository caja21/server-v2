import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const operadorIdParam = params.get("operadorId");
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const all = params.get("all");
  const page = Math.max(1, Number(params.get("page") || "1"));
  const pageSize = 50;

  let where: Record<string, unknown>;
  if (session.rol === "ADMIN") {
    if (all) {
      where = {};
    } else {
      where = operadorIdParam ? { operadorId: Number(operadorIdParam) } : { estado: "CERRADO" };
    }
    if (operadorIdParam && all) where.operadorId = Number(operadorIdParam);
  } else {
    where = { estado: "CERRADO", operadorId: session.id };
  }

  if (all && (desde || hasta)) {
    const startTime: Record<string, Date> = {};
    if (desde) startTime.gte = new Date(desde);
    if (hasta) startTime.lte = new Date(`${hasta}T23:59:59.999`);
    where.startTime = startTime;
  }

  if (!all) {
    const turnos = await prisma.turno.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: 50,
      include: { operador: { select: { nombre: true, username: true } } },
    });
    return NextResponse.json(turnos);
  }

  const [turnos, total] = await Promise.all([
    prisma.turno.findMany({
      where,
      orderBy: { startTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { operador: { select: { nombre: true, username: true } } },
    }),
    prisma.turno.count({ where }),
  ]);

  return NextResponse.json({ turnos, total, page, pageSize });
}
