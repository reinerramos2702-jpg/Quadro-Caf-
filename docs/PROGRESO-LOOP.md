# PROGRESO-LOOP — rama `quadro-feature-reunion-05sept`

Bitácora del loop largo que arrancó el 01/oct/2026. Hay una entrada por iteración. Plan aprobado: deuda de seguridad, login del equipo con roles y, al final, UI premium con motion.

Guardarraíles: no se hace merge ni push a `main`, ni `wrangler deploy`, ni `supabase db push`. **No se aplica SQL en producción durante el loop**: las migraciones quedan como archivos y van en un lote ordenado para Reiner. No se escriben secretos y la RLS nunca se abre más.

Línea base del bundle principal: **153.73 KB gzip** (`index-*.js`, medido en la iteración 0). La referencia de 147.99 KB del 18/sept es anterior a los 45 placeholders y sus fotos. Tope de la fase de UI: 170 KB.

---

## Lote de migraciones y deploy para Reiner (NO aplicado en el loop)

Hay que aplicarlo **uno por uno, en este orden**, verificando cada paso por lectura antes de pasar al siguiente. Todo está probado en PGlite (Postgres real en WASM) sobre 0001–0005 tal cual están en el repo, con stubs de `auth`/`storage`.

| # | Paso | Qué hace | Riesgo | Verificación | Reversión |
|---|---|---|---|---|---|
| 1 | `0006_validar_total_orden.sql` | Trigger BEFORE INSERT: el total y los precios salen de `productos`; rechaza ids desconocidos, agotados o con cantidad fuera de 1–50 | Bajo. Un pedido con un producto recién agotado falla con el mensaje genérico | El bloque `DO … raise exception` del archivo → `OK rollback · total=6.00 · precio=3.00` (sin dejar filas) | `drop trigger ordenes_validar_total on ordenes; drop function validar_total_orden();` |
| 2 | `0007_rpc_obtener_orden.sql` | RPC de lectura de una orden por id, sin nombre ni items. No cambia nada visible | Bajo. El advisor la lista a propósito | `select * from obtener_orden('00000000-0000-4000-8000-000000000000');` → 0 filas | `drop function obtener_orden(uuid);` |
| 3 | `0008_staff_roles.sql` | Tabla `staff`, `es_staff()`/`es_admin()`, **siembra de Reiner como admin**, `search_path` fijo y EXECUTE revocado en las funciones de trigger | Bajo (aditiva) | `select s.rol, u.email from staff s join auth.users u on u.id = s.user_id;` → `admin · reinerramos2702@gmail.com`. Correr también los advisors | Script de reversión dentro del archivo |
| 4 | `0009_endurecer_rls_staff.sql` | RLS de staff: de "cualquier authenticated" a roles. `ordenes` se actualiza solo en `estado`/`comprobante_*` | **Alto si el paso 3 no sembró**: lo frena el candado, que aborta sin cambiar nada | Entrar a `/equipo` con la cuenta de Reiner: Admin (cambiar y restaurar un precio) y Barra; `pg_policies` | Script de reversión dentro del archivo (probado: vuelve al estado previo) |
| 5 | Redeploy de `verificar-comprobante` | CORS por allowlist + tope `OCR_MAX_POR_HORA` | Bajo | `list_edge_functions` → v4, `verify_jwt=false` | Redesplegar desde el commit anterior a `0d76d97` |
| 6 | Merge del PR a `main` | Deploy de Cloudflare | Medio. CI en verde antes | Probar `/`, Carta, pedido de prueba y `/equipo` en producción | Revert del merge |
| 7 | `0003_categoria_bolleria.sql` | Panadería → Bollería en la base | Solo **después** del deploy del merge | `select distinct cat from productos;` | `update productos set cat='Panadería' where cat='Bollería' and id in ('m9','m10');` |
| 8 | Retirar el fallback `TODO(0008)` | Borrar la rama legacy de `resolverRol` y su test | Ninguno con 0008 aplicada | `npm test` | — |

**Avance (01/oct, 19:05 UTC, verificado por SELECT)**: pasos **1–4 aplicados por Reiner** (siembra `admin · reinerramos2702@gmail.com` OK, policies por rol activas, advisors sin hallazgos nuevos inesperados) y **paso 8 hecho** en la rama (23/23 tests). Quedan 5 (redeploy, sigue en v3), 6 (merge) y 7 (0003).

---

