# Estado de sesión — Quadro Café
Última actualización: 1 oct 2026 (loop largo en curso; el detalle por iteración está en `docs/PROGRESO-LOOP.md`)

## Estado real verificado (01/oct, solo lectura)
- Rama `quadro-feature-reunion-05sept`: va 0 commits por detrás de `main` (main ya está mergeado en `72a3389`) y `git merge-tree` sale **sin conflictos**. `ROADMAP.md` ya no existe y no hay locks.
- Supabase: **0004 y 0005 aplicadas**, edge function `verificar-comprobante` en la v3 (`verify_jwt=false`). Falta solo **0003**, que va después del deploy del merge.
- `productos` tiene 12 filas (m9/m10 todavía en "Panadería") y `ordenes` 15 (la última del 18/ago).

## Hecho en esta sesión
- Iteración 0: corregido el **P0 de `useCarta`**, que dejaba los productos sin precio. Lo cubre `npm test`.
- Iteración 0b: fondos del login commiteados, `npm run lint` y CI (`.github/workflows/ci.yml`).
- Iteración 1: la Carta en producción muestra 12 reales + 45 placeholders (`fusionarCarta`).

## Pendiente (en el orden del plan)
1. Base: assets del login, lint y CI.
2. Fusión de placeholders en `useCarta` (12 de la base + 45 `nuevo:true`).
3. Migraciones **como archivos, sin aplicar**: 0006 (total en servidor), 0007 (RPC `obtener_orden`), 0008 (staff/roles + siembra de admin), 0009 (RLS por rol, con candado).
4. Login del equipo (`/equipo`) con ruta protegida.
5. Revisión de seguridad y de la edge function (CORS + tope de OCR).
6. Docs.
7. UI premium con motion en toda la app.

## Pasos manuales de Reiner (se consolidan en el reporte final)
- Aplicar el lote de migraciones en orden (0009 solo después de verificar la siembra de 0008).
- Correr 0003 después del deploy del merge.
- Revisar el PR y hacer el merge a `main`.
