# Brief · Carta premium · PR-1

Recibido de Reiner el 01/oct/2026 y guardado tal cual, para que una sesión nueva lo ejecute después de un `/clear`. **Ejecutado el 01/oct/2026** en la rama `quadro-feature-carta-premium` (PR sin merge): ver `docs/ESTADO-SESION.md` y `docs/PROGRESO-LOOP.md`.

Punto de partida:
- **Rama:** `quadro-feature-carta-premium`, creada desde `main` en `f7d8aba`.
- **Merges a `main`:** el PR #8 (`quadro-feature-reunion-05sept`) ya está fusionado.
- **Supabase:** 0003 aplicada y edge function `verificar-comprobante` en v4.
- **Cambios sin commitear que no son míos:** `docs/ROADMAP.html` es de Reiner (desde el Chat). Va con este PR solo cuando se edite en la sección 9.

---

Eres el desarrollador senior de Quadro Café (Vite + React 18 PWA; `src/App.jsx` + `src/equipo/`; Supabase `wckufllomfmuwxptegvm`; Cloudflare Workers Builds, main se despliega solo). Esta sesión entrega el PR-1 de la Carta premium. Trabaja con buenas prácticas, en español de verdad (tildes y ortografía impecables en todo texto visible), y deja la documentación al día.

## 0. Reglas de sesión (obligatorias)
- Rama: `quadro-feature-carta-premium` (ya creada desde main f7d8aba). Un commit por punto, mensajes claros. NO merges, NO push a main, NO toques otra rama. Al final: push de la rama y PR contra main SIN merge.
- No toques `.agents/`, `AGENTS.md`, `docs/ROADMAP.backup-01oct*.html`. `docs/ROADMAP.html` y `docs/ESTADO-SESION.md` los actualizas al final (sección 9).
- No toques: carrito/checkout, Supabase (sin migraciones en este PR), edge functions, login `/equipo`, Admin, Barra, D-ID, push. Si algo de esto te estorba, lo reportas, no lo cambias.
- Sin blur en imágenes. Sin estrellas, sin descuentos falsos, sin escasez falsa. Sin librerías nuevas. Bundle del chunk principal: máximo +8 KB gzip respecto a main; si lo superas, lo explicas y recortas.
- No inventes datos: nombres, descripciones, precios y estados salen de lo que ya existe. Lo que no exista, no se muestra.
- No pidas permiso por cada paso; detente solo si hay una decisión irreversible o algo fuera de alcance.

## 1. Fase 0 · Leer y reportar (sin editar)
Lee `docs/ESTADO-SESION.md`, `src/App.jsx` (Carta, `DetalleProducto`, lista, chips, nav inferior, cabecera), `src/equipo/` solo para ubicar estilos compartidos, y los estilos globales. Reporta en 15 líneas máximo:
1. Dónde se renderiza la lista de la Carta, la tarjeta de producto, los chips, el detalle y la barra inferior.
2. Qué contenedor hace scroll (window o un div interno) y cómo se monta/desmonta el detalle.
3. Qué lógica esconde la barra inferior al hacer scroll.
4. Cuántas fotos hay realmente (el mapeo dice 48; Reiner habló de 50): productos SIN foto y fotos huérfanas. Cuántos productos hay (57 esperados; 45 "Próximamente").
5. Cómo se calcula el estado de cada producto (disponible, agotado hoy, próximamente, precio por confirmar, personalizable como V60).
Luego continúa con el plan sin esperar respuesta, salvo bloqueo real.

## 2. Problemas reales a corregir (capturas en celular, producción)
1. "POR CONFIRMAR" aparece arriba a la derecha de la tarjeta, se sale de la tarjeta y de la pantalla, en mayúsculas con espaciado enorme. Pasa en Latte, Macchiato, Matcha latte, Chocolate caliente, Americano, etc.: es un patrón general.
2. Además aparece "PRECIO Y RECETA POR CONFIRMAR" como línea completa abajo: duplicado e innecesario.
3. Badge "Próximamente" compite con el nombre en la misma línea; nombres de hasta 5–6 líneas.
4. Productos reales (Cold Brew 18h, Tónica de cascarilla, Latte de cascarilla) sin miniatura; solo la tienen los "Próximamente". Miniatura chica (~48 px).
5. Fotos apagadas por el gris de las tarjetas "Próximamente".
6. Chips de categoría cortados a ambos lados y tapados por la cabecera fija.
7. Al abrir un producto y volver con atrás, la lista se reinicia arriba.
8. La barra inferior (Inicio, Carta, Fincas, Tienda, Lab, Aula) se esconde al hacer scroll hacia abajo.