## Iteración 0 — P0: precio comentado en `useCarta` (01/oct/2026)
- **Objetivo**: arreglar `src/App.jsx:552`. El comentario `// compat…` de `91dc218` quedó en la misma línea que `precio: Number(p.precio),` y lo dejaba comentado.
- **Impacto si se mergeaba**: con Supabase activo, todos los productos llegaban sin `precio`. La Carta mostraba `$NaN`, el total del carrito era `NaN` y el INSERT a `ordenes` fallaba, porque `total` es NOT NULL y `NaN` se serializa como `null`. Reproducido con el mapeo viejo: `precio: undefined → $NaN`.
- **Archivos**:
  - `src/lib/carta.js` (nuevo): `mapearProducto()` puro, con el comentario en su propia línea.
  - `src/App.jsx`: `useCarta` ahora usa `data.map(mapearProducto)`.
  - `test/carta.test.js` (nuevo): falla si un producto mapeado no tiene precio numérico finito, y también si `useCarta` deja de usar `mapearProducto`.
  - `package.json`: `npm test` = `node --test test/`.
- **Verificación**:
  - `npm test`: 5/5.
  - `npm run build`: Vite compila (153.73 KB gzip). El SW falla por el apóstrofo de `App's`, fallo conocido.
  - Chrome headless sobre `vite preview` con Supabase real:
    - precios `$4.50 $5.00 $7.00`, sin NaN y sin aviso de fallback;
    - carrito 2× Cortado + 1× Latte = **$10.20**;
    - "Enviar a barra" con el POST a `ordenes` **interceptado y respondido en local** (no se insertó nada): `{"items":[{"id":"m5","precio":3,"cantidad":2},{"id":"m6","precio":4.2,"cantidad":1}],"total":10.2,…}`.
  - Único error de consola: el registro de `sw.js` en local (no se genera por el mismo apóstrofo; en Cloudflare sí existe).
- **Hallazgos**: ninguno nuevo.
- **Siguiente**: 0b. Assets del login en commit propio y base de lint/CI.

## Iteración 0b — assets del login + lint + CI (01/oct/2026)
- **Objetivo**: dejar `npm test`, `npm run lint` y `npm run build` como bucle de verificación, con CI que los corra.
- **Archivos**:
  - Commit propio `54eccee`: "assets: fondos del login" (4 `.webp` de `public/img/`, sin tocar).
  - `eslint.config.js` (nuevo): mínimo a propósito, con `no-undef`, `react-hooks/rules-of-hooks` y parseo JSX.
  - `.github/workflows/ci.yml` (nuevo): `npm ci` → test → lint → build en Node 22. Corre en cada push y PR, sin deploy.
  - `package.json`: script `lint` y devDeps con **versión fija**: `eslint@10.11.0`, `eslint-plugin-react-hooks@7.1.1`, `globals@17.13.0`. Las tres son MIT, sin scripts de instalación y con publicación en septiembre/octubre de 2026.
- **Verificación**:
  - test 5/5; lint 0 errores; build OK (153.73 KB gzip, sin cambios: son devDeps).
  - Lockfile: las 26 entradas `@img/sharp*` (binarios opcionales por plataforma) siguen todas.
- **Hallazgo — deuda de dependencias (preexistente)**: `npm audit` da 10 (2 moderadas, 8 altas) **idénticas antes y después** de agregar lint, comparando contra el lockfile previo. Todas son tooling de build/dev: `wrangler`/`miniflare`/`undici`, `sharp` (libvips), `vite`/`postcss`/`nanoid`, `browserslist`, `brace-expansion`, `fast-uri`, `baseline-browser-mapping`. Ninguna entra al bundle del cliente. No corrí `npm audit fix` porque sube majors de tooling (wrangler/sharp) sin pedido. Queda como deuda en el ROADMAP.
- **Siguiente**: 1. Fusión de placeholders en `useCarta`.

## Iteración 1 — fusión de placeholders en la Carta (01/oct/2026)
- **Objetivo**: con Supabase activo, `useCarta` reemplazaba `MENU` por las 12 filas de la base, así que los 45 placeholders "Próximamente" (y sus fotos) no se veían en producción. Decisión de Reiner: fusionar en el cliente.
- **Archivos**:
  - `src/lib/carta.js`: `fusionarCarta(filasDB, MENU)`. Supabase manda. Se suman los `nuevo:true` del MENU local que la base no tenga ni por **id** ni por **nombre normalizado** (sin tildes ni mayúsculas): el Admin crea ids slug, así que lo normal es que coincida el nombre. Un placeholder desaparece solo cuando el dueño carga el producto real.
  - `src/App.jsx`: `setItems(fusionarCarta(data, MENU))`.
  - `test/carta.test.js`: +3 tests (fusión, retiro por id/nombre, 12+45=57).
- **Verificación**:
  - test 8/8; lint 0 errores; build OK (**153.86 KB gzip**, +0.13).
  - Chrome headless con Supabase real, por categoría (`Agregar`/`Próximamente`/`Agotado`):

    | Categoría | Agregar | Próximamente | Agotado |
    |---|---|---|---|
    | Filtrado | 0 | 0 | 3 |
    | Espresso | 2 | 9 | 1 |
    | Frío | 2 | 8 | 0 |
    | Bollería | 2 | 4 | 0 |
    | Postres | 0 | 14 | 2 |
    | Infusiones | 0 | 10 | 0 |

    Total: **12 reales + 45 placeholders**, sin NaN, sin fallback y sin errores de consola (salvo el `sw.js` local).
