-- CreateTable
CREATE TABLE "Turno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "saldoInicial" REAL NOT NULL DEFAULT 0,
    "saldoFinal" REAL,
    "totalCargas" REAL NOT NULL DEFAULT 0,
    "totalRetiros" REAL NOT NULL DEFAULT 0,
    "saldoTeoricoCierre" REAL,
    "saldoRealCierre" REAL,
    "diferencia" REAL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "operadorId" INTEGER NOT NULL,
    CONSTRAINT "Turno_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountTransfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monto" REAL NOT NULL,
    "motivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origenId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,
    "creadoPorId" INTEGER NOT NULL,
    CONSTRAINT "AccountTransfer_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "CuentaBancaria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountTransfer_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "CuentaBancaria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountTransfer_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accion" TEXT NOT NULL,
    "detalles" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER,
    CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "paraRoles" TEXT NOT NULL DEFAULT 'todos',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" INTEGER,
    CONSTRAINT "Notificacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificacionLeida" (
    "notificacionId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "leidaAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("notificacionId", "usuarioId"),
    CONSTRAINT "NotificacionLeida_notificacionId_fkey" FOREIGN KEY ("notificacionId") REFERENCES "Notificacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotificacionLeida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CuentaBancaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "oficina" TEXT NOT NULL,
    "billetera" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "alias" TEXT,
    "cbu" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "saldoBase" REAL NOT NULL DEFAULT 0,
    "totalDescargado" REAL NOT NULL DEFAULT 0,
    "esSegura" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operadorId" INTEGER,
    CONSTRAINT "CuentaBancaria_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CuentaBancaria" ("alias", "billetera", "cbu", "createdAt", "estado", "id", "nombre", "oficina", "operadorId", "saldoBase", "totalDescargado") SELECT "alias", "billetera", "cbu", "createdAt", "estado", "id", "nombre", "oficina", "operadorId", "saldoBase", "totalDescargado" FROM "CuentaBancaria";
DROP TABLE "CuentaBancaria";
ALTER TABLE "new_CuentaBancaria" RENAME TO "CuentaBancaria";
CREATE TABLE "new_Movimiento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "titular" TEXT,
    "monto" REAL NOT NULL,
    "bono" REAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operadorId" INTEGER,
    "cuentaId" INTEGER,
    "turnoId" INTEGER,
    CONSTRAINT "Movimiento_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movimiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movimiento_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Movimiento" ("bono", "cliente", "createdAt", "cuentaId", "estado", "id", "monto", "operadorId", "tipo", "titular") SELECT "bono", "cliente", "createdAt", "cuentaId", "estado", "id", "monto", "operadorId", "tipo", "titular" FROM "Movimiento";
DROP TABLE "Movimiento";
ALTER TABLE "new_Movimiento" RENAME TO "Movimiento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
