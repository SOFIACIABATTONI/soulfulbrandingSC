-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN "prebriefResponses" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ClientProject" ADD COLUMN "prebriefSubmittedAt" TIMESTAMP(3);
