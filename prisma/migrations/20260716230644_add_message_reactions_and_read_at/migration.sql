-- AlterTable
ALTER TABLE "conversation_member" ADD COLUMN     "lastReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "editedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "message_reaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_reaction_messageId_idx" ON "message_reaction"("messageId");

-- CreateIndex
CREATE INDEX "message_reaction_userId_idx" ON "message_reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reaction_messageId_userId_reaction_key" ON "message_reaction"("messageId", "userId", "reaction");

-- AddForeignKey
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
