-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateTable
CREATE TABLE "ClientConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "activeModules" TEXT[],
    "settings" JSONB NOT NULL,

    CONSTRAINT "ClientConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "clientId" TEXT NOT NULL,
    "moduleUsed" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientConfig_phoneNumber_key" ON "ClientConfig"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
