import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const opPass = await bcrypt.hash("operador123", 10);

  const admin = await prisma.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPass,
      nombre: "Administrador",
      rol: "ADMIN",
      oficina: "Casa Central",
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { username: "operador1" },
    update: {},
    create: {
      username: "operador1",
      password: opPass,
      nombre: "Operador Uno",
      rol: "OPERADOR",
      oficina: "Club21",
    },
  });

  const cuenta1 = await prisma.cuentaBancaria.create({
    data: {
      oficina: "Club21",
      billetera: "Ueno Bank",
      nombre: "Juan Perez - CARGAS MANUALES",
      alias: "juan.cargas",
      cbu: "0000-1234-5678-90",
      estado: "ACTIVA",
      operadorId: operador.id,
    },
  });

  await prisma.cuentaBancaria.create({
    data: {
      oficina: "Club21",
      billetera: "Banco Itaú",
      nombre: "Maria Gonzalez",
      alias: "maria.itau",
      cbu: "0001-9876-5432-10",
      estado: "ACTIVA",
      operadorId: operador.id,
    },
  });

  await prisma.movimiento.createMany({
    data: [
      {
        tipo: "CARGA",
        cliente: "juanpitt6576",
        titular: "Juan Perez",
        monto: 10000,
        estado: "PENDIENTE",
        operadorId: operador.id,
        cuentaId: cuenta1.id,
      },
      {
        tipo: "RETIRO",
        cliente: "saraa9420",
        titular: "Sara Gomez",
        monto: 5000,
        estado: "PENDIENTE",
        operadorId: operador.id,
        cuentaId: cuenta1.id,
      },
    ],
  });

  console.log("Seed listo. admin/admin123 - operador1/operador123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
