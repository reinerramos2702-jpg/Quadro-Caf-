# memoria.md — bitácora del proyecto

Registro corrido de decisiones y estado, para que cualquier sesión de Claude Code futura (o Reiner) pueda retomar sin releer todo el historial de chat.

## Sistema anti-pérdida (2026-08-09)

Se detectó que la carpeta local de trabajo real (`C:\Users\RAI Agency\Documents\RAI Agency\App's\Quadro Cafe`, con `.git`) es **distinta** de la ruta OneDrive que el dueño usa como referencia (`C:\Users\RAI Agency\OneDrive\Documentos\RAI Agency\App's\Quadro Cafe`, sin `.git` — solo contiene `_incoming/` con assets/checklist). Confirmado con `git rev-parse --show-toplevel`. Ver PR del batch de checklist para el detalle completo.

Se configuró un hook global `PostToolUse` (`~/.claude/settings.json` → `~/.claude/hooks/auto-commit.sh`) que commitea localmente (sin push) cada archivo que Claude Code escribe/edita, en cualquier proyecto de esta máquina — documentado en `~/.claude/skills/auto-save-repo/SKILL.md`.

## Ronda 2 del checklist — feedback de producción (2026-08-09)

El dueño probó la preview del batch anterior y reportó 6 cosas a corregir, todo en `fix/checklist-batch`:

- **Lab + comparador de rutas de Inicio, un solo elemento 3D real**: `three` se agregó como dependencia directa (reusando la entrada `three@0.183.2` que ya estaba resuelta en `package-lock.json` como peer de `@google/model-viewer` — sin `npm install`, sin inventar hashes). Nuevo `src/lib/espiral3d.jsx`: tubo procedural (misma fórmula que `spiralPath`, en 3D) + `espiral.glb` como base, cargado bajo demanda (`React.lazy`, chunk propio `espiral3d-*.js`, no infla el bundle principal). Reemplaza: el `<model-viewer>` decorativo + el SVG interactivo de Laboratorio (ahora un solo `EspiralTubo3D` respondiendo a vueltas/radio/prog), el SVG del comparador de rutas en Inicio (mismo componente, `prog=1`), y el hero de Inicio (`EspiralHero`, cámara orbitando + espiral encendida con colores de marca en vez del modelo solo apagado — directamente ataca el problema de contraste reportado). `@google/model-viewer` quedó sin uso — se sacó su import de `main.jsx` (el paquete queda declarado en package.json pero sin ejecutarse).
- **Escala/posición del modelo**: a diferencia de un intento anterior (otra sesión, modelo distinto `dripper.glb`, nunca llegó a esta rama) que afinaba escala/posición a mano con Playwright, acá no hay navegador disponible — se implementó `encuadrarModelo()`: calcula la caja contenedora real del `.glb` cargado y lo centra/escala a un radio objetivo, así no depende de adivinar las unidades/pivote del archivo.
- **Notch "pico de montaña" eliminado de toda la app**: se quitó `.quadro-frame` (la clase CSS) y sus 6 usos (`borderBottomRightRadius:0` + clip-path) — decisión explícita del dueño de retirar el motivo, documentada en `CLAUDE.md`.
- **Bug de tildes/ñ en VIOLA — causa real identificada**: VIOLA es una fuente unicase (de logo) sin tildes/ñ; `.disp*` nunca forzaba `text-transform`, así que un acento en minúscula real ("café", "Triángulo de Mocotíes") caía a Fraunces en su minúscula real — de ahí que se viera "en otra tipografía" en medio de letras que ya se ven en caja alta. Fix: `text-transform:uppercase` en las 4 clases `.disp*` (sumado al `font-size-adjust:from-font` de la ronda anterior). `.mono/.label/.micro` (Nexa) ya tenían uppercase, no se tocaron más allá de lo ya hecho.
- **Badges ovalados descentrados**: el patrón correcto ya existía en el propio código (badge del contador del carrito, `display:grid, placeItems:center`) — se aplicó el mismo patrón (`inline-grid`) a los 4 badges de texto que no lo tenían (tag de producto, "Agotado hoy", notas de finca, contador del lightbox de Estudio).

**Verificado**: build de Cloudflare limpio (`npm install` resolvió `three` sin fricción — no fue necesario tocar más que el lockfile a mano), bundle principal bajó de ~1.5MB a ~460KB (three.js quedó en su propio chunk lazy, confirmado por separado). No se pudo verificar visualmente — sin navegador Chrome conectado en este entorno en ninguna de las dos rondas.

## v1 → v2 (scaffold + imágenes reales)

- El repo empezó vacío (solo `README.md`); el componente `QuadroCafe` nunca había sido comiteado.
- Se creó el scaffold Vite + React (`package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`).
- Se inventarió la carpeta de Drive `1i6U98nzBDotKZYQTAH60VVChKLGgOdP1` (`Quadro-Cafe-Assets/`): `Branding/` (logo real), `3D-Assets/` (renders Blender: Bebidas, Cafés, Equipos, Menú, Postres, Libros de café — de referencia), `Equipos/`, `Menu/`, `Lotes/`, `Fotos-Local/` (fotos reales de celular).
- **Decisión del dueño:** usar el logo real + los renders Blender (calidad profesional, marca consistente) en vez de las fotos de celular ("se ven poco profesional"). Los renders son collages multi-panel (hero + variantes FRONT/3-4 VIEW/SIDE-BACK) — cada uno se recortó a la región más limpia antes de usarlo.
- Assets procesados a `src/assets/`: `logo.png`, `lote-villa-nueva.jpg`, `lote-bourbon.jpg`, `club-box.jpg`, `hero-dispenser.jpg`, `menu-postres.jpg`, `menu-iced.jpg`.
- Verificado con captura de pantalla en las 5 pantallas de v2 (Inicio, Fincas, Lab, Carta, Club). Build de producción confirmado. Comiteado y pusheado a `claude/quadro-cafe-v2-5uq32e`.

## v3 (hoy) — módulos nuevos + tema + docs

El dueño construyó un rediseño mucho más avanzado en un artifact aparte de Claude.ai y envió capturas + el código fuente completo (`quadrocafe.jsx`). Instrucción: *"solo toma estos módulos de referencia, además utiliza el lettering original de la página."*

### Confirmado con el dueño en esta sesión
- Los datos nuevos del rediseño (Elio/Rosa/Mina, Triángulo de Mocotíes/Santa Cruz de Mora/La Mina, precios reales) son **reales y confirmados** — reemplazan el roster de fincas/lotes/menú de v2.
- Se construyó un **selector de tema claro/oscuro** (no un reemplazo) — el dueño quiere poder elegir.
- La pestaña "Estudio" del código de referencia resultó ser una herramienta de **subida/organización de archivos**, no una galería estática — se pre-sembró con las fotos reales de `Fotos-Local`/`Equipos` ya identificadas en Drive, manteniendo la función de subida para agregar más.

