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
