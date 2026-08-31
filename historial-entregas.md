# Historial de entregas — Quadro Café

Registro de cada deploy a producción: qué rama, qué cambió, resultado de verificación, y qué quedó pendiente. Una entrada por entrega, más reciente arriba.

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