### Decisiones propias (no vueltas a preguntar, mejor criterio aplicado)
- Se mantuvo el **logo real** (`logo.png`) en vez del ícono espiral dibujado a mano del archivo de referencia.
- Se mantuvo el **módulo Quadro Club** aunque el nuevo tab bar de referencia no lo incluye (6 tabs: Inicio/Carta/Fincas/Lab/Aula/Estudio) — la captura de email por fidelidad está explícitamente listada en `docs/rai-template-escalable.md` como función central vendible del template RAI; eliminarla sin que nadie lo pidiera habría perdido funcionalidad real. Ahora se accede como una 5ª tarjeta de acceso rápido en Inicio, no desde el tab bar.
- Los renders de etiqueta (bolsa Villa Nueva, frasco Bourbon) **ya no se usan como evidencia literal de "ficha del lote"** — el texto impreso (varietal, notas) quedó desactualizado frente a los datos nuevos (p. ej. la bolsa dice "Bourbon A · cítricos amarillos", los datos nuevos dicen "Catuai · floral, té verde" para lo que parece ser el mismo lote en evolución). Se reutilizan solo como imagen ambiental/de categoría donde nadie va a leer la letra chica.
- **Lettering real:** no hay acceso al archivo de fuente real de quadrocafe.com. Se aproximó el wordmark serif alto y de alto contraste con **Cormorant Garamond** (reemplazando Archivo Black del archivo de referencia y Fraunces de v2), con su itálica para momentos de acento. Esto es una aproximación visual, no la fuente de marca real — pendiente si el dueño consigue el archivo exacto.

### Qué se portó del archivo de referencia
Simulador interactivo de extracción en Lab (fórmula `perfil` verbatim de `quadrocafe.jsx:619-629`), Fincas con avatar/inducción por audio-texto + transcripción, Menú con precios reales y selección de finca/taza por bebida, Academia con progreso + estudio de color de tazas, Estudio con carga de archivos.

### Pendiente / fuera de alcance
Migración a React Native, Supabase (auth/pedidos/captura de email real), pagos reales, exportación a CRM externo, videos de avatar Higgsfield (reemplazarían el reproductor de inducción actual), archivo de fuente real de la marca, más fotos reales para Estudio.

## v4 — despliegue en Cloudflare + navegación básica + más interacción

### Cloudflare estaba conectado pero rompiéndose
El proyecto `quadro-cafe` en Cloudflare (Workers & Pages, no "Pages" clásico) **sí** estaba conectado al repo correcto (`main`, `npm run build` → `npx wrangler deploy`) — el problema real era que el repo nunca tuvo un `wrangler.toml`, así que cada build fallaba antes de poder desplegar nada. Se agregó `wrangler.toml` (nombre `quadro-cafe`, assets desde `./dist`, mismas `compatibility_date`/`compatibility_flags` que ya tenía el Worker en el dashboard) y `wrangler` como devDependency. Confirmado con `wrangler deploy --dry-run` y luego con el propio bot de Cloudflare comentando "✅ Deployment successful" en el PR.

**Nota de proceso:** el PR #1 (v2) ya estaba mergeado a `main` cuando se retomó el trabajo — un PR mergeado no puede recibir más commits. Se rebaseó el trabajo nuevo sobre el `main` actualizado y se abrió el PR #3 en vez de reusar el viejo. Esto es lo que hay que hacer cada vez que se vuelve a un PR ya mergeado: rebase + PR nuevo, nunca apilar sobre el histórico ya integrado.

### Navegación básica de app móvil
Cada pantalla (Carta, Fincas, Lab, Aula, Estudio, Club) tiene ahora un botón de volver en su `Header` que regresa a Inicio (antes solo Club lo tenía, con su propio código ad-hoc — se unificó todo por el mismo `onBack` prop). También se conectó el botón/gesto de retroceso real del navegador (History API + `popstate`): navega entre tabs y cierra el carrito o el ticket antes de salir de la app, como cualquier app nativa. El carrito y el email de Club ahora se guardan en `localStorage` y sobreviven a un refresh.

### Más interactivo — delegado a 3 agentes en paralelo (worktrees aislados)
- **PWA instalable**: `vite-plugin-pwa` — manifest (verde oficial `#1F4D3D`, standalone), service worker (precache del app shell, cache-first para las imágenes grandes de `src/assets/`), íconos generados desde el logo real (`src/assets/logo.png`) en `public/icons/` (192/512/maskable/apple-touch). Cero cambios a `App.jsx`.
- **Academia con quizzes reales**: cada lección ahora tiene 2-3 preguntas de comprensión sacadas directamente de sus `puntos` existentes (nada inventado) — una lección se marca "hecha" solo al responder su quiz. Al completar las 4, aparece una insignia — explícitamente etiquetada como logro dentro de la app, no como certificación real. Progreso persistido en `localStorage`.
- **Fincas: modo comparar** — toggle que permite elegir 2 fincas y ver sus "Ficha del lote" lado a lado (mismas fórmulas ya existentes, sin inventar métricas nuevas).
- **Estudio: lightbox + selección múltiple** — tocar una foto abre una vista de pantalla completa con navegación izquierda/derecha; un modo "Seleccionar" permite reasignar destino o borrar varias fotos a la vez.

Los tres agentes trabajaron en git worktrees aislados; dos de ellos notaron por su cuenta que su worktree había arrancado de un commit viejo (antes del rediseño v3) y se re-basaron sobre la rama real antes de tocar nada — buena señal de que el prompt de contexto fue suficiente. La integración final (cherry-pick/fast-forward + resolución de conflictos en `package.json`/`package-lock.json`) la hizo la sesión orquestadora, no los agentes.

### Pendiente (actualizado)
Todo lo de la v3 sigue pendiente. Se suma: confirmar que el ícono/manifest de PWA se vea bien una vez instalado en un teléfono real, y decidir si el modo "Comparar" de Fincas necesita una versión de 3 fincas a la vez si el catálogo crece.

## v4 — "BRIEF DE EJECUCIÓN v2 (ALTA GAMA)"

El dueño mandó un brief de dirección de arte completo (7 bloques: tokens/tipografía/marco → assets → menú+pagos → carrito+pago → panel admin → geometrías → fincas), con instrucción explícita de **no encadenar los 7 bloques sin confirmar** entre uno y otro. Antes de tocar código se resolvieron 4 conflictos reales entre este brief y lo ya confirmado como "real" en sesiones anteriores:

1. **Paleta**: el brief define tokens distintos a los oficiales de `HANDOFF.md` (`#3b574c`/`#e9d8c6` vs `#1F4D3D`/`#EDE9E0`). El dueño confirmó: **la del brief es la vigente ahora** — `HANDOFF.md` y `CLAUDE.md` actualizados, la paleta vieja queda como registro histórico.
2. **Roster de fincas**: el brief describe el roster viejo de v2 (Agua Fría/Villa Nueva/Bourbon/Catuai), pero v3 ya había reemplazado eso por Elio/Rosa/Mina. El dueño confirmó: **ambos son reales, hay que fusionarlos** (no reemplazar uno por otro). Esto es trabajo del Bloque 7 (Fincas), todavía no ejecutado — queda pendiente explícitamente.
3. **Curación de imágenes**: el brief pide integrar las ~54 imágenes de 3D-Assets "sin curar". El dueño confirmó: **se mantiene la curación** — no se muestran imágenes con el nombre de otra marca (Espressate, Caturral Beencia), sin importar la instrucción "sin curar".
4. **Panel Admin (Supabase)**: no hay proyecto Supabase conectado a este repo. El dueño dijo que pasaría las credenciales — pendiente de recibirlas antes de tocar ese bloque.

