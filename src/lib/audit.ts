import { prisma } from "@/lib/prisma";

export async function logAudit(usuarioId: number | null, accion: string, detalles?: string, ip?: string | null) {
  await prisma.auditLog.create({
    data: { usuarioId, accion, detalles: detalles || null, ip: ip || null },
  });
}
