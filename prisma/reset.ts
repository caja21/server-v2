import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.notificacionLeida.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.accountTransfer.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.turno.deleteMany();
  await prisma.cuentaBancaria.updateMany({ data: { saldoBase: 0, totalDescargado: 0 } });

  console.log("Reset completo. Movimientos, turnos, transferencias, auditoria y notificaciones eliminados. Saldos de cuentas reiniciados a 0.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
