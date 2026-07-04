-- Narrativa de marca: contenido editable por admin + envío al cliente
ALTER TABLE "ClientProject" ADD COLUMN "narrativaContent" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ClientProject" ADD COLUMN "narrativaStatus" TEXT NOT NULL DEFAULT 'borrador';
ALTER TABLE "ClientProject" ADD COLUMN "narrativaSentAt" TIMESTAMP(3);