## 3. Tareas (un commit por punto, en este orden)

### T1 · Componente único `ProductCard` con 4 estados
Una sola jerarquía visual (foto > nombre > precio/estado). Estados:
- Disponible: foto 1:1 de 88–96 px a la izquierda (`object-fit: cover`, `width`/`height` explícitos, `loading="lazy"`, `decoding="async"`), nombre máx. 2 líneas (`line-clamp: 2`), descripción máx. 2 líneas, precio abajo a la izquierda y "+" a la derecha (>= 44 px). Con cantidad: − n + (>= 44 px), sin cambiar la lógica del carrito.
- Agotado hoy: foto con desaturación máx. 40%, pill "Agotado hoy" sobre la esquina de la foto, "Vuelve mañana" solo si ya existe en los datos, sin "+".
- Próximamente / precio por confirmar: foto A COLOR; pill "Próximamente" sobre la esquina de la foto (nunca en la línea del título); en lugar del precio, UNA sola pill compacta "Precio por confirmar" con icono SVG de línea (reloj de arena, 14 px), borde punteado fino de color acento tenue, fondo translúcido, texto en capitalización normal 12 px, tracking <= .02em, abajo a la derecha, dentro del flujo normal (nunca `position: absolute` fuera de la tarjeta). Elimina el "POR CONFIRMAR" de la esquina superior y la línea "Precio y receta por confirmar". Sin "+". Toda la tarjeta abre el detalle.
- Personalizable (V60: "Elegir finca y taza"): el "+" no añade directo; abre el selector existente. No cambies el flujo.
- Sin foto: marcador de marca (monograma Quadro sobre fondo del tema), misma relación 1:1.
Detalle "por confirmar": bloque con icono, título "Estamos afinando este producto", texto "Precio y receta por confirmar. Pronto en la carta.", sin botón de agregar, mismo estilo premium (tokens existentes), que no parezca un error.

### T2 · Fotos y miniaturas
- Todas las filas muestran su foto vía el mapa existente (FOTO_PRODUCTO / assetManifest). WebP de 480 px en miniaturas; 900+ solo en el detalle. Si falta la versión 480, genérala con el script de assets que ya use el repo y confirma peso máx. ~40 KB por miniatura.
- Reporta el conteo exacto de fotos y los productos sin foto. No borres ni renombres fotos.

### T3 · Tipografía y espaciado móvil
- `clamp()`: nombre ~16–20 px, descripción 13–14 px, etiquetas 11–12 px. Tracking en mayúsculas pequeñas <= .06em. Frases en capitalización normal; mayúsculas solo en etiquetas cortas.
- Cada hijo de flex/grid con `min-width: 0`; textos largos con `overflow-wrap: anywhere`. Cero scroll horizontal de 320 a 430 px, también con fuente del sistema al 130% y 200%.
- Objetivos táctiles >= 44 px. Fotos con relación fija. `env(safe-area-inset-*)`; `dvh`, nunca `vh`. Tema claro y oscuro, contraste AA.

### T4 · Chips de categoría
Sticky justo debajo de la cabecera con `scroll-margin`/`scroll-padding` correctos (la cabecera NO tapa los chips). Padding inicial y final. El chip activo se centra con scroll suave. Indicador deslizante bajo el activo (solo `transform`). Sin recorte lateral.

### T5 · Barra inferior siempre fija
- Elimina TODA lógica de ocultar/mostrar por scroll. `position: fixed; bottom: 0`, fuera del contenedor que hace scroll, `z-index` sobre lista y detalle y bajo los modales. Visible también en el detalle de producto.
- Padding inferior del contenido (lista y detalle) = alto del nav + `env(safe-area-inset-bottom)`: el último producto y el botón de agregar nunca quedan tapados.
- Única excepción: teclado abierto en un campo de texto; el nav puede ocultarse mientras dure y no debe saltar encima del teclado.
- Compatible con el nav líquido actual; sin tapar el "+" de las filas. Probar con la barra de URL de Chrome visible y colapsada.

