# QUADRO CAFÉ — Documento Maestro (Handoff a Claude Code)

> Transcripción del PDF original enviado por el dueño/Reiner al iniciar el proyecto. Se conserva tal cual como registro histórico — el estado actual del proyecto vive en `memoria.md` y `CLAUDE.md`.

## Qué enviar a Claude Code

1. `quadro-cafe-v2.jsx` — código base actual de la app (React)
2. Este archivo `HANDOFF.md` — contexto completo del proyecto
3. `rai-template-escalable.md` — nota sobre el modelo como producto de RAI Agency (no es código, guardar en `/docs`)
4. Link de Drive con assets: https://drive.google.com/drive/folders/1i6U98nzBDotKZYQTAH60VVChKLGgOdP1
5. (Opcional) `propuesta-quadro-cafe.docx` — solo si querés que Claude Code también gestione la documentación del proyecto en el repo

No hace falta pegar el historial de esta conversación — este documento resume todo lo accionable.

## Stack decidido

- **Frontend:** React Native (app nativa — destino App Store + Google Play)
- **Backend:** Supabase
- **Repo:** GitHub → conectado a Cloudflare Pages (deploy automático en cada push)
- **Flujo de trabajo:** Reiner edita desde Claude Code (móvil) → push a GitHub → Cloudflare redeploya solo
- **Avatares fincas:** modelos 3D en Blender → animación en Higgsfield (aún no generados)
- **Analítica:** Google Analytics

## Brand tokens oficiales

```
Verde Quadro     #1F4D3D
Hueso/crema      #EDE9E0
Negro            #101311
Dorado/oliva     (acento, logo lettering)
```

Tipografía usada en v2: Fraunces (display) + Archivo (body) + IBM Plex Mono (labels/mono) — aproximación al lettering de quadrocafe.com; ajustar si el dueño provee las fuentes exactas del logo.

## Datos reales confirmados (no inventar más)

- **Ubicación:** 4ª Av. de Los Palos Grandes, Edif. Los Eucaliptos, Caracas 1060, Miranda · Lun–Dom 8am–8pm
- **Contacto:** info@quadrocafe.com · 04242970595 · @quadro.cafe (10.4k) · quadrocafe.com
- **Fincas/caficultores (4):** Agua Fría (José Tomás Carrillo Batalla), Santa Anita (Anacelis Dávila Alessandrello), Los Naranjos (Falsir Dúran), finca de Shady Ramírez
- **Lotes marca propia:** Villa Nueva, Catuai, Bourbon A Competencia
- **Menú completo:** ya cargado en `quadro-cafe-v2.jsx` (10 categorías reales, sin inventos)

## Módulos ya construidos en v2

Inicio, Carta (con carrito + ticket de estado), Fincas (slider + ambiente con avatar-texto placeholder), Quadro Club (captura de email + niveles), Lab (geometría de extracción)

## Pendiente de implementar

- Módulo Aula (educación) — código base existe pero no está en el tab bar de v2, falta reconectar
- Pagos reales dentro de la app (checkout actual es mock)
- Conectar Supabase (auth, pedidos, Quadro Club, captura de email real)
- Reemplazar avatar-texto por video/animación Higgsfield cuando estén los renders 3D
- Imágenes reales de espirales/geometría de extracción — Reiner aún no las subió a Drive
- CRM externo — otra persona maneja logística, la app debe exportar/enviar pedidos a esa interfaz (definir integración)

## Decisiones de negocio (contexto, no código)

- Cobro actualizado: $300 por el desarrollo (subido de $180) + $300 opcional por 2 meses de soporte post-lanzamiento
- Servicio bajo RAI Agency
- Contrato y reunión con el dueño: pendiente de definir fecha
- Modelo replicable a otros negocios de origen/trazabilidad — ver `rai-template-escalable.md`

## Preguntas de scope aún sin responder por el dueño

(quedaron pendientes — Reiner las responde cuando el dueño confirme)

1. Presupuesto/plazo total
2. Detalle del ángulo de sostenibilidad/deforestación europea a destacar
3. Confirmación de exclusividad de RAI Agency como proveedor
4. Fecha definitiva de cierre de acuerdo

## Siguiente paso inmediato en Claude Code

1. Crear repo GitHub `quadro-cafe-app`
2. Subir `quadro-cafe-v2.jsx` como punto de partida
3. Conectar Cloudflare Pages al repo
4. Migrar el componente a estructura de proyecto (React Native o mantener como PWA hasta decidir empaquetado nativo)
