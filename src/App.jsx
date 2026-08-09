import React, { useState, useEffect, useRef, useMemo, useContext, createContext, Suspense, lazy } from "react";
import {
  Coffee, Mountain, Waves, ShoppingBag, GraduationCap, Award,
  Plus, Minus, X, Play, Pause, Check, ChevronRight, ChevronLeft, MapPin, Instagram,
  Mail, Lock, ArrowLeft, Image as ImageIcon, Upload, Trash2, Sun, Moon, Settings, LogOut,
} from "lucide-react";

import { supabase } from "./lib/supabase";
import { ASSET_MANIFEST } from "./data/assetManifest";
import logo from "./assets/logo.png";
import clubBox from "./assets/club-box.jpg";
import estudioLocal from "./assets/estudio/local-barra.jpg";
import estudioPourover from "./assets/estudio/pourover-barra.jpg";
import violaFont from "./assets/fonts/VIOLA.otf";
import nexaBoldFont from "./assets/fonts/Nexa-Bold.otf";
import nexaLightFont from "./assets/fonts/Nexa-Light.otf";

// three.js pesa varios cientos de KB — se carga bajo demanda (chunk propio,
// se descarga solo cuando alguien abre Inicio o Lab, no bloquea el resto).
const EspiralTubo3D = lazy(() => import("./lib/espiral3d.jsx"));
const EspiralHero = lazy(() => import("./lib/espiral3d.jsx").then((m) => ({ default: m.EspiralHero })));

/* ============================================================
   QUADRO CAFÉ — v4 "alta gama"
   Dos temas, mismos datos reales.
   claro   verde #3b574c · crema #e9d8c6 · terracota #b5613c · marino #243b57   (branding oficial v4)
   oscuro  ink #0B0F0D · mocoties #1E5C4A · latón #C9873A · nebulosa #5B2E8C · alien #7FE3C0
   ============================================================ */

const PALETAS = {
  claro: {
    id: "claro", shell: "#1a1f1c",
    surface: "#e9d8c6", card: "#f5efe6", line: "#d8c7ae",
    text: "#1a1f1c", textMuted: "#6f6459",
    brand: "#3b574c", onBrand: "#e9d8c6", deep: "#26382f",
    brandAlt: "#b5613c", onBrandAlt: "#f5efe6",
    purple: "#243b57", amarillo: "#c79a3b", warn: "#9c3b28",
  },
  oscuro: {
    id: "oscuro", shell: "#07100D",
    surface: "#0B0F0D", card: "#131A17", line: "#243029",
    text: "#F2EDE3", textMuted: "#8AA096",
    brand: "#7FE3C0", onBrand: "#0B0F0D", deep: "#050807",
    brandAlt: "#C9873A", onBrandAlt: "#0B0F0D",
    purple: "#A47BE0", amarillo: "#E0C24B", warn: "#E08C6B",
  },
};

const FINCA_TINTS = {
  claro: ["#243b57", "#3b574c", "#b5613c"],
  oscuro: ["#5B2E8C", "#1E5C4A", "#C9873A"],
};

/* Tipografía real de marca (reemplaza las aproximaciones Fraunces/Inter
   Tight de Google Fonts): VIOLA es el lettering real del logo quadrocafe.com
   — se usa solo en display/headers, con Fraunces como fallback de glyph
   (VIOLA no trae acentos, así que "café" cae a Fraunces solo para la é).
   Nexa (Light 300 / Bold 700) es la sans de marca para cuerpo y labels. */
const FONTS = `
@font-face{font-family:'VIOLA';src:url(${violaFont}) format('opentype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Nexa';src:url(${nexaLightFont}) format('opentype');font-weight:300;font-style:normal;font-display:swap}
@font-face{font-family:'Nexa';src:url(${nexaBoldFont}) format('opentype');font-weight:700;font-style:normal;font-display:swap}
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Fraunces:ital,opsz,wght@1,9..144,600&display=swap');
`;

function buildCss(C) {
  return `
${FONTS}
*{box-sizing:border-box}
.qc{font-family:'Nexa','Inter Tight',system-ui,sans-serif;font-weight:300;color:${C.text};background:${C.surface}}
/* font-size-adjust:from-font en todas las clases con fallback (VIOLA→Fraunces,
   Nexa→Inter Tight/system-ui): VIOLA y Nexa no traen tildes/ñ (ver comentario
   arriba de @font-face), así que esos glifos puntuales caen al siguiente
   font-family del stack. Sin esto, el navegador dibuja el glifo de fallback
   a su propio x-height/cap-height — que no coincide con el de VIOLA/Nexa —
   así que dentro de un texto en mayúscula (.mono/.label/.micro, o cualquier
   .disp* forzado a uppercase) una tilde o ñ se ve chica y como fuera de
   registro, casi como si no hubiera heredado el uppercase/tamaño del resto
   (sí los hereda — text-transform y font-size son propiedades del elemento,
   no de la fuente — es la métrica del glifo de reemplazo la que no calza).
   from-font le pide al navegador reescalar el fallback para igualar el
   tamaño percibido de la fuente principal. Soporte: Chromium/Firefox
   recientes; en motores sin soporte no rompe nada, sigue el comportamiento
   previo. */
.disp{font-family:'VIOLA','Fraunces',serif;font-weight:400;letter-spacing:-.01em;font-optical-sizing:auto;font-size-adjust:from-font}
.script{font-family:'Fraunces',serif;font-style:italic;font-weight:600}
.mono{font-family:'Nexa','Inter Tight',system-ui,sans-serif;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size-adjust:from-font}
.disp-xl{font-family:'VIOLA','Fraunces',serif;font-weight:400;font-size:40px;line-height:44px;letter-spacing:-.02em;margin:0;font-size-adjust:from-font}
.disp-l{font-family:'VIOLA','Fraunces',serif;font-weight:400;font-size:30px;line-height:34px;letter-spacing:-.015em;margin:0;font-size-adjust:from-font}
.disp-m{font-family:'VIOLA','Fraunces',serif;font-weight:400;font-size:22px;line-height:28px;margin:0;font-size-adjust:from-font}
.body-l{font-family:'Nexa','Inter Tight',sans-serif;font-weight:300;font-size:17px;line-height:26px;font-size-adjust:from-font}
.label{font-family:'Nexa','Inter Tight',sans-serif;font-weight:700;font-size:13px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;font-size-adjust:from-font}
.micro{font-family:'Nexa','Inter Tight',sans-serif;font-weight:700;font-size:11px;line-height:14px;letter-spacing:.08em;text-transform:uppercase;font-size-adjust:from-font}
.quadro-frame{clip-path:polygon(0 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%)}
.qc-scroll::-webkit-scrollbar{width:0;height:0}
@keyframes qc-spiral-enter{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes qc-spiral-spin{to{transform:rotate(360deg)}}
.spiral-enter{animation:qc-spiral-enter .9s cubic-bezier(.2,.8,.2,1) both}
.spiral-spin{transform-origin:100px 100px;animation:qc-spiral-spin 16s cubic-bezier(.45,0,.55,1) infinite}
@keyframes qc-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes qc-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes qc-slide{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes qc-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes qc-drip{0%{transform:translateY(-6px);opacity:0}20%{opacity:1}100%{transform:translateY(26px);opacity:0}}
@keyframes qc-pulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.9;transform:scale(1.06)}}
@keyframes qc-steam{0%{transform:translateY(0) scaleX(1);opacity:0}30%{opacity:.55}100%{transform:translateY(-22px) scaleX(1.5);opacity:0}}
@keyframes qc-bar{from{width:0}}
@keyframes qc-frame-square{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes qc-frame-fade{from{opacity:0}to{opacity:1}}
.rise{animation:qc-rise .45s cubic-bezier(.2,.8,.2,1) both}
.pop{animation:qc-pop .35s cubic-bezier(.2,.8,.2,1) both}
.slide{animation:qc-slide .4s cubic-bezier(.2,.8,.2,1) both}
.sheet{animation:qc-sheet .34s cubic-bezier(.2,.9,.2,1) both}
.press{transition:transform .12s ease, background .2s ease, border-color .2s ease}
.press:active{transform:scale(.96)}
.tapfx{transition:all .2s cubic-bezier(.2,.8,.2,1)}
.tapfx:hover{transform:translateY(-2px)}
.drip{animation:qc-drip 1.6s linear infinite}
.steam{animation:qc-steam 2.6s ease-out infinite}
.pulse{animation:qc-pulse 2.4s ease-in-out infinite}
.bar{animation:qc-bar .8s cubic-bezier(.2,.8,.2,1) both}
:focus-visible{outline:2px solid ${C.brand};outline-offset:2px;border-radius:6px}
@media (prefers-reduced-motion:reduce){*{animation-duration:.001s!important;transition-duration:.001s!important}}
`;
}

/* ============================ DATOS REALES ============================ */

const FINCAS = [
  {
    id: "mocoties",
    finca: "Triángulo de Mocotíes",
    zona: "Bailadores, Mérida",
    altura: 2200, varietal: "Catuai", proceso: "Lavado", score: 86.5,
    notas: ["Caramelo", "Floral", "Té verde"],
    avatar: { nombre: "Elio", rol: "Tostador de altura", inicial: "E" },
    guion: [
      "Bienvenido. Soy Elio, del Triángulo de Mocotíes, en Bailadores.",
      "Sembramos a 2.200 metros. El frío alarga la maduración del fruto y concentra el azúcar.",
      "Este lote es Catuai lavado: despulpado el mismo día, fermentado 18 horas, secado en marquesina.",
      "En taza vas a encontrar caramelo primero, luego floral, y un cierre a té verde.",
      "Puntaje SCA: 86,5. Fue el grano del Campeonato AeroPress Venezuela 2023.",
      "Si lo preparas en AeroPress, invertido y 2 minutos. No lo ahogues en agua caliente.",
    ],
  },
  {
    id: "vct",
    finca: "Santa Cruz de Mora",
    zona: "Mérida · VCT",
    altura: 1400, varietal: "Arábica", proceso: "Lavado", score: 83.0,
    notas: ["Panela", "Nuez", "Cítrico suave"],
    avatar: { nombre: "Rosa", rol: "Beneficiadora", inicial: "R" },
    guion: [
      "Soy Rosa. Trabajo el beneficio húmedo en Santa Cruz de Mora.",
      "Café verde lavado, humedad entre 11 y 12 por ciento, empacado en GrainPro.",
      "Screen 16/18 en el 95 por ciento del lote. Menos de 20 defectos por muestra de 300 gramos.",
      "Es un café de cuerpo medio, dulce a panela. Aguanta leche sin desaparecer.",
      "Puntaje 83. Es nuestro café de todos los días, el que sostiene la barra.",
    ],
  },
  {
    id: "lamina",
    finca: "La Mina",
    zona: "Colombia · 1000 Cups",
    altura: 1800, varietal: "Yellow Bourbon", proceso: "Honey · fermentación",
    score: 87.5,
    notas: ["Choco dulce", "Fruto amarillo", "Floral"],
    avatar: { nombre: "Mina", rol: "Curadora de lote", inicial: "M" },
    guion: [
      "La Mina. Yellow Bourbon a 1.800 metros, fermentación honey controlada.",
      "El mucílago se queda en el grano durante el secado. Por eso el dulzor es tan espeso.",
      "Chocolate dulce al frente, fruta amarilla en el medio, floral al enfriarse.",
      "Puntaje 87,5. Es el lote más caro de la barra y el que más se defiende solo.",
      "Filtrado. Si lo pasas por espresso, pierdes la parte floral.",
    ],
  },
];

