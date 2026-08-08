# CLAUDE.md — Quadro Café

Guidance for Claude Code sessions working in this repo. Read `docs/HANDOFF.md` and `docs/rai-template-escalable.md` for full historical context, and `memoria.md` for the running project log.

## What this is

A mobile-first web app for Quadro Café, a real coffee shop at 4ª Av. de Los Palos Grandes, Edif. Los Eucaliptos, Caracas. Built under RAI Agency, intended as the flagship case study for a replicable "finca interactiva" template (see `docs/rai-template-escalable.md`).

## Stack

- **Vite + React 18**, plain JS (no TypeScript), inline styles (no CSS framework/Tailwind)
- Icons: `lucide-react`
- Single-file component pattern: the entire app lives in `src/App.jsx` (mounted by `src/main.jsx`).
- Deploy: GitHub → Cloudflare Pages, auto-deploys on push to `claude/quadro-cafe-v2-5uq32e`
- `npm run dev` / `npm run build` / `npm run preview`

## Theme system

Two palettes, user-switchable (toggle in the header, persisted to `localStorage`, defaults to `prefers-color-scheme`):

```
PALETAS.claro   — official brand (v4, "alta gama" brief): verde #3b574c, crema #e9d8c6, hueso/bone #f5efe6,
                  terracota #b5613c (acento cálido — precios/badges), marino #243b57 (acento frío — filtrado/proceso),
                  verde profundo #26382f (deep — capas superpuestas, fondo módulo Fincas), ink #1a1f1c
PALETAS.oscuro  — dark theme ported from the owner's redesign: ink #0B0F0D, panel #131A17,
                  mocoties #1E5C4A, latón #C9873A, nebulosa #5B2E8C, alien #7FE3C0
```

The `claro` palette above supersedes the earlier v3 tokens (`#1F4D3D`/`#EDE9E0`/`#B08B4F`) per the owner's "BRIEF DE EJECUCIÓN v2 (ALTA GAMA)" — those older values are preserved in `docs/HANDOFF.md` as history but are no longer current.

Every component reads colors via `useTheme()` (a `ThemeCtx` React context) — never hardcode a hex value in a component; add it to `PALETAS` if a new color is needed in both themes.

Typography: `Fraunces` (variable, opsz axis) for display/headers (`.disp`, `.script`, and the `.disp-xl`/`.disp-l`/`.disp-m` scale), `Inter Tight` for body and for labels (`.mono`/`.label`/`.micro` — uppercase, tracked; despite the class name `.mono` this is not monospace, kept for backwards compat with existing markup). This replaced Cormorant Garamond/Archivo/IBM Plex Mono in the v4 pass — still an approximation of quadrocafe.com's real logo lettering, swap in the real font file if the owner provides it.

**Marco Quadro**: the brand's signature visual motif — a corner notch (`.quadro-frame` CSS class, `clip-path` cutting the bottom-right corner) echoing the mountain-peak notch in the real logo. Applied only to brand-content containers (product cards in Menu, finca/lote cards in Fincas) — never to system chrome (nav bar, modals, form fields, buttons). Don't apply it indiscriminately.

## Real-data policy

Do not invent café/menu/finca/pricing data. Only use data that's either in `docs/HANDOFF.md`, confirmed by the owner in conversation, or already in `src/App.jsx`. When in doubt, ask before adding a new "fact" to the app.

Current confirmed-real data inventory (as of the v3 pass):
- Fincas/lotes (`FINCAS` in `App.jsx`): Elio (Triángulo de Mocotíes, Bailadores — Catuai, 86.5 SCA), Rosa (Santa Cruz de Mora, VCT — 83 SCA), Mina (La Mina, Colombia/1000 Cups — Yellow Bourbon honey, 87.5 SCA). Supersedes the earlier v2 roster (Agua Fría/Santa Anita/Los Naranjos/Shady Ramírez from `docs/HANDOFF.md`) — preserved there as history but no longer what's rendered in the app.
- Menu (`MENU`): real prices, categories (Filtrado/Espresso/Frío/Panadería/Postres), tags.
- Equipo (`EQUIPO`): Comandante C40, AeroPress, Sifón de vacío, Copas de perfil (Pinot/Aroma/Barrel).
- Location/contact: address, hours, Instagram — from `docs/HANDOFF.md`, rendered on Inicio.
- Still placeholder/unconfirmed: Quadro Club tier thresholds/points math, exact loyalty pricing, Academia lesson copy (plausible but not owner-verified), the geometry-simulator formula (a reasonable model, not lab-measured), and `METODOS_PAGO` (Efectivo/Pago móvil/Zelle/Transferencia) — a reasonable default list for a Venezuelan business, not owner-confirmed; no specific bank/phone/account data was invented for any of them (the cart just says "datos en caja al confirmar").

## Images

`src/assets/` holds two kinds of real assets — no stock photos, no unlabeled AI images:
- Professional Blender renders the owner commissioned (`hero-dispenser.jpg`, `club-box.jpg`, `menu-postres.jpg`, `menu-iced.jpg`, `lote-bourbon.jpg`) — used as ambient/equipment/category imagery, not as literal "ficha del lote" evidence (printed label text can lag behind current data — see `memoria.md`).
- Real camera photos (`assets/estudio/`) pre-seeding the Estudio tab's media library.
- `logo.png` is the one non-render real asset — the official brand mark, used in `Marca`.

Full asset library (renders + real photos, ~80 files) lives in the Drive folder `1i6U98nzBDotKZYQTAH60VVChKLGgOdP1` — ask before re-pulling from it, folder structure is documented in `memoria.md`.

## Out of scope / not yet built

React Native migration, CRM export integration, Higgsfield avatar videos (would replace the text/audio induction player in Fincas). See `docs/HANDOFF.md` for the original list, though it's now stale on two points: Supabase is live (Admin Panel + real-time Carta, see `memoria.md`), and checkout has a payment-**method** picker (Efectivo/Pago móvil/Zelle/Transferencia, `METODOS_PAGO` in `App.jsx`) — the cart tells the barista how the customer intends to pay, it does not process a real charge. An actual payment gateway (Stripe or similar, with a real merchant account and PCI scope) is still out of scope — confirmed explicitly with the owner, not to be added without asking again.
