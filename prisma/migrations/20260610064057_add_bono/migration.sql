-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Movimiento_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movimiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Movimiento" ("cliente", "createdAt", "cuentaId", "estado", "id", "monto", "operadorId", "tipo", "titular") SELECT "cliente", "createdAt", "cuentaId", "estado", "id", "monto", "operadorId", "tipo", "titular" FROM "Movimiento";
DROP TABLE "Movimiento";
ALTER TABLE "new_Movimiento" RENAME TO "Movimiento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