### Bloque 1 — Tokens, tipografía, marco Quadro (ejecutado)
- `PALETAS.claro` actualizado a los tokens nuevos (ver `CLAUDE.md`). `PALETAS.oscuro` sin cambios (el brief no toca el tema oscuro).
- Tipografía: Fraunces + Inter Tight reemplazan Cormorant Garamond + Archivo + IBM Plex Mono. Se redefinieron las clases `.disp`/`.mono` a nivel CSS (sin tocar los ~80 usos existentes en el JSX) y se agregó una escala nueva (`.disp-xl/l/m`, `.body-l`, `.label`, `.micro`) disponible para usos puntuales.
- Nuevo componente visual de marca: `.quadro-frame` (clip-path que recorta la esquina inferior derecha, el "pico" del logo) — aplicado solo a tarjetas de producto (Menú), finca y ficha de lote (Fincas), nunca a navegación/modales/formularios, tal como pide el brief.
- Secuencia de entrada del splash: el marco (cuadrado exterior → interior → pico) se dibuja con `stroke-dashoffset` (usando `pathLength="1"` para no depender de geometría exacta), luego revela el logo real y el texto — una sola vez por sesión, bajo 900ms la parte de dibujo.
- No se tocó: el pipeline de assets WebP/AVIF+manifiesto (Bloque 2), el menú/categorías nuevas (Bloque 3), carrito/pago (Bloque 4), panel admin (Bloque 5), scroll-linked spiral drawing en Lab (Bloque 6, parte de "Geometrías"), ni la transición shared-element de Fincas (Bloque 7) — todos quedan para bloques siguientes, cada uno con su propio commit/push/verificación de Cloudflare antes de continuar, como pide el brief.

### Pendiente (v4)
Bloques 2–7 del brief, fusión del roster de fincas (punto 2 arriba), credenciales de Supabase para el panel admin, y confirmar con el dueño antes de avanzar al siguiente bloque tras cada checkpoint.

## Limpieza de Home — Quadro Club a banner fijo

Fuera de los 7 bloques del brief (pedido aparte del dueño, con plazo de 2 días para una entrega visible): el grid de accesos rápidos de Inicio repetía Pedir ahora/Laboratorio/Fincas/Academia, que ya están en la barra inferior de 6 tabs. Se quitó el grid completo y Quadro Club (el único sin tab propio) pasa a un banner fijo arriba del hero, siempre visible al entrar a Inicio, con acento en `C.brandAlt` para diferenciarlo. Verificado en ambos temas (claro/oscuro) con captura de pantalla en headless antes de pushear. Commit `fcef832` en `claude/quadro-cafe-v2-5uq32e`.

**Decisión de plataforma para el plazo de 2 días** (confirmada con el dueño): seguir como PWA pulida — React Native/Expo + publicación en Google Play/App Store queda para una fase posterior, ya que la revisión de tiendas por sí sola no cabe en 2 días. Esto es consistente con "Out of scope" en `CLAUDE.md`.

**Pendiente reportado por el dueño, aún sin material que integrar:** video real de la máquina extrayendo para reemplazar el espiral SVG animado (se decidió mejorar el SVG existente con animación ligada al vertido mientras no llega el video), y avatar grabado (Higgsfield) por finca con el guion que ya está en `FINCAS[].guion`. Ver también el checklist propio del tab Estudio en la app ("Siguiente entrega").

## Bloque 5 — Panel Admin (Supabase) ejecutado, Bloque 2 delegado

El dueño confirmó las credenciales de Supabase del proyecto real (`wckufllomfmuwxptegvm.supabase.co`) y pidió arrancar Bloque 2 (pipeline de assets) en paralelo.

**Módulo → Problema → Fix → Pendiente**

- **Credenciales**: nunca se hardcodean. Van en `.env` (gitignored, verificado con `git check-ignore`) como `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`; `.env.example` (sí commiteado) documenta las variables con placeholders y explica por qué la publishable key es segura de exponer en cliente (RLS es el límite real, no el secreto de la key).
- **Cliente Supabase**: `src/lib/supabase.js` — único archivo fuera de `App.jsx` que se añadió (módulo de servicio, no componente UI; consistente con que `main.jsx`/`assets/` ya viven fuera del single-file). Exporta `supabase` como `null` si faltan las env vars, para no tumbar el build/la app si alguien clona el repo sin `.env`.
- **Esquema**: `supabase/migrations/0001_init.sql` — tabla `productos` (espejo de `MENU`: cat/nombre/precio/descripcion/tag/geo/finca/disponible/orden), RLS activado (lectura pública, escritura solo autenticado), trigger de `actualizado_en`, semilla con los 12 items reales ya existentes en `MENU`. No hay CLI/MCP de Supabase en este entorno — el dueño debe correr este SQL manualmente en el SQL Editor de su dashboard, y crear al menos un usuario en Authentication → Users para poder entrar.
- **Panel Admin**: pantalla nueva (`Admin` en `App.jsx`), fuera de la barra de tabs pública. Se llega por un ícono de engranaje en el header de Quadro Club, o directo por `#admin` en la URL. Login con Supabase Auth (email+clave). Una vez dentro: lista de productos por categoría, precio editable inline (input numérico, guarda `onBlur`), switch de "disponible hoy" (el uso diario que el brief marcó como prioritario). Sin roles adicionales — un solo dueño.
- **Alcance explícito de este pase**: el panel edita la tabla `productos` en Supabase; el `MENU` público que ve el cliente todavía es la constante local en `App.jsx` (no lee de Supabase en vivo) — conectar la Carta pública a la tabla real es trabajo de Bloque 3 (Menú+pagos), no se adelantó para no mezclar alcance.
- **PWA**: de paso se corrigió el `theme_color`/`background_color` del manifest en `vite.config.js`, que seguía en el verde viejo `#1F4D3D` — ahora usa el verde oficial v4 `#3b574c`.
- **Bloque 2 (pipeline de assets) — ejecutado, integrado a mano**: el agente delegado en worktree aislado terminó su trabajo, pero había arrancado desde un commit viejo (antes del rediseño v3 — sin `PALETAS`/`useTheme`/tema oscuro), así que su `App.jsx` no era usable directamente. Se integró manualmente lo reutilizable de su output: `src/data/assetManifest.js` (manifiesto ES module con `import` estático de cada JPG + 3 variantes WebP de 480/900/1400w por imagen, color dominante, ancho/alto — generado con `sharp`, sin sobre-escalar más allá de la resolución nativa), los 18 `.webp` generados para `hero-dispenser`, `club-box`, `menu-postres`, `menu-iced`, `lote-bourbon` y `lote-villa-nueva`, y el componente `ResponsiveImg` (un `<picture>` con `srcSet` WebP + fallback JPG, placeholder de color sólido sin blur, `loading="lazy"` salvo la imagen `eager` de la barra superior de Laboratorio). Se conectó a mano en los dos usos reales de `<img>` que había en el código actual: la imagen de categoría en Carta (`CAT_IMG` ahora mapea a ids del manifiesto en vez de imports directos) y la foto de equipo en Laboratorio. Los usos como `backgroundImage` CSS (hero de Inicio, banner de Club) se dejaron con el JPG original — el `<picture>`/`srcSet` no aplica a `background-image`, y no era parte del alcance del bloque. `lote-villa-nueva` queda en el manifiesto sin usar todavía (no hay ningún `<img>` de esa finca en el código actual) — disponible para cuando se ejecute la fusión de roster del Bloque 7. Verificado con build + capturas de pantalla (Carta y Laboratorio, ambas cargan bien la imagen responsiva).
## Bloque 3 — Carta pública conectada a Supabase

