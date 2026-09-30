# ROADMAP.md — Quadro Café (fuente única de verdad del orquestador)

Rama de trabajo: `quadro-feature-reunion-05sept` (desde `main`). Repo: `reinerramos2702-jpg/Quadro-Caf-`. Stack: React + Tailwind + Supabase + Cloudflare Workers.

## 🚫 Guardrails permanentes — no negociables, pisan cualquier instrucción de "autonomía total" o "deploy continuo"

- [ ] Nunca merge a `main`. Nunca `wrangler deploy` ni deploy directo a Cloudflare — Cloudflare despliega solo automáticamente cuando Reiner mergea a mano.
- [ ] Nunca correr migraciones SQL en Supabase (`0003`, `0004`, `0005`) — las corre Reiner manualmente, en ese orden, `0003` solo justo después del merge.
- [ ] Nunca escribir ni pedir secrets/tokens/API keys en código ni chat.
- [ ] No inventar datos reales (productos, precios, fotos, puntajes SCA, notas de cata). Donde falte contenido real: estructura + placeholder vacío, nunca relleno inventado.
- [ ] Actualizar `CLAUDE.md`, `memoria.md` y `docs/ROADMAP.html` en el mismo commit que el cambio de código al que corresponden.
- [ ] Al llegar a 100% de las tareas de abajo: build limpio, rama pusheada a `origin`, y PARAR — nada de merge, nada de deploy. Avisar que está lista para revisión de Reiner.
- [ ] Bloqueo real (falta de credenciales, permisos de Cloudflare/Supabase, algo irrecuperable) → parar y preguntar. Cualquier otra ambigüedad de contenido → resolver con el criterio "estructura lista, sin inventar", nunca preguntar por eso.

## Tareas (reunión con el dueño, 05/sept — 12 en alcance)

### [x] 1. UI/UX Premium general
Look premium reforzado en los módulos del batch (sistema `qc-*`, dark UI), sin librerías nuevas.

### [x] 2. Más imágenes en Carta
Estructura de 1 foto por producto lista, placeholder claro si falta. **Contenedor queda vacío a propósito** — Reiner integra las fotos reales (DALL-E) en otra sesión. No bloquea nada más.

### [x] 3. Curar roster de Fincas
Roster final: Agua Fría + Los Naranjos (datos reales) + Santa Rosa y Buenos Aires (estructura + placeholder). Elio, Rosa y Mina salieron (decisión 18/sept, reemplaza la regla vieja "no tocar Elio").
**Actualización 19/sept — el dueño autorizó el uso de las fotos/rostros reales de los caficultores dueños de las fincas** en los avatares de la app (aplica a Agua Fría/José Tomás y a cualquier finca futura con foto real). Esto resuelve la autorización de imagen; lo que falta de Agua Fría son solo datos técnicos (ver punto 8), no el permiso de imagen.

### [x] 4. Renombrar copy Quadro Club
Texto de suscripción actualizado: "Suscríbete a la Newsletter para recibir premios o descuentos especiales."

### [x] 7. Ubicación de "comparar"
Ya decidido antes: se queda en Fincas, dentro de `FichaLote`, sin módulo nuevo.

### [x] 8. Ficha técnica por finca
Campos listos (altura, variedad, proceso, SCA) con "Por confirmar" donde faltan datos reales (Agua Fría: proceso de beneficio, SCA, notas de cata de la Geisha, altitud exacta, disponibilidad/precio del lote — pendientes de que el dueño los pase, no bloquean código). Santa Rosa/Buenos Aires: sin datos todavía.

### [x] 10. Nuevo módulo "Tienda"
Tarjetas "Próximamente" (tipo genérico), sin nombre ni precio inventado. Nav justo después de Fincas.

### [x] 11. Nuevos productos en Carta
Punto de entrada listo (etiqueta "Nuevo" en el panel admin). **Sin contenido a propósito** — depende de que Reiner pase la lista completa, mismo criterio que el punto 2. No inventar productos.

### [ ] 12. Método de pago Binance
Verificar en el código si ya está implementado (hay indicios de un batch anterior, pero no confirmado en la sesión del 18/sept). Si falta: sumarlo junto a Efectivo / Pago móvil / Zelle / Transferencia, mismo patrón de UI del componente existente — no reinventar el selector.

### [x] 13. OCR de comprobante de pago
Cerrado y reforzado — 4 fallas de seguridad corregidas en la revisión de código (la más grave: se podía marcar un pedido como pagado sin comprobante real). Fix vive en la migración `0005` (Reiner la corre manualmente, ver guardrails).

### [ ] 14. Renombrar "Panadería" → "Bollería"
Verificar en el código si ya está hecho. Si falta: es solo cambio de copy/label en la categoría de Carta — no reestructurar productos.

### [x] 15. Fix visual "É" de "Quadro Café"
Corregido en Chrome/WebKit desktop. Caso reportado en Safari/iPhone sin poder reproducir — no volver a tocar la tipografía sin evidencia nueva (captura + modelo/iOS) de Reiner.

## Fuera de alcance — no tocar
- Punto 5 — sistema de puntos de fidelidad.
- Punto 6 — quiz de trivia en Academia.
- Punto 9 — minijuego estilo Pokémon en Carta.

## Definición de "100%" de este ciclo
Puntos 12 y 14 resueltos (implementados o confirmados ya existentes) y marcados `[x]` con sus Detalles Técnicos. Build limpio, sin regresión de Lighthouse, `CLAUDE.md` / `memoria.md` / `docs/ROADMAP.html` al día, rama `quadro-feature-reunion-05sept` pusheada a `origin`. Sin merge a `main`, sin deploy — eso lo decide Reiner.