const GEOMETRIAS = [
  { id: "espiral", nombre: "Espiral continua", vueltas: 4.2, pasos: 260, radio: 1, metodo: "V60 · vertido continuo",
    efecto: { extraccion: 82, cuerpo: 38, acidez: 78, dulzor: 66 },
    lectura: "Moja todo el lecho por igual. Sube acidez y claridad, baja cuerpo." },
  { id: "centro", nombre: "Punto central", vueltas: 0.6, pasos: 120, radio: 0.35, metodo: "AeroPress invertida",
    efecto: { extraccion: 68, cuerpo: 84, acidez: 46, dulzor: 74 },
    lectura: "Agua concentrada al centro. Extracción más lenta, cuerpo denso y dulce." },
  { id: "pulsos", nombre: "Espiral por pulsos", vueltas: 2.4, pasos: 200, radio: .85, metodo: "Kalita · 3 pulsos",
    efecto: { extraccion: 76, cuerpo: 58, acidez: 64, dulzor: 82 },
    lectura: "Cada pulso reinicia la turbulencia. Es la ruta más estable al dulzor." },
  { id: "inmersion", nombre: "Inmersión con vacío", vueltas: 6, pasos: 300, radio: .95, metodo: "Sifón",
    efecto: { extraccion: 88, cuerpo: 72, acidez: 70, dulzor: 60 },
    lectura: "Temperatura sostenida y agitación total. Extrae más, perdona menos." },
];

const TAZAS = [
  { id: "blanca", nombre: "Blanca", hex: "#F2EDE3", pct: 0, efecto: "Referencia. Percepción neutra de dulzor y amargor." },
  { id: "azul", nombre: "Azul Alpine", hex: "#5E93A8", pct: 18, efecto: "Se percibe más dulce. Baja la lectura de amargor." },
  { id: "roja", nombre: "Roja Sunset", hex: "#B2483A", pct: -12, efecto: "Realza cuerpo e intensidad. Sube el amargor percibido." },
  { id: "verde", nombre: "Verde Mocotíes", hex: "#1E5C4A", pct: 8, efecto: "Acentúa las notas vegetales y de té verde." },
  { id: "barro", nombre: "Barro Barrel", hex: "#8C6242", pct: 4, efecto: "Suaviza la acidez. Alarga el retrogusto." },
];

const MENU = [
  { id: "m1", cat: "Filtrado", nombre: "V60 de origen", precio: 4.5, desc: "60° C de servicio, 15 g, 250 ml. Elige finca.", finca: true, geo: "espiral", tag: "Firma" },
  { id: "m2", cat: "Filtrado", nombre: "AeroPress campeonato", precio: 5.0, desc: "Receta del Campeonato AeroPress Venezuela 2023.", finca: true, geo: "centro", tag: "86.5" },
  { id: "m3", cat: "Filtrado", nombre: "Sifón a la mesa", precio: 7.0, desc: "Extracción por vacío, servida frente al cliente.", finca: true, geo: "inmersion", tag: "Show" },
  { id: "m4", cat: "Espresso", nombre: "Espresso doble", precio: 2.5, desc: "18 g dentro, 36 g fuera, 28 segundos.", finca: false },
  { id: "m5", cat: "Espresso", nombre: "Cortado", precio: 3.0, desc: "Espresso doble con 60 ml de leche texturizada.", finca: false },
  { id: "m6", cat: "Espresso", nombre: "Latte de cascarilla", precio: 4.2, desc: "Con Coffee Husk Syrup orgánico de la casa.", finca: false, tag: "Casa" },
  { id: "m7", cat: "Frío", nombre: "Cold brew 18 h", precio: 4.0, desc: "Inmersión larga en frío. Servido sobre hielo prensado.", finca: true },
  { id: "m8", cat: "Frío", nombre: "Tónica de cascarilla", precio: 4.8, desc: "Cascarilla, tónica y cítrico. Sin alcohol.", finca: false },
  { id: "m9", cat: "Panadería", nombre: "Croissant de mantequilla", precio: 2.8, desc: "Laminado de 3 días. Horneado a las 7:00.", finca: false },
  { id: "m10", cat: "Panadería", nombre: "Pan de masa madre", precio: 5.5, desc: "Pieza de 800 g. Fermentación de 24 horas.", finca: false },
  { id: "m11", cat: "Postres", nombre: "Tarta de café y nuez", precio: 4.6, desc: "Con espresso del lote Santa Cruz de Mora.", finca: false },
  { id: "m12", cat: "Postres", nombre: "Cheesecake de cascarilla", precio: 4.9, desc: "Base de galleta, sirope de cascarilla.", finca: false, tag: "Nuevo" },
];

const CATS = ["Filtrado", "Espresso", "Frío", "Panadería", "Postres"];
const CAT_IMG = { Filtrado: "lote-bourbon", Frío: "menu-iced", Postres: "menu-postres" };

/* Aviso de "estamos usando el respaldo local" — nunca silencioso. En consola
   siempre (el dueño puede revisarla en prod si algo no cuadra); en pantalla
   solo en dev, para no asustar a un cliente real con un banner de deploy. */
function avisarFallbackCarta(motivo) {
  console.warn(`[Carta] Usando MENU local de respaldo — ${motivo}`);
}

/* Carta viva: lee la tabla `productos` de Supabase (la misma que edita el
   Panel Admin) y cae de vuelta a la constante MENU local si Supabase no está
   configurado, la consulta falla, o la tabla todavía está vacía — la app
   nunca debe quedarse sin carta que mostrar. */
function useCarta() {
  const [items, setItems] = useState(MENU);
  const [fuente, setFuente] = useState("local");

  useEffect(() => {
    if (!supabase) {
      avisarFallbackCarta("faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY en esta build.");
      return;
    }
    let cancelado = false;
    supabase.from("productos").select("*").order("orden").then(({ data, error }) => {
      if (cancelado) return;
      if (error) { avisarFallbackCarta(`error de Supabase — ${error.message}`); return; }
      if (!data || !data.length) { avisarFallbackCarta("la tabla productos está vacía."); return; }
      setItems(data.map((p) => ({
        id: p.id, cat: p.cat, nombre: p.nombre, precio: Number(p.precio),
        desc: p.descripcion, tag: p.tag || undefined, geo: p.geo || undefined,
        finca: p.finca, disponible: p.disponible,
      })));
      setFuente("supabase");
    }).catch((err) => {
      if (cancelado) return;
      avisarFallbackCarta(`fallo de red hacia Supabase — ${err?.message || err}`);
    });
    return () => { cancelado = true; };
  }, []);

  return { items, fuente };
}

const EQUIPO = [
  { nombre: "Comandante C40", detalle: "Nitro Blade · Alpine Lagoon y Sunset", uso: "Molienda de barra y competencia", clicks: "18–24 clics para filtrado" },
  { nombre: "AeroPress", detalle: "Presión de aire + microfiltro", uso: "Recetas de campeonato", clicks: "Invertida, 2:00 min" },
  { nombre: "Sifón de vacío", detalle: "Balón, mechero, filtro de tela", uso: "Servicio a la mesa", clicks: "93 °C sostenidos" },
  { nombre: "Copas de perfil", detalle: "Pinot · Aroma · Barrel", uso: "Catación y cierre de venta", clicks: "Cambian el aroma percibido" },
];

const ACADEMIA = [
  { id: "a1", titulo: "Leer una etiqueta de lote", min: 4,
    puntos: ["Origen y altura definen acidez", "El proceso define dulzor y cuerpo", "La fecha de tueste manda sobre todo lo demás"],
    quiz: [
      { q: "¿Qué define la acidez de un café, según la etiqueta del lote?", opciones: ["El logo de la marca", "Origen y altura", "El precio impreso"], correcta: 1 },
      { q: "Verdadero o falso: el proceso de beneficio es lo que define el dulzor y el cuerpo del café.", opciones: ["Verdadero", "Falso"], correcta: 0 },
      { q: "De estos datos de una etiqueta, ¿cuál manda sobre todos los demás?", opciones: ["El precio", "El logo de la marca", "La fecha de tueste"], correcta: 2 },
    ] },
  { id: "a2", titulo: "Molienda: por qué el clic importa", min: 6,
    puntos: ["Más fino, más superficie, más extracción", "Los finos ahogan el lecho y amargan", "Ajusta molienda antes que tiempo"],
    quiz: [
      { q: "Si un shot sale agrio y sub-extraído, ¿hacia qué lado ajustas la molienda?", opciones: ["Más gruesa", "No se toca la molienda", "Más fina"], correcta: 2 },
      { q: "Verdadero o falso: demasiados finos en la molienda ahogan el lecho y producen amargor.", opciones: ["Verdadero", "Falso"], correcta: 0 },
      { q: "Para corregir una extracción, ¿qué se ajusta primero?", opciones: ["El tiempo de preparación", "La molienda", "La cantidad de tazas servidas"], correcta: 1 },
    ] },
  { id: "a3", titulo: "Geometría del vertido", min: 7,
    puntos: ["La espiral reparte, el centro concentra", "Los pulsos estabilizan la temperatura", "La turbulencia es sabor, no adorno"],
    quiz: [
      { q: "¿Qué patrón de vertido concentra el agua en vez de repartirla por el lecho?", opciones: ["La espiral continua", "El vertido al centro", "Ambos reparten igual"], correcta: 1 },
      { q: "Verdadero o falso: verter por pulsos ayuda a estabilizar la temperatura.", opciones: ["Verdadero", "Falso"], correcta: 0 },
      { q: "Según la lección, ¿qué es la turbulencia del vertido?", opciones: ["Un error que siempre hay que evitar", "Solo un efecto visual, sin impacto en sabor", "Parte del sabor, no solo adorno"], correcta: 2 },
    ] },
  { id: "a4", titulo: "Catación y vocabulario de barra", min: 5,
    puntos: ["Describe con comida, no con adjetivos vacíos", "Primero dulzor, luego acidez, luego cuerpo", "El cliente compra lo que entiende"],
    quiz: [
      { q: "¿Cómo se recomienda describir un café en catación?", opciones: ["Con adjetivos vacíos como \"rico\"", "Con referencias de comida (caramelo, panela, etc.)", "Solo con el puntaje SCA"], correcta: 1 },
      { q: "¿En qué orden se cata un café, según la lección?", opciones: ["Cuerpo, acidez, dulzor", "Acidez, cuerpo, dulzor", "Dulzor, acidez, cuerpo"], correcta: 2 },
      { q: "Verdadero o falso: el cliente compra lo que entiende, por eso el vocabulario claro importa al vender.", opciones: ["Verdadero", "Falso"], correcta: 0 },
    ] },
];

const CLUB_NIVELES = [
  { nombre: "Grano", desde: 0, beneficio: "Acumula 1 punto por cada $1 en compras" },
  { nombre: "Tueste", desde: 100, beneficio: "10% off en filtrados de origen" },
  { nombre: "Barista", desde: 300, beneficio: "1 bebida gratis al mes + acceso anticipado a lotes nuevos" },
  { nombre: "Q Circle", desde: 600, beneficio: "Cata privada trimestral con el equipo Quadro" },
];