### T6 · Restaurar posición al volver del detalle
- Al abrir un producto: guardar scroll (del contenedor correcto), categoría activa y cualquier filtro/búsqueda que exista, en un ref y en `sessionStorage` (siempre con try/catch). Al volver: restaurar en `useLayoutEffect` ANTES de pintar, sin parpadeo ni salto.
- History API: `pushState` al abrir el detalle y `popstate` al volver, de modo que el botón y el gesto atrás de Android y el swipe de iOS cierren el detalle y regresen a la lista en su lugar, sin salir de la app. El botón de volver de la cabecera hace lo mismo.
- Compatible con View Transitions y `prefers-reduced-motion`. Si el contenido cambió, restaura lo más cercano sin romper. Cambiar de categoría a propósito NO restaura. Recargar empieza arriba.
- Caso de prueba de Reiner: estás en el último producto de la lista, abres el penúltimo, vuelves y debes seguir viendo el último, no el inicio.

### T6b · Responsive del detalle
`DetalleProducto` a 320–430 px: sin desbordes, título fluido, bloque "por confirmar" de T1, padding inferior por el nav fijo.

## 4. Auditoría automatizada de TODOS los productos (obligatoria)
Script Playwright reutilizable (`npm run audit:carta`; no instales navegadores si ya hay uno). Recorre todas las categorías y los 57 productos y comprueba, por tarjeta, a 320, 360, 390, 412 y 430 px, con fuente 100%, 130% y 200%:
- `scrollWidth <= clientWidth` en documento y tarjeta; ningún elemento con `getBoundingClientRect().right` mayor que el viewport; ningún texto recortado.
- Nombre <= 2 líneas; una sola etiqueta "por confirmar" por tarjeta; ninguna etiqueta fuera de la tarjeta.
- Nav inferior con el mismo `top` antes y después de un scroll largo; último producto de cada categoría totalmente visible.
Entrega una tabla (producto, categoría, estado, ancho, fuente, antes/después, resultado). Cero fallos al cerrar. Capturas de cada categoría (incluye Infusiones y una con producto "Agotado hoy") en una carpeta que NO se despliegue (por ejemplo `docs/capturas-pr1/` si pesa poco; si no, no la subas y descríbela).

## 5. Tests
- `node --test` para la lógica pura: estado del producto, fallback de foto, restauración de posición (guardar/leer/expirar), selección de estado de `ProductCard`.
- `npm test`, lint y `npm run build` en verde. Reporta tamaño del chunk principal antes/después.

## 6. Fuera de alcance (no lo hagas; está planeado en otros PR)
Buscador, filtro "solo disponibles", héroe/carrusel, categorías con foto circular, "Destacados", agrupar "Próximamente" colapsado, banner de promo, botón de carrito central flotante, ripple, vuelo al carrito, parallax y toda la capa de motion (PR-2 y PR-3); Lab "Equipo en barra" (PR-4); push. Si ves una oportunidad cercana, anótala en `docs/ESTADO-SESION.md`, no la implementes.

## 7. Verificación manual antes de abrir el PR
Abre la app con Playwright en modo móvil (375 px) y revisa capturas de: Espresso, Infusiones, una categoría con producto "Agotado hoy", el detalle de un producto normal y el de uno "por confirmar", y el flujo abrir → atrás. Describe qué viste. No des por bueno algo que no verificaste.

## 8. Entrega
- Push de `quadro-feature-carta-premium` y PR contra main, SIN merge. Descripción en español: qué cambió por tarea, tabla de auditoría, tamaño del bundle, conteo de fotos, qué NO se hizo, riesgos.
- Si Cloudflare genera vista previa del PR, pásame la URL.
- Checklist manual para Reiner (celular real): (1) Latte/Macchiato/Americano sin "POR CONFIRMAR" desbordado; (2) chips completos y sin recorte; (3) abrir el penúltimo producto de una lista larga y volver: la lista queda donde estaba; (4) el gesto atrás de Android cierra el detalle y no sale de la app; (5) la barra inferior no se mueve al hacer scroll, ni en el detalle; (6) fuente grande del sistema al 130%/200% sin cortes.

## 9. Documentación (al cerrar, en el mismo PR)
- `docs/ESTADO-SESION.md`: qué se hizo, qué quedó, decisiones, oportunidades anotadas.
- `docs/PROGRESO-LOOP.md`: avance del bloque.
- `docs/ROADMAP.html`: bloque "Carta premium · PR-1" con estado y fecha (edita en sitio, conserva el estilo y el resto; no uses los respaldos).
- Patrón de siempre: rama nueva desde main y nada a main sin OK de Reiner.
