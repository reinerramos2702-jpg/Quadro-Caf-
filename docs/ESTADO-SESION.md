# ESTADO-SESION — Quadro Café

Foto del estado para retomar en una sesión nueva. Se actualiza al cerrar cada punto y al cerrar la sesión. El detalle histórico está en `memoria.md` y las reglas del proyecto en `CLAUDE.md`.

**Última actualización**: 2026-09-18

## Dónde estamos

- **Rama**: `quadro-feature-reunion-05sept` (sale de `main` en `bf8bde0`). Todavía no está en `origin`.
- **Alcance**: los 12 puntos de la reunión del 05/sept (ver `docs/ROADMAP.html`). Los puntos 5, 6 y 9 están diferidos.
- **Regla**: no se hace merge a `main` sin la revisión final de Reiner.

## Puntos

| Punto | Tema | Estado |
|---|---|---|
| 14 | Panadería → Bollería | ✅ Commiteado (`e78a0d9`) |
| 12 | Binance Pay | ✅ Commiteado (`39435dd`) |
| 13 | Comprobante + OCR | ✅ Commiteado (5 commits + fixes del code review) |
| 2 | Foto por producto (estructura) | ✅ Estructura lista, sin fotos todavía |
| 11 | Productos nuevos (punto de entrada) | ✅ Admin listo (+ etiqueta), sin contenido todavía |
| 3 | Roster de Fincas (Agua Fría + Los Naranjos + 2 placeholder) | ✅ Commiteado |
| 8 | Ficha técnica por finca | ✅ Commiteado |
| 7 | Comparar (se queda en FichaLote) | ✅ Sin código (alineado por el punto 8) |
| 10 | Módulo Tienda ("Próximamente") | ✅ Commiteado |
| 4 | Copy de Quadro Club | ✅ Commiteado |
| 15 | "E" de "Quadro Café" en el header | ⚠️ No reproducible: falta captura del dispositivo |
| 1 | Pulido premium general | ✅ Pasada acotada commiteada |

## Pendientes fuera del código (Reiner, a mano)

Verificado por lectura en Supabase el 2026-09-18:
1. Correr `0004_metodo_binance.sql` y `0005_comprobantes.sql` en el SQL Editor (**no están aplicadas**; son aditivas).
2. Redesplegar la edge function: `supabase functions deploy verificar-comprobante --no-verify-jwt` (la desplegada es anterior al fix del code review).
3. Confirmar o cargar el secret `GEMINI_API_KEY` (no se verificó).
4. Revisar la rama y hacer el merge a `main` (solo Reiner).
5. Correr `0003_categoria_bolleria.sql` **justo después** del deploy del merge.

## Preguntas abiertas para Reiner

- **Punto 15**: la "É" no se reproduce en Chrome ni en WebKit. Hace falta una captura del dispositivo donde se ve (modelo + iOS/navegador).
- **Punto 4**: el título "Desbloquea tu ficha de cata", el botón "Quiero mi guía" y el subtítulo sobre puntos del Club siguen como estaban. ¿Se ajustan?
- **Punto 3**: ¿"Falsir Durán" (el ROADMAP decía "Dúran") y el rol "Caficultor" están bien? ¿Tintes de color para Los Naranjos y un 4.º oscuro?
- **Carta en producción**: hay un producto "Reiner" ($800, Filtrado, disponible), aparentemente de prueba, y el postre `m11` todavía menciona "lote Santa Cruz de Mora" (finca que salió del roster).

## Verificación

- Build de Vite en verde (el SW de workbox falla por el apóstrofo de la ruta, preexistente).
- Bundle: 145.54 KB gzip (`main`) → 147.99 KB (rama).
- Headless por CDP: cero errores de consola en 6 pestañas, 2 temas, 390/360px y `/#barra` (login).
- Code review medium: 4 hallazgos, todos corregidos.

## Incidentes

- **2026-09-18, apagón a mitad del punto 13**: git estaba limpio y no se perdió nada. Ver `memoria.md` § "Reunión 05/sept".
