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
- Iteración 2: `0006_validar_total_orden.sql` escrita y probada en Postgres local (17/17). **No aplicada.**

- Iteración 3: `0007_rpc_obtener_orden.sql` escrita y probada. **No aplicada.** No toca la policy ni el cliente.

- Iteración 4: `0008_staff_roles.sql` (siembra de Reiner como admin, confirmado por SELECT) y `0009_endurecer_rls_staff.sql` (con candado). Probadas 26/26. **No aplicadas.**

- Iteración 5: login del equipo en `/equipo` con ruta protegida por rol (Barra/Admin ya no tienen login propio). Fallback provisional con TODO(0008).
- Iteración 6: edge function con CORS por allowlist + tope de OCR por hora (probada en Deno local, **sin desplegar**). Revisión de secretos limpia.

## Pendiente (en el orden del plan)
- Iteración 7: docs sincronizados (CLAUDE.md, README, ROADMAP con los pasos manuales reales, lote en PROGRESO-LOOP). Hecho.
- Code review del diff de la sesión: 3 hallazgos, todos corregidos.
- UI premium con motion en toda la app (al final, commits por pantalla, tope de bundle 170 KB).

## Pasos manuales de Reiner
Lote ordenado, con riesgo/verificación/reversión, en `docs/PROGRESO-LOOP.md` → "Lote de migraciones" (y en ROADMAP.html → "Pasos manuales"): 0006 → 0007 → 0008 (+ verificar la siembra) → 0009 → redeploy de la edge function → merge → 0003 → retirar el fallback TODO(0008).
