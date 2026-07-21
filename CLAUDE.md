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
PALETAS.claro   — official light brand: verde #1F4D3D, hueso/crema #EDE9E0, negro #101311, dorado #B08B4F
PALETAS.oscuro  — dark theme ported from the owner's redesign: ink #0B0F0D, panel #131A17,
                  mocoties #1E5C4A, latón #C9873A, nebulosa #5B2E8C, alien #7FE3C0
```

Every component reads colors via `useTheme()` (a `ThemeCtx` React context) — never hardcode a hex value in a component; add it to `PALETAS` if a new color is needed in both themes.

Typography: `Cormorant Garamond` for display/headers (`.disp`, `.script`), `Archivo` for body, `IBM Plex Mono` for labels. Cormorant is an approximation of quadrocafe.com's real logo lettering (tall serif wordmark + script "Coffee" accent) — swap in the real font file if the owner provides it.

## Real-data policy

Do not invent café/menu/finca/pricing data. Only use data that's either in `docs/HANDOFF.md`, confirmed by the owner in conversation, or already in `src/App.jsx`. When in doubt, ask before adding a new "fact" to the app.

Current confirmed-real data inventory (as of the v3 pass):
- Fincas/lotes (`FINCAS` in `App.jsx`): Elio (Triángulo de Mocotíes, Bailadores — Catuai, 86.5 SCA), Rosa (Santa Cruz de Mora, VCT — 83 SCA), Mina (La Mina, Colombia/1000 Cups — Yellow Bourbon honey, 87.5 SCA). Supersedes the earlier v2 roster (Agua Fría/Santa Anita/Los Naranjos/Shady Ramírez from `docs/HANDOFF.md`) — preserved there as history but no longer what's rendered in the app.
- Menu (`MENU`): real prices, categories (Filtrado/Espresso/Frío/Panadería/Postres), tags.
- Equipo (`EQUIPO`): Comandante C40, AeroPress, Sifón de vacío, Copas de perfil (Pinot/Aroma/Barrel).
- Location/contact: address, hours, Instagram — from `docs/HANDOFF.md`, rendered on Inicio.
- Still placeholder/unconfirmed: Quadro Club tier thresholds/points math, exact loyalty pricing, Academia lesson copy (plausible but not owner-verified), the geometry-simulator formula (a reasonable model, not lab-measured).

## Images

`src/assets/` holds two kinds of real assets — no stock photos, no unlabeled AI images:
- Professional Blender renders the owner commissioned (`hero-dispenser.jpg`, `club-box.jpg`, `menu-postres.jpg`, `menu-iced.jpg`, `lote-bourbon.jpg`) — used as ambient/equipment/category imagery, not as literal "ficha del lote" evidence (printed label text can lag behind current data — see `memoria.md`).
- Real camera photos (`assets/estudio/`) pre-seeding the Estudio tab's media library.
- `logo.png` is the one non-render real asset — the official brand mark, used in `Marca`.

Full asset library (renders + real photos, ~80 files) lives in the Drive folder `1i6U98nzBDotKZYQTAH60VVChKLGgOdP1` — ask before re-pulling from it, folder structure is documented in `memoria.md`.

## Out of scope / not yet built

React Native migration, Supabase (auth/orders/real email capture), real in-app payments, CRM export integration, Higgsfield avatar videos (would replace the text/audio induction player in Fincas). See `docs/HANDOFF.md` for the original list — still accurate.