El dueño corrió la migración y creó su usuario; pidió conectar la Carta que ve el cliente a la tabla `productos` real (la misma que edita el Panel Admin), respetando el toggle de disponibilidad, con fallback al `MENU` local si Supabase falla.

- **`useCarta()`** (hook nuevo, junto a `MENU`/`CATS`): al montar `Menu`, hace `supabase.from("productos").select("*").order("orden")` y mapea las filas a la misma forma que ya usan los componentes (`desc` en vez de `descripcion`, `precio` convertido a número). Si Supabase no está configurado, la consulta devuelve error/vacío, o falla la red (`.catch()` sin manejar rompería la app con una promesa rechazada sin capturar — ahora capturada), el hook simplemente no llama `setItems` y la Carta se queda mostrando el `MENU` local con el que arranca. `Menu` unmountea/remontea cada vez que se abre la tab (patrón ya existente con `key={tab}` en la raíz), así que cada visita a Carta trae datos frescos sin necesitar suscripción en tiempo real.
- **Decisión de UX — "Agotado hoy" en vez de ocultar**: los productos con `disponible: false` se muestran atenuados (opacidad reducida), con una etiqueta roja "Agotado hoy" reemplazando su tag normal, sin botón de agregar ni opción de "elegir finca y taza", y con el texto "Vuelve mañana" en su lugar. Se descartó ocultarlos porque (a) un cliente que ya conoce la carta y no ve un ítem que sabe que existe asume que se quitó del menú para siempre, no que se agotó hoy — genera más fricción/preguntas al mesero que mostrarlo tachado; (b) el dueño puede querer usar la ausencia temporal como gancho ("agotado hoy, vuelve mañana") en vez de que pase desapercibida; (c) es el mismo patrón mental de una pizarra de cafetería real con un ítem tachado, más legible que una carta que "encoge" sin explicación.
- **Verificación**: sin acceso de red desde este entorno a Supabase ni a la URL pública de Cloudflare (la política de red del sandbox bloquea ambos hosts), así que se verificó en dos pasos con Playwright contra un `npm run preview` local: (1) con la petición real fallando (mismo bloqueo de red, ejercitando el camino exacto de fallback), la Carta cae en el `MENU` local sin errores visibles ni promesas sin capturar; (2) interceptando la petición a `**/rest/v1/productos*` con una respuesta simulada de 3 productos (uno con `disponible: false`), la Carta pintó correctamente el estado "Agotado hoy". La confirmación de que la Carta real está leyendo los datos reales de Supabase en producción queda pendiente de que el dueño la revise en el navegador — mecánicamente es la misma llamada que ya usa el Panel Admin, que él ya confirmó que funciona.

### Pendiente
Bloques 4/6/7, fusión del roster de fincas (Bloque 7), y confirmar con el dueño antes de encadenar el siguiente bloque.

## Bloque 3 — seguimiento: las env vars no llegaban al build de Cloudflare

El dueño reportó que en el deploy real, `/#admin` decía "Supabase no está configurado" pese a que `.env` local sí las tiene. Causa: `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` nunca se configuraron en el entorno de **build** de Cloudflare — Vite las necesita presentes durante `vite build` (se inlinan en el JS del bundle), no en runtime del Worker, así que un binding de Cloudflare (Settings → Bindings/"Variables and Secrets") no las alcanza a tiempo aunque exista.

- **Confirmado que el repo no es la causa**: `wrangler.toml` no tiene `[vars]` ni nada que pise o filtre estas variables; `vite.config.js` no sobreescribe `envPrefix` (usa el default `VITE_`); no hay `.dev.vars` suelto. El problema está 100% del lado del dashboard de Cloudflare, no del código.
- **Pasos documentados en `README.md`** (nueva sección "Deploy (Cloudflare Workers)"): dónde exactamente en el dashboard van las variables de **build** (Settings → Build → "Build variables and secrets"/"Environment variables" de esa pantalla) vs. las de **runtime** (Settings → Bindings, que no sirven para esto), tipo Plaintext (no hace falta Secret para una publishable key), y que hace falta un build nuevo (push o "Retry build") para que tomen efecto — no basta con guardarlas.
- **Fallback ya no es silencioso**: `useCarta()` ahora llama a `console.warn` con el motivo exacto cada vez que cae al `MENU` local (Supabase no configurado / error de la consulta / tabla vacía / falla de red), siempre — en dev y en producción. Además, solo en dev (`import.meta.env.DEV`, se elimina del build de producción) se muestra un banner visible arriba de la Carta ("⚠ Modo dev: mostrando MENU local…"). En producción no hay banner visible al cliente (no tiene sentido exponerle un problema de infraestructura a alguien pidiendo un café), pero el `console.warn` sigue ahí para que el dueño lo revise si algo no cuadra.
- **Verificado** con `npm run dev` (banner visible) y `npm run preview`/build de producción (sin banner, mismo fallback funcionando) vía Playwright local — screenshots confirmaron ambos casos, luego se limpiaron los artefactos de prueba.
- **Pendiente de tu lado**: cargar las dos variables en el dashboard de Cloudflare siguiendo los pasos del README, y luego un "Retry build" o esperar al próximo push para que el deploy las recoja.

## Panel Admin — agregar producto + recuperar clave

Dos features pedidas fuera del Bloque 5 original, con "Agregar producto" priorizado primero.

- **Agregar producto** (`AdminNuevoProducto`): botón "+ Agregar producto" arriba de la lista que despliega un formulario (nombre, categoría, precio, descripción, disponible sí/no). Al crear, genera un `id` con `slugify(nombre)` (minúsculas, sin tildes, guiones) para no chocar con el patrón `m1`..`m12` existente; si el id ya existe (choque de nombre repetido, error `23505` de Postgres), reintenta con un sufijo numérico hasta 5 veces. `finca`/`tag`/`geo` no se pidieron en el formulario, así que quedan en sus valores por defecto (`false`/`null`/`null`) — no se inventó UI para eso. El `orden` nuevo se calcula como el mayor `orden` existente + 1, así el producto nuevo aparece al final de la lista tanto en el Panel Admin como en la Carta pública (que ya lee de la misma tabla desde el Bloque 3).
- **Recuperar clave**: enlace "¿Olvidaste tu clave?" en el login del Admin, usando el flujo nativo de Supabase Auth (`resetPasswordForEmail` + `updateUser`), no una implementación propia. El mensaje después de enviar es siempre el mismo genérico ("si ese correo tiene una cuenta…") porque Supabase mismo nunca confirma si un correo existe, por diseño anti-enumeración. El `redirectTo` apunta a `?admin=1` (no a `#admin`) porque Supabase agrega su propio `access_token`/`type=recovery` como fragmento hash al volver, y dos hashes no pueden coexistir en una URL — así que se separó el "llévame al Admin" a query string. Se amplió la detección de tab inicial (antes solo miraba `#admin`) para reconocer también `?admin=1` y cualquier hash con `type=recovery`, si no el evento `PASSWORD_RECOVERY` de Supabase nunca se escucharía (el listener vive dentro de `Admin`, que solo monta si el tab inicial ya es "admin"). Al llegar por ese enlace, `Admin` detecta el evento `PASSWORD_RECOVERY` del listener de auth y muestra `AdminNuevaClave` (clave nueva x2, mínimo 6 caracteres) en vez del dashboard normal, hasta que se guarda.
- **Verificación**: sin red real a Supabase desde este entorno, se probaron ambos flujos con Playwright contra `npm run preview`: (1) recuperar clave, interceptando `auth/v1/recover` y confirmando que se ve la pantalla "revisa tu correo"; (2) crear producto, con una sesión falsa inyectada en `localStorage` (mismo formato que guarda el SDK de Supabase) e interceptando `rest/v1/productos` — el producto nuevo apareció correctamente en la lista con sus datos. En el camino se encontró y corrigió un bug del propio mock de prueba (devolvía un array en vez de un objeto pelado para `.single()`, ignorando el header `Accept: vnd.pgrst.object+json` que si respeta el backend real de PostgREST) — no era un bug de la app.

