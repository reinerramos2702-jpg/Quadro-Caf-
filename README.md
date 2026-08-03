# Quadro Café

App móvil-first para Quadro Café (4ª Av. de Los Palos Grandes, Edif. Los Eucaliptos, Caracas). Vite + React 18, JS plano, estilos inline. Ver `CLAUDE.md` para convenciones del proyecto y `memoria.md` para el registro histórico de decisiones.

## Desarrollo local

```
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción a dist/
npm run preview   # sirve el build de producción localmente
```

## Variables de entorno

La app usa Supabase para el Panel Admin y para que la Carta lea precios/disponibilidad en vivo. Copia `.env.example` a `.env` y completa:

| Variable | Qué es | Dónde se usa |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `src/lib/supabase.js` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (segura de exponer en el cliente — la seguridad real la da Row Level Security en las tablas) | `src/lib/supabase.js` |

**Nunca** pongas aquí una `service_role`/secret key de Supabase — no la usa ni la necesita el cliente.

Si estas variables faltan (o Supabase no responde), la app cae de vuelta a los datos locales hardcodeados en `src/App.jsx` (`MENU`) en vez de romperse — ver "Comportamiento sin Supabase" abajo.

## Deploy (Cloudflare Workers)

El repo se despliega vía **Workers Builds** (integración Git de Cloudflare Workers, no Cloudflare Pages clásico): cada push a `claude/quadro-cafe-v2-5uq32e` dispara un build (`npm run build`) y un deploy (`npx wrangler deploy`) automáticos, configurados por `wrangler.toml` (sirve `./dist` como sitio estático con fallback SPA).

### Configurar las variables de entorno del build

Como Vite reemplaza `import.meta.env.VITE_*` por su valor real **durante `vite build`**, esas variables tienen que existir en el entorno donde corre ese build — no alcanza con tenerlas en un `.env` local, y no sirve agregarlas como binding de runtime del Worker (eso solo llega al código del Worker después de que el bundle ya se generó, nunca al bundle en sí).

Pasos exactos en el dashboard de Cloudflare:

1. `dash.cloudflare.com` → **Workers & Pages** → selecciona el Worker `quadro-cafe`.
2. **Settings** → **Build**.
3. Busca la sección de variables del build (aparece como **"Build variables and secrets"** o **"Environment variables"** dentro de esa misma pantalla de Build, según la versión del dashboard — es una sección aparte del binding de runtime, ver nota abajo).
4. **Add variable** dos veces:
   - `VITE_SUPABASE_URL` → tipo **Plaintext** → tu URL de Supabase.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → tipo **Plaintext** (es la key pública, no hace falta cifrarla como secret, aunque marcarla como Secret tampoco rompe nada) → tu publishable key.
5. Guarda.
6. **Las variables no aplican al build que ya corrió.** Para que tomen efecto: o esperas al próximo push (dispara un build nuevo automáticamente), o vas a la lista de builds y usas **"Retry build"** sobre el último — eso re-corre el build con la configuración actual.

**No confundir con** Settings → **Bindings** (a veces rotulado "Variables and Secrets" ahí también) — esa sección inyecta variables al objeto `env` que recibe el Worker en tiempo de ejecución (`env.ALGO` dentro de código de Worker). Esta app no tiene código de servidor que lea `env` — es un sitio estático servido por Workers Assets — así que esa sección no tiene ningún efecto sobre `import.meta.env.VITE_*`. Confirmado además que `wrangler.toml` no declara ningún `[vars]` ni filtra nada — el problema nunca estuvo en el repo, solo en que el dashboard de build no tenía las variables cargadas.

### Comportamiento sin Supabase (o si falla)

- **Panel Admin** (`/#admin`): muestra un mensaje explícito ("Supabase no está configurado…") en vez de fallar en blanco.
- **Carta pública**: cae de vuelta a la constante `MENU` local. En build de **desarrollo** (`npm run dev`) esto se ve como un banner visible arriba de la Carta más un `console.warn` con el motivo exacto; en **producción** no se muestra un banner al cliente (para no exponer un problema de infraestructura en la cara de alguien pidiendo un café), pero el mismo `console.warn` sigue apareciendo en la consola del navegador — revísala si algo no cuadra con lo que esperas ver.

Fuentes de referencia de Cloudflare consultadas para estos pasos: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/), [troubleshooting builds](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/).
