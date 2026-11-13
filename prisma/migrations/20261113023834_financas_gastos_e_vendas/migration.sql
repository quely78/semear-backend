-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "plantioId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venda" (
    "id" SERIAL NOT NULL,
    "plantioId" INTEGER NOT NULL,
    "quantidadeKg" DOUBLE PRECISION NOT NULL,
    "precoKg" DECIMAL(12,2) NOT NULL,
    "canal" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gasto_plantioId_idx" ON "Gasto"("plantioId");

-- CreateIndex
CREATE INDEX "Gasto_data_idx" ON "Gasto"("data");

-- CreateIndex
CREATE INDEX "Venda_plantioId_idx" ON "Venda"("plantioId");

-- CreateIndex
CREATE INDEX "Venda_data_idx" ON "Venda"("data");

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_plantioId_fkey" FOREIGN KEY ("plantioId") REFERENCES "Plantio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_plantioId_fkey" FOREIGN KEY ("plantioId") REFERENCES "Plantio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
