-- AlterTable
ALTER TABLE "message" ADD COLUMN     "replyToId" TEXT;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
