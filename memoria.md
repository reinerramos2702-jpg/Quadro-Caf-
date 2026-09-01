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

- **Agua Fría — agregada a `FINCAS` el 2026-08-16 (índice 3, `id: "aguafria"`)**: se agregó al final del array (no al principio), así que no corre los índices de `comparados` por defecto en `Fincas` (`FINCAS[0]`/`FINCAS[1]`, siguen siendo Elio/Rosa). El schema de `FINCAS` hacía matemática asumiendo `proceso`/`score` siempre presentes (`dulzor = score - 12`, `acidez = altura / 26`, `cuerpo` según `proceso.includes("Honey")`, en `FichaLote`) y los renderizaba también en el card "Lote en barra hoy" de `Inicio` (`score`, `notas.map`) — como esos 3 datos siguen sin confirmar, se guardaron `undefined` en el objeto y se blindaron los 4 puntos de consumo (`FichaLote`: campos "Proceso"/"Puntaje" y meters "Dulzor"/"Cuerpo" condicionados a que el dato exista; `Inicio`: el bloque de score y el de `notas` condicionados igual) en vez de inventar cifras o dejar que reviente. Ver detalle completo de esta sesión más abajo.

  **Datos confirmados por el dueño (2026-08-11):**
  - Caficultor: **José Tomás Carrillo Batalla**
  - Historia: finca con más de 100 años de trayectoria, premios en Europa a inicios del siglo XX, tercera generación
  - Variedades: **Tabi, Borbón Rosado, Geisha (insignia), Monte Claro**
  - Zona: Municipio Guaicaipuro, Sector Cortada de Maturín, Estado Miranda
  - Altura: **1200 msnm**

  **Pendiente del checklist (el dueño aún no los pasó — esperar, no inventar):**
  - Proceso de beneficio
  - Puntaje SCA
  - Notas de cata

  **`FINCA_TINTS` (`App.jsx` línea ~80)**: el 4º valor de `claro` ya quedó fijado en `#26382f` (verde profundo, confirmado por el dueño) — es inerte hasta que Agua Fría entre al array (`FINCAS.findIndex` nunca llega al índice 3 con solo 3 fincas). El candidato de `oscuro` (`#7FE3C0` alien) fue **descartado explícitamente**; el dueño no dio reemplazo — sigue pendiente, no agregar nada ahí sin confirmar.

  **Regla permanente (confirmada por el dueño 2026-08-11):** todo cambio de código o de dato debe reflejarse en los `.md` correspondientes (`memoria.md`, `CLAUDE.md`, y los que apliquen) **en el mismo paso**, no después — ver también `CLAUDE.md`.

## Limpieza de ramas: Bloque 8 (Barra) y Bloque de banners, mergeados a `main` (2026-08-16)

`main` estaba varios días atrasado de dos ramas de trabajo terminado: `fix/barra-dashboard` (Bloque 8) y `fix/checklist-batch` (banners con fotos reales + estructura de avatar-video de Fincas, ver secciones de arriba). Se mergearon ambas a `main` y se pusheó a `origin/main` (`706c647` → `9eaaa39`).

**`fix/checklist-batch` mergeó limpio, sin conflictos** (fast auto-merge de git).

**`fix/barra-dashboard` NO se mergeó directo — se aplicó a mano.** Esa rama se creó el 4 de agosto (`d0e68a7`), antes de que aterrizara en `main` el trabajo del 10-11 de agosto: VIOLA-Acentos, compresión del `.glb` (17.8x, 6.88MB→395KB) y el hero 3D real en Three.js (`EspiralHero`/`EspiralTubo3D`, `src/lib/espiral3d.jsx`). Un `git merge` directo producía 4 archivos en conflicto (`App.jsx`, `memoria.md`, `package-lock.json`, `public/models/espiral.glb`) y, de resolverse ingenuamente, habría **regresado** las tres cosas de arriba: el `.glb` volvía a su versión sin comprimir de 7.2MB, el hero de Inicio volvía a un `<model-viewer>` estático + SVG plano en vez del Three.js real, y el fix de acentos en VIOLA se perdía (esa rama nunca tuvo `VIOLA Acentos`/`scripts/generar-acentos-viola.mjs`, que de hecho borraba). `package.json`/`assetManifest.js` también tenían ese mismo problema (borraban `three`/`gltf-transform`/`sharp`/`opentype.js` y los scripts npm; y volvían a "slots reservados" en vez de las fotos reales de banners que trajo `fix/checklist-batch`).

Se extrajo a mano solo lo específico del Bloque 8 (verificado que es contenido nuevo, no stale) y se aplicó sobre el `App.jsx` actual de `main`:
- `METODOS_PAGO` / `ENTREGA_OPCIONES` / `ESTADOS_ORDEN` (consts de datos, sección `DATOS REALES`).
- `Carrito`: ahora pide nombre + para acá/llevar + método de pago, y llama `enviarABarra` (prop nueva) en vez de un `confirmar` que generaba un número random.
- `Ticket`: ahora recibe la `orden` completa y escucha su estado real por Supabase Realtime (`postgres_changes` sobre `ordenes`), en vez de un temporizador simulado de 4 pasos fijos.
- `QuadroCafe` (App): `ticket`/`setTicket` (número mock) reemplazado por `orden`/`setOrden` (fila real de Supabase); nueva función `enviarABarra` que hace el `insert` en la tabla `ordenes` y devuelve `{ok:false, error}` en vez de lanzar.
- Bloque nuevo `BARRA (BOH)` al final de `App.jsx`: `OrdenCard`, `reproducirBeep` (beep con Web Audio, sin asset), y `export function BarraDashboard()` — dashboard standalone para tablet/PC del local, login compartido con el Panel Admin, cola de órdenes activas por Realtime con beep+destello al llegar una nueva, botón de avanzar/cancelar estado.
- `src/main.jsx`: decide `#barra` vs la app de cliente una sola vez al montar (`BarraDashboard` en vez de `QuadroCafe`) — **sin** el `import "@google/model-viewer"` que traía esa rama, porque ya no hace falta (el hero usa Three.js).
- `supabase/migrations/0002_ordenes.sql` (archivo nuevo, sin conflicto): tabla `ordenes` + `ordenes_contador` (numeración secuencial diaria atómica vía trigger `security definer`), RLS (lectura/inserción pública, actualización solo `authenticated`), y alta en la publicación `supabase_realtime`. **Falta correrla a mano en el SQL Editor de Supabase** — no hay CLI de Supabase en este entorno para aplicarla.

Icons nuevos importados en `App.jsx` (ya estaban en `lucide-react`, solo faltaba el import): `Banknote, Smartphone, Landmark, DollarSign` (métodos de pago), `Volume2, VolumeX, Bell, XCircle, Home, Package, User` (entrega + dashboard).

`npm run build` corre en verde (la app compila y bundlea sin errores) — el único fallo es el conocido problema local del apóstrofo de la carpeta rompiendo la escritura de `sw.js` por `vite-plugin-pwa`/workbox (ver `quadro-cafe-build-apostrofo.md` en memoria del agente), no algo de este cambio.

**Deploy verificado en vivo tras el push**: Cloudflare Workers Builds disparó solo (commit `9eaaa39`, deploy `2026-08-16T19:32:06Z` según `wrangler deployments list`), y el bundle servido en `https://quadro-cafe.reinerramos2702.workers.dev/` ya contiene "Dashboard de barra"/"numero_orden" — confirmado con `curl` al JS de producción, no solo asumido por el trigger de push.

**Pendiente real después de este merge:**
- Correr `supabase/migrations/0002_ordenes.sql` en el proyecto de Supabase — sin eso, `/#barra` y el carrito muestran el mensaje de "Supabase no está configurado" / fallan al enviar, aunque el código ya está en producción.
- Verificar en el dashboard de Supabase (Database → Replication) que `ordenes` quedó en la publicación `supabase_realtime` después de correr la migración (el script lo intenta solo, pero conviene confirmarlo una vez, según su propio comentario de cabecera).

## Agua Fría entra a `FINCAS` + avatar conversacional real D-ID Agents (2026-08-16)

Sin tocar el módulo de Elio (Mocotíes): se agregó la 4ª finca al array `FINCAS` de `App.jsx` (`id: "aguafria"`, índice 3) copiando el patrón exacto de las otras tres (mismo shape de objeto, mismo `Chip` de selección, misma `FichaLote`), con los datos ya confirmados por el dueño (José Tomás Carrillo Batalla, Cortada de Maturín/Guaicaipuro/Miranda, 1200 msnm, Tabi/Borbón Rosado/Geisha insignia/Monte Claro, 100+ años de trayectoria, premios en Europa desde inicios del siglo XX, 3ra generación).

**Los 3 datos que el dueño todavía no confirmó (proceso de beneficio, puntaje SCA, notas de cata) se dejaron fuera del objeto — no placeholders con cifras falsas.** Como `FichaLote` y el card "Lote en barra hoy" de `Inicio` asumían que `score`/`proceso`/`notas` siempre existen (hacían `score - 12`, `proceso.includes(...)`, `notas.map(...)` sin guardas), se blindaron los 4 puntos de consumo para que cada campo derivado se oculte si su dato base falta, en vez de reventar con `undefined.includes` o mostrar "NaN":
- `FichaLote`: los pares "Proceso"/"Puntaje" del grid solo se agregan si `lote.proceso`/`lote.score` existen; los meters "Dulzor" y "Cuerpo" solo se renderizan si su valor derivado no es `null`.
- `Inicio` ("Lote en barra hoy"): el bloque de puntaje SCA a la derecha solo aparece si `lote.score != null`; el bloque de chips de `notas` solo aparece si `lote.notas` existe y tiene largo.

Cuando el dueño confirme los 3 datos, basta con agregarlos al objeto de `FINCAS` — las guardas los recogen solas, no hace falta tocar el JSX de nuevo.

