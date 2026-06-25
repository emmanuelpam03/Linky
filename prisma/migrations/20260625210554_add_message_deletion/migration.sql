-- AlterTable
ALTER TABLE "message" ADD COLUMN     "deletedFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deletedForEveryone" BOOLEAN NOT NULL DEFAULT false;