const DESTINOS = ["Galería del local", "Foto de lote", "Máquina en acción", "Avatar de finca", "Menú impreso", "Paleta de color"];
const MEDIOS_INICIALES = [
  { id: "seed-local", nombre: "Barra — Quadro Café", url: estudioLocal, destino: "Galería del local" },
  { id: "seed-pourover", nombre: "Filtrado en barra", url: estudioPourover, destino: "Máquina en acción" },
];

/* ============================ UTILES ============================ */

const money = (n) => `$${n.toFixed(2)}`;
const ACENTOS = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n", ü: "u" };
const slugify = (s) => s.toLowerCase()
  .replace(/[áéíóúñü]/g, (c) => ACENTOS[c])
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function spiralPath(vueltas, pasos, radioMax, size = 200, prog = 1) {
  const cx = size / 2, cy = size / 2;
  const max = Math.max(2, Math.floor(pasos * prog));
  let d = "";
  for (let i = 0; i < max; i++) {
    const t = i / pasos;
    const ang = t * vueltas * Math.PI * 2;
    const r = t * (size / 2 - 14) * radioMax;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d;
}

/* ============================ TEMA ============================ */

const ThemeCtx = createContext(null);
const useTheme = () => useContext(ThemeCtx);

function ThemeToggle() {
  const { tema, setTema, C } = useTheme();
  const oscuro = tema === "oscuro";
  return (
    <button onClick={() => setTema(oscuro ? "claro" : "oscuro")} className="press" aria-label="Cambiar tema" style={{
      display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 11,
      border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer",
    }}>
      {oscuro ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

/* ============================ PIEZAS ============================ */

/* <picture> con WebP responsivo (480/900/1400w) + fallback JPG, con el color
   dominante del asset pintado en el wrapper hasta que la imagen cargue (sin
   blur — placeholder sólido). `eager` solo para imagen above-the-fold. */
function ResponsiveImg({ id, alt = "", style = {}, className, eager = false }) {
  const asset = ASSET_MANIFEST[id];
  if (!asset) return null;
  const { objectFit, objectPosition, ...wrapperStyle } = style;
  return (
    <picture className={className} style={{
      display: "block", overflow: "hidden", background: asset.color,
      aspectRatio: `${asset.width} / ${asset.height}`,
      ...wrapperStyle,
    }}>
      <source type="image/webp"
        srcSet={`${asset.webp480} 480w, ${asset.webp900} 900w, ${asset.webp1400} 1400w`}
        sizes="(max-width: 430px) 100vw, 430px" />
      <img src={asset.jpg} alt={alt} loading={eager ? "eager" : "lazy"} style={{
        width: "100%", height: "100%", display: "block",
        objectFit: objectFit || "cover",
        ...(objectPosition ? { objectPosition } : {}),
      }} />
    </picture>
  );
}

function Chip({ children, active, onClick, tone, onTone }) {
  const { C } = useTheme();
  const bg = tone || C.brand;
  const fg = onTone || C.onBrand;
  return (
    <button onClick={onClick} className="press mono" style={{
      padding: "7px 13px", borderRadius: 999, fontSize: 11, letterSpacing: ".08em",
      textTransform: "uppercase", whiteSpace: "nowrap", cursor: "pointer",
      border: `1px solid ${active ? bg : C.line}`,
      background: active ? bg : "transparent",
      color: active ? fg : C.textMuted, fontWeight: 600,
    }}>
      {children}
    </button>
  );
}

function Meter({ label, value, tone, delay = 0 }) {
  const { C } = useTheme();
  const t = tone || C.brand;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: ".1em", color: C.textMuted, marginBottom: 5, textTransform: "uppercase" }}>
        <span>{label}</span><span style={{ color: t }}>{value}</span>
      </div>
      <div style={{ height: 4, background: C.line, borderRadius: 99, overflow: "hidden" }}>
        <div className="bar" style={{ height: "100%", width: `${value}%`, background: t, borderRadius: 99, animationDelay: `${delay}ms`, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
    </div>
  );
}

function Header({ titulo, sub, right, onBack }) {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "22px 20px 14px", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} className="press" aria-label="Volver a inicio" style={{ ...btnMiniStyle(C), flexShrink: 0, marginBottom: 3 }}>
            <ArrowLeft size={15} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 6 }}>{sub}</div>
          <h1 className="disp" style={{ fontSize: 30, lineHeight: .95, margin: 0 }}>{titulo}</h1>
        </div>
      </div>
      {right}
    </div>
  );
}

function Marca({ size = 28, ring = false }) {
  const { C } = useTheme();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      display: "grid", placeItems: "center", flexShrink: 0,
      boxShadow: ring ? `0 0 0 1.5px ${C.text}` : "none",
    }}>
      <img src={logo} alt="Quadro Café" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

function SplashFrame({ size = 96 }) {
  const { C } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ position: "absolute", inset: 0 }}>
      <rect x="4" y="4" width="92" height="92" rx="6" pathLength="1" fill="none" stroke={C.onBrand}
        strokeWidth="2" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation: "qc-frame-square .4s cubic-bezier(.4,0,.2,1) forwards" }} />
      <rect x="20" y="20" width="60" height="60" rx="3" pathLength="1" fill="none" stroke={C.onBrand}
        strokeWidth="2" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation: "qc-frame-square .3s cubic-bezier(.4,0,.2,1) .25s forwards" }} />
      <path d="M56 80 L68 62 L80 80 Z" pathLength="1" fill="none" stroke={C.onBrand}
        strokeWidth="2" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation: "qc-frame-square .25s cubic-bezier(.4,0,.2,1) .5s forwards" }} />
    </svg>
  );
}

function btnMiniStyle(C) {
  return {
    width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center",
    background: "transparent", border: `1px solid ${C.line}`, color: C.text, cursor: "pointer",
  };
}

/* ============================ INICIO ============================ */

function Inicio({ ir, lote }) {
  const { C, tema } = useTheme();
  const [geo, setGeo] = useState(GEOMETRIAS[0]);

  const tint = FINCA_TINTS[tema][FINCAS.findIndex((f) => f.id === lote.id)] || C.brand;

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 100 }}>
      <button onClick={() => ir("club")} className="press tapfx quadro-frame rise" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        width: "calc(100% - 40px)", margin: "12px 20px 0", textAlign: "left", cursor: "pointer",
        border: `1px solid ${C.brandAlt}`, borderRadius: 16, borderBottomRightRadius: 0, padding: "13px 16px",
        background: `linear-gradient(120deg, ${C.brandAlt}26, ${C.card})`, color: C.text,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ color: C.brandAlt }}><Award size={19} /></span>
          <div>
            <div className="disp" style={{ fontSize: 14 }}>Quadro Club</div>
            <div className="mono" style={{ fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>Tu fidelidad, tus puntos</div>
          </div>
        </div>
        <ChevronRight size={16} color={C.textMuted} />
      </button>

      <div className="rise" style={{ position: "relative", padding: "26px 20px 8px", overflow: "hidden", minHeight: 300 }}>
        {/* Hero 3D: mismo modelo que Lab (public/models/espiral.glb — el .glb
           reenviado por el dueño resultó ser idéntico byte a byte al que ya
           estaba en el repo, así que se reusa en vez de duplicar 7MB),
           orbitando solo como fondo decorativo. Sin camera-controls a
           propósito — "sin interacción" — reemplaza el JPG estático
           hero-dispenser.jpg que había antes. No se tocó escala/posición
           del modelo (nada que ajustar: model-viewer autoencuadra por
           bounding sphere), solo se alejó un poco la cámara del encuadre
           automático (mismo criterio que el fix de Lab) para no recortar
           bordes mientras gira. */}
        {/* eslint-disable-next-line react/no-unknown-property */}
        <model-viewer
          src="/models/espiral.glb"
          alt=""
          aria-hidden="true"
          auto-rotate
          rotation-per-second="9deg"
          interaction-prompt="none"
          camera-orbit="0deg 75deg 115%"
          shadow-intensity="0.9"
          exposure="1.1"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
            "--poster-color": "transparent", backgroundColor: "transparent",
          }}
        />
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, ${C.surface}CC, ${C.surface})`,
        }} />
        <div style={{ position: "relative" }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".24em", color: C.brandAlt, textTransform: "uppercase" }}>
            Barra abierta · 7:00 a 20:00
          </div>
          <h1 className="disp" style={{ fontSize: 44, lineHeight: .88, margin: "10px 0 4px" }}>
            El sabor<br />tiene una<br /><span className="script" style={{ color: C.brand }}>geometría.</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.5, margin: "10px 0 0", maxWidth: 300 }}>
            Cada método dibuja una ruta distinta del agua sobre el café. Toca una ruta y mira cómo cambia la taza.
          </p>
        </div>
      </div>

      <div className="pop" style={{ position: "relative", margin: "14px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div key={geo.id} style={{ flexShrink: 0 }} className="spiral-enter">
            <Suspense fallback={<div style={{ width: 132, height: 132 }} />}>
              <EspiralTubo3D vueltas={geo.vueltas} radio={geo.radio} prog={1} tam={132}
                colorLinea={C.line} colorBrand={C.brand} colorAcento={C.brandAlt} />
            </Suspense>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 10, color: C.brandAlt, letterSpacing: ".16em", textTransform: "uppercase" }}>{geo.metodo}</div>
            <div className="disp" style={{ fontSize: 19, margin: "4px 0 10px" }}>{geo.nombre}</div>
            <Meter label="Extracción" value={geo.efecto.extraccion} />
            <Meter label="Cuerpo" value={geo.efecto.cuerpo} tone={C.brandAlt} />
            <Meter label="Acidez" value={geo.efecto.acidez} tone={C.purple} />
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5, margin: "12px 0 12px" }}>{geo.lectura}</p>
        <div style={{ display: "flex", gap: 7, overflowX: "auto" }} className="qc-scroll">
          {GEOMETRIAS.map((g) => (
            <Chip key={g.id} active={g.id === geo.id} onClick={() => setGeo(g)}>{g.nombre}</Chip>
          ))}
        </div>
      </div>

      <div className="slide" style={{ margin: "16px 20px 0" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".2em", color: C.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Lote en barra hoy</div>
        <button onClick={() => ir("fincas")} className="press tapfx quadro-frame" style={{
          width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${C.line}`,
          borderRadius: 18, borderBottomRightRadius: 0, padding: 16, background: `linear-gradient(140deg, ${tint}44, ${C.card} 60%)`, color: C.text,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="disp" style={{ fontSize: 20 }}>{lote.finca}</div>
              <div className="mono" style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{lote.zona} · {lote.altura} msnm</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="disp" style={{ fontSize: 24, color: C.brand }}>{lote.score}</div>
              <div className="mono" style={{ fontSize: 9, color: C.textMuted, letterSpacing: ".1em" }}>SCA</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {lote.notas.map((n) => (
              <span key={n} className="mono" style={{ fontSize: 10, padding: "4px 9px", borderRadius: 99, border: `1px solid ${C.line}`, color: C.text }}>{n}</span>
            ))}
          </div>
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 11, color: C.brand }}>
            Escuchar la inducción de la finca <ChevronRight size={13} />
          </div>
        </button>
      </div>

      <div style={{ margin: "20px 20px 0", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textMuted }}>
          <MapPin size={14} /> 4ª Av. de Los Palos Grandes, Edif. Los Eucaliptos · Lun–Dom 8am–8pm
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textMuted }}>
          <Instagram size={14} /> @quadro.cafe
        </div>
      </div>
    </div>
  );
}

