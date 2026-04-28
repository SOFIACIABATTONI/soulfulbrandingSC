# CLAUDE.md

## Reglas críticas — NO tocar bajo ningún concepto
- `Project` en Prisma = portfolio público. NO renombrar, NO modificar, NO agregar campos.
- Las rutas `/portfolio` y `/portfolio/[slug]` están en producción activa.
- `ContactMessage` se mantiene intacto. Los leads del ERP usan el modelo `Lead` separado.
- `SiteContent` no se toca.
- `/api/admin/contact-messages/` no se toca.
- El middleware.ts actual no se modifica.
- `src/components/admin/ProjectWorkspace.tsx` NO se modifica — es el workspace del portfolio activo.

## Stack
Next.js 15 App Router · Prisma 6 · PostgreSQL (Neon) · Vercel · TypeScript · Tailwind CSS

## Rama de trabajo
Crear rama antes de cada bloque:
- feature/erp-bloque-1-schema
- feature/erp-bloque-2-leads-api
- feature/erp-bloque-3-presupuesto
- etc.
Nunca trabajar directo en main.

## Convenciones del proyecto
- Componentes admin en: src/components/admin/
- Páginas admin en: src/app/admin/
- APIs admin en: src/app/api/admin/
- Seguir el patrón de contact-messages/ para nuevas APIs
- Seguir el patrón de LeadsManager.tsx para nuevos componentes admin

## Paleta de colores (manual de marca aprobado)
- Crema: #F9F3DB (fondo principal del admin)
- Negro: #0D0D0D (sidebar, headers de documentos)
- Rosa: #F03172 (acento principal, CTAs)
- Azul: #323FF6 (estados informativos, links)
- Navy: #131945 (textos secundarios)

## Tipografía
- Títulos: EB Garamond (serif, itálica)
- Cuerpo: Helvetica / sans-serif del sistema

## Referencia visual
El archivo soulful-erp-prototipo.html (en la raíz o en /docs) tiene
el diseño completo aprobado por la clienta. Usarlo como referencia
de UI para cada pantalla nueva — no copiarlo literalmente, adaptarlo a Next.js/Tailwind.

## Modelos ERP (todos nuevos, no existen todavía)
Lead · Client · ClientProject · Invoice · ClientAccessToken

## Sobre ProjectWorkspace.tsx
Ya existe en `src/components/admin/ProjectWorkspace.tsx` y maneja el portfolio activo — NO tocar.
En la Sesión 11 (Bloque 5), creá `ERPProjectWorkspace.tsx` copiando el patrón de `ProjectWorkspace.tsx`
pero adaptado para `ClientProject`. Usar el original solo como referencia, no modificarlo.

## Servicios disponibles (enum compartido)
"identidad-de-marca" | "estrategia-visual" | "diseno-editorial"

## Estados de Lead
"negociacion" | "ganado" | "perdido"

## Estados de ClientProject
"onboarding" | "diseno" | "implementacion" | "entregado"

## Estados de Invoice
"pendiente" | "pagado"

## Tipos de Invoice
"sena" | "final"

## Propósitos de ClientAccessToken
"pre-brief" | "contrato" | "narrativa" | "entrega"
