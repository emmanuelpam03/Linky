CREATE TYPE "NotificationType" AS ENUM ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'MENTION', 'CALL_INVITE');

CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pinned_message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "pinnedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_recipientId_createdAt_idx" ON "notification"("recipientId", "createdAt");
CREATE INDEX "notification_recipientId_readAt_idx" ON "notification"("recipientId", "readAt");
CREATE UNIQUE INDEX "pinned_message_messageId_key" ON "pinned_message"("messageId");
CREATE INDEX "pinned_message_conversationId_createdAt_idx" ON "pinned_message"("conversationId", "createdAt");

ALTER TABLE "notification" ADD CONSTRAINT "notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification" ADD CONSTRAINT "notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pinned_message" ADD CONSTRAINT "pinned_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pinned_message" ADD CONSTRAINT "pinned_message_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pinned_message" ADD CONSTRAINT "pinned_message_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
