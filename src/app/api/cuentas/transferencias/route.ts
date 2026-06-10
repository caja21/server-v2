import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const transferencias = await prisma.accountTransfer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      origen: { select: { nombre: true, billetera: true } },
      destino: { select: { nombre: true, billetera: true } },
      creadoPor: { select: { nombre: true, username: true } },
    },
  });

  const total = await prisma.accountTransfer.aggregate({ _sum: { monto: true } });

  return NextResponse.json({ data: transferencias, total: total._sum.monto || 0 });
}
