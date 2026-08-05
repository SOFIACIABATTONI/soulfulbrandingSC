-- Mantiene los importes y actualiza únicamente la denominación monetaria.
UPDATE "Quote"
SET "content" = jsonb_set("content", '{currency}', '"EUR"', true)
WHERE "content"->>'currency' = 'USD';
