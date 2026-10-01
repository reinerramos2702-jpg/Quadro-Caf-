# Estado de sesión — Quadro Café
Última actualización: 1 oct 2026 (noche), bugs para la reunión del 2–3 oct. El detalle por iteración está en `docs/PROGRESO-LOOP.md`.

## Panel Admin responsive (01/oct, noche)
- `src/equipo/AdminPanel.jsx` reemplaza al Admin de `App.jsx`: lista de 1 columna en móvil, 2 en tablet y tabla con cabecera fija, buscador y chips en escritorio. Precio inline (Enter/Esc), switch accesible, estados guardando/guardado/error visibles, panel lateral para "Agregar producto".
- Verificado con sesión de admin **inventada** y Supabase **simulado** por CDP (nada real leído ni escrito): capturas a 375/768/1024/1440/1920 en los dos temas, antes y después, más búsqueda, chips, Enter/Esc, Espacio en el switch, error 403 (revierte + aviso) y el panel de alta. Tests 36/36, lint OK, build OK.
- Bundle: principal 154.64 KB (antes 156.31); chunk `/equipo` 14.31 KB (antes 7.85).
- "Panadería" ya no se muestra en ningún lado: el Admin la traduce a "Bollería" igual que la Carta. En la base sigue "Panadería" hasta correr 0003 (después del merge).
- **Falta probarlo con tu cuenta real** (cambiar y restaurar un precio): es también la prueba real de la RLS de 0009.

## Bugs del 01/oct (noche) — reunión 2–3 oct
1. **Avatar José Tomás**: el iframe ya no puede funcionar (D-ID manda `frame-ancestors 'self'`). Ahora se usa el SDK oficial de D-ID dentro del overlay, con capa de respaldo y "Abrir en pestaña nueva". **Falta una acción de Reiner** para que funcione dentro de la app: en D-ID Studio → agente → Embed → Allowed domains, agregar `https://quadro-cafe.reinerramos2702.workers.dev` (y `http://localhost:5173` para probar en local). Si el snippet de Embed trae otra `data-client-key`, pasármela para `avatar.didClientKey`. Mientras tanto, el botón "Abrir en pestaña nueva" lleva a la página de D-ID, que sí funciona.
2. **Login /equipo con autocompletado**: corregido (sombra inset opaca; antes dependía de una transición que reduced-motion anulaba).
- Pregunta abierta: la foto de la tarjeta (`jose-tomas.jpg`) no es la misma persona que muestra el agente de D-ID.
- Los dos arreglos están en la rama; llegan a producción solo con el merge (Reiner).

## Estado real verificado (01/oct, 19:05 UTC, solo lectura)
- Rama `quadro-feature-reunion-05sept`, sin conflictos con `main`. `main` no se tocó ni se mergeó.
- Supabase: **0004 a 0009 aplicadas** (Reiner, por SQL Editor). `staff` = `admin · reinerramos2702@gmail.com`. Trigger `ordenes_validar_total`, RPC `obtener_orden` y RLS por rol activos. `ordenes_lectura_publica` sigue abierta (es el bloque de cierre).
- Edge function `verificar-comprobante` **todavía en v3** (el endurecimiento de CORS y el tope de OCR no están desplegados).
- `productos` 12 filas (m9/m10 aún en "Panadería"), `ordenes` 15.
- Advisors: solo los esperados + "protección de contraseñas filtradas" apagada.

## Hecho en esta sesión
1. Verificación de solo lectura del lote (una primera lectura no veía nada; se repitió y confirmó lo aplicado).
2. **Fallback TODO(0008) retirado**: `src/equipo/rol.js` sin la excepción de "tabla staff ausente", `EquipoApp.jsx` sin el aviso `legacy`, `test/rol.test.js` ahora exige que ese caso deniegue. test 23/23, lint OK, Vite compila (155.30 KB; `/equipo` 7.45 KB).
3. Decisiones de Reiner registradas: dígitos en títulos **se quedan como están**; `ALLOWED_ORIGINS` **no se configura** (solo `workers.dev`, ya en la lista por defecto).
4. Docs sincronizados (CLAUDE.md, memoria.md, PROGRESO-LOOP; `AGENTS.md` local, no versionado).

## Pendiente (de Reiner)
- Redeploy de `verificar-comprobante` (→ v4): `npx supabase@latest functions deploy verificar-comprobante --no-verify-jwt --use-api --project-ref wckufllomfmuwxptegvm`.
- Probar `/equipo` con su cuenta real: Admin (cambiar y restaurar un precio) y Barra. Es la prueba de 0009 en uso real.
- Merge del PR a `main` → después 0003.
- Supabase Auth: confirmar signup público apagado y activar protección de contraseñas filtradas.
- Decidir si se hace el **bloque de cierre de la lectura pública de `ordenes`** (RPC `crear_orden` + Ticket por `obtener_orden` + drop de `ordenes_lectura_publica`), que necesita un pedido de prueba real.

## Riesgos
- Sin el fallback, si alguien despliega esta rama contra un proyecto sin 0008 (otro entorno), nadie entra a `/equipo`. En producción no aplica: 0008 está.
- Mientras `ordenes_lectura_publica` exista, cualquiera con la anon key puede listar órdenes (nombre + items).
- `npm audit`: 8 altas + 2 moderadas, todas de tooling (preexistentes).
- Esta PC tiene reduced-motion a nivel Windows: para verificar motion por CDP, emular `no-preference`.