- **Siguiente**: 2. Migración 0006 (total en servidor).
- **CI**: la primera corrida en GitHub falló porque Node 22 no acepta un directorio en `node --test test/`; en local tengo Node 26, que sí lo acepta. Se arregló con un glob (`aa3e884`) y **CI quedó en verde**: test, lint y build completo con service worker en Linux.

## Iteración 2 — `0006_validar_total_orden.sql` (archivo, NO aplicada) (01/oct/2026)
- **Objetivo**: deuda #1. El total lo decide el servidor (decisión de Reiner: recalcular y rechazar ids inválidos, no disponibles o con cantidad ≤ 0).
- **Archivo**: `supabase/migrations/0006_validar_total_orden.sql`. Es un trigger `BEFORE INSERT` (SECURITY INVOKER, `search_path` fijo) que:
  - valida 1–50 líneas, que el id exista y esté `disponible`, y que la cantidad sea un entero entre 1 y 50;
  - reescribe `nombre`/`precio` de cada línea desde `productos` y **pisa `total`**;
  - recorta `nombre_cliente` a 60 caracteres y rechaza uno vacío;
  - conserva `finca`/`taza`, recortados.
  - Trae documentados la verificación y la reversión.
- **Verificación sin producción**: Postgres real en WASM (PGlite 0.5.8, solo en el scratchpad) con stubs mínimos de `auth`/`storage`, roles `anon`/`authenticated` y las migraciones 0001–0005 **tal cual están en el repo**. Insertando como `anon`, **17/17 casos OK**:
  - un total de 0.01 sale recalculado a 10.20;
  - rechaza: id inexistente, agotado, cantidades 0, -1, 1.5, "2" y 51, pedido vacío, 51 líneas y nombre vacío;
  - el nombre se recorta a 60;
  - los rechazados no consumen número de orden;
  - el bloque de verificación de la migración devuelve `total=6.00 · precio=3.00` sin dejar filas.
- **Cliente**: sin cambios. El carrito ya manda `cantidad` entera y el Ticket muestra la fila que devuelve el INSERT, o sea el total del servidor.
- **Siguiente**: 3. `0007_rpc_obtener_orden.sql`.

