# Estado de sesión — Quadro Café
Última actualización: 30 sep 2026

## Hecho en la última sesión
- docs/ROADMAP.html actualizado: feature Carta (fotos mapeadas + 45 productos placeholder + DetalleProducto), decisión Cheesecake m12, ficha PDF para el dueño. Commits 275b569 y 2d3ba1c (ya pusheados).
- PDF `docs/Quadro_Cafe_Ficha_Productos_Nuevos.pdf` entregado (45 productos agrupados por categoría, para llenar en reunión 2-3 oct con el dueño).
- Papagayo: solicitud de integración enviada, Nelson (soporte) aprobó la llave. Falta cuenta bancaria real (Banco/Número/Teléfono/RIF) — esperando datos de Jonatha.
- WhatsApp a grupo Papagayo enviado; patrón de saludo a grupos capturado en skill `voice-dna` (guardado por Reiner).
- Skill nueva `autopiloto-senior-dev` creada + §21 agregado a BUENAS_PRACTICAS_CLAUDE_CODE.md (spec cerrado → 1 prompt maestro) + versión genérica portable entregada. Guardado por Reiner.
- Confirmado en código: punto 12 (Binance Pay, commit 39435dd) y punto 14 (Panadería→Bollería, commit e78a0d9) ya resueltos desde 18/sept. docs/ROADMAP.html ya lo refleja.
- 5 archivos/carpetas sin trackear investigados y resueltos:
  - `incoming/` y `quadrocafe-assets/` → agregados a `.gitignore` (material pesado de pipeline de fotos, no va a git)
  - `Claude outputs/` → agregado a `.gitignore` (artefacto de entrega de Cowork)
  - `ROADMAP.md` (raíz) → es el archivo fuente de verdad del orquestador (guardrails + estado de los 12 puntos de la reunión 05/sept) — trackeado en git por primera vez
  - `src/assets/jose-tomas.OLD-placeholder.jpg` → huérfano confirmado, movido a `_to_delete/` (no borrado — permiso de borrado directo fue rechazado)
- Commit `b4631e4` — "chore: ignora carpetas de pipeline de fotos + trackea ROADMAP.md" — hecho en la terminal de Reiner.
- Identificados 20 archivos con diff CRLF/LF (ruido cosmético de Windows, checkout del 05/sept) — sin cambio de contenido real, no se tocan.

## Decisiones tomadas
- Cheesecake de cascarilla (m12) se queda sin foto — ninguna de las 3 fotos nuevas la reemplaza.
- `incoming/` y `quadrocafe-assets/` nunca van a git — quedan en disco como material de trabajo.

## Archivos/módulos tocados
- docs/ROADMAP.html, docs/Quadro_Cafe_Ficha_Productos_Nuevos.pdf, .gitignore, ROADMAP.md (raíz), claude/BUENAS_PRACTICAS_CLAUDE_CODE.md (§21 + §22 pendientes)

## Pendiente para la próxima sesión
- Confirmar si el commit `b4631e4` ya se pusheó a origin.
- Actualizar `ROADMAP.md` (raíz) marcando `[x]` en los puntos 12 y 14 — ya resueltos en código, docs/ROADMAP.html ya actualizado, solo falta sincronizar este archivo.
- Decidir si se borra definitivamente `_to_delete/jose-tomas.OLD-placeholder.jpg` (dar permiso de borrado, o Reiner lo borra manualmente).
- Esperar datos bancarios reales de Jonatha → completar cuenta en Papagayo (pestaña Banco).
- Diseñar/implementar la integración técnica de verificación de pagos Papagayo↔app (no iniciada en código todavía).
- Esperar datos reales de los 45 productos (reunión 2-3 oct con el dueño) y actualizar MENU en App.jsx.
- Revisar CLAUDE.md del repo contra la plantilla de §19 de BUENAS_PRACTICAS_CLAUDE_CODE.md (pendiente ya anotado en §22).
- Pasos manuales de Reiner aún abiertos: migraciones 0003 (en el momento del merge)/0004/0005, redeploy edge function `--no-verify-jwt`, confirmar secret `GEMINI_API_KEY`, merge a `main` cuando decida.
- Si el lock de git (`index.lock`) vuelve a trabarse solo: revisar si la carpeta del repo está sincronizada por OneDrive y excluirla.
