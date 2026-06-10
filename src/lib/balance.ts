import { prisma } from "@/lib/prisma";

export async function getTotalBalance(): Promise<number> {
  const cuentas = await prisma.cuentaBancaria.findMany({
    where: { estado: "ACTIVA" },
    include: { movimientos: { select: { tipo: true, monto: true } } },
  });

  return cuentas.reduce((acc, c) => {
    const suma = c.movimientos.reduce(
      (s, m) => s + (m.tipo === "CARGA" ? m.monto : -m.monto),
      0
    );
    return acc + c.saldoBase + suma;
  }, 0);
}
