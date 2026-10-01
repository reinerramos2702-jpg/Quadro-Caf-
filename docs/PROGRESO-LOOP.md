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
