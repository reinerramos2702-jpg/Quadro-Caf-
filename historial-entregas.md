# Historial de entregas — Quadro Café

Registro de cada deploy a producción: qué rama, qué cambió, resultado de verificación, y qué quedó pendiente. Una entrada por entrega, más reciente arriba.

---

## 2026-08-31 — Pill envuelve ícono+label, nav inferior fijo

- **Rama**: `quadro-feature-nav-pill-v2` → mergeada a `main` con `--no-ff` (commit `6458901`), pusheada a `origin/main`.
- **Qué cambió** (2 pedidos del dueño sobre la entrega anterior):
  1. La pill del nav pasó de envolver sólo el ícono (círculo fijo de 40px) a envolver ícono+label juntos — ahora un óvalo dimensionado sobre el botón más ancho de los 5 tabs (`ORDEN_TABS`), para que el desplazamiento entre tabs siga siendo un `translateX` puro sin animar `width`/`left`. Contraste ajustado: ícono **y** label activos pasan a `C.onBrand` (antes el label quedaba fuera de la pill y usaba `C.brand`).
  2. El nav inferior pasó de ser un flex-item (`flexShrink:0`, compartiendo el alto de la columna con `main`) a `position:"absolute"` anclado al frame del teléfono — queda siempre visible, inmune al bug clásico de `100vh` + barra de direcciones móvil que puede empujar el último elemento de un layout flex fuera de la pantalla visible al scrollear. El padding-bottom (~100-120px) que cada `.qc-scroll` de la app ya reservaba de entregas anteriores sirvió de zona segura sin tocar layout de las pantallas individuales.
- **Verificación**:
  - `npm run build`: verde (mismo fallo cosmético conocido de `sw.js`, no relacionado).
  - Visual (Chrome headless por CDP, driver propio, tema forzado por `localStorage.qc-tema`) en **Inicio y Fincas, ambos temas** (4 combinaciones): pill legible envolviendo ícono+label en los 4 casos, y comprobación numérica de que el nav no se mueve con el scroll — `getBoundingClientRect().top/bottom` del nav idéntico antes y después de un scroll real aplicado (308px en Inicio, 58px en Fincas) en los 4 casos. Cero errores de consola.
  - Lighthouse antes/después, local vs. local (`vite preview`, `main` pre-merge como "antes", rama de feature como "después"):

    | | Performance | Accessibility | Best Practices | SEO |
    |---|---|---|---|---|
    | Antes (mobile) | 48 | 100 | 96 | 100 |
    | Después (mobile) | 53 | 100 | 96 | 100 |
    | Antes (desktop) | 69 | 100 | 96 | 100 |
    | Después (desktop) | 69 | 100 | 96 | 100 |

    Sin regresión (Performance sube o igual, Accessibility en 100 en los 4 casos, por encima del piso de 98).
- **Glitch conocido pendiente**: ninguno.
- **Deploy**: `npx wrangler deploy` → `https://quadro-cafe.reinerramos2702.workers.dev`, Version ID `6f45d479-c2e9-4149-87d2-75a1d31bb54f`. Confirmado en producción: HTTP 200, sirviendo `index-DEpkGCB9.js` (mismo hash subido por Wrangler).

---

## 2026-08-31 — Pill líquida en el nav inferior

- **Rama**: `quadro-feature-nav-liquido` → mergeada a `main` con `--no-ff` (commit `73527b3`), pusheada a `origin/main`.
- **Qué cambió**: el indicador de tab activo del nav inferior (antes un underline de 14×2px, Fase 7 "Alta Gama") pasó a ser una pill circular de 40px que se desplaza con `transform:translateX` (`--ease-spring`) y asoma por encima del borde del nav, con un efecto de "squish" retriggereado (`qc-navpill-squish`) al cambiar de tab — evolución del sistema de motion existente, sin librerías nuevas, sin filtro SVG gooey. Fix incluido en la misma entrega: la elevación de la pill se bajó de `top:-18` a `top:-10` tras encontrar en verificación visual que se montaba sobre el chip "Espiral continua"/"Punto central" de Inicio.
- **Verificación**:
  - `npm run build`: verde (falla solo el paso cosmético y ya documentado de `sw.js` por el apóstrofo de la carpeta — no relacionado, `dist/` se genera igual).
  - Visual (Chrome headless por CDP, driver propio sin dependencias, tema forzado por `localStorage.qc-tema`): confirmado en claro y oscuro, sin overlap sobre contenido real tras el fix, cero errores de consola.
  - Lighthouse antes/después, local vs. local (`vite preview`, mismo entorno en ambos lados — nada estaba pusheado al momento de medir):

    | | Performance | Accessibility | Best Practices | SEO |
    |---|---|---|---|---|
    | Antes (mobile) | 48 | 100 | 96 | 100 |
    | Después (mobile) | 50 | 100 | 96 | 100 |
    | Antes (desktop) | 69 | 100 | 96 | 100 |
    | Después (desktop) | 69 | 100 | 96 | 100 |

    Sin regresión (Performance sube o igual, Accessibility en 100 ambos lados, por encima del piso de 98 documentado en `CLAUDE.md`). Nota: estos números salen más bajos que los 61 mobile/68 desktop de la auditoría Track A porque esa corrió contra producción (CDN) y esta corrió local — comparación antes/después es apples-to-apples, pero no comparable en valor absoluto contra Track A.
- **Glitch conocido pendiente**: ninguno — el overlap encontrado en la verificación visual se corrigió en esta misma entrega (ver arriba), no quedó pendiente.
- **Deploy**: `npx wrangler deploy` → `https://quadro-cafe.reinerramos2702.workers.dev`, Version ID `03671d5e-e1cb-4652-8e58-b839af442a39`. Confirmado en producción: HTTP 200, sirviendo `index-D_szBi-v.js` (mismo hash subido por Wrangler).