## Batch de 3 bugs reportados con capturas (2026-08-10) — rama `fix/checklist-batch`

### 1. Acentos en VIOLA: por qué el fix anterior no alcanzaba

Diagnóstico real (medido, no supuesto): se parseó la tabla `cmap` de las tres fuentes de marca. **VIOLA tiene 76 glifos y ninguna vocal acentuada, ni `Ñ` ni `Ü` ni marcas combinantes.** Nexa Light/Bold sí traen el juego español completo — o sea el bug nunca estuvo en Nexa, solo en los estilos `.disp*`.

El pase anterior había atacado los síntomas: `text-transform:uppercase` (para que el fallback no cayera en minúscula) y `font-size-adjust:from-font` (para igualar el tamaño). Ambos siguen siendo correctos, pero ninguno puede igualar lo único que de verdad se nota — el **carácter del glifo**: la `Á` la seguía dibujando Fraunces, una serif que no se parece a VIOLA, en medio de una palabra en VIOLA. Por eso reaparecía "ahora también en mayúsculas".

Fix: `scripts/generar-acentos-viola.mjs` (`npm run fuente:acentos`) genera `src/assets/fonts-derivados/VIOLA-Acentos.otf` con opentype.js — 7 glifos (`Á É Í Ó Ú Ü Ñ`, cada uno mapeado también a su codepoint minúsculo porque VIOLA es unicase). Cada glifo es **el contorno base real de VIOLA más un acento compuesto encima**, con el mismo upem (2048), la misma altura de mayúscula (1612) y el mismo ancho de avance que la letra sin acento. Los acentos se dibujan con medidas tomadas de la propia fuente, no inventadas: el asta de la `I` (269 u) da el trazo grueso y la diéresis reutiliza el círculo del `period` escalado, así que el contraste didone de VIOLA se mantiene. La fuente entra segunda en el stack (`'VIOLA','VIOLA Acentos','Fraunces'`), o sea el navegador solo la toca en los codepoints que faltan; Fraunces queda de última como red de seguridad. Pesa 2,8 KB y Vite la inlinea como data URI, así que no agrega ni una petición.

`src/assets/fonts/` es carpeta protegida: **VIOLA.otf no se tocó**, el derivado vive aparte en `src/assets/fonts-derivados/`.

Verificado con capturas headless a 30/19/14 px comparando cada palabra acentuada contra `AEIOUN SIN ACENTO`: mismas formas de letra en ambas líneas.

### 2. Hero de Inicio

Tres cosas distintas en el mismo titular:
- **"GEOMETRÍA" cortada**: nuevo componente `UnaLinea` en `App.jsx`. Mide el texto a su tamaño máximo y, si no entra en el ancho del contenedor, baja el `font-size` por la razón que falte (el ancho es lineal respecto al cuerpo, así que una medición basta — no itera). Vuelve a medir con `ResizeObserver` (rotación de pantalla) y con `document.fonts.ready`, porque medir con la fuente de fallback da otro ancho. En un teléfono de 390 px cae de 44 a 29 px y entra completa, sin partir la palabra. `min` de 24 px por si algún día el contenedor es absurdamente angosto.
- **Interletrado apretado**: el `letter-spacing:-.01em` que hereda `.disp` pegaba las letras de "EL SABOR / TIENE UNA"; el `h1` ahora lo pisa con `.012em`.
- **Solape entre líneas**: `lineHeight` pasó de `.88` a `1.02` — con `.88` las ascendentes de la itálica de "geometría" chocaban con la línea de arriba.

De paso, el velo sobre el hero 3D subió de `99` a `cc` de opacidad: al arreglar la iluminación del modelo (punto 3) el cono dejó de ser una silueta apagada y, sin más velo, competía con el titular en tema claro.

### 3. El .glb del Lab — qué se había perdido y qué NO existía

Se revisó el historial completo (`main`, `claude/quadro-cafe-v2-5uq32e`, `claude/quadro-cafe-v2-fixes-q1r0fx`, `fix/barra-dashboard`, `cloudflare/workers-autoconfig`) y las cuatro versiones históricas del componente. Hallazgos:

- **`espiral.glb` es SOLO el cono negro.** Se le parseó el JSON chunk: una malla, un material PBR, cuatro texturas. No trae ninguna espiral ni puntos incorporados — la espiral siempre fue procedural. Se renderizó aislado desde 6 ángulos para confirmarlo.
- **Los "puntitos blancos" no salen de ningún commit anterior tal cual.** Lo que sí existía y el último pase borró son los **anillos guía en línea discontinua** (`LineDashedMaterial`, color de línea) que estaban en `956d57e`/`566dc05`. Se restauran, y además la ruta completa de la espiral se dibuja ahora como línea punteada por encima del tubo, que es lo que se lee como los puntos claros corriendo a lo largo del recorrido en la captura de referencia.
- Nota: el `dripper.glb` que referenciaba `566dc05` **nunca existió en este repo** (el propio comentario del archivo lo decía). No hay una versión anterior "buena" que copiar literalmente; se reprodujo el resultado visual.

Las tres causas del "pequeño, empujado hacia abajo, casi saliéndose del cono":

1. **Sin entorno de iluminación.** El material del `.glb` es PBR con `metallicRoughness` real: con luces direccionales y nada que reflejar, se apaga hasta quedar negro plano. La versión buena pasaba por `<model-viewer>`, que **siempre** monta un IBL neutro más tone mapping; en three.js hay que pedirlo explícitamente. Ahora `montarEntorno()` arma `PMREMGenerator` + `RoomEnvironment` + `ACESFilmicToneMapping`, con `scene.environmentIntensity = .4` y la ambiental bajada de `.7` a `.25` (a intensidad plena el cono negro mate se volvía plata pulida y al tubo se le lavaba el verde). Esto es lo que devuelve el relieve y los brillos de las aristas.
2. **Encuadre mal derivado.** `encuadrarModelo` escalaba por la dimensión **mayor** del modelo; como el cono es mucho más ancho (1.90) que alto (1.24), quedaba chico. Ahora escala por el **radio horizontal** y devuelve la media altura, de donde salen todas las demás medidas.
3. **La espiral estaba en el centro del cono, no en la boca.** Con la ruta en `y = 0` — media altura del cono, donde el cono ya se cerró — la espiral quedaba abrazándolo por fuera cerca de la punta. Ahora se dibuja en `ESPIRAL_Y_REL = .75` de la media altura (dentro de la boca) y su radio máximo (58 u contra 92 u del modelo) cabe con pared de sobra incluso con el slider de radio al tope.

