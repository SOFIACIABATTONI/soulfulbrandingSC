-- AlterTable
ALTER TABLE "ClientProject"
ADD COLUMN "deepDiveStatus" TEXT NOT NULL DEFAULT 'pendiente',
ADD COLUMN "deepDiveSentAt" TIMESTAMP(3),
ADD COLUMN "deepDiveDoneAt" TIMESTAMP(3);