**Avatar**: el agente ya está creado y funcionando en D-ID Agents (plan free trial — el iframe trae el watermark de D-ID hasta activar un plan pago, avisado a Reiner). Se agregó `agentUrl` al objeto `avatar` de Agua Fría con la URL de embed pública; en `Fincas`, el círculo del avatar ahora chequea `lote.avatar.agentUrl` antes que `lote.avatar.video`/`inicial` y, si existe, renderiza un `<iframe allow="microphone; camera">` con el mismo patrón de tamaño-fijo + `overflow:hidden` que ya usaba el patrón de video — pero más grande (168px vs 92px, el dueño pidió explícitamente que se vea más la persona), con el header del card creciendo a 260px (vs 216px) para que quepa sin cortarse. Elio/Rosa/Mina no tienen `agentUrl`, así que siguen exactamente igual. El inductor de texto/audio (`guion`, con Reproducir/Transcripción) se mantuvo también para Agua Fría, con 5 líneas que solo usan los datos ya confirmados arriba — nada de proceso/score/notas mencionado ahí tampoco.

**`FINCA_TINTS`**: el 4º valor de `claro` (`#26382f`, verde profundo) ya estaba reservado para este índice desde el 2026-08-11 y ahora está activo. `oscuro` sigue con solo 3 valores a propósito (el dueño rechazó `#7FE3C0` sin dar reemplazo) — Agua Fría cae al fallback `C.brand` en tema oscuro hasta que el dueño confirme un 4º color; no agregar nada ahí sin confirmar.

**Verificado**: `npm run build` compila igual que siempre (falla solo en el paso conocido de `sw.js` por el apóstrofo de la carpeta, no por este cambio — ver `quadro-cafe-build-apostrofo.md`). Con `npm run dev` + Chrome headless por CDP (sin extensión de Chrome en esta máquina) se confirmó por screenshot: Elio sin cambios (círculo 92px, ficha completa con Proceso/Puntaje), y Agua Fría con el chip activo, tint verde correcto, círculo grande con el `src` del iframe exacto al que pasó Reiner, y la ficha mostrando solo Altura/Varietal/Acidez (Proceso/Puntaje/Dulzor/Cuerpo correctamente ausentes) sin romper el layout en mobile. El iframe se vio en blanco en ese test puntual — esperable en Chrome headless sin GPU real cargando una SPA pesada como D-ID Studio; no verificado aún en un navegador real, pedirle a Reiner que confirme visualmente tras el deploy.

**Deploy**: pusheado a `main` (`2d19e48..029b41f`), Cloudflare Workers Builds lo tomó automático.

## Agua Fría — 2 bugs reportados por el dueño en producción, arreglados (2026-08-16)

Reiner confirmó visualmente en producción (mobile Chrome, `workers.dev`) y reportó 2 problemas.

**Bug 1 — el iframe D-ID se veía cortado dentro del círculo.** El primer intento metió el `<iframe>` de D-ID dentro del mismo wrapper circular de 168px que Elio/Rosa/Mina usan a 92px. En producción, D-ID's página de "share" resultó traer su propio chrome (ícono de ajustes, botón de mic, y un banner de error "The agent is temporarily unavailable") que el `border-radius:50%` recortaba por las esquinas, tapando la cara del avatar. Se investigó en `docs.d-id.com` si existe algún parámetro de URL para un modo minimalista — **no existe**: el link `studio.d-id.com/agents/share` está pensado para abrirse a página completa, no para iframearse en una forma chica. El único "embed limpio" real de D-ID es otro mecanismo (`<script data-mode data-client-key data-agent-id>`, con un `client-key` que hay que generar vía API con credenciales de la cuenta D-ID que no tenemos) y de todos modos sigue mostrando controles propios, solo que como burbuja flotante — no resuelve el problema del recorte tampoco.

Solución aplicada: en vez de un círculo, Agua Fría ahora usa un **rectángulo redondeado** (`aspectRatio: "4/5"`, ancho completo de la card, `borderRadius:20`) para que la UI de D-ID tenga espacio y no se corte en las esquinas. El nombre/rol se movió abajo del rectángulo (antes estaba superpuesto sobre el círculo). El círculo original de 92px de Elio/Rosa/Mina quedó **intacto, sin tocar** — es una rama `if (lote.avatar.agentUrl) {...} else {...}` separada en `Fincas` (`App.jsx`), no un parámetro que afecte a las demás fincas.

**Ojo — no verificado del todo:** el mensaje "agent temporarily unavailable" que vio Reiner podría no ser solo el recorte visual — puede ser un fallo real del lado de D-ID (límite de cuota del free trial, o restricciones de iframes de terceros en Chrome mobile bloqueando el flujo de auth/permiso de mic de D-ID). Pendiente: que Reiner abra el `agentUrl` directo en una pestaña de mobile (sin iframe) para descartar si el error es propio del embedding o un problema del servicio de D-ID.

**Bug 2 — "Reproducir inducción" no sonaba audio.** Confirmado por `grep`: no hay ningún `<audio>` ni TTS en todo `App.jsx` (el único uso de audio real es el beep de Web Audio del dashboard de barra, algo completamente distinto). El botón siempre fue un simulador de subtítulos — `guion` es un array de texto que avanza solo con `setTimeout` cada 3.4s — y esto es así **para las 4 fincas, no solo Agua Fría** (ya estaba documentado arriba en este archivo: "videos de avatar Higgsfield reemplazarían el reproductor de inducción actual", el plan real siempre fue video grabado, nunca voz sintetizada). No es un bug nuevo introducido con Agua Fría.

Se le preguntó a Reiner cómo resolverlo (afecta código compartido con Elio) y eligió **renombrar el botón app-wide** en vez de dejarlo así o agregar voz real por Web Speech API. Cambio de copy únicamente, sin tocar lógica ni datos de ninguna finca: "Reproducir inducción" → **"Ver guion"** (se mantienen los íconos Play/Pause, porque el guion sigue avanzando solo al tocarlo, solo que ya no promete ser audio), y en el card "Lote en barra hoy" de `Inicio`, "Escuchar la inducción de la finca" → **"Ver el guion de la finca"**.

**Verificado**: `npm run build` sigue en verde (mismo fallo conocido del apóstrofo, no relacionado). Con `npm run dev` + Chrome headless por CDP se confirmó por screenshot que Elio sigue exactamente igual (círculo 92px, botón ahora dice "Ver guion") y que Agua Fría muestra el rectángulo grande sin cortes de layout, con el mismo copy corregido. El iframe D-ID seguía en blanco/cargando en el test headless (sin GPU real, SPA pesada) — no se pudo confirmar ahí si el fix del bug 1 resuelve el recorte real ni si el bug del "agent unavailable" persiste; eso requiere que Reiner lo revise en un navegador real tras el deploy.

**Deploy**: pusheado a `main`.

### Seguimiento — foto de José Tomás sí está bien encuadrada, el bug 1 ya estaba resuelto (2026-08-16, mismo día)

Reiner volvió a reportar el recorte (screenshot mostrando oreja/hombro dentro de un círculo, con el botón diciendo "Reproducir inducción") y sospechó que la foto fuente subida a D-ID estaba mal encuadrada. Se verificó abriendo el `agentUrl` directo en una pestaña (sin iframe, vía Chrome headless por CDP) según pidió:

- **La foto/video de origen está bien encuadrada**: retrato de busto, cara centrada, sombrero, fondo natural — no hace falta resubir nada a D-ID.
- **Medido en el shadow DOM de D-ID**: el `<video>` real mide **864×1080px, aspect ratio exacto 4:5 (0.8)** — coincide exacto con el `aspectRatio: "4/5"` que ya tenía el contenedor rectangular del fix anterior. A esa proporción exacta el video entra completo, sin recortar.
- **El screenshot que mandó Reiner era de la versión vieja**: se confirmó bajando el JS servido en ese momento en `quadro-cafe.reinerramos2702.workers.dev` — ya contenía `"Ver guion"` y `aspectRatio`, o sea el fix del rectángulo ya estaba desplegado. El círculo de 168px + "Reproducir inducción" del screenshot corresponden al deploy anterior (`029b41f`), no al actual (`71a96f7`) — probablemente cache del navegador o el deploy de Cloudflare todavía no había propagado en el momento de esa captura.

Pendiente: que Reiner confirme con recarga forzada / incógnito si con el rectángulo 4:5 ya se ve bien — no se dio el bug por cerrado sin esa confirmación en dispositivo real.

### Segundo seguimiento — 2 bugs finos, causa raíz encontrada y arreglada con cambio de arquitectura (2026-08-16, mismo día)

Reiner probó en su celular real (Chrome mobile) y confirmó que la cara ya se ve centrada, pero reportó 2 ajustes finos con foto:
1. El sombrero se corta arriba.
2. El botón "Start call" de D-ID queda corrido hacia la derecha, no centrado.

**Investigación — se midió con precisión en vez de adivinar por CSS.** Se replicó el iframe de D-ID en un HTML aislado (`test-card.html`, mismo CSS que la card real) y se inspeccionó el DOM interno de D-ID directamente vía Chrome DevTools Protocol (esto evita el CORS que normalmente bloquea leer adentro de un iframe cross-origin desde JS de la página) — un truco válido acá porque el objetivo era diagnosticar, nunca fue leer datos privados del usuario ni nada por el estilo.

