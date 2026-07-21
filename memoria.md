# memoria.md — bitácora del proyecto

Registro corrido de decisiones y estado, para que cualquier sesión de Claude Code futura (o Reiner) pueda retomar sin releer todo el historial de chat.

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
