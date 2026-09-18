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
| 13 | Comprobante + OCR | ✅ Commiteado (`b57b2b2` a `80b76ad`, 5 commits) |
| 2 | Foto por producto (estructura) | ✅ Estructura lista, sin fotos todavía |
| 11 | Productos nuevos (punto de entrada) | ✅ Admin listo (+ etiqueta), sin contenido todavía |
| 3 | Roster de Fincas (Agua Fría + Los Naranjos + 2 placeholder) | ✅ Commiteado |
| 8 | Ficha técnica por finca | ✅ Commiteado |
| 7 | Comparar (se queda en FichaLote) | ⏳ Pendiente |
| 10 | Módulo Tienda ("Próximamente") | ⏳ Pendiente |
| 4 | Copy de Quadro Club | ⏳ Pendiente |
| 15 | "E" de "Quadro Café" en el header | ⏳ Pendiente |
| 1 | Pulido premium general | ⏳ Pendiente |

## Pendientes fuera del código (Reiner, en Supabase)

- Correr `0004_metodo_binance.sql` y `0005_comprobantes.sql` en el SQL Editor (son aditivas).
- Correr `0003_categoria_bolleria.sql` **recién al hacer el merge a `main`**.
- `supabase functions deploy verificar-comprobante --no-verify-jwt` y cargar el secret `GEMINI_API_KEY`.

## Incidentes

- **2026-09-18, apagón a mitad del punto 13**: git estaba limpio y no se perdió nada. Ver `memoria.md` § "Reunión 05/sept".
