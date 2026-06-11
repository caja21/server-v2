-- CreateTable
CREATE TABLE "Promocion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "paraRoles" TEXT NOT NULL DEFAULT 'OPERADOR',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" INTEGER,
    CONSTRAINT "Promocion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromocionCompletada" (
    "promocionId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "completadaAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("promocionId", "usuarioId"),
    CONSTRAINT "PromocionCompletada_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "Promocion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PromocionCompletada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
