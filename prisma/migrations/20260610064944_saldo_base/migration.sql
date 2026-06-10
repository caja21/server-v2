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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operadorId" INTEGER,
    CONSTRAINT "CuentaBancaria_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CuentaBancaria" ("alias", "billetera", "cbu", "createdAt", "estado", "id", "nombre", "oficina", "operadorId") SELECT "alias", "billetera", "cbu", "createdAt", "estado", "id", "nombre", "oficina", "operadorId" FROM "CuentaBancaria";
DROP TABLE "CuentaBancaria";
ALTER TABLE "new_CuentaBancaria" RENAME TO "CuentaBancaria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