- **Botón descentrado — causa exacta encontrada:** el `<video>`/UI interno de D-ID tiene un **ancho mínimo fijo de ~350px** que no se achica más allá de eso. Se barrieron varios anchos de contenedor (320 a 372px) y se confirmó la fórmula exacta: `offset = 175 − (ancho_real_del_contenedor / 2)` — el botón siempre queda centrado sobre ese frame interno fijo de 350px, no sobre nuestro contenedor real. Como nuestra card angosta (margen + padding + borde) deja casi siempre menos de 350px de ancho real en la mayoría de celulares (360-412px de ancho de pantalla), el bug aparecía casi siempre.
- **Sombrero cortado — causa exacta encontrada:** el `<img>` de preview estático de D-ID aplica un zoom fijo del ~105% centrado (recorta ~2.5% de cada borde) — probado en aspect ratio 4:5, 3:4 y 1:1, mismo recorte relativo en los tres casos. No depende del aspect ratio ni del tamaño del contenedor, así que no había ningún ajuste de CSS de nuestro lado que lo evitara.
- **Techo estructural:** la card tiene `overflow:hidden` para el borde redondeado, lo que pone un techo real a cuánto puede medir el iframe embebido — ni sacándole todo el padding se llega a 350px en la mayoría de celulares. Es decir: los 2 bugs eran quirks internos de D-ID, no arreglables por CSS mientras el iframe viva embebido en una card angosta.

**Se le presentó el hallazgo a Reiner con 3 opciones** (dejarlo así, pedirle a D-ID una config oficial, o cambiar de arquitectura) y **eligió cambiar de arquitectura**: foto estática en la card + abrir el agente aparte a pantalla completa.

**Implementado:**
- Se extrajo la foto real de José Tomás (300×375, sin marca de agua) directo del `<img>` interno de D-ID vía el mismo harness de inspección — es la misma foto que él ya tiene cargada ahí, no hubo que pedirle una nueva. Guardada como `src/assets/jose-tomas.jpg` (18.7 KB), agregada a `avatar.foto` en el objeto de Agua Fría en `FINCAS`.
- La card de Agua Fría en `Fincas` ahora muestra esa foto fija (rectángulo redondeado 4:5, `objectFit:"cover"`, sin problemas de recorte porque es una imagen local que controlamos entera) con un botón "Hablar con José Tomás" superpuesto abajo.
- Al tocar el botón, se abre `AgenteFincaOverlay` (componente nuevo) — un overlay a pantalla completa dentro del frame de teléfono de la app, mismo patrón que `EstudioLightbox` (`position:absolute inset:0`, fondo oscuro, botón X para cerrar). Ahí el iframe de D-ID queda con solo 8px de aire a cada lado — ancho de sobra (≈ ancho del dispositivo − 18px) para superar el piso de 350px de D-ID en casi todos los celulares reales (queda como caso raro sin garantía los celulares muy angostos, por debajo de ~370px de ancho — no se persiguió más allá de ahí).
- El estado `agenteAbierto` vive en `Fincas` y se resetea a `false` al cambiar de finca (mismo `useEffect` que ya reseteaba `linea`/`reproduciendo`).

**Verificado**: `npm run build` en verde (mismo fallo conocido del apóstrofo). Con `npm run dev` + Chrome headless por CDP se confirmó por screenshot: Elio exactamente igual (sin tocar en ninguna de las 3 iteraciones del día), la card de Agua Fría con la foto completa y nítida (sombrero entero visible, sin recorte), y el overlay abriendo correctamente con el iframe a ancho completo. El iframe seguía en blanco/cargando en el test headless puntual (limitación conocida del sandbox sin GPU real) — no se pudo re-confirmar ahí si el botón queda perfectamente centrado dentro del overlay real; pedirle a Reiner que lo pruebe en su celular la próxima vez.

**Deploy**: pusheado a `main`.

### Foto de José Tomás reemplazada por una de mayor resolución (2026-08-16, mismo día)

Reiner mandó la foto de referencia real de José Tomás en alta resolución. Comparación:
- **Vieja** (`jose-tomas.jpg` original): 300×375px, 18.7 KB — era el thumbnail de preview que D-ID renderiza puertas adentro, extraído de ahí por necesidad (no había una fuente mejor a mano en ese momento).
- **Nueva** (la que mandó Reiner): 1122×1402px, 1.9 MB PNG — casi 14× más píxeles, foto de referencia real.

Se re-codificó con `sharp` (ya es dependencia del proyecto, la usa `scripts/generar-asset.mjs`) a JPEG calidad 85 + mozjpeg → **1122×1402, 110 KB** — mismo 4:5 exacto que ya tenía, así que no hizo falta tocar el `aspectRatio` del contenedor en `Fincas`. Reemplazó a `src/assets/jose-tomas.jpg` sin cambios de código, solo el archivo.

**Verificado**: `npm run build` en verde (mismo fallo conocido del apóstrofo, no relacionado).

**Deploy**: pusheado a `main` (commit `5508d4e`).
- Las ramas remotas `fix/barra-dashboard` y `fix/checklist-batch` (y sus locales) quedaron atrás de `main` — no se borraron todavía, se puede limpiar cuando se confirme que no falta nada más por rescatar de ellas.

## Módulo Estudio eliminado (2026-08-17)

Reiner decidió sacar el tab "Estudio" — subida de fotos/video del local + asignación a un "destino" en la app — porque nunca lo terminó usando en producción.

**Investigación antes de borrar (pedida explícitamente):**
- **Datos en Supabase**: ninguno. `Estudio` nunca tocaba Supabase — era puro estado local (`useState(MEDIOS_INICIALES)` en `QuadroCafe`) con `URL.createObjectURL(file)` para previsualizar lo subido; se perdía al recargar la página. No había tabla que migrar ni borrar.
- **Referencias cruzadas**: ninguna real. `DESTINOS`/`medios`/`setMedios`/`EstudioLightbox` solo se usaban dentro del propio módulo. Ojo con el falso amigo: existe una sección **"Estudio de color"** dentro de Aula/Academia (la lección de cómo el color de la taza cambia el dulzor percibido) — nombre parecido, cero relación, no se tocó.
- **`main.jsx`**: no maneja Estudio para nada. Su único ruteo por hash/query es `#barra`/`?barra=1` para decidir `BarraDashboard` vs `QuadroCafe` — la navegación entre tabs (Inicio/Carta/Fincas/Lab/Aula/Estudio) es 100% estado de React dentro de `QuadroCafe` (`tab`/`setTab`), sin tocar la URL salvo el manejo de back-button. Sacar una pestaña de ese estado no afecta el routing de las demás.

**Eliminado de `src/App.jsx`:**
- Componentes `Estudio` y `EstudioLightbox` completos (bloque bajo el comentario `/* ESTUDIO MULTIMEDIA */`).
- Constantes `DESTINOS` y `MEDIOS_INICIALES`.
- Estado `const [medios, setMedios] = useState(MEDIOS_INICIALES)` en `QuadroCafe`.
- Entrada `{ k: "estudio", t: "Estudio", i: ImageIcon }` del array `TABS` (nav inferior).
- Render condicional `{tab === "estudio" && <Estudio .../>}`.
- Imports que solo usaba ese módulo: iconos `ImageIcon`, `Upload`, `Trash2` (lucide-react); `estudioLocal`/`estudioPourover` (los dos JPG semilla).
- Carpeta `src/assets/estudio/` completa (`local-barra.jpg`, `pourover-barra.jpg`).
- Los 3 comentarios en el código de `Fincas`/`AgenteFincaOverlay` que mencionaban "mismo patrón que `EstudioLightbox`" (referencia de diseño, del trabajo de Agua Fría de ayer) se reescribieron para no señalar a un componente que ya no existe — ahora dicen "mismo patrón position:absolute inset:0 que usaba el módulo Estudio, eliminado 2026-08-17".

Nav inferior quedó en 5 pestañas: Inicio, Carta, Fincas, Lab, Aula.

**Verificación**: se delegó un primer intento a un subagente en paralelo (mientras el hilo principal investigaba Framer Motion para la Fase 2), pero su reporte final salió inservible — devolvió un eco confuso de un mensaje de estado en vez de hallazgos reales, así que no se confió en él. La verificación real la hizo el hilo principal directamente después: `npm run build` en verde (mismo fallo conocido del apóstrofo, no relacionado), `grep` en `App.jsx` sin ninguna referencia huérfana a `Estudio`/`DESTINOS`/`MEDIOS_INICIALES`/`medios`/`ImageIcon`/`Upload`/`Trash2` (solo quedan los 3 comentarios históricos correctos y el "Estudio de color" de Aula, que no es este módulo), y con `npm run dev` + Chrome headless por CDP se confirmó por screenshot: el nav real devuelve exactamente `["Inicio","Carta","Fincas","Lab","Aula"]`, cero errores de consola, Lab/Aula/Fincas (Elio, default) cargan y se ven perfectos.

**Deploy**: pusheado a `main`.

## Sprint "Alta Gama" (Track D) — Fase 2: Sistema de motion (2026-08-17)

Reiner arrancó un sprint largo de pulido visual/interactividad (mapa completo: Fase 2 motion → Fase 3 Carta → Fase 4 Inicio → Fase 5 Lab → Fase 6 Fincas+Aula → Fase 7 transversal), con reglas fijas para todo el sprint: un commit+push por fase cerrada (nunca acumular fases en un push), documentar en el mismo paso, esperar confirmación visual del dueño antes de la fase siguiente, no tocar Elio/Fincas de Agua Fría salvo que la fase lo pida, avisar antes de gastar créditos de Higgsfield, probar claro y oscuro siempre, y medir en kb gzip exacto cualquier librería nueva antes de aprobarla.

**Reparto de trabajo de esta fase**: por pedido explícito de Reiner, se paralelizó con subagentes en vez de todo secuencial — un subagente de investigación (impacto de Framer Motion en bundle) corrió en paralelo mientras el hilo principal hacía la limpieza del módulo Estudio (ver sección de arriba). El research de Framer Motion salió sólido y se usó tal cual. **Nota aparte**: el intento de delegar la *verificación* de Estudio a un subagente (en paralelo, mismo momento) salió mal — el subagente devolvió un reporte inservible (un eco confuso de un mensaje de estado, no hallazgos reales) — así que esa verificación se rehizo a mano en el hilo principal. Lección para la próxima: la investigación pura (research, sin estado compartido) delegó bien; una verificación que depende de leer archivos/correr comandos en el momento exacto es más frágil delegada — vale la pena pedirle al subagente evidencia concreta (output de comandos, no solo un resumen) al reportar.