Además la cámara subió de ~27° a 50° de elevación: desde 27° se miraba el cono casi de perfil y la boca —que es justo donde vive la espiral— quedaba escondida.

**Pendiente, no bloqueante**: `espiral.glb` pesa **7,2 MB sin comprimir**. En las pruebas headless tarda varios segundos y durante ese rato se ve la espiral flotando sin cono. Comprimirlo (Draco o meshopt, como estaba planteado para el `dripper.glb` que nunca llegó) lo dejaría en cientos de KB. Requiere reemplazar el archivo en `public/models/` (carpeta protegida) — hace falta el visto bueno del dueño.

### Verificación

Sin extensión de Chrome disponible en este entorno, se manejó Chrome headless por CDP (driver propio, fuera del repo). Capturas de Inicio, Carta y Laboratorio en **ambos temas**, a 390×844 con `deviceScaleFactor` 2, más una hoja de prueba tipográfica a tres tamaños.

`npm run build` **falla en local con un error del service worker de `vite-plugin-pwa`**: workbox escribe la ruta absoluta del proyecto sin escapar dentro de una cadena entre comillas simples, y la carpeta se llama `App's` — el apóstrofo rompe el `sw.js` generado. No tiene relación con estos cambios. Confirmado copiando el proyecto a una ruta sin apóstrofo: ahí el build termina en verde con `sw.js` y `workbox-*.js` incluidos. En Cloudflare no se da (el checkout no lleva apóstrofo). Si algún día molesta en local, la solución es renombrar la carpeta, no tocar el `vite.config.js`.

## Compresión del .glb + contraste del hero en tema oscuro (2026-08-10) — rama `fix/checklist-batch`

### 1. `espiral.glb`: 6,88 MB → 395 KB (17,8×)

Quedaba pendiente del batch anterior. **Las texturas eran el peso, no la geometría**: 5,85 MB en cuatro mapas de 2048×2048 contra 1,04 MB de malla, para un modelo que se dibuja a 230 px en Lab, 132 px en la tarjeta de Inicio y 340 px en el hero — con DPR 2 son ~460 px físicos como máximo, o sea entre 4 y 16 veces menos de lo que la textura traía.

`scripts/comprimir-espiral-glb.mjs` (`npm run modelo:comprimir`), con `@gltf-transform` + `sharp`:
- Texturas a 512² en WebP. Los mapas de color con pérdida (calidad 82); quedaron en 7 KB y 4 KB porque además son casi uniformes.
- `EXT_meshopt_compression` en la geometría (weld + cuantización + encode). Conteo de triángulos idéntico antes y después: **28.554 en ambos**.
- `prune()` eliminó el `emissiveTexture`: se verificó que era **negro puro en todos sus píxeles** (min = max = 0 en los tres canales), así que no aportaba nada y quitarlo es exactamente equivalente. 65 KB menos.

**Elección de calidad del normal map, medida y no a ojo.** Es el mapa que dibuja el relieve de las aristas, o sea el detalle que había que conservar, así que se compararon tres variantes contra el original midiendo diferencia por píxel **en 8 azimuts de cámara** — el hero orbita, y los artefactos de un normal map con pérdida se delatan al cambiar el ángulo de luz, no en una pose fija:

| variante | tamaño | dif. media | dif. máx |
|---|---|---|---|
| WebP sin pérdida | 641 KB | 1,19/255 | 190 |
| **WebP calidad 95** | **395 KB** | **1,97/255** | **194** |
| WebP calidad 90 | 375 KB | 2,10/255 | 197 |

Ninguna muestra bandeado ni facetas en ningún ángulo. La diferencia de fondo (~1/255) ya la ponen los mapas de color y la cuantización, no el normal map. Se eligió calidad 95: 0,8/255 extra sobre el lossless, muy por debajo del umbral perceptible, a cambio de 246 KB menos en el asset de la primera pantalla. Constante `NORMAL_CALIDAD` en el script si alguna vez hay que ser conservador.

**Dos cosas a no romper:**
- Hubo que registrar `EXT_texture_webp` en el `NodeIO`, si no el `.glb` sale con imágenes WebP sin declarar la extensión que las habilita — fuera de spec.
- El loader ahora **necesita** `setMeshoptDecoder` (`three/examples/jsm/libs/meshopt_decoder.module.js`): la extensión va declarada como *required*, sin el decoder el modelo no carga. Meshopt y no Draco por la razón ya documentada en el repo: el decoder de Draco de three.js referencia sus `.wasm`/`.js` con `new URL(..., import.meta.url)` y Vite los empaqueta duplicados (~1 MB muerto que el service worker precachea); el de meshopt lleva el WASM embebido (~29 KB).

Costo real medido en el bundle: el chunk `espiral3d` pasa de 613,78 kB a 643,63 kB (**+29,85 kB**, el decoder) contra **−6,5 MB** de modelo.

### 2. El cono del hero de Inicio no se distinguía en tema oscuro

**Por qué no bastaba con `material.color`.** En three.js ese color **multiplica** al `baseColorTexture`, y la textura de este cono es un gris casi uniforme y muy oscuro: promedio **31/255**, máximo 95. Multiplicar solo puede oscurecer — ningún color habría aclarado el modelo mientras el mapa siguiera puesto. Por eso `tenirModelo()` quita `map` y deja que el color se aplique sobre blanco. **No se pierde relieve**: el volumen lo dibujan el normal map y el metallic-roughness, que no se tocan, y el baseColor que se quita era casi plano de todos modos (rango 5–95) — aportaba tono, no detalle.

