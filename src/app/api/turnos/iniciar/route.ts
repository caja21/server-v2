import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTotalBalance } from "@/lib/balance";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existente = await prisma.turno.findFirst({
    where: { operadorId: session.id, estado: "ABIERTO" },
  });
  if (existente) {
    return NextResponse.json({ error: "Ya tenés un turno abierto" }, { status: 400 });
  }

  const saldoInicial = await getTotalBalance();

  const turno = await prisma.turno.create({
    data: { operadorId: session.id, saldoInicial },
  });

  const ip = req.headers.get("x-forwarded-for");
  await logAudit(session.id, "INICIAR_TURNO", `Inició turno. Saldo inicial: ${saldoInicial}`, ip);

  return NextResponse.json(turno);
}
