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
