# Almacenamiento definitivo — Cloudflare R2

Documento de referencia para migrar el ERP y el sitio **fuera de Vercel Blob** (límite 1 GB en Hobby, store suspendido por cuota).

## Objetivo

- **Un solo almacén** para subidas del ERP (Brand ID, manual PDF, portfolio, oráculo, imágenes admin).
- **URLs públicas estables** guardadas en Postgres (igual que hoy con Blob).
- **Subidas grandes** por URL presignada (sin pasar por el límite ~4,5 MB del body en Vercel).
- **Migración completa** del histórico en Blob → R2 y retiro de Blob en Vercel cuando termine el cutover en producción.

Cloudinary **no** forma parte de este plan (opcional más adelante solo para optimizar imágenes del sitio público).

---

## Variables de entorno (Vercel + local)

| Variable | Descripción |
|----------|-------------|
| `R2_ACCOUNT_ID` | ID de cuenta Cloudflare |
| `R2_ACCESS_KEY_ID` | Token R2 (S3 API) |
| `R2_SECRET_ACCESS_KEY` | Secret del token |
| `R2_BUCKET_NAME` | Nombre del bucket (ej. `soulful-assets`) |
| `R2_PUBLIC_BASE_URL` | URL pública del bucket (custom domain ej. `https://assets.sofiaciabattoni.com` o `https://pub-….r2.dev`) |

Cuando estas variables están definidas, el código **prioriza R2** sobre Vercel Blob en todas las rutas de subida.

Blob (`BLOB_*`) queda como **fallback** solo si R2 no está configurado (transición / entornos sin R2).

---

## Setup Cloudflare (checklist)

1. Crear bucket R2 en el equipo de Cloudflare.
2. **API token** con permiso de lectura/escritura en ese bucket.
3. **Public access**: custom domain en el mismo dominio (`assets.sofiaciabattoni.com`) o dominio `r2.dev` habilitado.
4. **CORS** en el bucket: permitir `PUT` desde `https://*.vercel.app` y `https://www.sofiaciabattoni.com` (y localhost en dev si probás R2 local).
5. En **Vercel → proyecto → Environment Variables**: cargar las 5 variables `R2_*` primero en **Preview** (rama `dev`), probar, luego **Production** cuando hagáis cutover.

---

## Código (implementado en esta rama)

| Pieza | Rol |
|-------|-----|
| `src/lib/object-storage.ts` | Cliente S3 → R2, `put` y presigned PUT |
| `src/lib/admin-upload-put.ts` | `putPublicFile()` — R2 primero, Blob si no hay R2 |
| `src/app/api/admin/object-storage-presign/route.ts` | Presign para archivos > 4 MB desde el admin |
| Rutas `*-upload`, `/api/upload`, oráculo | Usan `putPublicFile` |
| `src/lib/admin-client-upload.ts` | Presign R2 para subidas grandes; fallback Blob |
| `scripts/migrate-blob-urls-to-r2.ts` | Migración de URLs en Neon (ejecutar manual) |
| `scripts/upload-oraculo-video.ts` | Soporta R2 si hay env |

### Rutas de objetos (sin cambiar convención)

- `brand/…` — Brand ID  
- `manual/…` — manual PDF  
- `uploads/…` — portfolio / imágenes admin  
- `oraculo/receipts/…`, `oraculo/presentacion.mov` — oráculo  

---

## Migración del histórico (Blob → R2)

1. Configurar R2 y variables en **Preview** con BD de staging o copia de prod (según política del equipo).
2. Ejecutar (con `DATABASE_URL` apuntando al entorno correcto):

   ```bash
   npx tsx scripts/migrate-blob-urls-to-r2.ts --dry-run
   npx tsx scripts/migrate-blob-urls-to-r2.ts
   ```

3. Verificar portales de 2–3 clientes (descarga directa + ZIP Brand ID).
4. Repetir contra **production** en ventana acordada.
5. Desconectar Vercel Blob del proyecto y quitar `BLOB_*` cuando no queden URLs `blob.vercel-storage.com` en la BD.

---

## Operación (clienta sube archivos a menudo)

- Alertas de uso en Cloudflare R2 (~80 % del bucket).
- Backup: Neon (datos) + copia periódica del bucket (export o segunda región cuando escale).
- Preview y Production: recomendado **mismo bucket** con prefijos distintos solo si hace falta; o bucket `staging` pequeño para previews sin mezclar pruebas con entregas reales.

---

## Git y despliegue — **solo `dev` hasta acordar producción**

Regla explícita para agentes y equipo:

| Permitido | Prohibido sin pedido explícito de Sofía |
|-----------|----------------------------------------|
| Trabajar en rama **`dev`** | `git push sofia master` |
| `git push sofia dev` | Merge a `master` / deploy Production |
| Preview Vercel de la rama `dev` | Publicar este cambio en producción |

### Comandos habituales

```bash
git checkout dev
git pull sofia dev
# … commits …
git push sofia dev
```

**Producción (`master`):** solo cuando R2 esté probado en preview, migración hecha (si aplica) y Sofía confirme el cutover.

---

## Cutover a producción (cuando toque)

1. Variables `R2_*` en Vercel **Production**.
2. Migración de URLs Blob → R2 en BD production (script).
3. Deploy desde `master` (merge `dev` → `master` + `git push sofia master` — **solo con OK explícito**).
4. Quitar Blob del proyecto Vercel.
5. Monitorear subidas Brand ID y portal cliente 48 h.

---

## Estado

| Fase | Estado |
|------|--------|
| Código R2 en repo | En rama `dev` |
| Bucket + DNS + env Preview | Pendiente (Cloudflare + Vercel) |
| Migración histórica | Pendiente (`migrate-blob-urls-to-r2.ts`) |
| Production cutover | Pendiente — no automatizar push a `master` |