## Iteración 3 — `0007_rpc_obtener_orden.sql` (archivo, NO aplicada) (01/oct/2026)
- **Objetivo**: preparar el cierre de la lectura pública de `ordenes` (deuda #2) **sin tocar la policy ni el cliente** (decisión de Reiner: el Ticket depende de ella).
- **Archivo**: `obtener_orden(p_id uuid)`, SQL `stable`, SECURITY DEFINER, `search_path` fijo. Devuelve una sola fila con columnas mínimas: **sin `nombre_cliente` ni `items`**. `revoke … from public` + `grant execute` a anon/authenticated. La migración trae documentado el plan de cierre en 3 pasos (RPC `crear_orden` → Ticket por RPC → drop de la policy), además de la verificación y la reversión.
- **Verificación (PGlite, 0001–0007)**:
  - anon lee su orden con el total ya recalculado por 0006 (3.00), sin nombre ni items;
  - un id inexistente devuelve 0 filas y un parámetro que no es uuid se rechaza por tipo;
  - las 3 policies de `ordenes` quedan intactas;
  - `public` no tiene EXECUTE y `anon` sí;
  - 0006 se re-corrió: 17/17.
- **Nota**: el advisor "anon can execute SECURITY DEFINER" la va a listar. Es intencional y queda documentado en el archivo.
- **Siguiente**: 4. Confirmar por SELECT el email del admin y escribir 0008/0009.

## Iteración 4 — staff/roles: `0008_staff_roles.sql` + `0009_endurecer_rls_staff.sql` (archivos, NO aplicados) (01/oct/2026)
- **Confirmación previa por SELECT (solo lectura, pedida por Reiner)**: `reinerramos2702@gmail.com` existe, está confirmado y es la **única** cuenta de `auth.users` (total 1, otras 0, último acceso 25/ago). Es la cuenta del Admin.
- **Advisors antes (lectura, inicio de sesión)**:
  - `rls_enabled_no_policy`: `ordenes_contador`. Intencional.
  - `function_search_path_mutable`: ×2.
  - `anon/authenticated_security_definer_function_executable`: `asignar_numero_orden` y `marcar_comprobante_subido`.
  - `auth_leaked_password_protection`: desactivado.
- **0008 (aditiva)**:
  - tabla `staff`, con RLS que deja leer solo la fila propia y sin escritura por API;
  - `es_staff()` y `es_admin()`, SECURITY DEFINER, solo para authenticated;
  - **siembra de Reiner como admin** (email en minúsculas, idempotente);
  - `search_path` fijo en las 2 funciones del advisor;
  - `REVOKE EXECUTE` en las 2 funciones de trigger;
  - plantilla SQL para dar de alta y de baja a un barista.
- **0009 (endurecimiento)**:
  - **candado** como primera sentencia (aborta si falta `staff` o no hay ningún admin);
  - `productos` escritura → `es_admin()`;
  - `ordenes` update → `es_staff()` y **privilegio por columna** (solo `estado` y `comprobante_*`);
  - `comprobantes` y la imagen en storage → `es_staff()`;
  - **no toca** la lectura ni la inserción públicas de `ordenes` ni la subida del cliente;
  - reversión exacta documentada en el archivo.
- **Verificación (PGlite, 0001–0009, usuarios Reiner/barista/intruso): 26/26 OK**.
  - Candado: aborta sin admin y sin 0008; las policies quedan idénticas.
  - Clientes anónimos: siguen pidiendo, leyendo y subiendo comprobantes, y los triggers disparan aunque EXECUTE esté revocado.
  - RPC: las 2 funciones de trigger ya no son llamables.
  - Intruso autenticado: no ve staff, no se auto-asigna admin y no edita productos, órdenes ni comprobantes.
  - Barista: mueve estados y ve comprobantes, pero no edita productos ni puede subirse a admin.
  - Admin: edita productos. **Ni el admin reescribe `total`/`items`** de un pedido.
  - La reversión de 0009 vuelve al estado previo.
- **Riesgo marcado**: 0009 se aplica **solo** después de leer `select s.rol, u.email from staff s join auth.users u on u.id=s.user_id` y ver `admin · reinerramos2702@gmail.com`.
- **Siguiente**: 5. UI de login del equipo + ruta protegida.

## Iteración 5 — login del equipo (`/equipo`) + ruta protegida (01/oct/2026)
- **Discrepancia resuelta con Reiner**: por la API, Supabase **nunca** devuelve `42P01` para una tabla ausente. Devuelve `PGRST205` (HTTP 404, "Could not find the table 'public.staff' in the schema cache"), verificado con un GET de solo lectura en producción. Decisión: el fallback acepta `PGRST205` **o** `42P01` **solo si el mensaje o el detalle nombran la tabla `staff`**. Cualquier otro error (red, permisos, JWT, otra tabla) **deniega el acceso**.
- **⚠ TODO retirar el fallback**: `src/equipo/rol.js` → `resolverRol()`, marcado `TODO(0008)`. Mientras falte 0008, una sesión válida sin tabla `staff` entra como admin. No abre nada nuevo: sin 0008/0009, la RLS vigente ya es "cualquier authenticated". **En cuanto 0008 esté aplicada en producción**, borrar esa rama y su test.
- **Error al leer el rol (code review)**: red, timeout o 5xx → pantalla "Sin conexión" con **Reintentar**, no "Sin acceso" (`resolverRol` → `error: true`).
- **El gate es UX, no seguridad**: lo dice el código (`rol.js`, `EquipoApp.jsx`). La seguridad real es la RLS de 0008/0009.
- **Archivos**:
  - `src/equipo/rol.js`: `resolverRol`, `esTablaStaffAusente`, `vistaInicial`.
  - `src/equipo/ruta.js`: `rutaEquipo`. Decide desde la URL si va el equipo o el cliente: `/equipo`, `#barra`/`#admin`, `?equipo|barra|admin=1` y la vuelta de recuperación.
  - `src/equipo/LoginEquipo.jsx`: escena + formulario + CSS.
  - `src/equipo/EquipoApp.jsx`: sesión → rol → vista. Selector para admin, "Sin acceso" para los demás, Barra/Admin adentro.
  - `src/main.jsx`: `EquipoApp` en un **chunk diferido** (7.66 KB gzip); el cliente no lo descarga.
  - `src/App.jsx`:
    - `MARCA_FIJA` (verde, verde profundo, Mocotíes, crema, hueso, tinta, panel y terracota) en **los dos temas** de `PALETAS`;
    - Admin y Barra sin login propio; se borraron `AdminLogin`/`AdminNuevaClave`, que reemplaza la recuperación del equipo;
    - `#admin` dejó de ser un tab del cliente; el engranaje de Club lleva a `/equipo#admin`;
    - "Volver" en Barra para el admin; botones "Cerrar sesión" con aria;
    - exports para el módulo, sin ciclo de imports.
  - `test/rol.test.js` + `test/ruta.test.js`: incluyen los 4 casos pedidos (PGRST205 de staff, 42P01 de staff, error de red, PGRST205 de otra tabla) + permisos, sin fila y rutas.
- **Diseño y motion**:
  - Siempre `PALETAS.oscuro`; colores solo vía variables `--eq-*` desde tokens (cero hex en el módulo).
  - Tarjeta verde profundo al 84% con borde crema al 25% y radio 28; **sin blur ni backdrop-filter**.
  - Botón con degradado verde marca → Mocotíes → profundo, texto hueso y anillo crema; nada de ámbar. Terracota solo en el borde de error.
  - `<picture>` mobile/desktop sin las versiones "-con-logo"; velo verde profundo/tinta (35% → 85%) + tinte `mix-blend-mode: color` de marca; degradado de respaldo si la imagen falla.
  - Logo real con `srcset` a `icon-512` (escalado 1.21: el PNG trae 16 px de margen blanco, medido).
  - Motion: logo con spring, tarjeta que sube, 16 estrellas que titilan, "vertido" dentro del botón mientras carga, temblor en el error, View Transitions entre vistas (si no hay soporte, cambio directo). Todo `transform`/`opacity` y apagado con `prefers-reduced-motion`.
  - Accesibilidad: labels reales, ojo con `aria-pressed`/`aria-controls`, `role=alert`, `aria-invalid`, foco al cambiar de modo (no al montar, para que el teclado no tape la escena en el móvil), `:focus-visible` crema y safe-area.
- **Verificación** (Chrome headless sobre `vite preview`):
  - Textos pedidos presentes, sin "Crear cuenta" y sin errores de consola, a 390×844 y 1440×900.
  - Ojo: `password → text`, `aria-pressed=true`.
  - **Login real contra Supabase Auth con un email inventado** → "No pudimos iniciar sesión. Revisa tus datos e intenta de nuevo.", `aria-invalid=true`. "¿Olvidaste…?" pasa a "Recuperar contraseña" con foco en el email (no se envió nada).
  - **Gate** con sesión inventada y respuestas de `/rest/v1/staff` interceptadas en el navegador:
    - PGRST205 de staff → selector;
    - PGRST205 de otra tabla → denegado;
    - sin fila → denegado;
    - barista que pide `#admin` → barra;
    - admin con `#admin` → panel;
    - `/#barra` viejo → barra.
    - Sin interceptar, un JWT inválido real (401) → denegado.
    - **Red caída** → denegado tras ~7 s: `postgrest-js` reintenta 3 veces (1/2/4 s) antes de devolver el error. Comportamiento correcto; anotado.
  - **Contraste AA medido sobre píxeles reales** (fondo semitransparente sobre la escena), peor caso: título 10.9, subtítulo 6.5, labels 9.2, botón 6.8, enlace 9.5, nota 5.5. Todos ≥ 4.5.
  - **Predominio de verde**: 98.2% (móvil) / 99.5% (escritorio) de los píxeles con color, **0% azul**, ámbar 0.5–1.8% (luna y ventanas). El tinte alcanza; no hace falta regenerar el fondo.
  - Cliente `/`: sin login visible ni errores.
  - test 19/19; lint 0 errores; build OK. Bundle principal **152.98 KB** (−0.88 KB: salió el login viejo) + chunk del equipo 7.66 KB diferido.
- **Pendiente**: el login con una cuenta real (Reiner) no se probó, porque no se usan contraseñas reales. Va en el Bloque 2 del reporte.
- **Siguiente**: 6. Revisión de seguridad + edge function.

## Iteración 6 — endurecimiento de `verificar-comprobante` + revisión de seguridad (01/oct/2026)
- **Objetivo**: deuda #3. La función corría con `verify_jwt = false` y CORS `*`, sin límite de gasto de Gemini.
- **Archivos**:
  - `supabase/functions/verificar-comprobante/origen.js` (nuevo, JS puro, testeado en CI): allowlist con producción `workers.dev`, previews `*-quadro-cafe…workers.dev` y localhost 5173/4173. Se reemplaza con el secret opcional `ALLOWED_ORIGINS`.
  - `index.ts`:
    - CORS por origen con `Vary: Origin`; un Origin ajeno recibe **403** y las peticiones sin Origin (no navegador) siguen;
    - **tope global** `OCR_MAX_POR_HORA` (por defecto 30) contado en `comprobantes` (`detalle` no nulo, última hora) **antes** de descargar la imagen o llamar a Gemini. Si se pasa, o si falla el conteo (cerrado por defecto), deja `sin_lectura` y la barra verifica a mano.
  - `test/origen.test.js`: 6 tests, incluidos orígenes trampa (`…workers.dev.evil.example`, `http://`, subdominio con punto, `null`).
- **Verificación**:
  - test 25/25.
  - `deno check` OK (Deno 2.9.6 desde npm, en el scratchpad).
  - **Función real corriendo en Deno local**:
    - origen ajeno → 403 sin `Allow-Origin`;
    - producción → 200 con `Allow-Origin` exacto;
    - preview → permitido;
    - sin Origin → sigue (405 a GET).
  - **Tope, con PostgREST/Storage simulados en Node** (Gemini nunca llamado, nada real):
    - 30 lecturas/hora → `sin_lectura` "tope de 30 lecturas por hora alcanzado" **sin pedir la imagen**;
    - 5 lecturas/hora → pasa el tope y llega a Storage.
    - El conteo usa `detalle=not.is.null&actualizado_en=gte.<hace 1 h>`.
- **Revisión de secretos**: grep de JWT/`sb_secret_`/`AIza`/`sb_publishable_`/`GEMINI_API_KEY=` sobre todo lo trackeado y el diff de la sesión → **0 hallazgos**. Solo está trackeado `.env.example`, con placeholders.
- **Deploy**: **no se desplegó**. Va al lote final para Reiner, con el comando `--no-verify-jwt`. Hasta entonces sigue la v3 (CORS `*`, sin tope).
- **Siguiente**: code review del diff de la sesión → docs → UI premium.

## Iteración 7 — docs sincronizados (01/oct/2026)
- Lo que estaba desactualizado:
  - ROADMAP: pasos manuales rehechos con el lote real; stack correcto ("inline", no Tailwind); `productos` con 12 filas.
  - CLAUDE.md: estado de Supabase, bundle e Infusiones.
  - README: `/equipo`, `npm test`/`lint`.
  - Tabla "Lote de migraciones" arriba en este archivo. Commit `b56fd7e`.

## Iteración 7b — code review del diff de la sesión (`/code-review medium 91dc218..HEAD`) (01/oct/2026)
Verificó que están bien: el formato de líneas que espera 0006, que 0009 cubre el UPDATE de la Barra, los nombres de función de 0005/0008, el hash `type=recovery` y que el regex de CORS no matchea de más. Encontró **3 problemas reales, todos corregidos**:
1. **(Medio) El tope de OCR contaba todo cierre, no solo las llamadas a Gemini.** Cada rechazo por tope renovaba la ventana: con tráfico sostenido el OCR quedaba apagado para todos, y un atacante podía apagarlo a propósito con 30 órdenes basura por hora.
   - Fix: contar solo `detalle->>modelo` no nulo. Solo los cierres posteriores a Gemini (éxito, HTTP de error, timeout, respuesta rara) guardan `modelo`; los previos (sin key, sin imagen, el propio tope) no.
   - Verificado: `deno check` OK y la función en Deno local manda `detalle->>modelo=not.is.null` en el conteo.
2. **(Bajo) Un error transitorio al leer el rol dejaba "Sin acceso" sin salida.**
   - Fix: `resolverRol` devuelve `error: true` en los errores de lectura. `EquipoApp` muestra **"Sin conexión"** con un botón **Reintentar** (vuelve a pedir el rol) además de "Cerrar sesión"; "Sin acceso" queda solo para "sin fila en staff".
   - Verificado en Chrome: red caída → "Sin conexión"; red de vuelta + Reintentar → selector. Tests actualizados (25/25).
3. **(Bajo) `html,body{background:var(--eq-tinta)}` nunca aplicaba**: las variables viven en un descendiente.
   - Fix: el valor del token se inyecta directo (`PALETAS.oscuro.tinta`). Verificado: `rgb(11,15,13)` en `html` y `body`.

## Iteración 8 — UI premium con motion: capa transversal "Fase 8" (01/oct/2026)
- **Decisión sobre librerías: 0 nuevas.**
  - Todo lo que pide la fase (tinta al tocar, inclinación, revelado por scroll, tipografía cinética, split-flap, View Transitions, entradas con `@starting-style`) sale con CSS/HTML moderno y ~1.5 KB gzip.
  - `motion` (LazyMotion + domAnimation, ~20–43 KB gzip según el issue motiondivision/motion#1585, ya evaluado en la Fase 2) y `@formkit/auto-animate` (~3 KB) quedan disponibles si una pantalla los pide de verdad. Hoy no hace falta ninguno.
- **Archivos**: `src/App.jsx`. El bloque `CSS_MOTION_V2(C)` queda **centralizado** y lo inyecta `buildCss`; los colores salen de `PALETAS` (cero hex).
  - Clases: `.mo-ink` (tinta en el punto de toque), `.mo-lift`, `.mo-tilt` (solo puntero fino), `.mo-reveal` (`animation-timeline: view()` con `@supports`), `.mo-aparece` (`@starting-style`), `.mo-brillo`, `.mo-palabra`/`.mo-linea`, `.mo-flap` y `.mo-caer`, más tokens para `::view-transition-*`.
  - Delegados únicos por raíz: `manejarTinta` (pointerdown) y `manejarTilt`/`soltarTilt`.
  - Helpers: `conTransicion` (View Transitions con fallback directo; lo usa también `/equipo`) y `PalabrasCineticas`.
  - Háptica opt-in (`vibrar`, atada al mismo toggle que el sonido; iOS no la expone).
  - Arreglos de paso:
    - **margen blanco de 8 px del `body` en la app del cliente** (preexistente): `html,body{margin:0}` con el fondo del tema;
    - la regla global de reduced-motion ahora fuerza `animation-iteration-count:1`. Antes, las animaciones infinitas (`.pulse`, `.drip`, `.mo-skeleton`…) seguían en bucle a .001 s con reduced-motion.
- **Hallazgo de entorno (importante para Reiner)**: Chrome en esta PC reporta `prefers-reduced-motion: reduce` porque **Windows tiene las animaciones apagadas** (Configuración → Accesibilidad → Efectos visuales). En este equipo la app se ve **sin animaciones** a propósito. Para ver el motion hay que activar "Efectos de animación". Desde aquí las verificaciones de motion emulan `no-preference` y el modo reducido se prueba aparte.
- **Verificación**:
  - test 25/25; lint 0 errores; build OK (bundle **154.43 KB**, +1.46 KB por toda la capa; tope 170).
  - Tinta: un pointerdown real en el botón "Entrar" escribe `--tx: 40px`, `data-ink=a` y la animación `qc-ink-a 0.56s`.
  - Cliente: `body` con margen 0 y fondo del tema.
  - Sin errores de consola.

### 8.1 Inicio
- Titular cinético: "El sabor / tiene una / geometría." entra palabra por palabra desde su propia línea (`PalabrasCineticas` + `.mo-linea`/`.mo-palabra`, escalonado de 90 ms, `aria-label` con la frase completa). "geometría." sigue en `UnaLinea`: su padre pasa a ser la `.mo-linea` (bloque), así que la medición de ancho no cambia (30 px a 390, igual que antes).
- Banner del Club con `.mo-brillo` (destello cada ~5 s) y tinta; tinta también en "Simular vertido", en la tarjeta del lote y en `Chip` (compartido con Carta).
- **2 regresiones encontradas en las capturas y corregidas**:
  1. el `nbsp` entre palabras caía en una fuente de respaldo más ancha ("EL    SABOR"), así que ahora va un espacio normal entre `inline-block`;
  2. `.mo-ink` (`overflow:hidden`) volvía `min-width` a 0 en los chips (ítems flex) y se cortaban ("PUNTO C…"). `Chip` lleva `flexShrink: 0`.
  - La tilde de "GEOMETRÍA" no se recorta: `.mo-linea` tiene padding vertical compensado con margen negativo.
- Verificado en los dos temas a 390 (a mitad de animación y asentado), sin errores de consola. Bundle 154.58 KB.

### 8.2 Carta
- **Foto y nombre compartidos tarjeta → detalle** con View Transitions (`view-transition-name: foto-<id>` / `nombre-<id>`; abrir y volver pasan por `conTransicion`). Sin soporte o con reduced-motion: cambio directo, como antes.
- **Inclinación 3D + elevación** (`.mo-tilt`) que sigue al mouse, solo con `(hover:hover) and (pointer:fine)`. En táctil la tarjeta queda con `transform: none` (verificado con emulación táctil).
- **Revelado por scroll** (`.mo-reveal`) en un wrapper aparte: una animación con fill fijaría `transform:none` sobre la tarjeta y anularía la inclinación.
- Sin cambios de lógica: precios, carrito, fly-to-cart, agotados y "Próximamente" intactos.
- Verificado a 1440×900:
  - mouse sobre la tarjeta → `--rx 1.80deg / --ry 2.45deg`;
  - abrir Cortado dispara 1 View Transition con `foto-m5`; la captura a mitad muestra la foto creciendo.
  - Sin errores. Bundle 154.69 KB.

### 8.3 Carrito y Ticket
- **Carrito**:
  - las filas entran escalonadas;
  - el total "late" al cambiar (`useRetriggerAnim(total, "mo-late")`);
  - "Enviar a barra" con tinta y **llenado** (`.mo-llenado`: una lámina sube mientras envía, `aria-busy`);
  - los métodos de pago con tinta.
- **Ticket**:
  - el número de orden entra en **split-flap**, dígito por dígito (`.mo-flap`, `aria-label` con el número entero);
  - una **línea de vertido** une los pasos y crece con `scaleY(paso/total)` según el estado real de Realtime;
  - los checks entran con pop.
- **Conflicto evitado**: animar cada fila de pasos con `.rise` (fill both → `opacity: 1`) pisaba el `opacity: .35` de los pasos pendientes. La entrada va en el contenedor.
- Verificado con el pedido **interceptado** en el navegador (POST a `ordenes` respondido en local, nada insertado), en los dos temas: total 10.2, 4 dígitos con aria, opacidades 1/1/.35/.35, línea `scaleY(1/3)` en "moliendo", sin errores.
- La lógica de pedido, precios y Supabase no cambió.

### 8.3b Hallazgo y arreglo de tipografía (preexistente, verificado por CDP)
- **Fraunces nunca cargó en producción.** En `FONTS` el `@import` de Google Fonts iba **después** de los `@font-face`, y por spec un `@import` que no encabeza la hoja se ignora.
  - Verificado: 0 reglas `@import` en las hojas y 0 peticiones a Google Fonts. `CSS.getPlatformFontsForNode` mostraba que "geometría." (`.script`) se dibujaba en **Times New Roman**.
  - Fix: el `@import` pasa primero. Ahora hay 1 regla `@import`, peticiones a fonts.googleapis/gstatic y "geometría." con **Fraunces SemiBold** (lo que siempre documentó CLAUDE.md).
- **Dígitos en títulos**: VIOLA no trae números, así que caen al respaldo, y `font-size-adjust: from-font` los agranda ~1.6–1.7× (usa la x-height de VIOLA, que es unicase). En el Ticket, el "#027" pisaba "ORDEN".
  - Fix acotado: `fontSizeAdjust: "none"` **solo en el número del Ticket**, que ya estaba en esta fase.
  - **Quedan igual, pregunta para Reiner**: "V60" en Carta y el "#007" de la Barra. No se tocó la tipografía de la "É" (punto 15).

### 8.4 Fincas
- Retrato real del caficultor con **Ken Burns** lento (`.mo-kenburns`: zoom 1 → 1.07 y leve desplazamiento en 16 s, ida y vuelta, solo transform): el retrato "respira".
- Tinta en el retrato ("Hablar con…") y en "Ver guion". Los chips de finca usan `Chip` (tinta + `flexShrink: 0`).
- No se tocó el avatar D-ID, el guion ni los datos.

### 8.5 Aula
- "Tu avance": la barra pasa de animar `width` a `scaleX` (regla de la fase: solo transform/opacity).
- Chispas que suben de la llama de la racha (3 puntos que reusan `.steam`).
- Destello sobre la insignia desbloqueada y tinta en las tarjetas de lección.

### 8.6 Tienda y Club
- Tienda: destello desfasado sobre cada tarjeta "Próximamente" (`--brillo-delay` por tarjeta). Sin datos nuevos.
- Club: tinta en "Quiero mi guía". El copy no se tocó (decisión del 18/sept).
- Verificado (8.4–8.6) en los dos temas a 390, sin errores de consola. Bundle 155.25 KB.

### 8.7 Barra y Admin
- **Barra**: cada orden entra "cayendo y asentándose" (`.mo-caer`) y la etiqueta de estado hace pop cada vez que avanza (`key` por estado). "Avanzar a…" lleva tinta.
- **Admin**: la perilla del switch "Disponible hoy" pasa de animar `left` a `translateX` con spring, y el botón ahora es `role="switch"` con `aria-checked` (lo anuncia bien un lector de pantalla).
- Verificado con sesión inventada y **datos simulados en el navegador**: `staff`/`ordenes`/`productos` interceptados, Realtime bloqueado, nada real leído ni escrito. Barra a 1280×800 y Admin a 390×844, en los dos temas: 2 órdenes animadas, "Volver" presente, switches `aria-checked` true/false con `translateX(16px)`/`none` y foco de teclado OK. Sin errores. Bundle 155.30 KB.
- Lógica de órdenes, precios y Supabase sin cambios.

### 8.8 Regresión final de la fase UI
- **36 capturas** (9 pantallas × 2 temas × 390×844 y 1440×900) con **0 errores de consola**, más la pasada con `prefers-reduced-motion: reduce` (contenido visible y quieto, 0 errores).
- Revelado por scroll: en Postres, la última tarjeta arranca con opacidad 0 y queda en 1 al llegar con el scroll (no se queda invisible).
- CI de GitHub en verde en todos los commits de la fase.
- Login (8.0, iteración 5): AA medido sobre píxeles (peor caso 5.5) y verde ≥ 98%.
- **Bundle final: 155.30 KB gzip** (línea base 153.73; tope 170). Chunk de `/equipo`: 7.68 KB, diferido.
- **Pantallas pendientes de la fase: ninguna** de la lista (Inicio, Carta, Carrito, Ticket, Fincas, Aula, Barra/Admin, Login). Lab no estaba en la lista y no se tocó, más allá de lo transversal: chips y reduced-motion.

---

## Cierre del loop (01/oct/2026)
- **META**: build OK; cliente implementado; migraciones preparadas y **no aplicadas**; login del equipo funcionando contra Supabase Auth sin crear usuarios (verificado el camino de error real); paleta verde verificada; docs sincronizados; deuda de seguridad actualizada. **Cumplida.**
- Tareas bloqueadas: **ninguna**.
- Lo que queda es de Reiner: ver el "Lote de migraciones" arriba y el Bloque 2 del reporte final.
