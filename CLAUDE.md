# CLAUDE.md

## Reglas críticas — NO tocar bajo ningún concepto
- `Project` en Prisma = portfolio público. NO renombrar, NO modificar, NO agregar campos.
- Las rutas `/portfolio` y `/portfolio/[slug]` están en producción activa.
- `ContactMessage` se mantiene intacto. Los leads del ERP usan el modelo `Lead` separado.
- `SiteContent` no se toca.
- `/api/admin/contact-messages/` no se toca.
- El middleware.ts actual no se modifica (salvo pedido explícito).
- `src/components/admin/ProjectWorkspace.tsx` NO se modifica — workspace del portfolio en admin (`/admin/projects/[slug]`). El ERP usa `ERPProjectWorkspace.tsx` con `ClientProject`.

## Producción (sep 2026)
- **Dominio:** https://www.sofiaciabattoni.com
- **Git:** remoto `sofia` → rama `master`
- **Neon:** branch `production` (Vercel Production) · branch `dev` (preview)
- **ERP en vivo:** `/admin`, portales `/cliente/*`, `/presupuesto/*`
- **Antes de push a `master` con cambios de BD:** backup Neon → regla `.cursor/rules/neon-backup-before-master.mdc`
- **Docs internas:** `private-notes/backups-y-restauracion.md`, `private-notes/deploy-dev-a-master.md`, `private-notes/_ciberseguridad.md`

## Stack
Next.js 15 App Router · Prisma 6 · PostgreSQL (Neon) · Vercel · TypeScript · Tailwind CSS · Vercel Blob

## Rama de trabajo
- Desarrollo: `dev` (preview) o ramas `feature/*`
- Publicación: merge a `master` → `git push sofia master`
- No trabajar cambios de producción directo en `master` sin probar en `dev`

## Convenciones del proyecto
- Componentes admin: `src/components/admin/`
- Páginas admin: `src/app/admin/`
- APIs admin: `src/app/api/admin/`
- Patrón APIs: `contact-messages/` · Patrón UI: `LeadsManager.tsx`

## Paleta de colores (manual de marca)
- Crema: #F9F3DB · Negro: #0D0D0D · Rosa: #F03172 · Azul: #323FF6 · Navy: #131945

## Tipografía
- Títulos: EB Garamond (serif) · Cuerpo: Helvetica / sistema

## Referencia visual ERP
`soulful-erp-prototipo.html` — UI aprobada; adaptar a Next.js/Tailwind.

## Modelos ERP (implementados)
Lead · Quote · Client · ClientProject · Invoice · ClientAccessToken · ContractAcceptance · PortfolioGalleryItem

## Enums / estados
- Servicios: `identidad-de-marca` | `estrategia-visual` | `diseno-editorial`
- Lead status: `negociacion` | `ganado` | `perdido`
- ClientProject status: `onboarding` | `diseno` | `implementacion` | `entregado`
- Invoice: type `sena` | `final` · status `pendiente` | `pagado`
- ClientAccessToken purpose: `pre-brief` | `contrato` | `narrativa` | `entrega`

## Documentación de desarrollo
Resúmenes de bloques: `private-notes/dev-log.md` (histórico). Nuevos hitos: entrada al inicio de ese archivo o nota en `private-notes/`.