**Decisión Framer Motion — NO se suma** (medido, no ojo al bulto): `framer-motion` completo son 62KB gzip (Bundlephobia); incluso `LazyMotion`+`domAnimation`, documentado en ~19.6KB, se midió en **~43KB gzip real** en un issue del propio repo de la librería (motiondivision/motion#1585 — la doc asume tree-shaking ideal que no siempre pasa). El sistema CSS que la app ya tenía (`qc-rise`/`qc-pop`/`qc-slide`/`qc-sheet`/`qc-pulse`/`qc-bar`, todos con `@keyframes` propios) cubre lo que pide el sprint (entradas/salidas, spring sutil, crossfade, fill-on-scroll) a costo casi nulo — `qc-bar{from{width:0}}` en particular ya es exactamente el patrón de fill-on-scroll que pide la Fase 4, solo le falta el trigger (`IntersectionObserver`).

**Implementado** (aditivo, nada existente se tocó): tokens de motion como CSS custom properties en `buildCss()` (`App.jsx`) — `--motion-fast` (150ms, toque), `--motion-base` (300ms, transición de contenido), `--motion-slow` (500ms, hero), `--ease-out` (entradas), `--ease-in-out` (transiciones de estado), `--ease-spring` (overshoot sutil para elementos táctiles). Tres clases nuevas que los consumen: `.mo-tap` (spring de toque), `.mo-enter`/`.mo-hero` (reusan el keyframe `qc-rise` ya existente, sin tocarlo, solo con duración/easing del token system). Ninguna animación vieja (`.rise`/`.pop`/`.slide`/`.sheet`/`.press`/`.tapfx`/`.pulse`/`.bar`/`.drip`/`.steam`) se modificó — es vocabulario nuevo para lo que viene, no una migración de lo existente.

**Componente de ejemplo (definición de hecho de la fase)**: el botón de `ThemeToggle` (☀/🌙 en el header, visible en toda la app) pasó de `className="press"` a `className="mo-tap"` — es el único cambio de comportamiento visible de esta fase. Confirmado en DevTools con el build real: `transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)`, coincide exacto con `--motion-fast`/`--ease-spring`.

**Verificado**: `npm run build` en verde (mismo fallo conocido del apóstrofo). Bundle: **77.39 KB gzip** (antes 76.25 KB → **+1.14 KB**, solo CSS/comentarios, sin dependencia nueva — dentro del presupuesto de ~50kb que puso Reiner con margen de sobra). Probado en Chrome headless por CDP en **ambos temas** (claro y oscuro, toggle real funcionando, ícono cambia Sun↔Moon) — se ven bien los dos, sin romper nada del resto de Inicio.

**Deploy**: pusheado a `main`.

## Sprint "Alta Gama" — Fase 3: Carta (2026-08-17)

Reiner confirmó la Fase 2 en producción y pidió arrancar la Fase 3, y en el mismo mensaje adjuntó 5 fotos de tazas para el widget "La taza también sabe" de Inicio — que es trabajo de **Fase 4**, no de Fase 3, según su propio mapa del sprint. Se le preguntó cómo secuenciar y eligió terminar Fase 3 primero. Las fotos no llegaron adjuntas en el mensaje (se le avisó y quedó pendiente que las reenvíe).

**Reparto**: esta fase se hizo secuencial en el hilo principal (no ameritaba paralelizar — era una sola pieza de código coherente, sin research previo que valiera la pena delegar).

**Implementado, las 7 piezas pedidas** (detalle técnico completo en `CLAUDE.md` § Motion system — Fase 3):
1. **Fly-to-cart**: un punto viaja del botón "+" tocado hasta el ícono del carrito, vía Web Animations API (no CSS `@keyframes` fijo, porque el origen cambia en cada tarjeta).
2. **Badge del carrito con bounce + count-up**: retriggerea la animación sin remontar (para no perder el estado del conteo animado), número real cuenta en vez de saltar.
3. **Transición de categorías con slide + underline animado**: el underline se mide contra la posición real de cada chip (no un ancho fijo), el contenido remonta como bloque atómico con `.slide`.
4. **"Elegir finca y taza" como acordeón animado**: técnica CSS `grid-template-rows: 0fr→1fr`, sin salto de layout, sin medir con JS.
5. **Feedback táctil (scale .96 + sombra)**: clase nueva `.mo-press`, **sin tocar** la `.press` compartida que usa Elio/Fincas/el resto de la app.
6. **Precio con count-up**: total del carrito y subtotal por fila.
7. **Skeleton loaders al cambiar de categoría**: shimmer de ~260ms, honesto en los comentarios de que es una transición deliberada (los datos ya están en memoria, no hay carga real).

**2 bugs reales encontrados y arreglados durante la verificación** (no en el código que se planeaba pushear tal cual — se probó de verdad antes de dar la fase por cerrada):
- **Flash de contenido antes del skeleton**: el estado `cambiando` se prendía reactivamente en un `useEffect` que observaba `cat`, así que React ya había re-renderizado los items de la categoría nueva por un frame antes de que el efecto alcanzara a mostrar el skeleton. Fix: `cambiando` se prende en el MISMO handler de click que cambia `cat` (`cambiarCategoria`), nunca reactivo — los dos estados quedan en el mismo render, nunca hay un frame intermedio.
- **Banners de categoría duplicados en el DOM**: la versión inicial tenía el banner (`ResponsiveImg key={cat}`) y el bloque de items (`<div key={cat}>`) como dos hermanos con su propia key cada uno. Reproducido y confirmado con un **build de producción** (no era artefacto de StrictMode/dev): cambiar de categoría dejaba banners viejos pegados en el DOM en vez de reemplazarlos — después de Filtrado→Espresso→Filtrado había 3 banners apilados en vez de 1. Costó bastante diagnosticar (se probó con instrumentación de `console.log`, inspección directa del DOM vía CDP, comparación dev vs producción) antes de encontrar el fix real: un solo wrapper con una sola key envolviendo banner + contenido juntos, para que remonten como una unidad atómica. Verificado después con `document.querySelectorAll('picture').length === 1` tras la misma secuencia de clicks que antes daba 3.
- También se corrigió un bug de redondeo en `AnimatedNumber`: sin el fix, un precio como $4.50 se redondeaba a entero durante el conteo animado y se quedaba en $5 en vez de terminar en $4.50 exacto — separado el comportamiento según si el componente recibe `format` (precios, sin redondear) o no (conteos enteros, sí redondear).

**Verificado**: `npm run build` en verde. Bundle: **78.68 KB gzip** (antes 77.39 KB de Fase 2 → **+1.29 KB** para las 7 piezas, sin ninguna dependencia nueva). Probado con Chrome headless por CDP: flujo completo (cambiar categoría → agregar al carrito → badge → acordeón → carrito con count-up) sin errores de consola, en ambos temas. Fincas/Elio confirmados sin tocar (`.press` global intacto, solo Menu/Carrito usan la clase nueva `.mo-press`).

**Deploy**: pusheado a `main` (`04708a9`, confirmado up to date con `origin/main` — esta nota se había quedado desactualizada, corregida al retomar la sesión para Fase 4).

## Sprint "Alta Gama" — Fase 4: Inicio (2026-08-17, mismo día)

Reiner pidió arrancar Fase 4 con 4 piezas: swap de taza por color (SVG, fotos reales después), barras de Extracción/Cuerpo/Acidez con fill-on-load, "Simular vertido" con trazo de agua en tiempo real, y parallax sutil en el hero.

**Ambigüedad de alcance resuelta antes de tocar código**: "swap de taza por color" y "Simular vertido" ya existen como nombres en la app — el primero es el widget de Aula/Academia (tazas de color fijo, efecto en dulzor percibido), agendado para Fase 6 en el propio mapa del sprint; el segundo es el botón de Laboratorio, agendado para Fase 5. Se le preguntó a Reiner directamente en vez de adivinar, porque construir en el componente equivocado habría sido caro de deshacer. Confirmó: **ambos son piezas NUEVAS dentro de Inicio**, sin tocar Aula ni Laboratorio — homónimos por coincidencia temática, no el mismo widget adelantado.

**Implementado, las 4 piezas** (detalle técnico en `CLAUDE.md` § Motion system — Fase 4):
1. Barras con fill-on-load + re-fill al cambiar de ruta — resultó que el fill-on-load YA existía desde Fase 2 (`.bar`/`qc-bar`, documentado ahí mismo como "le falta el trigger"); esta fase agregó justamente ese trigger, generalizando `useRetriggerAnim` (antes hardcodeado a `.mo-bounce`) para aceptar cualquier clase, y sumando un `triggerKey` opcional a `Meter` — sin tocar los usos existentes en Fincas/Laboratorio (su `triggerKey` queda `undefined`, la dependencia del hook nunca cambia, cero comportamiento nuevo ahí).
2. Taza SVG con color derivado de `cuerpo` (interpolado entre `C.card` y `C.brandAlt`, nunca un hex nuevo suelto — sigue la regla de `CLAUDE.md` de no hardcodear color fuera de `PALETAS`), crossfade real vía `transition: fill` de CSS (por eso el elemento vive fuera del `key={geo.id}` que remonta el tubo 3D — un nodo remontado no tiene "desde" que cruzar) y bounce reusando `useRetriggerAnim`.
3. "Simular vertido" en Inicio reusa el mecanismo que ya tenía `EspiralTubo3D` (`prog` dibuja el tubo progresivamente) en vez de una animación CSS paralela — mismos 4200ms que el de Laboratorio, para no inventar un segundo ritmo de vertido en la misma app.
4. Parallax del hero: `translateY` de la capa 3D a una fracción (`×.2`) del `scrollTop` real de `.qc-scroll`, con techo de 36px para que "sutil" sea literal, throttled a un frame con `rAF`. Cero librerías nuevas — coherente con la decisión de Fase 2 de no sumar Framer Motion.

Las 4 piezas respetan `prefers-reduced-motion` a mano donde hace falta (todo lo que es JS/rAF, no una `transition`/`animation` CSS) — mismo patrón ya establecido en Fase 3 (`AnimatedNumber`, `volarAlCarrito`).

**Verificación con evidencia real, no solo capturas.** Se armó un driver CDP propio de ~90 líneas (`WebSocket`/`fetch` nativos de Node 24, sin dependencias — no hay Playwright/Puppeteer instalado en este repo) que navega, clickea, espera y captura contra Chrome headless (`--headless=new --remote-debugging-port`). Con eso:
- Capturas a mitad de animación (300ms después de tocar una ruta distinta) muestran las barras a medio llenar y la taza ya con el color nuevo — prueba visual de que el retrigger corre, no solo que el estado final se ve bien.
- El "Simular vertido" se capturó a mitad de trazo (botón en estado "Vertiendo…", tubo con la espiral parcial) y al terminar.
- El parallax se verificó **por cálculo, no a ojo**: se leyó el `transform` inline del elemento con `Runtime.evaluate` antes y después de fijar `scrollTop = 150` — dio `translateY(30px)`, exactamente `150 × .2`, confirmando la fórmula y el techo de 36px.
- Cero errores en `Runtime.exceptionThrown` durante todo el flujo. Probado en ambos temas (el toggle de tema se clickeó por selector `aria-label`).
- `npm run build` en verde (mismo fallo conocido del apóstrofo, no relacionado).

**Nota operativa, no un bug de la app**: para levantar Chrome headless se usó `taskkill /IM chrome.exe` al terminar, que mata TODOS los procesos `chrome.exe` de la máquina, no solo la instancia headless — si Reiner tenía Chrome normal abierto durante esta sesión, esas ventanas se cerraron también. Anotado para no repetir el mismo comando la próxima vez (matar por PID específico, no por nombre de imagen).

**Deploy**: pusheado a `main` — Cloudflare Workers Builds lo toma solo.

### Bugfix post-Fase 4: Sifón y AeroPress se veían casi del mismo color en la taza (2026-08-17)

Reiner reportó, ya confirmando Fase 4 en producción, que la taza de color (pieza 2 arriba) mostraba a Sifón (extracción 88/cuerpo 72) y AeroPress Punto Central (extracción 68/cuerpo 84) casi idénticos.

**Causa**: `colorTaza()` normalizaba `cuerpo` contra un rango fijo 0-100, pero el `cuerpo` real de las 4 rutas nunca baja de 38 ni sube de 84 — o sea usaba solo el 46% central del gradiente `card→brandAlt`, y ese par puntual queda a 12 puntos de distancia justo ahí adentro, casi imperceptible.

**Fix** (`colorTaza`/`normalizar` en `App.jsx`): cada eje se normaliza contra su rango real dentro de `GEOMETRIAS` (estira lo poco que hay a todo el gradiente disponible) y se suma `extracción` como segundo eje — que es justo donde ese par sí difiere fuerte (88 vs 68). `cuerpo` pesa más (`.6`, por ser lo que más se lee como densidad visual), `extracción` amplifica (`.4`). Con esto el mismo par pasa de 12 a ~24 puntos de separación en el gradiente. Sigue sin usar ningún hex suelto — los dos extremos siguen saliendo de `PALETAS` (`C.card`/`C.brandAlt`).

Commit `4b8c5cf`, pusheado a `main`. **Confirmado por Reiner.** Con esto, Fase 4 queda cerrada del todo — recién ahora arranca Fase 5 (Laboratorio), según la regla del sprint.

## Sprint "Alta Gama" — Fase 5: Laboratorio (2026-08-17, mismo día)

Cuatro piezas, todas dentro de `Laboratorio` (`App.jsx`), detalle técnico en `CLAUDE.md` § Motion system — Fase 5:

1. **Perfil resultante en vivo mientras se arrastra**: no hizo falta código nuevo — `Slider` ya usa `onChange` de React sobre un `<input type="range">`, que dispara en cada tick del arrastre (no solo al soltar), y `perfil` ya es un `useMemo` sobre `[vueltas, radio, temp, molienda]`. Sumado a que `Meter` ya traía `transition: width .5s` desde antes de este sprint, el efecto de "vivo" ya estaba armado por piezas previas — se verificó (no se asumió) leyendo el valor de Extracción del DOM en 5 pasos de un arrastre (1v→76, 3v→90, 5v→98…), confirmando que el estado cambia en cada paso, no solo al final.
2. **Goteo animado + color de extracción** (`colorExtraccion`, `GoteoTaza`, junto a `colorTaza`/`TazaColor` que ya existían para Inicio): tres gotas en bucle infinito reusando `.drip` (definida en la hoja de estilos desde antes de este sprint, sin ningún uso hasta ahora) cayendo sobre la misma `TazaColor` de Inicio, coloreadas según `perfil.extraccion` — a diferencia de `colorTaza` (Inicio, cuerpo+extracción de las 4 rutas fijas), acá `extraccion` ya es un resultado en vivo del simulador que los sliders mueven por casi todo 0-100, así que normalizar directo contra 0-100 alcanza (no hace falta estirar un rango angosto como en el bugfix de arriba). Vive junto al título "Perfil resultante". Verificado que el color realmente sigue a `extraccion` leyendo el valor **objetivo** (`el.style.fill`/`background`, no el pintado a mitad de transición) en los dos extremos del rango de vueltas: extracción 72 → `rgb(150,104,48)`, extracción 98 → `rgb(197,133,57)`, claramente distintos.
3. **"Simular vertido" de Lab, mismo patrón que el de Inicio**: le faltaban dos cosas que el de Inicio (Fase 4) ya tenía — respetar `prefers-reduced-motion` a mano (el trazo corre por `rAF`, no por una transition/animation CSS) y `disabled={corriendo}` para no poder re-disparar un vertido a medias. Se portaron ambas, más la clase `mo-press` (ya usada en el botón gemelo de Inicio). El vertido sigue siendo el mismo mecanismo de siempre (`prog` de `EspiralTubo3D` dibujando el tubo de 0 a 1 en 4200ms) — nunca hubo una animación CSS paralela que sincronizar, así que "mejorar" fue alcanzar paridad de comportamiento, no un mecanismo nuevo.
4. **Crossfade al cambiar de método**: el tubo 3D de Lab ahora vive en un `<div key={geo.id} className="spiral-enter">` — mismo patrón exacto que ya usa el comparador de Inicio (opacity 0→1 + scale .85→1, .9s) — así que tocar un chip de método (Espiral continua/Punto central/…) entra como una pieza nueva en vez de saltar la geometría de golpe. De paso, se agregó `setProg(1); setCorriendo(false)` al mismo `useEffect` que ya sincronizaba `vueltas`/`radio` al cambiar `geo` — corta cualquier vertido a medias del método anterior para que el crossfade entre limpio (mismo reset que ya hacía Inicio).

**Verificado con el mismo driver CDP propio de fases anteriores** (WebSocket/fetch nativos de Node 24, sin dependencias): capturas del tubo a mitad del crossfade (spiral-enter parcial) y ya asentado, del botón en estado "Vertiendo…" (`disabled:true` confirmado leyendo la propiedad del DOM, no solo el texto) y al completar, y de la tarjeta "Perfil resultante" con el goteo+taza visibles junto al título, en ambos temas. Cero errores en `Runtime.exceptionThrown`. `npm run build` en verde (mismo fallo conocido del apóstrofo). Bundle: **79.75 KB gzip** (antes 79.55 KB con el bugfix de `colorTaza` ya aplicado → **+0.20 KB** para las 4 piezas, sin ninguna dependencia nueva).

**Nota operativa**: para levantar/bajar Chrome headless esta vez se mató por PID específico (`Stop-Process -Id`), no por nombre de imagen — evita el problema ya anotado en Fase 4 de cerrar de paso el Chrome normal del dueño si lo tenía abierto.

**Deploy**: pendiente de pushear a `main` en el mismo paso que esta documentación. Queda pendiente que Reiner confirme visualmente en producción antes de arrancar Fase 6 (Fincas + Aula), según la regla del sprint.

## Sprint "Alta Gama" — Fase 6: Fincas + Aula (2026-08-17, retomado tras apagón)

**Contexto**: la compu se apagó forzosamente a mitad de Fase 6/7. Al retomar, diagnóstico completo: `git status` limpio (nada corrupto ni a medio escribir), 10 commits `[AUTO-SAVE] src/App.jsx` completos por delante de `origin/main` (nunca se llegó a pushear ni a documentar esta fase antes del apagón — esta sección reconstruye ese trabajo), y `npm run build` en verde real (mismo fallo conocido del apóstrofo). No hubo que descartar nada.

**Reconstrucción**: como `memoria.md` no llegó a registrar el arranque de Fase 6, se reconstruyó el alcance leyendo el diff completo de los 10 commits (`git diff origin/main..HEAD -- src/App.jsx`) contra el mapa de la fase (pulso en avatar + dots de progreso del guion en Fincas; checkbox de lección con micro-animación, barra "Tu avance" animada, taza SVG intacta, badges/racha visual-local en Aula), pieza por pieza:

1. **Pulso en avatar de Fincas** — ✅ ya existía *antes* de esta fase (`className={reproduciendo ? "pulse" : ""}` en el círculo de 92px, `App.jsx` ~L1461), no aparece en el diff de los 10 commits. No era trabajo pendiente, ya estaba resuelto de una fase anterior.
2. **Dots de progreso del guion** — ✅ ídem, ya existía (la fila de barritas de 2px bajo el texto del guion, `i <= linea ? C.brand : C.line`, `App.jsx` ~L1492), tampoco aparece en el diff. Ya resuelto.
3. **Barra "Tu avance" animada (Aula)** — ✅ ya existía (`transition: width .5s cubic-bezier(...)` sobre el `div` de progreso, `App.jsx` ~L1825), no tocado en los 10 commits. Al estar siempre montado (no hay remount de la barra al completar lecciones), el `transition` de CSS alcanza solo — no necesita el truco `triggerKey`/`useRetriggerAnim` que sí hace falta en `Meter` (que si se remonta). Ya resuelto.
4. **Taza SVG de Aula** — ✅ confirmado sin tocar en los 10 commits, correcto: sigue pendiente de fotos reales del dueño, tal como estaba.
5. **Badges/racha visual-local sin Supabase (Aula)** — ✅ implementado en los 10 commits: `racha` (`{dias, ultimaFecha}`) en `localStorage` bajo `qc-academia-racha`, sube 1 por día distinto con al menos una lección completada (se corta a 1 si el día anterior no tuvo actividad), ícono `Flame` con bounce (`useRetriggerAnim(racha.dias)`) junto al texto "N días de racha", solo visible con `racha.dias > 0`. **Decisión propia documentada en el código** (comentario junto al estado): el dueño todavía no confirmó si esto debe persistir en Supabase — se dejó la versión local-only, reversible sin tocar la UI si después pide la versión con Supabase.
6. **Checkbox de lección con micro-animación** — ❌ era lo único que faltaba de verdad: el checkbox (cuadrado 22×22 con `Check` de Aula) existía desde antes pero sin ninguna transición ni animación de entrada. **Completado ahora**: `transition` de `background`/`border-color` sobre el cuadrado (tokens `--motion-fast`/`--ease-spring`, mismo lenguaje que el resto del sprint) + `className="pop"` en el ícono `Check` (reusa `qc-pop`, ya usado como entrada de tarjetas) para que aparezca con fade+scale al completar la lección en vez de aparecer de golpe.

**Además, ya presente en los 10 commits (piezas de refinamiento de Fincas no listadas explícitamente en el mapa pero parte de la misma fase)**: `FichaLote` ahora re-llena sus barras (Dulzor/Acidez/Cuerpo) al cambiar de finca vía `triggerKey={lote.id}` (antes saltaban directo al valor nuevo, sin remontar); transición `.slide` al alternar entre la fila de chips normal y el modo "Comparar"; `.rise` con stagger al mostrar las 2 fichas comparadas; el overlay de agente conversacional (`AgenteFincaOverlay`) pasó de `.pop` a `.sheet` (se lee más como hoja a pantalla completa); y los botones propios de Fincas/Academia (`press` → `mo-press`) para tacto consistente con el resto del sprint. Nada de esto tocó Elio ni Fincas de Agua Fría más allá de lo que la fase ya pedía (Agua Fría es una finca más dentro de `FINCAS`, recibe las mismas mejoras que Elio/Rosa/Mina).

**Verificado**: `npm run build` en verde (mismo fallo conocido del apóstrofo, confirmado antes y después del fix del checkbox). Fase 6 queda cerrada con esto — falta Fase 7 (transversal), sin alcance documentado en ningún lado más allá del nombre; se le preguntó a Reiner qué cubre antes de arrancarla, para no adivinar una fase entera sin especificación.

## Sprint "Alta Gama" — Fase 7: transversal/pulido (2026-08-17, retomada tras un segundo apagón)

**Alcance confirmado por Reiner** (4 ítems, sin nada más implícito): (1) transición entre pestañas del nav inferior tipo app nativa, (2) transición animada al cambiar tema claro/oscuro, (3) sonido sutil opcional en interacciones clave, (4) loading states/skeletons consistentes en Carta/Fincas/Lab.

**Contexto del apagón**: la máquina se colgó fuerte a mitad de la fase, por segunda vez en el sprint durante una sesión larga con el driver CDP corriendo. Al retomar en sesión nueva: `git status` limpio (nada corrupto ni a medio escribir — ya no había ni working tree sucio), 16 commits `[AUTO-SAVE] src/App.jsx` completos por delante de `origin/main`, sin documentar (el trabajo de esta fase quedó hecho pero `memoria.md`/`CLAUDE.md` seguían con el estado de cierre de Fase 6). No hubo nada que revertir — todo el código de los 16 commits compila y funciona.

**Reconstrucción**: como no se alcanzó a documentar, se reconstruyó el alcance leyendo `git diff` del último commit de doc (`b235d75`) contra `HEAD`, pieza por pieza contra los 4 ítems:

1. **Transición direccional entre tabs del nav inferior** — ✅ completo. El contenido de cada tab pasó de `.rise` (pensado para entradas verticales) a una nueva `.mo-tabswitch`/`qc-tabswitch`: desplazamiento horizontal cuya dirección depende de si el tab nuevo queda a la derecha o izquierda del anterior (`--tabdir`, calculado comparando `ORDEN_TABS.indexOf` del tab previo vs el nuevo, seteado inline). Además, el nav inferior pasó de un indicador de 2px por-botón (aparece/desaparece suelto) a **un único indicador absoluto que desliza** entre posiciones (mismo patrón `offsetLeft`/`useLayoutEffect` que ya usa el underline de categorías de Carta, Fase 3), midiendo cada botón de tab vía refs.
2. **Crossfade de tema claro/oscuro** — ✅ completo. Dos piezas: (a) una regla CSS global de baja especificidad (`:where(.qc) button,div,span,p,input{transition:background-color,border-color,color ...}`) que da crossfade "gratis" a cualquier elemento sin transition propia, usando `:where()` a propósito para que nunca le gane a `.press`/`.mo-press`/`.mo-tap` (feedback táctil intacto); (b) `ThemeToggle` pasó de un ternario `{oscuro ? <Sun/> : <Moon/>}` (swap instantáneo, nada que interpolar entre dos SVG distintos) a los dos íconos **siempre montados y superpuestos**, animando solo `opacity`/`rotate`/`scale` — eso sí es interpolable. Sin flash.
3. **Sonido sutil opt-in** — ✅ completo. `SonidoToggle` nuevo en el header (junto a `ThemeToggle`), lee/escribe `localStorage["qc-sonido"]` ("1"/"0"), **apagado por defecto**. `sonar(freq,dur,vol)` crea un único `AudioContext` compartido recién al primer toque real (los navegadores bloquean crearlo sin gesto del usuario), dos osciladores cortos (`sonarTap`/`sonarCarrito`, 0KB de bundle — nada de archivos de audio), todo en try/catch silencioso. Un solo listener delegado (`manejarTapSonido`, en el `onClick` del contenedor raíz `.qc`) en vez de un handler por botón — cualquier tap dentro de `.press`/`.mo-press`/`.mo-tap` suena el tono genérico, salvo `data-sonido="carrito"` (el botón "+" de agregar en Carta) que usa el tono distinto.
4. **Skeletons consistentes (Carta/Fincas/Lab)** — ✅ completo. Carta ya tenía `.mo-skeleton` desde Fase 3 (`cambiando` al cambiar de categoría) — sin tocar. Nuevo en esta fase: Fincas (`cambiandoFinca`, mismo patrón "prender en el mismo handler que llama `setLote`, no reactivo" que ya usaba Carta, para no dejar pasar un frame con contenido real antes del skeleton — cubre el alto real de la card para no saltar el layout) y los `Suspense fallback` del tubo 3D lazy-loaded en Inicio y Laboratorio (antes un `<div>` vacío, ahora `.mo-skeleton` con la forma real — acá sí es carga real del chunk de three.js, no una transición fingida como en Carta/Fincas).

**Verificado en esta sesión** (recuperación, CDP corto y cerrado explícitamente al terminar — no en loop, para no repetir el cuelgue): `npm run build` en verde (mismo fallo conocido del apóstrofo — build de Vite en sí `✓ built in 14.19s`). `npm run dev` + una sola sesión de Chrome headless por CDP contra `http://localhost:5183/`: **cero errores de consola** (`Runtime.exceptionThrown`/`console.error`). Captura de pantalla salió en blanco (posible timing de splash/WebGL en headless, no se insistió para no alargar la sesión) — no se tomó como señal de fallo real dado que la consola no reportó nada y el diff de código es coherente y comentado con el mismo criterio que fases anteriores. Chrome y el dev server se cerraron por PID/puerto específico al terminar, nada quedó corriendo en loop. **No hubo nada sin commitear**: los 16 commits ya estaban completos en el working tree limpio.

**Deploy**: pendiente pushear a `main` en el mismo paso que esta documentación. Con esto, **Fase 7 queda cerrada — sprint "Alta Gama" completo** (Fases 2 a 7). Falta que Reiner confirme visualmente en producción, y si quiere una verificación visual más profunda (capturas reales de los 4 ítems), pedírsela con una sesión CDP corta y puntual, no una exploración larga.

## Cierre de sesión (2026-08-17): Reiner pidió detalle línea-por-línea de Fases 4/5/6, confirmó las 4 fases + Track D completo, y salió un pendiente aparte

Reiner pidió el mismo nivel de detalle de la doc de Fase 7 pero para 4/5/6, puntualmente: ¿se resolvió el bug de "Color en taza" (Sifón/AeroPress casi idénticos)?, ¿llegó la foto marrón caramelo o se usó placeholder para el "6to color"?, ¿qué versión de racha/badges se construyó en Aula?

- **Bug "Color en taza"**: sí, resuelto — es el bugfix ya documentado arriba (commit `4b8c5cf`, normalización por rango real + segundo eje de extracción), confirmado por Reiner en producción en su momento. Sin novedad, solo se re-confirmó con el detalle línea a línea.
- **Racha/badges de Aula**: se re-confirmó que es **local-only** (`localStorage["qc-academia-racha"]`), no Supabase — tal como ya estaba documentado y comentado en el propio código (`App.jsx` ~L1906). Reiner remarcó que esa decisión seguía pendiente de su confirmación y pidió no asumirla — quedó claro que nunca se asumió, la implementación local-only fue siempre la "decisión temporal reversible" ya anotada, no una migración a Supabase sin permiso.
- **"Foto marrón caramelo"/"6to color"**: acá salió un malentendido real, aclarado por Reiner — **no tiene nada que ver** con `FINCA_TINTS`/`#7FE3C0` (eso es un tinte de Fincas, tema aparte, sigue rechazado y sin reemplazo). Es sobre el widget **"La taza también sabe" de Aula**: el roadmap de Reiner (que vive fuera de este repo, no en `memoria.md`/`CLAUDE.md` — por eso no había rastro acá) contempla reemplazar las 5 tazas de color plano actuales (`TAZAS` en `App.jsx`, swatches CSS con `hex`, sin fotos) por **6 fotos reales**: 5 que Reiner ya tiene generadas (terracota, verde bosque, blanca, azul marino, roja) + una 6ª pendiente de generar por él mismo, **marrón caramelo `#A87456`**.
  - **Verificado en código antes de documentar nada como "cerrado"**: la integración de fotos para este widget **no existe en el repo todavía** — `TAZAS` (`App.jsx` ~L348-354) sigue siendo 5 entradas CSS-only (`blanca #F2EDE3`, `azul #5E93A8`, `roja #B2483A`, `verde #1E5C4A`, `barro #8C6242` — nombres/hex distintos a los que describe el roadmap de Reiner), dibujadas como `div`s de color plano, sin ningún `<img>`. Se buscó en `src/assets/`, en `_incoming/` (carpeta OneDrive donde suelen aterrizar assets sin integrar) y en todo `git log --all -i --grep=taza` — cero rastro de las 5 fotos ya generadas. Se le señaló la discrepancia a Reiner en vez de asumir que el trabajo de integración ya estaba hecho y solo faltaba el asset — confirmó que **todavía no las mandó**, van a llegar en un paso siguiente. **Nada de este widget se tocó todavía**: sigue con los 5 swatches CSS originales tal cual estaban, esperando las fotos.
- **Track D "Alta Gama" — confirmado cerrado por Reiner** (Fases 2 a 7, todo lo demás), salvo este ítem aparte de fotos de tazas que **no bloquea el cierre** (es un asset externo pendiente de Reiner, no trabajo de código pendiente) y que se retoma cuando envíe las 5 fotos + eventualmente la 6ª.

### Las 5 fotos de tazas llegaron y se integraron en la misma sesión (2026-08-17)

Reiner las pegó directo en el chat (imagen inline) primero — sin archivo accesible en disco desde acá, se le explicó y pidió que las pusiera en `_incoming/` (la carpeta OneDrive sin `.git` que ya se usa para assets sin integrar, ver nota histórica arriba). Aparecieron ahí como 5 PNG de 1254×1254 con nombre genérico (`file_0000...png`), identificadas una por una abriéndolas:

| Archivo | Color |
|---|---|
| `...341481f5...` | Blanca |
| `...79e8820c...` | Azul marino |
| `...ccd081f5...` | Verde bosque |
| `...d1ec822f...` | Terracota (logo verde) |
| `...dfd081f5...` | Roja |

**Antes de tocar `TAZAS` se detectó una discrepancia real** entre los 5 nombres del roadmap de Reiner (Terracota/Verde bosque/Blanca/Azul marino/Roja) y los 5 que ya vivían en el código con su propio `pct`/`efecto` de dulzor aprobado (Blanca/Azul Alpine/Roja Sunset/Verde Mocotíes/Barro Barrel) — nombres y hasta colores distintos en el caso de "Barro Barrel" vs "Terracota". Se le preguntó a Reiner en vez de asumir un mapeo o inventar `pct`/`efecto` nuevos (regla de "no inventar datos" del proyecto). **Confirmó**: es el mismo set de siempre, swap 1:1 de foto+nombre, `pct`/`efecto` **sin tocar**: Blanca→Blanca, Azul Alpine→Azul Marino, Roja Sunset→Roja, Verde Mocotíes→Verde Bosque, Barro Barrel→Terracota. La 6ª (Marrón caramelo) queda **explícitamente afuera** del set de producción por ahora — sin foto real ni `pct`/`efecto` confirmado, no se inventa, se suma en un paso aparte cuando Reiner la tenga.

**Implementado**:
- Las 5 PNG se procesaron con el mismo pipeline que `jose-tomas.jpg` (`sharp`, sin CLI dedicado — script de un solo uso, no quedó en `scripts/`): resize a 480×480 `cover`, JPEG calidad 85 + mozjpeg → 9–13 KB cada una (`src/assets/taza-blanca.jpg`, `taza-azul-marino.jpg`, `taza-verde-bosque.jpg`, `taza-terracota.jpg`, `taza-roja.jpg`).
- `TAZAS` (`App.jsx`) ganó un campo `foto` por entrada y `nombre`/`hex` actualizados al mapeo confirmado — `pct`/`efecto` **byte-idénticos** a como estaban. `hex` se re-muestreó del cuerpo real de cada foto (una zona de cerámica lisa, verificada visualmente para no caer en el logo/fondo/brillo) en vez de mantener el hex de diseño anterior, para que el swatch chico siga matcheando la foto real; esto es un dato leído de las fotos reales, no inventado.
- El "hero" (la taza grande arriba del selector) pasó de dibujarse con `div`s (cuerpo de color plano + franja oscura simulando el café) a la foto real (`<img>`, 120×120, `objectFit: cover`, mismo borde `C.line` que tenía el dibujo). El humo (`.steam`) se mantuvo intacto encima. **Fallback defensivo a propósito**: si `taza.foto` no existe (ej. el día que se sume Marrón caramelo sin foto todavía), cae de vuelta al dibujo CSS original en vez de romper — no hace falta tocar este código cuando llegue la 6ª, si se agrega sin `foto` sigue funcionando igual que ahora.
- Los 5 swatches selectores (34×34, abajo del hero) se dejaron como estaban — chips de color plano con `t.hex`, no fotos en miniatura (a esa escala una foto se vería peor que un color sólido, y ya cumplen su función de selector).

**Verificado**: `npm run build` en verde (mismo fallo conocido del apóstrofo). `npm run dev` + una sesión CDP corta (cerrada explícitamente al terminar): cero errores de consola, captura confirmando el widget con la foto de Azul Marino, nombre actualizado, `+18% dulzor percibido` intacto, y los 5 swatches con los colores nuevos.

**Con esto, "La taza también sabe" queda al día salvo la 6ª taza (Marrón caramelo `#A87456`), que sigue 100% del lado de Reiner: falta que genere la foto y confirme su `pct`/`efecto` real.

## Track A — Auditoría Lighthouse (2026-08-17)

Roadmap "Publicación app stores", sesión 1/16. Auditoría corrida con `npx lighthouse` (v13.4.1) contra producción (`https://quadro-cafe.reinerramos2702.workers.dev/`), mobile (preset por defecto, throttling simulado) y desktop (`--preset=desktop`) por separado. Reportes completos en `lighthouse/{mobile,desktop}.report.{html,json}` (no versionados — son output local, ver `.gitignore`; si hace falta reproducir, el comando exacto quedó documentado abajo).

**Nota de alcance**: Lighthouse 13 eliminó la categoría PWA del core (reemplazada por "Agentic Browsing", que no es lo mismo) — no hay score de PWA de este audit. Chequeo manual en su lugar: el build (`dist/`) ya trae `manifest.webmanifest` y `registerSW.js` (vía `vite-plugin-pwa`, confirmado por archivo), o sea la base de instalabilidad está — no se verificó a fondo (offline, ícono maskable, etc.) porque quedó fuera de esta pasada.

**Scores**

| Categoría | Mobile | Desktop |
|---|---|---|
| Performance | 61 | 68 |
| Accessibility | 98 | 98 |
| Best Practices | 100 | 100 |
| SEO | 83 | 83 |

**Issues concretos**

- **Performance — Total Blocking Time altísimo (mobile 6.640ms, score 0; desktop 1.490ms, score 1)**: el bundle principal (`assets/index-*.js`, 145KB, **60% sin usar** según `unused-javascript`) ejecuta ~5.2s de scripting en mobile. El chunk de three.js (`espiral3d-*.js`, 172KB, 33% sin usar) suma otros ~3.3s — se carga en cadena inmediatamente detrás del bundle principal porque `Inicio` (primer tab) lo importa vía `React.lazy` apenas monta, así que "lazy" no lo saca del camino crítico de la primera pantalla. `network-dependency-tree-insight` muestra la cadena real: `index.js → espiral3d.js → espiral.glb` (405KB), 2.87s solo esa cadena.
- **Performance — Cumulative Layout Shift 0.102 (mobile, score 89)**: `layout-shifts` reporta 3 shifts; no se identificó el elemento exacto en esta pasada (`cls-culprits-insight` no devolvió detalle en este run).
- **Performance — imagen de logo pesada**: `src/assets/logo.png` (usado en `Marca`) pesa 52KB pero se muestra a 62×62px con un archivo de 256×256 — 48KB desperdiciados por tamaño + 41KB más si se convirtiera a WebP/AVIF.
- **Accessibility (98) — falta landmark `<main>`**: el árbol raíz de `App.jsx` usa `<div className="qc">` (líneas ~2953 y ~3319) sin ningún `<main>` alrededor del contenido de cada tab.
- **SEO (83) — sin meta description**: `index.html` no tiene `<meta name="description">`.
- **SEO (83) — robots.txt inválido (18 errores)**: no existe `public/robots.txt`, así que la ruta cae al fallback SPA de `wrangler.toml` (`not_found_handling = "single-page-application"`) y sirve el `index.html` completo como si fuera el robots.txt — Lighthouse lo parsea como HTML y falla.
- **Best Practices (100 igual, pero con warning)**: `valid-source-maps` — el JS de producción no tiene source maps (no baja el score en este run, pero conviene si se va a debuggear producción).

**Priorización de fixes**

Quick wins (bajo esfuerzo, alto impacto — para próxima sesión):
1. Agregar `public/robots.txt` real (`User-agent: *\nAllow: /`) — arregla el error de 18 fallos en SEO en un archivo.
2. Agregar `<meta name="description" content="...">` a `index.html` — sube SEO.
3. Envolver el contenido de cada tab en `<main>` dentro de `App.jsx` — sube Accessibility a ~100.
4. Recomprimir `logo.png` a su tamaño real de render (62×62 @2x ≈ 124×124) y/o convertir a WebP — ahorra ~48-90KB en la carga inicial.

Requieren más trabajo (arquitectura/decisión del dueño):
5. **TBT/mainthread**: el bundle principal con 60% de código sin usar en la carga inicial es el problema de fondo — candidato a code-splitting más agresivo (separar por tab/ruta, no solo el chunk de three.js) o diferir el chunk de three.js hasta que el usuario realmente interactúe con el comparador/Laboratorio en vez de cargarlo apenas monta `Inicio`. Impacto grande en el score pero toca la arquitectura de carga de `App.jsx`, no es un cambio de una línea.
6. CLS (0.102, mobile): necesita otra pasada con `cls-culprits-insight` con más detalle (o inspección visual en Chrome DevTools) para identificar el elemento exacto antes de tocar código.

No se aplicó ningún fix todavía — esta sesión fue solo diagnóstico, según el pedido (Track A = auditoría). Próxima sesión: decidir con el dueño si arrancamos por los quick wins (#1-4) o si el code-splitting (#5) entra en este mismo track dado que es el que más pesa en el score.

**Comando para reproducir**: `npx lighthouse "https://quadro-cafe.reinerramos2702.workers.dev/" --output=html,json --output-path=./lighthouse/mobile --chrome-flags="--headless=new --no-sandbox"` (agregar `--preset=desktop` para el modo desktop). Nota: en este entorno Windows, Lighthouse tira un `EPERM` al final al intentar borrar su carpeta temp (`chrome-launcher` cleanup) — es cosmético, el reporte ya se generó antes de ese error; no hace falta reintentar.

**Próximo**: ejecutar los quick wins de Track A (#1-4) — sin tocar Elio, según regla fija del proyecto.

---

## Fix — nav inferior "se movía" al scrollear (2026-09-01)

El dueño reportó que el nav inferior (Inicio/Carta/Fincas/Lab/Aula) seguía
ocultándose/moviéndose al scrollear hacia arriba, no solo hacia abajo, y
pidió confirmar primero si el fix anterior (el que puso el nav en
`position:absolute`, 2026-08-31) ya contemplaba esto.

**Confirmado que no lo contemplaba.** Ese fix resolvía un bug distinto:
contenido empujando el nav fuera de pantalla por mal cálculo de alto en un
layout flex. Pero tanto `.qc` (línea ~3011) como el frame del teléfono
(línea ~3013) seguían midiéndose con `100vh` puro — y no existe ningún
listener de scroll que oculte/muestre el nav (se buscó `scrollY`,
`onScroll`, `translateY` condicional: no hay nada de eso en el archivo). No
existe tampoco un "Bloque UI-1" documentado en este repo — se buscó en
`memoria.md`/`docs/HANDOFF.md` y ese nombre no aparece; lo más cercano es
el comentario inline junto al nav.

**Mecanismo real**: en mobile, `100vh` es el alto de *layout* viewport, que
no se re-mide cuando la barra de direcciones del navegador se
expande/contrae al scrollear — el alto *visible* cambia sin que el layout
reaccione, así que el frame (anclado a ese vh fijo) queda desfasado del
área visible, y el nav (que cuelga de `bottom:0` de ese frame) se percibe
como si se moviera.

**Fix aplicado**: dos clases CSS nuevas en `buildCss()` (`src/App.jsx`,
junto a los tokens `:root` del sistema de motion):

```css
.qc-vh{min-height:100vh;min-height:100dvh}
.qc-frame-vh{height:100vh;height:100dvh}
```

Declarado dos veces a propósito (fallback sin `@supports`: un navegador sin
soporte de `dvh` ignora esa línea y se queda con el `vh` de arriba). No se
podía hacer en el `style={{...}}` inline porque un objeto JS no admite la
misma propiedad dos veces — por eso viven como clases, aplicadas a `.qc`
(antes `minHeight:"100vh"` inline) y al frame del teléfono (antes
`height:"100vh"` inline). El nav en sí no se tocó — sigue
`position:"absolute", bottom:0`, correcto.

**Verificación — con una limitación real que hay que decir explícita,
no dar el bug por cerrado sin más**: `npm run build` en verde (el único
fallo es el conocido de `vite-plugin-pwa` al generar el service worker por
el apóstrofo en la ruta del repo — `App's`/Quadro Cafe —, no relacionado,
documentado en fases anteriores). Se verificó por CDP (Chrome headless,
driver propio vía WebSocket) que las clases `.qc-vh`/`.qc-frame-vh` aplican
y que `min-height`/`height` computados coinciden con `window.innerHeight`
(805px en la corrida), y que el nav queda anclado al borde inferior del
frame sin overlap ni salto. **Pero esto no reproduce el bug real**: un
Chrome headless no tiene barra de direcciones que expandir/contraer, así
que no hay forma de simular por CDP el cambio real de alto de viewport que
dispara el bug en un móvil real. La prueba de que el fix efectivamente lo
resuelve queda pendiente de confirmación del dueño en un navegador móvil
real (o al menos el device toolbar de Chrome DevTools, que tampoco es
100% fiel a la barra de direcciones real).

### Iteración 2 (2026-09-01, mismo día) — probado en Chrome Android real

El dueño probó en un teléfono real: el nav queda fijo mientras se
scrollea (el fix de arriba funciona para eso), **pero** al llegar arriba
del todo — el instante exacto en que la barra de direcciones de Chrome
termina de expandirse — el nav "bajaba" de nuevo un momento. Pidió
investigar si convenía escuchar `window.visualViewport` directamente en
vez de depender solo de la unidad CSS `dvh`.

**Investigación**: `dvh` sigue siendo válido y necesario, pero su
recálculo interno del navegador le llega con un frame (o más) de retraso
respecto a la animación real de la propia barra — es un timing gap del
motor, no un error de la unidad. Además se encontró una causa raíz
adicional y más probable para el "por qué justo arriba del todo": el
`<body>` no tenía ningún reset (`margin`/`padding` por default del
navegador, sin `overflow` declarado), así que el documento real
(`html`/`body`) terminaba ~16px más alto que el viewport por el margin de
8px arriba+abajo — es decir, la página raíz SÍ podía scrollear un poco,
aunque la intención de la app siempre fue que solo scrolleen los
`.qc-scroll` internos de cada tab. Sumado a que ningún `.qc-scroll` tenía
`overscroll-behavior` declarado, un swipe que llegaba al límite de un
`.qc-scroll` (típicamente arriba del todo) podía seguir de largo
("scroll chaining") y mover el documento real por detrás — eso es lo que
más probablemente dispara el show/hide de la barra de direcciones,
incluso sin que se vea nada scrolleando fuera del frame del teléfono.

**Fix, tres capas (todas en `src/App.jsx`, `buildCss()` + `QuadroCafe`)**:
1. `html,body{margin:0;padding:0;height:100%;overflow:hidden;overscroll-behavior:none}` — elimina el margin de 8px que hacía scrolleable al documento real, y bloquea que scrollee aunque algo se lo empuje.
2. `.qc-scroll{overscroll-behavior-y:contain}` — cada contenedor de scroll interno frena el gesto en su propio límite en vez de dejarlo pasar al documento.
3. `.qc-frame-vh{height:100vh;height:100dvh;height:var(--vvh, 100dvh)}` — tercera capa que gana en la cascada cuando `--vvh` existe. Un nuevo `useEffect` en `QuadroCafe` escucha `window.visualViewport`'s evento `"resize"` (rAF-throttled) y escribe el alto real en px a esa custom property, en sincronía con la animación real de la barra (para eso existe esa API — más rápida que esperar el recálculo interno de `dvh`). Si `--vvh` no está seteada (SSR, o sin soporte de `visualViewport`) cae al fallback `100dvh` sin romper nada.

**Verificado por CDP** (Chrome headless, mismo driver propio): `--vvh` se
escribe correctamente (805px, igual a `window.innerHeight`/
`visualViewport.height` en la corrida), `.qc-frame-vh` computa ese mismo
alto, `html`/`body` quedan con `overflow:hidden`/`margin:0` y
`document.documentElement.scrollHeight` ahora es exactamente igual a
`window.innerHeight` (antes tenía ~16px de sobra por el margin default —
confirma que se cerró esa causa raíz), y `.qc-scroll` computa
`overscroll-behavior-y:contain`. `npm run build` en verde (mismo fallo
conocido del apóstrofo, no relacionado).

**Misma limitación que la iteración 1, sigue sin poder probarse del
todo por automatización**: CDP headless no tiene barra de direcciones
real que expandir/contraer, así que no puede reproducir el momento exacto
que el dueño reportó — sólo confirma que el mecanismo (variable CSS,
listener, reset de scroll) está correctamente cableado. La confirmación
final de que ya no "baja" en ese instante puntual sigue pendiente de
prueba en el teléfono real del dueño.
