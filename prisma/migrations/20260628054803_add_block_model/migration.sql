-- CreateTable
CREATE TABLE "block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "block_blockerId_idx" ON "block"("blockerId");

-- CreateIndex
CREATE INDEX "block_blockedId_idx" ON "block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "block_blockerId_blockedId_key" ON "block"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
