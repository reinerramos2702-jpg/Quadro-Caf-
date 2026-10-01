# PROGRESO-LOOP — rama `quadro-feature-reunion-05sept`

Bitácora del loop largo que arrancó el 01/oct/2026. Hay una entrada por iteración. Plan aprobado: deuda de seguridad, login del equipo con roles y, al final, UI premium con motion.

Guardarraíles: no se hace merge ni push a `main`, ni `wrangler deploy`, ni `supabase db push`. **No se aplica SQL en producción durante el loop**: las migraciones quedan como archivos y van en un lote ordenado para Reiner. No se escriben secretos y la RLS nunca se abre más.

Línea base del bundle principal: **153.73 KB gzip** (`index-*.js`, medido en la iteración 0). La referencia de 147.99 KB del 18/sept es anterior a los 45 placeholders y sus fotos. Tope de la fase de UI: 170 KB.

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
