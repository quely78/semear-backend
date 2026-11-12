-- DropIndex
DROP INDEX "Coordenadora_comunidadeId_key";

-- AlterTable
ALTER TABLE "Agricultora" ADD COLUMN     "senhaProvisoria" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Plantio" ADD COLUMN     "dataColheita" TIMESTAMP(3),
ADD COLUMN     "quantidadeColhida" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "RedefinicaoSenha" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RedefinicaoSenha_tokenHash_key" ON "RedefinicaoSenha"("tokenHash");

-- CreateIndex
CREATE INDEX "RedefinicaoSenha_tipo_usuarioId_idx" ON "RedefinicaoSenha"("tipo", "usuarioId");

-- CreateIndex
CREATE INDEX "Coordenadora_comunidadeId_idx" ON "Coordenadora"("comunidadeId");

