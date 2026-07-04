-- AlterTable: contract fields on ClientProject
ALTER TABLE "ClientProject" ADD COLUMN IF NOT EXISTS "contractContent" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ClientProject" ADD COLUMN IF NOT EXISTS "contractStatus" TEXT NOT NULL DEFAULT 'borrador';
ALTER TABLE "ClientProject" ADD COLUMN IF NOT EXISTS "contractSentAt" TIMESTAMP(3);
ALTER TABLE "ClientProject" ADD COLUMN IF NOT EXISTS "contractAcceptedAt" TIMESTAMP(3);
