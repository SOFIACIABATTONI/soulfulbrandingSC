-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "tokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tokenHash_key" ON "Invoice"("tokenHash");
