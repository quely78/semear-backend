-- CreateTable
CREATE TABLE "Agricultora" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "comunidadeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agricultora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coordenadora" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "comunidadeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coordenadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comunidade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comunidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plantio" (
    "id" SERIAL NOT NULL,
    "especie" TEXT NOT NULL,
    "dataPlantio" TIMESTAMP(3) NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "tipoCultivo" TEXT NOT NULL,
    "agricultoraId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plantio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarioAgricola" (
    "id" SERIAL NOT NULL,
    "especie" TEXT NOT NULL,
    "epocaPlantio" TEXT NOT NULL,
    "epocaColheita" TEXT NOT NULL,

    CONSTRAINT "CalendarioAgricola_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agricultora_contato_key" ON "Agricultora"("contato");

-- CreateIndex
CREATE UNIQUE INDEX "Coordenadora_contato_key" ON "Coordenadora"("contato");

-- CreateIndex
CREATE UNIQUE INDEX "Coordenadora_comunidadeId_key" ON "Coordenadora"("comunidadeId");

-- CreateIndex
CREATE INDEX "Plantio_especie_idx" ON "Plantio"("especie");

-- CreateIndex
CREATE INDEX "Plantio_dataPlantio_idx" ON "Plantio"("dataPlantio");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarioAgricola_especie_key" ON "CalendarioAgricola"("especie");

-- AddForeignKey
ALTER TABLE "Agricultora" ADD CONSTRAINT "Agricultora_comunidadeId_fkey" FOREIGN KEY ("comunidadeId") REFERENCES "Comunidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coordenadora" ADD CONSTRAINT "Coordenadora_comunidadeId_fkey" FOREIGN KEY ("comunidadeId") REFERENCES "Comunidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plantio" ADD CONSTRAINT "Plantio_agricultoraId_fkey" FOREIGN KEY ("agricultoraId") REFERENCES "Agricultora"("id") ON DELETE CASCADE ON UPDATE CASCADE;
