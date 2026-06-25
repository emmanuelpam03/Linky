/*
  Warnings:

  - A unique constraint covering the columns `[pairKey]` on the table `conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "pairKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "conversation_pairKey_key" ON "conversation"("pairKey");