/* ============================ MENÚ ============================ */

function Menu({ carrito, add, quitar, lote, setLote, taza, setTaza, onBack }) {
  const { C } = useTheme();
  const [cat, setCat] = useState("Filtrado");
  const [abierto, setAbierto] = useState(null);
  const { items: carta, fuente } = useCarta();
  const items = carta.filter((m) => m.cat === cat);
  const imgCategoria = CAT_IMG[cat];

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 120 }}>
      <Header sub="Carta viva" titulo="Pedir en barra" onBack={onBack} />
      {import.meta.env.DEV && fuente === "local" && (
        <div className="mono" style={{
          margin: "0 20px 12px", padding: "8px 12px", borderRadius: 10, fontSize: 10.5,
          letterSpacing: ".02em", background: C.warn, color: C.onBrandAlt,
        }}>
          ⚠ Modo dev: mostrando MENU local — Supabase no respondió. Revisa la consola.
        </div>
      )}
      <div className="qc-scroll" style={{ display: "flex", gap: 7, padding: "0 20px 14px", overflowX: "auto" }}>
        {CATS.map((c) => <Chip key={c} active={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      <div style={{ padding: "0 20px" }}>
        {imgCategoria && (
          <ResponsiveImg key={cat} id={imgCategoria} alt={cat} className="rise" style={{
            width: "100%", height: 120, borderRadius: 14, marginBottom: 12,
          }} />
        )}
        {items.map((m, i) => {
          const n = carrito.filter((x) => x.id === m.id).length;
          const open = abierto === m.id;
          const agotado = m.disponible === false;
          return (
            <div key={m.id} className="rise quadro-frame" style={{
              animationDelay: `${i * 45}ms`, background: C.card, border: `1px solid ${n ? C.brand : C.line}`,
              borderRadius: 16, borderBottomRightRadius: 0, padding: 14, marginBottom: 10, transition: "border-color .25s",
              opacity: agotado ? .55 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="disp" style={{ fontSize: 15 }}>{m.nombre}</span>
                    {agotado ? (
                      <span className="mono" style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: C.warn, color: C.onBrandAlt, fontWeight: 600 }}>Agotado hoy</span>
                    ) : m.tag && (
                      <span className="mono" style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: C.brandAlt, color: C.onBrandAlt, fontWeight: 600 }}>{m.tag}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: C.textMuted, margin: "5px 0 0", lineHeight: 1.45 }}>{m.desc}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{money(m.precio)}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                {agotado ? <span /> : m.finca ? (
                  <button onClick={() => setAbierto(open ? null : m.id)} className="press mono" style={{
                    fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.brand,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}>
                    {open ? "Ocultar opciones" : "Elegir finca y taza"}
                  </button>
                ) : <span />}
                {agotado ? (
                  <span className="mono" style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: C.textMuted }}>Vuelve mañana</span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {n > 0 && (
                      <>
                        <button onClick={() => quitar(m.id)} className="press" aria-label="Quitar uno" style={btnMiniStyle(C)}><Minus size={14} /></button>
                        <span className="mono" style={{ width: 16, textAlign: "center", fontSize: 13 }}>{n}</span>
                      </>
                    )}
                    <button onClick={() => add(m)} className="press" aria-label={`Agregar ${m.nombre}`} style={{ ...btnMiniStyle(C), background: C.brand, color: C.onBrand, borderColor: C.brand }}>
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>

              {open && !agotado && (
                <div className="pop" style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Finca</div>
                  <div className="qc-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }}>
                    {FINCAS.map((f) => <Chip key={f.id} active={f.id === lote.id} onClick={() => setLote(f)} tone={C.brandAlt} onTone={C.onBrandAlt}>{f.finca}</Chip>)}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".14em", textTransform: "uppercase", margin: "14px 0 8px" }}>Taza</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {TAZAS.map((t) => (
                      <button key={t.id} onClick={() => setTaza(t)} className="press" aria-label={`Taza ${t.nombre}`} style={{
                        width: 30, height: 30, borderRadius: 8, background: t.hex, cursor: "pointer",
                        border: `2px solid ${taza.id === t.id ? C.brand : "transparent"}`,
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: C.textMuted, marginTop: 10, lineHeight: 1.45 }}>
                    <strong style={{ color: C.text }}>{taza.nombre}:</strong> {taza.efecto}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ FINCAS + AVATAR ============================ */

function FichaLote({ lote, compact, titulo }) {
  const { C } = useTheme();
  const dulzor = Math.round(lote.score - 12);
  const acidez = Math.round(lote.altura / 26);
  const cuerpo = lote.proceso.includes("Honey") ? 80 : 58;
  return (
    <div className="quadro-frame" style={{
      flex: compact ? 1 : "initial", minWidth: 0, background: C.card, border: `1px solid ${C.line}`,
      borderRadius: compact ? 14 : 18, borderBottomRightRadius: 0, padding: compact ? 12 : 16,
    }}>
      {titulo && (
        <div className="disp" style={{ fontSize: 14, lineHeight: 1.15, marginBottom: 8 }}>{titulo}</div>
      )}
      <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase", marginBottom: compact ? 8 : 12 }}>Ficha del lote</div>
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: compact ? 8 : 14 }}>
        {[
          ["Altura", `${lote.altura} msnm`], ["Varietal", lote.varietal],
          ["Proceso", lote.proceso], ["Puntaje", `${lote.score} SCA`],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="mono" style={{ fontSize: 9.5, color: C.textMuted, letterSpacing: ".12em", textTransform: "uppercase" }}>{k}</div>
            <div className="disp" style={{ fontSize: compact ? 13 : 16, lineHeight: 1.15, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: compact ? 12 : 16 }}>
        <Meter label="Dulzor" value={dulzor} tone={C.brandAlt} />
        <Meter label="Acidez" value={acidez} />
        <Meter label="Cuerpo" value={cuerpo} tone={C.purple} />
      </div>
    </div>
  );
}

function Fincas({ lote, setLote, onBack }) {
  const { C, tema } = useTheme();
  const [linea, setLinea] = useState(0);
  const [reproduciendo, setRepro] = useState(false);
  const [transcripcion, setTrans] = useState(false);
  const [comparar, setComparar] = useState(false);
  const [comparados, setComparados] = useState([FINCAS[0].id, FINCAS[1].id]);
  const timer = useRef(null);

  useEffect(() => { setLinea(0); setRepro(false); }, [lote.id]);

  useEffect(() => {
    if (!reproduciendo) { clearTimeout(timer.current); return; }
    if (linea >= lote.guion.length - 1) { setRepro(false); return; }
    timer.current = setTimeout(() => setLinea((l) => l + 1), 3400);
    return () => clearTimeout(timer.current);
  }, [reproduciendo, linea, lote]);

  const tint = FINCA_TINTS[tema][FINCAS.findIndex((f) => f.id === lote.id)] || C.brand;

  const toggleComparado = (id) => {
    setComparados((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= 2) return [sel[1], id];
      return [...sel, id];
    });
  };

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Origen" titulo="Fincas" onBack={onBack}
        right={<Chip active={comparar} onClick={() => setComparar((v) => !v)} tone={C.purple} onTone={C.surface}>Comparar</Chip>} />

      {!comparar ? (
        <div className="qc-scroll" style={{ display: "flex", gap: 7, padding: "0 20px 16px", overflowX: "auto" }}>
          {FINCAS.map((f) => <Chip key={f.id} active={f.id === lote.id} onClick={() => setLote(f)} tone={C.brandAlt} onTone={C.onBrandAlt}>{f.finca}</Chip>)}
        </div>
      ) : (
        <div style={{ padding: "0 20px 16px" }}>
          <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
            Elige 2 fincas para comparar
          </div>
          <div className="qc-scroll" style={{ display: "flex", gap: 7, overflowX: "auto" }}>
            {FINCAS.map((f) => <Chip key={f.id} active={comparados.includes(f.id)} onClick={() => toggleComparado(f.id)} tone={C.purple} onTone={C.surface}>{f.finca}</Chip>)}
          </div>
        </div>
      )}

      {!comparar && (
        <div className="pop quadro-frame" key={lote.id} style={{
          margin: "0 20px", borderRadius: 22, borderBottomRightRadius: 0, overflow: "hidden",
          border: `1px solid ${C.line}`, background: `linear-gradient(165deg, ${tint}55, ${C.card} 55%)`,
        }}>
          <div style={{ position: "relative", height: 216, display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 320 160" style={{ position: "absolute", bottom: 0, width: "100%", opacity: .35 }}>
              <path d="M0 160 L60 78 L104 122 L156 44 L212 118 L262 70 L320 160 Z" fill={C.surface} />
            </svg>
            <div style={{ position: "relative", textAlign: "center" }}>
              <div className={reproduciendo ? "pulse" : ""} style={{
                width: 92, height: 92, borderRadius: "50%", margin: "0 auto",
                display: "grid", placeItems: "center", background: C.surface,
                border: `2px solid ${reproduciendo ? C.brand : C.brandAlt}`,
              }}>
                <span className="disp" style={{ fontSize: 34, color: reproduciendo ? C.brand : C.brandAlt }}>{lote.avatar.inicial}</span>
              </div>
              {reproduciendo && [0, .5, 1].map((d) => (
                <span key={d} className="steam" style={{
                  position: "absolute", left: `${42 + d * 8}%`, top: -6, width: 3, height: 16,
                  borderRadius: 99, background: C.brand, animationDelay: `${d}s`,
                }} />
              ))}
              <div className="disp" style={{ fontSize: 16, marginTop: 12 }}>{lote.avatar.nombre}</div>
              <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".12em", textTransform: "uppercase" }}>{lote.avatar.rol}</div>
            </div>
          </div>

          <div style={{ background: C.surface, padding: "14px 16px", minHeight: 86 }}>
            <p key={linea} className="slide" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
              {lote.guion[linea]}
            </p>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {lote.guion.map((_, i) => (
                <span key={i} style={{
                  flex: 1, height: 2, borderRadius: 99,
                  background: i <= linea ? C.brand : C.line, transition: "background .3s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <button onClick={() => { if (linea >= lote.guion.length - 1) setLinea(0); setRepro(!reproduciendo); }} className="press"
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 99, border: "none", background: C.brand, color: C.onBrand, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                {reproduciendo ? <Pause size={14} /> : <Play size={14} />}
                {reproduciendo ? "Pausar" : linea === 0 ? "Reproducir inducción" : "Continuar"}
              </button>
              <button onClick={() => setTrans(!transcripcion)} className="press mono" style={{
                fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", background: "none",
                border: `1px solid ${C.line}`, color: C.textMuted, padding: "8px 12px", borderRadius: 99, cursor: "pointer",
              }}>
                Transcripción
              </button>
            </div>
            {transcripcion && (
              <div className="pop" style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                {lote.guion.map((g, i) => (
                  <p key={i} onClick={() => setLinea(i)} style={{
                    fontSize: 12.5, lineHeight: 1.5, margin: "0 0 7px", cursor: "pointer",
                    color: i === linea ? C.text : C.textMuted,
                  }}>{g}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!comparar ? (
        <div style={{ margin: "16px 20px 0" }}>
          <FichaLote lote={lote} />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, margin: "16px 20px 0", alignItems: "stretch" }}>
          {[0, 1].map((slot) => {
            const id = comparados[slot];
            const f = id && FINCAS.find((x) => x.id === id);
            return f ? (
              <FichaLote key={id} lote={f} compact titulo={f.finca} />
            ) : (
              <div key={`vacio-${slot}`} style={{
                flex: 1, minWidth: 0, border: `1px dashed ${C.line}`, borderRadius: 14,
                display: "grid", placeItems: "center", padding: 18, color: C.textMuted,
                fontSize: 11.5, textAlign: "center", lineHeight: 1.4,
              }}>Elige otra finca arriba</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ LABORATORIO ============================ */

function Slider({ label, value, min, max, step, onChange, suf }) {
  const { C } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: ".1em", color: C.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
        <span>{label}</span><span style={{ color: C.text }}>{value}{suf}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: C.brand }} />
    </div>
  );
}

function Laboratorio({ onBack }) {
  const { C } = useTheme();
  const [geo, setGeo] = useState(GEOMETRIAS[0]);
  const [vueltas, setVueltas] = useState(GEOMETRIAS[0].vueltas);
  const [radio, setRadio] = useState(GEOMETRIAS[0].radio);
  const [temp, setTemp] = useState(93);
  const [molienda, setMolienda] = useState(22);
  const [corriendo, setCorriendo] = useState(false);
  const [prog, setProg] = useState(1);

  useEffect(() => { setVueltas(geo.vueltas); setRadio(geo.radio); }, [geo]);

  useEffect(() => {
    if (!corriendo) return;
    let raf, t0 = performance.now();
    const loop = (t) => {
      const p = Math.min(1, (t - t0) / 4200);
      setProg(p);
      if (p < 1) raf = requestAnimationFrame(loop); else setCorriendo(false);
    };
    setProg(0);
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [corriendo]);

  const perfil = useMemo(() => {
    const extraccion = Math.round(Math.min(98, 30 + vueltas * 7 + radio * 22 + (temp - 88) * 2.2 + (30 - molienda) * .8));
    const cuerpo = Math.round(Math.max(12, 100 - radio * 46 - vueltas * 5 + (30 - molienda) * 1.1));
    const acidez = Math.round(Math.min(96, 26 + radio * 40 + vueltas * 5 + (temp - 90) * 1.6));
    const dulzor = Math.round(Math.max(20, 96 - Math.abs(extraccion - 78) * 1.5));
    return { extraccion, cuerpo, acidez, dulzor };
  }, [vueltas, radio, temp, molienda]);

  const veredicto = perfil.extraccion > 88 ? "Sobreextraído. Amargo seco al final."
    : perfil.extraccion < 62 ? "Subextraído. Ácido punzante y hueco."
    : "Rango dulce. Aquí es donde se vende la taza.";

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Geometría de extracción" titulo="Laboratorio" onBack={onBack} />
      <p style={{ padding: "0 20px", fontSize: 13.5, color: C.textMuted, lineHeight: 1.5, margin: "0 0 16px" }}>
        Mueve la ruta del agua y mira cómo se desplaza el perfil. Lo mismo que hace la máquina, en tu mano.
      </p>

      {/* Un solo elemento 3D real (espiral.glb + tubo procedural que
         responde a vueltas/radio/prog) — antes eran dos cosas separadas
         (un <model-viewer> decorativo arriba, un SVG plano abajo con el
         propio simulador); se fusionaron para eliminar la duplicación. */}
      <div style={{ margin: "0 20px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "grid", placeItems: "center" }}>
          <Suspense fallback={<div style={{ width: 230, height: 230 }} />}>
            <EspiralTubo3D vueltas={vueltas} radio={radio} prog={prog} tam={230}
              colorLinea={C.line} colorBrand={C.brand} colorAcento={C.brandAlt} />
          </Suspense>
        </div>

        <button onClick={() => setCorriendo(true)} className="press" style={{
          width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, border: `1px solid ${C.brand}`,
          background: corriendo ? C.brand : "transparent", color: corriendo ? C.onBrand : C.brand,
          cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}>
          {corriendo ? "Vertiendo…" : "Simular vertido"}
        </button>

        <div style={{ marginTop: 18 }}>
          <Slider label="Vueltas de espiral" value={vueltas} min={.4} max={8} step={.2} onChange={setVueltas} suf="v" />
          <Slider label="Radio de cobertura" value={radio} min={.2} max={1} step={.05} onChange={setRadio} suf="" />
          <Slider label="Temperatura" value={temp} min={82} max={98} step={1} onChange={setTemp} suf=" °C" />
          <Slider label="Molienda (clics C40)" value={molienda} min={12} max={30} step={1} onChange={setMolienda} suf=" clics" />
        </div>
      </div>

      <div style={{ margin: "14px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 12 }}>Perfil resultante</div>
        <Meter label="Extracción" value={perfil.extraccion} />
        <Meter label="Cuerpo" value={perfil.cuerpo} tone={C.brandAlt} />
        <Meter label="Acidez" value={perfil.acidez} tone={C.purple} />
        <Meter label="Dulzor" value={perfil.dulzor} tone={C.amarillo} />
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: "12px 0 0", color: perfil.extraccion > 88 || perfil.extraccion < 62 ? C.warn : C.brand }}>
          {veredicto}
        </p>
      </div>

      <div className="qc-scroll" style={{ display: "flex", gap: 7, padding: "14px 20px 0", overflowX: "auto" }}>
        {GEOMETRIAS.map((g) => <Chip key={g.id} active={g.id === geo.id} onClick={() => setGeo(g)}>{g.nombre}</Chip>)}
      </div>

      <div style={{ margin: "16px 20px 0" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>Equipo en barra</div>
        {EQUIPO.map((e, i) => (
          <div key={e.nombre} className="rise" style={{
            animationDelay: `${i * 50}ms`, background: C.card, border: `1px solid ${C.line}`,
            borderRadius: 14, padding: 13, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="disp" style={{ fontSize: 14 }}>{e.nombre}</span>
              <span className="mono" style={{ fontSize: 10, color: C.brand }}>{e.clicks}</span>
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>{e.detalle} · {e.uso}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ ACADEMIA + TAZAS ============================ */

function Academia({ taza, setTaza, onBack }) {
  const { C } = useTheme();

  const [estado, setEstado] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qc-academia"));
      return saved && typeof saved === "object" ? saved : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("qc-academia", JSON.stringify(estado)); } catch { /* noop */ }
  }, [estado]);

  const [abierta, setAbierta] = useState(null);

  const hechos = ACADEMIA.filter((a) => estado[a.id]?.done).map((a) => a.id);
  const pct = Math.round((hechos.length / ACADEMIA.length) * 100);
  const insigniaLista = hechos.length === ACADEMIA.length;

  const responder = (leccionId, qIdx, opIdx) => {
    setEstado((prev) => {
      const leccion = ACADEMIA.find((a) => a.id === leccionId);
      const actual = prev[leccionId] || { respuestas: [] };
      if (actual.done) return prev;
      const respuestas = [...actual.respuestas];
      respuestas[qIdx] = opIdx;
      const done = respuestas.length === leccion.quiz.length && respuestas.every((r) => r !== undefined && r !== null);
      return { ...prev, [leccionId]: { respuestas, done } };
    });
  };

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Formación de barra" titulo="Academia" onBack={onBack} />

      <div style={{ margin: "0 20px 18px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase" }}>Tu avance</span>
          <span className="disp" style={{ fontSize: 24, color: C.brand }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: C.line, borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.brand, borderRadius: 99, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
        </div>
      </div>

      {insigniaLista && (
        <div className="pop" style={{
          margin: "0 20px 18px", background: C.brand, color: C.onBrand, borderRadius: 18,
          padding: 15, display: "flex", gap: 12, alignItems: "center",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "grid", placeItems: "center",
            background: `${C.onBrand}22`,
          }}>
            <Award size={20} />
          </div>
          <div>
            <div className="disp" style={{ fontSize: 16, lineHeight: 1.1 }}>Insignia desbloqueada</div>
            <div className="mono" style={{ fontSize: 10, opacity: .85, marginTop: 4, lineHeight: 1.5 }}>
              Logro dentro de la app · completaste las 4 lecciones de Academia
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        {ACADEMIA.map((a, i) => {
          const info = estado[a.id] || { respuestas: [] };
          const done = !!info.done;
          const abierto = abierta === a.id;
          const aciertos = info.respuestas.filter((r, qi) => r === a.quiz[qi]?.correcta).length;
          return (
            <div key={a.id} className="rise" style={{ animationDelay: `${i * 55}ms`, marginBottom: 10 }}>
              <button onClick={() => setAbierta(abierto ? null : a.id)} className="press tapfx" style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: C.card, border: `1px solid ${done ? C.brand : C.line}`,
                borderRadius: abierto ? "16px 16px 0 0" : 16, padding: 15, color: C.text,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="disp" style={{ fontSize: 15 }}>{a.titulo}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                    border: `1px solid ${done ? C.brand : C.line}`, background: done ? C.brand : "transparent", color: C.onBrand,
                  }}>{done && <Check size={13} />}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 5 }}>
                  {a.min} min de lectura{done ? ` · ${aciertos}/${a.quiz.length} correctas` : ""}
                </div>
                <ul style={{ margin: "10px 0 0", padding: "0 0 0 16px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.6 }}>
                  {a.puntos.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </button>

              {abierto && (
                <div className="slide" style={{
                  background: C.card, border: `1px solid ${done ? C.brand : C.line}`, borderTop: "none",
                  borderRadius: "0 0 16px 16px", padding: 15,
                }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 12 }}>
                    Comprueba lo que leíste
                  </div>
                  {a.quiz.map((qz, qi) => {
                    const resp = info.respuestas[qi];
                    const respondido = resp !== undefined && resp !== null;
                    return (
                      <div key={qi} style={{ marginBottom: qi === a.quiz.length - 1 ? 0 : 16 }}>
                        <div style={{ fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>{qz.q}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {qz.opciones.map((op, oi) => {
                            const elegido = resp === oi;
                            const esCorrecta = oi === qz.correcta;
                            let borde = C.line, color2 = C.textMuted;
                            if (respondido && (elegido || esCorrecta)) {
                              const tono = esCorrecta ? C.brand : C.warn;
                              borde = tono; color2 = tono;
                            }
                            return (
                              <button key={oi} onClick={() => responder(a.id, qi, oi)} disabled={respondido}
                                className={respondido ? "" : "press"} style={{
                                  textAlign: "left", padding: "9px 11px", borderRadius: 10, fontSize: 12.5,
                                  border: `1px solid ${borde}`, background: "transparent", color: color2,
                                  cursor: respondido ? "default" : "pointer",
                                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                                }}>
                                <span>{op}</span>
                                {respondido && elegido && (esCorrecta ? <Check size={13} /> : <X size={13} />)}
                              </button>
                            );
                          })}
                        </div>
                        {respondido && (
                          <div className="mono" style={{ fontSize: 10.5, marginTop: 6, color: resp === qz.correcta ? C.brand : C.warn }}>
                            {resp === qz.correcta ? "Correcto." : `Incorrecto — la respuesta era: ${qz.opciones[qz.correcta]}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ margin: "20px 20px 0" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 6 }}>Estudio de color</div>
        <h2 className="disp" style={{ fontSize: 20, margin: "0 0 6px" }}>La taza también sabe</h2>
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5, margin: "0 0 14px" }}>
          El color del recipiente desplaza el dulzor percibido antes del primer sorbo. Toca una taza y compara.
        </p>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 16 }}>
            <div key={taza.id} className="pop" style={{ position: "relative" }}>
              <div style={{
                width: 94, height: 78, borderRadius: "10px 10px 40px 40px",
                background: taza.hex, border: `2px solid ${C.line}`,
              }} />
              <div style={{
                position: "absolute", top: 8, left: 10, right: 10, height: 16,
                borderRadius: 99, background: "#2B1A10",
              }} />
              {[0, .6, 1.2].map((d) => (
                <span key={d} className="steam" style={{
                  position: "absolute", left: `${34 + d * 14}%`, top: -14, width: 3, height: 16,
                  borderRadius: 99, background: C.textMuted, animationDelay: `${d}s`,
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
            {TAZAS.map((t) => (
              <button key={t.id} onClick={() => setTaza(t)} className="press" aria-label={`Taza ${t.nombre}`} style={{
                width: 34, height: 34, borderRadius: 10, background: t.hex, cursor: "pointer",
                border: `2px solid ${taza.id === t.id ? C.brand : "transparent"}`,
              }} />
            ))}
          </div>

          <div className="slide" key={taza.id + "d"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="disp" style={{ fontSize: 17 }}>{taza.nombre}</span>
              <span className="mono" style={{ fontSize: 13, color: taza.pct >= 0 ? C.brand : C.warn }}>
                {taza.pct >= 0 ? "+" : ""}{taza.pct}% dulzor percibido
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5, margin: "8px 0 0" }}>{taza.efecto}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ ESTUDIO MULTIMEDIA ============================ */

function EstudioLightbox({ medio, total, index, cerrar, mover }) {
  const { C } = useTheme();
  return (
    <div onClick={cerrar} style={{ position: "absolute", inset: 0, background: "rgba(5,8,7,.92)", zIndex: 45, display: "flex", flexDirection: "column" }}>
      <div onClick={(e) => e.stopPropagation()} className="pop" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
          <span className="mono" style={{
            fontSize: 10, color: C.textMuted, letterSpacing: ".1em", background: C.card,
            border: `1px solid ${C.line}`, borderRadius: 99, padding: "5px 10px",
          }}>{index + 1} / {total}</span>
          <button onClick={cerrar} className="press" aria-label="Cerrar" style={{ ...btnMiniStyle(C), background: C.card }}><X size={15} /></button>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px", position: "relative", minHeight: 0 }}>
          {total > 1 && (
            <button onClick={() => mover(-1)} className="press" aria-label="Foto anterior" style={{
              ...btnMiniStyle(C), position: "absolute", left: 6, borderRadius: "50%", width: 34, height: 34, background: C.card,
            }}><ChevronLeft size={17} /></button>
          )}
          <img key={medio.id} src={medio.url} alt={medio.nombre} className="pop" style={{
            maxWidth: "100%", maxHeight: "100%", borderRadius: 14, objectFit: "contain", border: `1px solid ${C.line}`,
          }} />
          {total > 1 && (
            <button onClick={() => mover(1)} className="press" aria-label="Foto siguiente" style={{
              ...btnMiniStyle(C), position: "absolute", right: 6, borderRadius: "50%", width: 34, height: 34, background: C.card,
            }}><ChevronRight size={17} /></button>
          )}
        </div>
        <div style={{ margin: "0 16px 20px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
          <div className="disp" style={{ fontSize: 15, color: C.text }}>{medio.nombre}</div>
          <div className="mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 4, letterSpacing: ".1em", textTransform: "uppercase" }}>{medio.destino}</div>
        </div>
      </div>
    </div>
  );
}

function Estudio({ medios, setMedios, onBack }) {
  const { C } = useTheme();
  const input = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [seleccionando, setSeleccionando] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const cargar = (files) => {
    const nuevos = Array.from(files).slice(0, 30).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      nombre: f.name, url: URL.createObjectURL(f), destino: "Galería del local",
    }));
    setMedios((m) => [...nuevos, ...m]);
  };

  const toggleSeleccionando = () => {
    setSeleccionando((v) => !v);
    setSeleccionados([]);
  };
  const toggleSeleccionado = (id) => {
    setSeleccionados((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  };
  const bulkReasignar = (destino) => {
    setMedios((arr) => arr.map((x) => seleccionados.includes(x.id) ? { ...x, destino } : x));
  };
  const bulkEliminar = () => {
    setMedios((arr) => arr.filter((x) => !seleccionados.includes(x.id)));
    setSeleccionados([]);
  };

  return (
    <>
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Producción" titulo="Estudio" onBack={onBack}
        right={medios.length > 0 ? (
          <Chip active={seleccionando} onClick={toggleSeleccionando}>{seleccionando ? "Cancelar" : "Seleccionar"}</Chip>
        ) : null} />
      <p style={{ padding: "0 20px", fontSize: 13.5, color: C.textMuted, lineHeight: 1.5, margin: "0 0 16px" }}>
        Fotos y videos reales del local. Sube más y asigna cada archivo a su lugar en la app.
      </p>

      {!seleccionando && (
        <div style={{ padding: "0 20px" }}>
          <button onClick={() => input.current?.click()} className="press tapfx" style={{
            width: "100%", padding: "26px 16px", borderRadius: 18, cursor: "pointer",
            border: `1px dashed ${C.brandAlt}`, background: C.card, color: C.text,
          }}>
            <Upload size={20} color={C.brandAlt} />
            <div className="disp" style={{ fontSize: 15, marginTop: 10 }}>Subir multimedia</div>
            <div className="mono" style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Fotos de granos, máquinas, menús y paleta</div>
          </button>
          <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => cargar(e.target.files)} />
        </div>
      )}

      {seleccionando && (
        <div className="pop" style={{
          margin: "0 20px 16px", display: "flex", gap: 8, alignItems: "center",
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 10,
        }}>
          <span className="mono" style={{ fontSize: 10.5, color: C.textMuted, flexShrink: 0 }}>
            {seleccionados.length} seleccionada{seleccionados.length === 1 ? "" : "s"}
          </span>
          <select value="" aria-label="Reasignar destino de las seleccionadas" disabled={seleccionados.length === 0}
            onChange={(e) => { if (e.target.value) bulkReasignar(e.target.value); }}
            className="mono" style={{
              flex: 1, fontSize: 10, background: C.surface, color: C.text,
              border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 7px",
              opacity: seleccionados.length === 0 ? .5 : 1,
            }}>
            <option value="">Reasignar a…</option>
            {DESTINOS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={bulkEliminar} disabled={seleccionados.length === 0} className="press" aria-label="Eliminar seleccionadas" style={{
            ...btnMiniStyle(C), color: C.warn, borderColor: C.warn, opacity: seleccionados.length === 0 ? .5 : 1,
          }}>
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {medios.length === 0 ? (
        <div style={{ margin: "18px 20px 0", padding: 20, border: `1px solid ${C.line}`, borderRadius: 16, textAlign: "center" }}>
          <ImageIcon size={18} color={C.textMuted} />
          <p style={{ fontSize: 13, color: C.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>
            Todavía no hay archivos. Sube el primero y elige dónde vive dentro de la app.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "18px 20px 0" }}>
          {medios.map((m, i) => {
            const marcado = seleccionados.includes(m.id);
            return (
              <div key={m.id} className="pop" style={{
                animationDelay: `${i * 40}ms`, borderRadius: 14, overflow: "hidden",
                border: `1px solid ${marcado ? C.brand : C.line}`, background: C.card,
              }}>
                <button
                  onClick={() => seleccionando ? toggleSeleccionado(m.id) : setLightboxIndex(i)}
                  className="press" aria-label={seleccionando ? `Seleccionar ${m.nombre}` : `Ver ${m.nombre} en grande`}
                  style={{
                    position: "relative", display: "block", width: "100%", height: 108, padding: 0,
                    background: C.surface, border: "none", cursor: "pointer", overflow: "hidden",
                  }}>
                  <img src={m.url} alt={m.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  {seleccionando && (
                    <span style={{
                      position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 7,
                      display: "grid", placeItems: "center",
                      background: marcado ? C.brand : "rgba(5,8,7,.5)",
                      border: `1px solid ${marcado ? C.brand : C.card}`, color: C.onBrand,
                    }}>{marcado && <Check size={13} />}</span>
                  )}
                </button>
                {seleccionando ? (
                  <div className="mono" style={{ padding: "8px 10px", fontSize: 10, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.destino}
                  </div>
                ) : (
                  <div style={{ padding: 10 }}>
                    <select value={m.destino} aria-label="Destino del archivo"
                      onChange={(e) => setMedios((arr) => arr.map((x) => x.id === m.id ? { ...x, destino: e.target.value } : x))}
                      className="mono" style={{
                        width: "100%", fontSize: 10, background: C.surface, color: C.text,
                        border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 7px",
                      }}>
                      {DESTINOS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <button onClick={() => setMedios((arr) => arr.filter((x) => x.id !== m.id))} className="press mono" style={{
                      marginTop: 7, display: "flex", alignItems: "center", gap: 5, fontSize: 10,
                      background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 0,
                    }}>
                      <Trash2 size={11} /> Quitar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ margin: "20px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 10 }}>Siguiente entrega</div>
        {[
          "Video de la máquina extrayendo, para reemplazar la espiral animada",
          "Avatar grabado por finca, con el guion que ya está en la app",
          "Paleta de color final y menú impreso para ajustar precios",
        ].map((s, i) => (
          <div key={s} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
            <span className="mono" style={{ fontSize: 10, color: C.brandAlt, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.45 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
    {lightboxIndex !== null && medios[lightboxIndex] && (
      <EstudioLightbox
        medio={medios[lightboxIndex]}
        total={medios.length}
        index={lightboxIndex}
        cerrar={() => setLightboxIndex(null)}
        mover={(d) => setLightboxIndex((i) => (i + d + medios.length) % medios.length)}
      />
    )}
    </>
  );
}

/* ============================ QUADRO CLUB ============================ */

function Club({ email, setEmail, onBack, onAdmin }) {
  const { C } = useTheme();
  const [enviado, setEnviado] = useState(!!email);
  const [valor, setValor] = useState(email || "");
  const puntos = enviado ? 40 : 0;
  const nivel = [...CLUB_NIVELES].reverse().find((n) => puntos >= n.desde) || CLUB_NIVELES[0];

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Fidelidad" titulo="Quadro Club" onBack={onBack} right={
        <button onClick={onAdmin} className="press" aria-label="Panel del dueño" style={{ ...btnMiniStyle(C), marginBottom: 3 }}>
          <Settings size={15} />
        </button>
      } />

      <div style={{
        margin: "0 20px", color: C.onBrand, borderRadius: 20, padding: "20px 18px", position: "relative", overflow: "hidden",
        backgroundImage: `linear-gradient(180deg, ${C.brand}CC, ${C.brand}), url(${clubBox})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <Award size={22} />
        <div className="disp" style={{ fontSize: 21, marginTop: 8 }}>Quadro Club</div>
        <div style={{ fontSize: 12.5, opacity: .85, marginTop: 2 }}>Tu fidelidad, en puntos y beneficios reales</div>
      </div>

      {!enviado ? (
        <div className="rise" style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
          <Lock size={18} color={C.brand} />
          <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>Desbloquea tu ficha de cata</div>
          <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
            Déjanos tu correo y te enviamos tu Guía de Cata Quadro — además te suma tu primer punto en el Club.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
              <Mail size={15} color={C.textMuted} />
              <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="tucorreo@email.com"
                style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
            </div>
          </div>
          <button onClick={() => { if (valor.includes("@")) { setEmail(valor); setEnviado(true); } }} className="press" style={{
            marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
            background: C.brand, color: C.onBrand, fontSize: 13.5, fontWeight: 700,
          }}>Quiero mi guía</button>
        </div>
      ) : (
        <>
          <div className="pop" style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: C.textMuted, textTransform: "uppercase" }}>Nivel actual</div>
                <div className="disp" style={{ fontSize: 18 }}>{nivel.nombre}</div>
              </div>
              <div className="disp" style={{ fontSize: 26, color: C.brand }}>{puntos}<span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}> pts</span></div>
            </div>
            <p style={{ fontSize: 12.5, marginTop: 8, color: C.text }}>{nivel.beneficio}</p>
          </div>
          <div style={{ margin: "14px 20px 0" }}>
            {CLUB_NIVELES.map((n) => (
              <div key={n.nombre} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                  background: puntos >= n.desde ? C.brand : C.line, color: puntos >= n.desde ? C.onBrand : C.textMuted,
                }}>{puntos >= n.desde && <Check size={13} />}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{n.nombre} <span className="mono" style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>· {n.desde}+ pts</span></div>
                  <div style={{ fontSize: 11.5, color: C.textMuted }}>{n.beneficio}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ ADMIN ============================ */

function AdminLogin({ onLogged }) {
  const { C } = useTheme();
  const [modo, setModo] = useState("login"); // "login" | "recuperar" | "enviado"
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError(""); setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
    setCargando(false);
    if (err) setError("Correo o clave incorrectos.");
    else onLogged();
  };

  const enviarRecuperacion = async (e) => {
    e.preventDefault();
    setError(""); setCargando(true);
    await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}${window.location.pathname}?admin=1`,
    });
    setCargando(false);
    setModo("enviado"); // Supabase nunca confirma si el correo existe — el mensaje es siempre el mismo.
  };

  if (modo === "enviado") {
    return (
      <div style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
        <Mail size={18} color={C.brand} />
        <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>Revisa tu correo</div>
        <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
          Si <strong style={{ color: C.text }}>{correo}</strong> tiene una cuenta, te enviamos un enlace para elegir una clave nueva.
        </p>
        <button onClick={() => setModo("login")} className="press mono" style={{
          marginTop: 12, fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.brand,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>Volver a entrar</button>
      </div>
    );
  }

  const recuperando = modo === "recuperar";

  return (
    <form onSubmit={recuperando ? enviarRecuperacion : entrar} style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <Lock size={18} color={C.brand} />
      <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>{recuperando ? "Recuperar clave" : "Entrar como dueño"}</div>
      <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
        {recuperando ? "Te mandamos un enlace a tu correo para elegir una clave nueva." : "Acceso privado para editar la carta. Pide tu usuario si no lo tienes."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
          <Mail size={15} color={C.textMuted} />
          <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="dueño@quadrocafe.com"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
        </div>
        {!recuperando && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
            <Lock size={15} color={C.textMuted} />
            <input type="password" required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave"
              style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={cargando} className="press" style={{
        marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontSize: 13.5, fontWeight: 700, opacity: cargando ? .6 : 1,
      }}>{cargando ? "Enviando…" : recuperando ? "Enviar enlace" : "Entrar"}</button>
      <button type="button" onClick={() => { setModo(recuperando ? "login" : "recuperar"); setError(""); }} className="press mono" style={{
        marginTop: 10, width: "100%", textAlign: "center", fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase",
        color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 4,
      }}>{recuperando ? "Volver a entrar" : "¿Olvidaste tu clave?"}</button>
    </form>
  );
}

function AdminNuevaClave({ onListo }) {
  const { C } = useTheme();
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (clave.length < 6) { setError("La clave debe tener al menos 6 caracteres."); return; }
    if (clave !== clave2) { setError("Las claves no coinciden."); return; }
    setGuardando(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password: clave });
    setGuardando(false);
    if (err) setError("No se pudo actualizar la clave. Pide un enlace nuevo e intenta de nuevo.");
    else onListo();
  };

  return (
    <form onSubmit={guardar} style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <Lock size={18} color={C.brand} />
      <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>Elige una clave nueva</div>
      <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
        Veniste desde el enlace de recuperación. Escribe tu clave nueva dos veces.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
          <Lock size={15} color={C.textMuted} />
          <input type="password" required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave nueva"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
          <Lock size={15} color={C.textMuted} />
          <input type="password" required value={clave2} onChange={(e) => setClave2(e.target.value)} placeholder="Repite la clave"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
        </div>
      </div>
      {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={guardando} className="press" style={{
        marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontSize: 13.5, fontWeight: 700, opacity: guardando ? .6 : 1,
      }}>{guardando ? "Guardando…" : "Guardar clave"}</button>
    </form>
  );
}

function AdminFila({ p, onCambio }) {
  const { C } = useTheme();
  const [precio, setPrecio] = useState(String(p.precio));
  const [guardando, setGuardando] = useState(false);

  const guardarPrecio = async () => {
    const n = parseFloat(precio.replace(",", "."));
    if (Number.isNaN(n) || n === p.precio) { setPrecio(String(p.precio)); return; }
    setGuardando(true);
    await onCambio({ precio: n });
    setGuardando(false);
  };

  const toggleDisponible = async () => {
    setGuardando(true);
    await onCambio({ disponible: !p.disponible });
    setGuardando(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 0",
      borderBottom: `1px solid ${C.line}`, opacity: p.disponible ? 1 : .5,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
        <div className="mono" style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>{p.cat}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 10, padding: "6px 8px" }}>
        <span className="mono" style={{ fontSize: 12, color: C.textMuted }}>$</span>
        <input value={precio} onChange={(e) => setPrecio(e.target.value)} onBlur={guardarPrecio}
          inputMode="decimal" style={{
            width: 44, border: "none", outline: "none", background: "transparent",
            fontSize: 13, fontWeight: 700, color: C.text,
          }} />
      </div>
      <button onClick={toggleDisponible} disabled={guardando} className="press" aria-label="Disponible hoy" style={{
        width: 40, height: 24, borderRadius: 99, border: "none", cursor: "pointer", flexShrink: 0,
        background: p.disponible ? C.brand : C.line, position: "relative", transition: "background .2s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: p.disponible ? 18 : 2, width: 20, height: 20, borderRadius: "50%",
          background: C.card, transition: "left .2s",
        }} />
      </button>
    </div>
  );
}

function AdminNuevoProducto({ siguienteOrden, onCreado }) {
  const { C } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const limpiar = () => {
    setNombre(""); setCat(CATS[0]); setPrecio(""); setDescripcion(""); setDisponible(true);
  };

  const crear = async (e) => {
    e.preventDefault();
    const n = parseFloat(precio.replace(",", "."));
    if (!nombre.trim() || Number.isNaN(n)) { setError("Nombre y precio son obligatorios."); return; }
    setGuardando(true); setError("");

    const base = slugify(nombre) || "producto";
    let id = base;
    let fila = null;
    for (let intento = 0; intento < 5 && !fila; intento++) {
      const { data, error: err } = await supabase.from("productos").insert({
        id, cat, nombre: nombre.trim(), precio: n, descripcion: descripcion.trim(),
        disponible, finca: false, orden: siguienteOrden,
      }).select().single();
      if (!err) { fila = data; break; }
      if (err.code === "23505") { id = `${base}-${intento + 2}`; continue; } // id duplicado, prueba con sufijo
      setError("No se pudo crear el producto. Intenta de nuevo.");
      setGuardando(false);
      return;
    }
    setGuardando(false);
    if (fila) { onCreado(fila); limpiar(); setAbierto(false); }
    else setError("No se pudo generar un id único para este nombre. Cámbialo e intenta de nuevo.");
  };

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="press mono" style={{
        margin: "0 20px 14px", width: "calc(100% - 40px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "11px", borderRadius: 12, border: `1px dashed ${C.line}`, background: "none", cursor: "pointer",
        color: C.brand, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
      }}><Plus size={14} /> Agregar producto</button>
    );
  }

  return (
    <form onSubmit={crear} style={{ margin: "0 20px 14px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="disp" style={{ fontSize: 15 }}>Producto nuevo</div>
        <button type="button" onClick={() => { setAbierto(false); setError(""); }} className="press" aria-label="Cerrar" style={btnMiniStyle(C)}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, background: "transparent", color: C.text }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, background: C.card, color: C.text }}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px" }}>
          <span className="mono" style={{ fontSize: 12, color: C.textMuted }}>$</span>
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" inputMode="decimal" required
            style={{ border: "none", outline: "none", flex: 1, fontSize: 13, background: "transparent", color: C.text }} />
        </div>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" rows={2}
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, background: "transparent", color: C.text, resize: "none", fontFamily: "inherit" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.text }}>
          <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
          Disponible desde ya
        </label>
      </div>
      {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={guardando} className="press" style={{
        marginTop: 12, width: "100%", padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontSize: 13, fontWeight: 700, opacity: guardando ? .6 : 1,
      }}>{guardando ? "Creando…" : "Crear producto"}</button>
    </form>
  );
}

function Admin({ onBack }) {
  const { C } = useTheme();
  const [sesion, setSesion] = useState(undefined); // undefined = cargando, null = sin sesión
  const [recuperando, setRecuperando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) { setSesion(null); return; }
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s);
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const cargarProductos = async () => {
    setCargando(true); setError("");
    const { data, error: err } = await supabase.from("productos").select("*").order("orden");
    setCargando(false);
    if (err) setError("No se pudo cargar la carta. Revisa la conexión con Supabase.");
    else setProductos(data || []);
  };

  useEffect(() => { if (sesion) cargarProductos(); }, [sesion]);

  const cambiarProducto = async (id, cambios) => {
    setProductos((ps) => ps.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    const { error: err } = await supabase.from("productos").update(cambios).eq("id", id);
    if (err) setError("No se pudo guardar el cambio. Intenta de nuevo.");
  };

  const agregarProducto = (fila) => setProductos((ps) => [...ps, fila]);
  const siguienteOrden = productos.reduce((m, p) => Math.max(m, p.orden || 0), 0) + 1;

  if (!supabase) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
        <p style={{ margin: "0 20px", fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
          Supabase no está configurado en este entorno (faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
        </p>
      </div>
    );
  }

  if (sesion === undefined) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
      </div>
    );
  }

  if (sesion && recuperando) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
        <AdminNuevaClave onListo={() => setRecuperando(false)} />
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
        <AdminLogin onLogged={cargarProductos} />
      </div>
    );
  }

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} right={
        <button onClick={() => supabase.auth.signOut()} className="press" aria-label="Salir" style={{ ...btnMiniStyle(C), marginBottom: 3 }}>
          <LogOut size={15} />
        </button>
      } />
      <p style={{ margin: "0 20px 8px", fontSize: 12, color: C.textMuted }}>
        Toca el precio para editarlo, usa el switch para marcar si hay hoy.
      </p>
      {error && <p style={{ margin: "0 20px 8px", fontSize: 12, color: C.warn }}>{error}</p>}
      <AdminNuevoProducto siguienteOrden={siguienteOrden} onCreado={agregarProducto} />
      <div style={{ margin: "0 20px" }}>
        {cargando && !productos.length ? (
          <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 0" }}>Cargando carta…</p>
        ) : (
          productos.map((p) => (
            <AdminFila key={p.id} p={p} onCambio={(cambios) => cambiarProducto(p.id, cambios)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================ CARRITO ============================ */

function Carrito({ carrito, cerrar, quitar, lote, taza, confirmar }) {
  const { C } = useTheme();
  const total = carrito.reduce((s, i) => s + i.precio, 0);
  const agrupado = carrito.reduce((acc, i) => {
    acc[i.id] = acc[i.id] ? { ...acc[i.id], n: acc[i.id].n + 1 } : { ...i, n: 1 };
    return acc;
  }, {});
  const filas = Object.values(agrupado);

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,7,.72)", zIndex: 40, display: "flex", alignItems: "flex-end" }} onClick={cerrar}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxHeight: "84%", overflowY: "auto", background: C.card,
        borderTop: `1px solid ${C.line}`, borderRadius: "24px 24px 0 0", padding: "18px 20px 26px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="disp" style={{ fontSize: 22, margin: 0 }}>Tu pedido</h2>
          <button onClick={cerrar} className="press" aria-label="Cerrar" style={btnMiniStyle(C)}><X size={15} /></button>
        </div>

        {filas.length === 0 ? (
          <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.5 }}>
            Aún no has agregado nada. Empieza por el filtrado del lote en barra.
          </p>
        ) : (
          <>
            {filas.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{f.n}× {f.nombre}</div>
                  {f.finca && <div className="mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{lote.finca} · taza {taza.nombre.toLowerCase()}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="mono" style={{ fontSize: 13 }}>{money(f.precio * f.n)}</span>
                  <button onClick={() => quitar(f.id)} className="press" aria-label="Quitar" style={btnMiniStyle(C)}><Minus size={13} /></button>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "18px 0 16px" }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase" }}>Total</span>
              <span className="disp" style={{ fontSize: 30 }}>{money(total)}</span>
            </div>

            <button onClick={confirmar} className="press" style={{
              width: "100%", padding: 15, borderRadius: 14, border: "none",
              background: C.brand, color: C.onBrand, fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
              Enviar a barra
            </button>
            <p className="mono" style={{ fontSize: 10, color: C.textMuted, textAlign: "center", marginTop: 10 }}>
              Pago en caja o transferencia al retirar
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Ticket({ n, cerrar }) {
  const { C } = useTheme();
  const [paso, setPaso] = useState(0);
  const pasos = ["Recibido en barra", "Moliendo", "Extrayendo", "Listo para retirar"];
  useEffect(() => {
    if (paso >= pasos.length - 1) return;
    const t = setTimeout(() => setPaso((p) => p + 1), 2200);
    return () => clearTimeout(t);
  }, [paso]);

  return (
    <div style={{ position: "absolute", inset: 0, background: C.surface, zIndex: 50, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="pop" style={{ textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 20 }}>
          <div className={paso < 3 ? "pulse" : ""} style={{
            width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center",
            border: `2px solid ${paso === 3 ? C.brand : C.brandAlt}`,
          }}>
            {paso === 3 ? <Check size={30} color={C.brand} /> : <Coffee size={28} color={C.brandAlt} />}
          </div>
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: C.brandAlt, textTransform: "uppercase" }}>Orden</div>
        <div className="disp" style={{ fontSize: 52, lineHeight: 1, margin: "6px 0 20px" }}>#{n}</div>

        <div style={{ textAlign: "left", maxWidth: 260, margin: "0 auto" }}>
          {pasos.map((p, i) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, opacity: i <= paso ? 1 : .35, transition: "opacity .4s" }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center",
                background: i <= paso ? C.brand : "transparent", border: `1px solid ${i <= paso ? C.brand : C.line}`, color: C.onBrand,
              }}>{i <= paso && <Check size={12} />}</span>
              <span style={{ fontSize: 14, fontWeight: i === paso ? 700 : 400 }}>{p}</span>
            </div>
          ))}
        </div>

        <button onClick={cerrar} className="press" style={{
          marginTop: 22, padding: "13px 26px", borderRadius: 99, cursor: "pointer",
          border: `1px solid ${C.line}`, background: "transparent", color: C.text, fontSize: 14,
        }}>
          Volver a la carta
        </button>
      </div>
    </div>
  );
}

/* ============================ APP ============================ */

export default function QuadroCafe() {
  const [tema, setTema] = useState(() => {
    try {
      const saved = localStorage.getItem("qc-tema");
      if (saved === "claro" || saved === "oscuro") return saved;
    } catch { /* localStorage no disponible */ }
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "oscuro" : "claro";
  });
  useEffect(() => { try { localStorage.setItem("qc-tema", tema); } catch { /* noop */ } }, [tema]);
  const C = PALETAS[tema];
  const css = useMemo(() => buildCss(C), [C]);

  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "inicio";
    const { hash, search } = window.location;
    // #admin: acceso directo. ?admin=1 y type=recovery: vuelta desde el enlace
    // de "olvidé mi clave" de Supabase (que agrega su propio access_token al hash).
    const esAdmin = hash === "#admin" || search.includes("admin=1") || hash.includes("type=recovery");
    return esAdmin ? "admin" : "inicio";
  });
  const [carrito, setCarrito] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qc-carrito")) || []; } catch { return []; }
  });
  const [verCarrito, setVerCarrito] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [lote, setLote] = useState(FINCAS[0]);
  const [taza, setTaza] = useState(TAZAS[1]);
  const [medios, setMedios] = useState(MEDIOS_INICIALES);
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem("qc-email") || ""; } catch { return ""; }
  });
  const [splash, setSplash] = useState(true);

  useEffect(() => { const t = setTimeout(() => setSplash(false), 1700); return () => clearTimeout(t); }, []);
  useEffect(() => { try { localStorage.setItem("qc-carrito", JSON.stringify(carrito)); } catch { /* noop */ } }, [carrito]);
  useEffect(() => { try { localStorage.setItem("qc-email", email); } catch { /* noop */ } }, [email]);

  // Botón/gesto de retroceso del dispositivo: navega entre tabs y cierra
  // el carrito o el ticket antes de salir de la app, como cualquier app nativa.
  useEffect(() => {
    window.history.replaceState({ tab: "inicio" }, "");
    const onPop = (e) => {
      if (ticket) { setTicket(null); return; }
      if (verCarrito) { setVerCarrito(false); return; }
      setTab(e.state?.tab || "inicio");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [ticket, verCarrito]);

  useEffect(() => {
    if (window.history.state?.tab !== tab) window.history.pushState({ tab }, "");
  }, [tab]);
  useEffect(() => { if (verCarrito) window.history.pushState({ tab, modal: "carrito" }, ""); }, [verCarrito]);
  useEffect(() => { if (ticket) window.history.pushState({ tab, modal: "ticket" }, ""); }, [ticket]);

  const irInicio = () => setTab("inicio");
  const add = (m) => setCarrito((c) => [...c, m]);
  const quitar = (id) => setCarrito((c) => { const i = c.findIndex((x) => x.id === id); if (i < 0) return c; const n = [...c]; n.splice(i, 1); return n; });

  const TABS = [
    { k: "inicio", t: "Inicio", i: Coffee },
    { k: "menu", t: "Carta", i: ShoppingBag },
    { k: "fincas", t: "Fincas", i: Mountain },
    { k: "maquinas", t: "Lab", i: Waves },
    { k: "academia", t: "Aula", i: GraduationCap },
    { k: "estudio", t: "Estudio", i: ImageIcon },
  ];

  return (
    <ThemeCtx.Provider value={{ tema, setTema, C }}>
      <div className="qc" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: PALETAS.oscuro.shell, padding: 0 }}>
        <style>{css}</style>
        <div style={{
          position: "relative", width: "100%", maxWidth: 430, height: "100vh", maxHeight: 940,
          background: C.surface, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          {splash ? (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: C.brand, zIndex: 60 }}>
              <div style={{ textAlign: "center", color: C.onBrand }}>
                <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto" }}>
                  <SplashFrame size={96} />
                  <div style={{
                    position: "absolute", inset: 0, display: "grid", placeItems: "center",
                    opacity: 0, animation: "qc-frame-fade .35s ease .68s forwards",
                  }}><Marca size={62} /></div>
                </div>
                <div className="disp" style={{
                  fontSize: 28, marginTop: 16, letterSpacing: "-.01em",
                  opacity: 0, animation: "qc-frame-fade .35s ease .85s forwards",
                }}>Quadro Café</div>
                <div className="mono" style={{
                  fontSize: 10, marginTop: 8, opacity: 0,
                  animation: "qc-frame-fade .35s ease 1s forwards",
                }}>Geometría del sabor</div>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Marca size={26} />
              <span className="disp" style={{ fontSize: 15 }}>Quadro Café</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThemeToggle />
              <button onClick={() => setVerCarrito(true)} className="press" aria-label="Ver pedido" style={{
                position: "relative", ...btnMiniStyle(C), width: 36, height: 36, borderRadius: 11,
                borderColor: carrito.length ? C.brand : C.line,
              }}>
                <ShoppingBag size={16} />
                {carrito.length > 0 && (
                  <span className="mono pop" style={{
                    position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px",
                    borderRadius: 99, background: C.brand, color: C.onBrand, fontSize: 10, fontWeight: 700,
                    display: "grid", placeItems: "center",
                  }}>{carrito.length}</span>
                )}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div key={tab} className="rise" style={{ height: "100%" }}>
              {tab === "inicio" && <Inicio ir={setTab} lote={lote} />}
              {tab === "menu" && <Menu carrito={carrito} add={add} quitar={quitar} lote={lote} setLote={setLote} taza={taza} setTaza={setTaza} onBack={irInicio} />}
              {tab === "fincas" && <Fincas lote={lote} setLote={setLote} onBack={irInicio} />}
              {tab === "maquinas" && <Laboratorio onBack={irInicio} />}
              {tab === "academia" && <Academia taza={taza} setTaza={setTaza} onBack={irInicio} />}
              {tab === "estudio" && <Estudio medios={medios} setMedios={setMedios} onBack={irInicio} />}
              {tab === "club" && <Club email={email} setEmail={setEmail} onBack={irInicio} onAdmin={() => setTab("admin")} />}
              {tab === "admin" && <Admin onBack={irInicio} />}
            </div>
          </div>

          <div style={{
            flexShrink: 0, display: "flex", justifyContent: "space-around",
            borderTop: `1px solid ${C.line}`, background: C.card, padding: "9px 4px 12px",
          }}>
            {TABS.map((x) => {
              const Icono = x.i, on = tab === x.k;
              return (
                <button key={x.k} onClick={() => setTab(x.k)} className="press" style={{
                  background: "none", border: "none", cursor: "pointer", padding: "5px 8px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  color: on ? C.brand : C.textMuted, transition: "color .2s",
                }}>
                  <Icono size={19} />
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase" }}>{x.t}</span>
                  <span style={{ width: on ? 14 : 0, height: 2, borderRadius: 99, background: C.brand, transition: "width .25s" }} />
                </button>
              );
            })}
          </div>

          {verCarrito && (
            <Carrito carrito={carrito} lote={lote} taza={taza}
              cerrar={() => setVerCarrito(false)} quitar={quitar}
              confirmar={() => { setTicket(Math.floor(100 + Math.random() * 800)); setVerCarrito(false); setCarrito([]); }} />
          )}
          {ticket && <Ticket n={ticket} cerrar={() => setTicket(null)} />}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