Tokens nuevos en `PALETAS` (nada hardcodeado en componentes):
- `modelo` — tinte del cono. `claro: null` (sin tinte: sobre fondo crema ya contrasta de sobra), `oscuro: "#CFC3AE"`, un crema deliberadamente más apagado que `text` (#F2EDE3) porque el cono es fondo detrás del titular y no debe competir.
- `veloHero` — fuerza del velo que separa cono y titular, `claro: "cc"` / `oscuro: "b3"`. **Los dos temas tienen el problema opuesto**: en claro un modelo oscuro sobre fondo claro es el caso de MÁS contraste y el velo tiene que ser fuerte; en oscuro el cono apenas se despega del fondo y taparlo al 80 % lo borraba. Con `cc` fijo en ambos (como quedó el batch anterior) el tema oscuro se comía el arreglo.

El tinte se pasa como prop (`colorModelo`) desde `App.jsx`, respetando que `espiral3d.jsx` recibe todos los colores por props y nunca toca `ThemeCtx`. Solo lo usa el hero de Inicio: el simulador de Lab y la tarjeta comparadora viven sobre `C.card`, donde el cono negro ya contrasta.

**Medición de contraste** (luminancia en la franja del hero, percentiles; p20 ≈ fondo liso, p60 ≈ cono, p95 ≈ titular):

| | fondo (p20) | cono (p60) | titular (p95) |
|---|---|---|---|
| oscuro antes | 14,0 | **17,0** | 237,3 |
| oscuro después | 14,0 | **51,1** | 237,3 |
| claro antes | 187,8 | 206,1 | 219,2 |
| claro después | 186,9 | 206,1 | 219,2 |

En oscuro el cono pasa de 3 niveles sobre el fondo (relación 1,02:1, invisible) a 37 (1,29:1, legible) **sin mover un solo nivel del titular**. En claro no cambia nada, que era la condición. Se descartó de paso una variante con velo `b3` en ambos temas: en claro hundía el fondo de 187,8 a 171,8 y el cono empezaba a competir con "EL SABOR / TIENE UNA".

### Verificación
Capturas headless de Inicio y Lab en ambos temas, comparación A/B del modelo original contra el comprimido a 230 y 340 px, y el barrido de 8 azimuts descrito arriba. `npm run build` termina en verde con `sw.js` (desde ruta sin apóstrofo — ver la nota del batch anterior sobre `App's`). Los archivos temporales de prueba (`public/__ab-*`, `scripts/__*-tmp.mjs`) se eliminaron.

## Contenedores de imagen reservados + tinte del cono en Lab (2026-08-10) — rama `fix/checklist-batch`

### Slots reservados: un mecanismo, no tres parches

El dueño pidió contenedor de imagen para Espresso y Panadería en Carta y restaurar el banner de Laboratorio, con **placeholder de color sólido** hasta que él genere las fotos definitivas.

En vez de maquetar tres divs sueltos, `assetManifest.js` ahora admite entradas con `placeholder: true` que declaran solo `color` + `width`/`height` (la caja pretendida) y ningún archivo. `ResponsiveImg` detecta esa marca y pinta un bloque sólido con la geometría final. **El punto de uso es idéntico al de una imagen real**, así que rellenar un slot no toca JSX: se agregan los imports, se cambia `placeholder: true` por los cuatro campos de fuente y listo. Los tres slots comparten la constante `BANNER = { width: 390, height: 120 }`, que es la caja real medida (columna 430 − 40 de padding).

- `menu-espresso` (#6f4b32) y `menu-panaderia` (#b08b58): entradas nuevas; `CAT_IMG` pasa de 3 a 5 categorías, o sea todas tienen banner.
- `hero-dispenser`: **se convirtió de entrada real a slot reservado**. El JPG de 1400x1011 sigue en `src/assets/` sin usar — es vertical y en una caja de 3.25:1 perdía el 78% de la imagen, así que se reemplaza por una foto encuadrada a medida en vez de recortar aquella. No rompió nada porque ningún componente lo consumía (estaba solo declarado en el manifiesto desde que se quitó el banner de Lab en `14acf93`).
- El banner de Lab vuelve con la spec exacta de `68ab232` (`width: calc(100% - 40px)`, `margin: 0 20px`, `height: 120`, `borderRadius: 14`), antes del `<Header>`, con `eager` porque es lo primero de la pantalla.
- El placeholder va con `role="presentation"`: un bloque de color no comunica nada y no debe anunciarse como imagen.

Verificado en el navegador: los seis banners (5 categorías + Lab) miden **334x120 a viewport 390** (390x120 al tope de 430), mismo ratio, `border-radius: 14px`, `padding: 0`.

**`scripts/generar-asset.mjs` (`npm run assets:generar <archivo>`)** — agregado porque el pipeline de assets se corrió una sola vez y nunca quedó script en el repo (el manifiesto se integró a mano en el Bloque 2). Emite las tres variantes WebP sin sobre-escalar, lee el color dominante y **imprime los imports y la entrada listos para pegar**; además avisa cuánto recortaría `cover` si la fuente no viene en 3.25:1. Sin esto, cada imagen nueva obligaba a reconstruir a ojo cuatro imports y una entrada.

### Tinte del cono también en Lab (y en el comparador de Inicio)

El dueño pidió el mismo tinte condicional por tema que ya tenía el hero de Inicio, "para consistencia visual entre ambos módulos". Se aplicó a **los dos usos de `EspiralTubo3D`** —el simulador de Lab y la tarjeta comparadora de Inicio— no solo a Lab: si el hero de Inicio va tinteado y la tarjeta que está 400px más abajo no, la inconsistencia se ve dentro del propio módulo Inicio. Ahora el cono se lee igual en las tres apariciones.

**El tinte tuvo que volverse reversible.** `EspiralHero` se reconstruye entero al cambiar de tema (el tema está en sus deps), pero `EspiralTubo3D` no: su efecto de montaje solo depende de `tam`, para no rehacer la escena WebGL en cada toggle. Así que el mismo material tiene que poder volver a su estado original: `tenirModelo()` guarda `map` y `color` de origen en `material.userData.qcOriginal` la primera vez que lo toca, y con `color` nulo restaura. Se aplica desde el efecto de colores, y el `.glb` puede llegar después de un cambio de tema, así que el valor vigente se lee por referencia (`modeloRef`) en el callback de carga — con el valor del montaje se habría quedado con el tinte viejo.

**Contraste medido** (espiral de menta contra el cono, aislando el cono del fondo de la tarjeta por rango de luminancia y saturación):

| | espiral vs cono |
|---|---|
| oscuro, antes del tinte | 3,65:1 |
| **oscuro, con tinte** | **1,60:1** |
| claro (nunca tinteado) | 1,82:1 |

O sea: el cono gana presencia y deja de fundirse con el fondo, pero la espiral —que es el dato del simulador— pierde separación contra él. **Queda en 1,60:1, prácticamente donde el tema claro ha estado siempre (1,82:1)**, así que no introduce un caso peor que el ya aceptado: empareja los dos temas en vez de dejar el oscuro mejor. Se le reportó el número al dueño con las opciones (tinte más apagado solo para el cono, o dejar Lab sin tinte) por si prefiere priorizar la legibilidad de la espiral sobre la consistencia.

## Tinte del cono: de crema a topo medio (2026-08-10) — rama `fix/checklist-batch`

El dueño eligió la opción de tinte más apagado tras ver que el crema `#CFC3AE` hundía la espiral. Objetivo: espiral-vs-cono por encima de 3:1 sin perder la separación cono-vs-fondo.

**Se eligió con datos, no a ojo.** Se armó un banco (`public/__tinte.html`, temporal) que replica la escena exacta del simulador de Lab —mismas constantes, mismo IBL, misma cámara— con seis tintes, y mide las dos relaciones que compiten entre sí: subir el cono lo despega del fondo pero se come la espiral, que es el dato del simulador.

| tinte | espiral/cono | cono/fondo |
|---|---|---|
| `#CFC3AE` (crema anterior) | 1,09 | 10,58 |
| `#B3A695` | 1,47 | 7,85 |
| `#9A8E80` | 1,98 | 5,77 |
| `#877C70` | 2,55 | 4,46 |
| **`#746A5F`** | **3,27** | **3,45** |
| `#615950` | 4,51 | 2,48 |

`#746A5F` es el único con ambas por encima de 3. Confirmado después en la app real (mismo criterio, recortando el canvas por su rect leído del DOM): **espiral/cono 3,17:1 · cono/fondo 3,47:1**.

**Error de medición corregido en el camino.** Las cifras del pase anterior (1,60:1 en oscuro, 1,82:1 en claro) salieron de recortar el screenshot por una ventana estimada a ojo que caía FUERA del canvas: incluía el título "LABORATORIO" en crema (contado como cono) y el párrafo en `textMuted`, que es verdoso (contado como espiral). Además, al agregar el banner del Lab el layout bajó 120px y la ventana quedó aún más desplazada. Ahora la región se obtiene del `getBoundingClientRect()` del canvas. Con el método corregido, el crema medía **1,19:1**, no 1,60 — o sea era peor de lo reportado, y peor que el tema claro. La decisión del dueño de cambiarlo era aún más correcta de lo que sugerían los números que se le dieron.

**`veloHero` (oscuro) bajó de `b3` a `8c`.** El topo llega al hero de Inicio ya atenuado por el velo, así que con `b3` la separación cono-vs-fondo caía a 1,21:1. A `8c` vuelve a **1,38:1**, sin tocar el titular: su luminancia es 237,3 en todas las variantes medidas — el velo solo mueve el cono. El tema claro no se toca (`modelo: null`, `veloHero: "cc"`).

Resumen del hero de Inicio: 1,02:1 sin tinte → 1,53:1 con crema → **1,38:1 con topo**. Se cede un poco ahí, que es el precio de recuperar 3:1 en el simulador, donde la espiral es información y no decoración.

## Fotos reales en los seis banners de 3.25:1 (2026-08-11) — rama `fix/checklist-batch`

Llegaron las seis imágenes finales del dueño, generadas a medida para la caja de 3.25:1 documentada en el reporte de medidas. Vinieron a **2260x696** (no 1170x360 como decía el mensaje — más resolución, sin problema), salvo `menu-espresso` a **2172x724 = ratio 3.00**, la única que `cover` recorta (7.7% del alto, repartido arriba y abajo; el bowl está centrado, así que no lo toca).

### Mapeo, con una corrección del dueño a mitad de camino

Las imágenes venían con nombres de hash, así que el destino se dedujo por contenido (se armó una hoja de contactos para verlas todas juntas). El primer mapeo puso los tubos en Filtrado y los dispensadores en Lab; el dueño corrigió que era al revés. Quedó:

| asset | contenido | destino |
|---|---|---|
| `menu-filtrado` | dispensadores de pared | Filtrado |
| `menu-espresso` | bowl en la tostadora | Espresso |
| `menu-frio` | frappé | Frío |
| `menu-panaderia` | bagel en plato | Panadería |
| `menu-postres-v2` | caja de cookies | Postres |
| `lab-tubos` | tubos de grano en gradilla | Laboratorio |

`-v2` en postres para no pisar el render viejo `menu-postres`, que sigue en `src/assets/` por si se quiere recuperar. Los otros huérfanos (`menu-iced`, `hero-dispenser`) también quedan en disco: Vite no los mete al bundle si nadie los importa.

### El overlay del logo: solo una de las seis

El pedido original era ponerle overlay del logo a cinco de las seis ("todas menos Frío"). Al revisar las imágenes resultó que **cinco de seis ya traen "QUADRO CAFÉ" dibujado por el generador** — en el bowl, el plato, la caja, el vaso, y en la escena misma de los dispensadores (ahí arriba a la izquierda, exactamente donde iría el overlay: habrían quedado dos logos pisados). Se le reportó al dueño con el detalle de cada una y confirmó: overlay solo donde falta. La única sin marca alguna es `lab-tubos`, y es la única que lo lleva.

Implementación: prop `logo` en `ResponsiveImg`, que envuelve el `<picture>` en un contenedor `position: relative` y superpone `<Marca size={26}>` en `position: absolute`. Tres decisiones:
- **Se reusa `Marca`**, el componente que ya dibuja el logo en el header y la nav, en vez de duplicar el tratamiento. `logo.png` no tiene alpha (es un cuadro con esquinas crema), por eso `Marca` lo recorta en círculo — replicarlo a mano habría mostrado el cuadro.
- **La marca va fuera del `<picture>`**, en un div hermano: `<picture>` solo admite `<source>`/`<img>`, meterle un div rompe el HTML. El wrapper toma la geometría y el `borderRadius`, y la foto los hereda.
- `drop-shadow` suave detrás: la gradilla tiene fondo gris medio y sin sombra el logo se perdía.

### Pipeline

`scripts/generar-asset.mjs` se amplió: acepta PNG (las fuentes venían así) y emite el JPG de respaldo, porque un PNG fotográfico pesa varias veces el JPG equivalente y `<picture>` necesita un fallback raster. Los PNG originales no se commitean — el `.jpg` queda de master, igual que los assets previos del repo.

Anchos **480/900/1170**: 1170 = 390 px CSS x DPR 3, más allá de eso ninguna pantalla usa los píxeles. Como las entradas viejas se generaron a 1400, el manifiesto ahora declara `webp: [[import, ancho], ...]` en vez de campos fijos `webp480/900/1400`, y `ResponsiveImg` arma el `srcSet` desde esa lista — así conviven ambos sin regenerar lo viejo.

De paso se corrigió el `sizes`: decía `100vw` cuando la caja real es `100vw - 56` (16 de margen del body + 40 de padding del wrapper), así que el navegador pedía una variante más grande de la necesaria.

### Verificación
Panel con las seis cajas a su geometría exacta (334x120, `cover`, radius 14) para juzgar recorte y encuadre de un vistazo, más capturas del Lab real en ambos temas. Ninguna sale estirada ni mal recortada; el overlay queda alineado con el logo del header. Build en verde con `sw.js`.

## Fincas — avatar en video (estructura) + Agua Fría pendiente (2026-08-11)

Dos cambios de estructura de código, sin tocar Higgsfield ni audio todavía:

- **Círculo de avatar de `Fincas` acepta video**: el wrapper de 92×92px (`borderRadius:"50%"`) ahora tiene `overflow:"hidden"` y, si `lote.avatar.video` existe, renderiza un `<video autoPlay loop muted playsInline objectFit:"cover">` en vez de la inicial de texto — mismo patrón que `Marca` (el logo circular del header): el archivo puede ser rectangular normal, el recorte a círculo lo hace el CSS, no hace falta pre-recortarlo ni con transparencia. Fallback a `lote.avatar.inicial` cuando no hay `video` — así Elio/Rosa/Mina (que no tienen ese campo) siguen igual. Falta la ruta del archivo final; cuando llegue, solo hay que agregar `video: <import>` al `avatar` de la finca correspondiente en `FINCAS`.

- **Agua Fría — NO se agregó todavía a `FINCAS`, a propósito**: el dueño confirmó datos cualitativos reales (caficultor **José Tomás Carrillo Batalla**, finca con más de 100 años de trayectoria, premios en Europa a inicios del siglo XX, tercera generación, variedades **Tabi, Borbón Rosado, Geisha y Monte Claro** — Geisha como varietal insignia si hace falta uno solo), pero el schema de `FINCAS` exige `zona`, `altura` (msnm), `proceso` y `score` (SCA) porque el código hace matemática con ellos (`dulzor = score - 12`, `acidez = altura / 26`, `cuerpo` según si `proceso.includes("Honey")`, línea ~857-859 de `App.jsx`) y los renderiza en la vista Comparar. El dueño confirmó explícitamente que esos 4 campos **todavía no los tiene** — agregarlos con valores inventados rompería el runtime apenas alguien seleccione Agua Fría (`undefined.includes` explota) además de violar la política de datos reales del proyecto. Queda pendiente del Bloque 7 (fusión de roster, ver "Pendiente (v4)" arriba) hasta tener esos 4 datos; también falta un 4° color en `FINCA_TINTS` (candidatos ya definidos en la paleta y sin uso ahí: `#26382f` verde profundo en claro, `#7FE3C0` alien en oscuro) y decidir el orden en el array (se recomienda agregarla al final, no al principio, para no correr los índices de `comparados` por defecto en `Fincas`, que hoy son `FINCAS[0]`/`FINCAS[1]`).
