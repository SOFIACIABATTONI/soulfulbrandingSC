-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "dueAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "reminder7dSentAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "reminder1dSentAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "reminderDueSentAt" TIMESTAMP(3);
