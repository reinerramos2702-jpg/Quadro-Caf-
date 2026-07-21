import React, { useState, useEffect, useRef, useMemo, useContext, createContext } from "react";
import {
  Coffee, Mountain, Waves, ShoppingBag, GraduationCap, Award,
  Plus, Minus, X, Play, Pause, Check, ChevronRight, MapPin, Instagram,
  Mail, Lock, ArrowLeft, Image as ImageIcon, Upload, Trash2, Sun, Moon,
} from "lucide-react";

import logo from "./assets/logo.png";
import loteBourbon from "./assets/lote-bourbon.jpg";
import menuPostres from "./assets/menu-postres.jpg";
import clubBox from "./assets/club-box.jpg";
import heroDispenser from "./assets/hero-dispenser.jpg";
import menuIced from "./assets/menu-iced.jpg";
import estudioLocal from "./assets/estudio/local-barra.jpg";
import estudioPourover from "./assets/estudio/pourover-barra.jpg";

/* ============================================================
   QUADRO CAFÉ — v3
   Dos temas, mismos datos reales.
   claro   verde #1F4D3D · hueso #EDE9E0 · dorado #B08B4F   (branding oficial)
   oscuro  ink #0B0F0D · mocoties #1E5C4A · latón #C9873A · nebulosa #5B2E8C · alien #7FE3C0
   ============================================================ */

const PALETAS = {
  claro: {
    id: "claro", shell: "#07100D",
    surface: "#F7F5EF", card: "#FFFFFF", line: "#DCD6C8",
    text: "#101311", textMuted: "#7A8580",
    brand: "#1F4D3D", onBrand: "#F7F5EF",
    brandAlt: "#B08B4F", onBrandAlt: "#101311",
    purple: "#7C5CA6", amarillo: "#C79A3B", warn: "#B5502E",
  },
  oscuro: {
    id: "oscuro", shell: "#07100D",
    surface: "#0B0F0D", card: "#131A17", line: "#243029",
    text: "#F2EDE3", textMuted: "#8AA096",
    brand: "#7FE3C0", onBrand: "#0B0F0D",
    brandAlt: "#C9873A", onBrandAlt: "#0B0F0D",
    purple: "#A47BE0", amarillo: "#E0C24B", warn: "#E08C6B",
  },
};

const FINCA_TINTS = {
  claro: ["#7C5CA6", "#1F4D3D", "#B08B4F"],
  oscuro: ["#5B2E8C", "#1E5C4A", "#C9873A"],
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

function buildCss(C) {
  return `
${FONTS}
*{box-sizing:border-box}
.qc{font-family:'Archivo',system-ui,sans-serif;color:${C.text};background:${C.surface}}
.disp{font-family:'Cormorant Garamond',serif;font-weight:700;letter-spacing:.01em}
.script{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.qc-scroll::-webkit-scrollbar{width:0;height:0}
@keyframes qc-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes qc-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes qc-slide{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes qc-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes qc-drip{0%{transform:translateY(-6px);opacity:0}20%{opacity:1}100%{transform:translateY(26px);opacity:0}}
@keyframes qc-pulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.9;transform:scale(1.06)}}
@keyframes qc-steam{0%{transform:translateY(0) scaleX(1);opacity:0}30%{opacity:.55}100%{transform:translateY(-22px) scaleX(1.5);opacity:0}}
@keyframes qc-bar{from{width:0}}
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
const CAT_IMG = { Filtrado: loteBourbon, Frío: menuIced, Postres: menuPostres };

const EQUIPO = [
  { nombre: "Comandante C40", detalle: "Nitro Blade · Alpine Lagoon y Sunset", uso: "Molienda de barra y competencia", clicks: "18–24 clics para filtrado" },
  { nombre: "AeroPress", detalle: "Presión de aire + microfiltro", uso: "Recetas de campeonato", clicks: "Invertida, 2:00 min" },
  { nombre: "Sifón de vacío", detalle: "Balón, mechero, filtro de tela", uso: "Servicio a la mesa", clicks: "93 °C sostenidos" },
  { nombre: "Copas de perfil", detalle: "Pinot · Aroma · Barrel", uso: "Catación y cierre de venta", clicks: "Cambian el aroma percibido" },
];

const ACADEMIA = [
  { id: "a1", titulo: "Leer una etiqueta de lote", min: 4,
    puntos: ["Origen y altura definen acidez", "El proceso define dulzor y cuerpo", "La fecha de tueste manda sobre todo lo demás"] },
  { id: "a2", titulo: "Molienda: por qué el clic importa", min: 6,
    puntos: ["Más fino, más superficie, más extracción", "Los finos ahogan el lecho y amargan", "Ajusta molienda antes que tiempo"] },
  { id: "a3", titulo: "Geometría del vertido", min: 7,
    puntos: ["La espiral reparte, el centro concentra", "Los pulsos estabilizan la temperatura", "La turbulencia es sabor, no adorno"] },
  { id: "a4", titulo: "Catación y vocabulario de barra", min: 5,
    puntos: ["Describe con comida, no con adjetivos vacíos", "Primero dulzor, luego acidez, luego cuerpo", "El cliente compra lo que entiende"] },
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

function Header({ titulo, sub, right }) {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "22px 20px 14px" }}>
      <div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 6 }}>{sub}</div>
        <h1 className="disp" style={{ fontSize: 30, lineHeight: .95, margin: 0 }}>{titulo}</h1>
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

function btnMiniStyle(C) {
  return {
    width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center",
    background: "transparent", border: `1px solid ${C.line}`, color: C.text, cursor: "pointer",
  };
}

/* ============================ INICIO ============================ */

function Inicio({ ir, lote }) {
  const { C, tema } = useTheme();
  const [prog, setProg] = useState(0);
  const [geo, setGeo] = useState(GEOMETRIAS[0]);
  useEffect(() => {
    let raf, t0 = performance.now();
    const loop = (t) => {
      const p = ((t - t0) / 3600) % 1;
      setProg(p);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [geo]);

  const tint = FINCA_TINTS[tema][FINCAS.findIndex((f) => f.id === lote.id)] || C.brand;

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 100 }}>
      <div className="rise" style={{
        position: "relative", padding: "26px 20px 8px", overflow: "hidden",
        backgroundImage: `linear-gradient(180deg, ${C.surface}CC, ${C.surface}), url(${heroDispenser})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
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

      <div className="pop" style={{ position: "relative", margin: "14px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <svg width={132} height={132} viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
            <circle cx="100" cy="100" r="92" fill="none" stroke={C.line} strokeWidth="1" />
            <circle cx="100" cy="100" r="62" fill="none" stroke={C.line} strokeWidth="1" strokeDasharray="3 5" />
            <path d={spiralPath(geo.vueltas, geo.pasos, geo.radio, 200, 1)} fill="none" stroke={C.line} strokeWidth="2" />
            <path d={spiralPath(geo.vueltas, geo.pasos, geo.radio, 200, prog)} fill="none" stroke={C.brand} strokeWidth="2.6" strokeLinecap="round" />
            <circle r="4" fill={C.brandAlt}
              cx={100 + Math.cos(prog * geo.vueltas * Math.PI * 2) * (86 * geo.radio * prog)}
              cy={100 + Math.sin(prog * geo.vueltas * Math.PI * 2) * (86 * geo.radio * prog)} />
          </svg>
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
        <button onClick={() => ir("fincas")} className="press tapfx" style={{
          width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${C.line}`,
          borderRadius: 18, padding: 16, background: `linear-gradient(140deg, ${tint}44, ${C.card} 60%)`, color: C.text,
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "14px 20px 0" }}>
        {[
          { k: "menu", t: "Pedir ahora", s: "Café, pan y postres", i: <ShoppingBag size={17} /> },
          { k: "maquinas", t: "Laboratorio", s: "Geometrías y espirales", i: <Waves size={17} /> },
          { k: "fincas", t: "Fincas", s: "Inducción con avatar", i: <Mountain size={17} /> },
          { k: "academia", t: "Academia", s: "Formación de barra", i: <GraduationCap size={17} /> },
          { k: "club", t: "Quadro Club", s: "Tu fidelidad, tus puntos", i: <Award size={17} /> },
        ].map((c, i) => (
          <button key={c.k} onClick={() => ir(c.k)} className="press tapfx rise" style={{
            animationDelay: `${120 + i * 60}ms`, textAlign: "left", cursor: "pointer",
            background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, color: C.text,
          }}>
            <span style={{ color: C.brandAlt }}>{c.i}</span>
            <div className="disp" style={{ fontSize: 14, marginTop: 10 }}>{c.t}</div>
            <div className="mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{c.s}</div>
          </button>
        ))}
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

function Menu({ carrito, add, quitar, lote, setLote, taza, setTaza }) {
  const { C } = useTheme();
  const [cat, setCat] = useState("Filtrado");
  const [abierto, setAbierto] = useState(null);
  const items = MENU.filter((m) => m.cat === cat);
  const imgCategoria = CAT_IMG[cat];

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 120 }}>
      <Header sub="Carta viva" titulo="Pedir en barra" />
      <div className="qc-scroll" style={{ display: "flex", gap: 7, padding: "0 20px 14px", overflowX: "auto" }}>
        {CATS.map((c) => <Chip key={c} active={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      <div style={{ padding: "0 20px" }}>
        {imgCategoria && (
          <img key={cat} src={imgCategoria} alt={cat} className="rise" style={{
            width: "100%", height: 120, objectFit: "cover", borderRadius: 14, marginBottom: 12,
          }} />
        )}
        {items.map((m, i) => {
          const n = carrito.filter((x) => x.id === m.id).length;
          const open = abierto === m.id;
          return (
            <div key={m.id} className="rise" style={{
              animationDelay: `${i * 45}ms`, background: C.card, border: `1px solid ${n ? C.brand : C.line}`,
              borderRadius: 16, padding: 14, marginBottom: 10, transition: "border-color .25s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="disp" style={{ fontSize: 15 }}>{m.nombre}</span>
                    {m.tag && <span className="mono" style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: C.brandAlt, color: C.onBrandAlt, fontWeight: 600 }}>{m.tag}</span>}
                  </div>
                  <p style={{ fontSize: 12.5, color: C.textMuted, margin: "5px 0 0", lineHeight: 1.45 }}>{m.desc}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{money(m.precio)}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                {m.finca ? (
                  <button onClick={() => setAbierto(open ? null : m.id)} className="press mono" style={{
                    fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.brand,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}>
                    {open ? "Ocultar opciones" : "Elegir finca y taza"}
                  </button>
                ) : <span />}
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
              </div>

              {open && (
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

function Fincas({ lote, setLote }) {
  const { C, tema } = useTheme();
  const [linea, setLinea] = useState(0);
  const [reproduciendo, setRepro] = useState(false);
  const [transcripcion, setTrans] = useState(false);
  const timer = useRef(null);

  useEffect(() => { setLinea(0); setRepro(false); }, [lote.id]);

  useEffect(() => {
    if (!reproduciendo) { clearTimeout(timer.current); return; }
    if (linea >= lote.guion.length - 1) { setRepro(false); return; }
    timer.current = setTimeout(() => setLinea((l) => l + 1), 3400);
    return () => clearTimeout(timer.current);
  }, [reproduciendo, linea, lote]);

  const tint = FINCA_TINTS[tema][FINCAS.findIndex((f) => f.id === lote.id)] || C.brand;

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Origen" titulo="Fincas" />
      <div className="qc-scroll" style={{ display: "flex", gap: 7, padding: "0 20px 16px", overflowX: "auto" }}>
        {FINCAS.map((f) => <Chip key={f.id} active={f.id === lote.id} onClick={() => setLote(f)} tone={C.brandAlt} onTone={C.onBrandAlt}>{f.finca}</Chip>)}
      </div>

      <div className="pop" key={lote.id} style={{
        margin: "0 20px", borderRadius: 22, overflow: "hidden",
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

      <div style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 12 }}>Ficha del lote</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            ["Altura", `${lote.altura} msnm`], ["Varietal", lote.varietal],
            ["Proceso", lote.proceso], ["Puntaje", `${lote.score} SCA`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="mono" style={{ fontSize: 9.5, color: C.textMuted, letterSpacing: ".12em", textTransform: "uppercase" }}>{k}</div>
              <div className="disp" style={{ fontSize: 16, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Meter label="Dulzor" value={Math.round(lote.score - 12)} tone={C.brandAlt} />
          <Meter label="Acidez" value={Math.round(lote.altura / 26)} />
          <Meter label="Cuerpo" value={lote.proceso.includes("Honey") ? 80 : 58} tone={C.purple} />
        </div>
      </div>
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

function Laboratorio() {
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
      <img src={heroDispenser} alt="Equipo de extracción Quadro Café" style={{
        width: "calc(100% - 40px)", margin: "0 20px", height: 120, objectFit: "cover", borderRadius: 14, display: "block",
      }} />
      <Header sub="Geometría de extracción" titulo="Laboratorio" />
      <p style={{ padding: "0 20px", fontSize: 13.5, color: C.textMuted, lineHeight: 1.5, margin: "0 0 16px" }}>
        Mueve la ruta del agua y mira cómo se desplaza el perfil. Lo mismo que hace la máquina, en tu mano.
      </p>

      <div style={{ margin: "0 20px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "grid", placeItems: "center", position: "relative" }}>
          <svg width={210} height={210} viewBox="0 0 200 200">
            <defs>
              <radialGradient id="lecho">
                <stop offset="0%" stopColor={C.brandAlt} stopOpacity=".25" />
                <stop offset="100%" stopColor={C.brandAlt} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="url(#lecho)" stroke={C.line} />
            <circle cx="100" cy="100" r="60" fill="none" stroke={C.line} strokeDasharray="2 6" />
            <circle cx="100" cy="100" r="30" fill="none" stroke={C.line} strokeDasharray="2 6" />
            <path d={spiralPath(vueltas, 280, radio, 200, 1)} fill="none" stroke={C.line} strokeWidth="2" />
            <path d={spiralPath(vueltas, 280, radio, 200, prog)} fill="none" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
            <circle r="5" fill={C.brandAlt}
              cx={100 + Math.cos(prog * vueltas * Math.PI * 2) * (86 * radio * prog)}
              cy={100 + Math.sin(prog * vueltas * Math.PI * 2) * (86 * radio * prog)} />
          </svg>
          {corriendo && <span className="drip" style={{ position: "absolute", top: 6, width: 3, height: 12, borderRadius: 99, background: C.brand }} />}
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

function Academia({ taza, setTaza }) {
  const { C } = useTheme();
  const [hechos, setHechos] = useState([]);
  const toggle = (id) => setHechos((h) => h.includes(id) ? h.filter((x) => x !== id) : [...h, id]);
  const pct = Math.round((hechos.length / ACADEMIA.length) * 100);

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Formación de barra" titulo="Academia" />

      <div style={{ margin: "0 20px 18px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase" }}>Tu avance</span>
          <span className="disp" style={{ fontSize: 24, color: C.brand }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: C.line, borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.brand, borderRadius: 99, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {ACADEMIA.map((a, i) => {
          const done = hechos.includes(a.id);
          return (
            <button key={a.id} onClick={() => toggle(a.id)} className="press tapfx rise" style={{
              animationDelay: `${i * 55}ms`, width: "100%", textAlign: "left", cursor: "pointer",
              background: C.card, border: `1px solid ${done ? C.brand : C.line}`, borderRadius: 16,
              padding: 15, marginBottom: 10, color: C.text,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="disp" style={{ fontSize: 15 }}>{a.titulo}</span>
                <span style={{
                  width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                  border: `1px solid ${done ? C.brand : C.line}`, background: done ? C.brand : "transparent", color: C.onBrand,
                }}>{done && <Check size={13} />}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 5 }}>{a.min} min de lectura</div>
              <ul style={{ margin: "10px 0 0", padding: "0 0 0 16px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.6 }}>
                {a.puntos.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </button>
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

function Estudio({ medios, setMedios }) {
  const { C } = useTheme();
  const input = useRef(null);

  const cargar = (files) => {
    const nuevos = Array.from(files).slice(0, 30).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      nombre: f.name, url: URL.createObjectURL(f), destino: "Galería del local",
    }));
    setMedios((m) => [...nuevos, ...m]);
  };

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Producción" titulo="Estudio" />
      <p style={{ padding: "0 20px", fontSize: 13.5, color: C.textMuted, lineHeight: 1.5, margin: "0 0 16px" }}>
        Fotos y videos reales del local. Sube más y asigna cada archivo a su lugar en la app.
      </p>

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

      {medios.length === 0 ? (
        <div style={{ margin: "18px 20px 0", padding: 20, border: `1px solid ${C.line}`, borderRadius: 16, textAlign: "center" }}>
          <ImageIcon size={18} color={C.textMuted} />
          <p style={{ fontSize: 13, color: C.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>
            Todavía no hay archivos. Sube el primero y elige dónde vive dentro de la app.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "18px 20px 0" }}>
          {medios.map((m, i) => (
            <div key={m.id} className="pop" style={{ animationDelay: `${i * 40}ms`, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`, background: C.card }}>
              <div style={{ height: 108, background: C.surface, display: "grid", placeItems: "center", overflow: "hidden" }}>
                <img src={m.url} alt={m.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
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
            </div>
          ))}
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
  );
}

/* ============================ QUADRO CLUB ============================ */

function Club({ email, setEmail, onBack }) {
  const { C } = useTheme();
  const [enviado, setEnviado] = useState(!!email);
  const [valor, setValor] = useState(email || "");
  const puntos = enviado ? 40 : 0;
  const nivel = [...CLUB_NIVELES].reverse().find((n) => puntos >= n.desde) || CLUB_NIVELES[0];

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Fidelidad" titulo="Quadro Club" right={
        <button onClick={onBack} className="press" aria-label="Volver a inicio" style={btnMiniStyle(C)}><ArrowLeft size={15} /></button>
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

  const [tab, setTab] = useState("inicio");
  const [carrito, setCarrito] = useState([]);
  const [verCarrito, setVerCarrito] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [lote, setLote] = useState(FINCAS[0]);
  const [taza, setTaza] = useState(TAZAS[1]);
  const [medios, setMedios] = useState(MEDIOS_INICIALES);
  const [email, setEmail] = useState("");
  const [splash, setSplash] = useState(true);

  useEffect(() => { const t = setTimeout(() => setSplash(false), 1700); return () => clearTimeout(t); }, []);

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
              <div className="pop" style={{ textAlign: "center", color: C.onBrand }}>
                <div style={{ display: "grid", placeItems: "center" }}><Marca size={72} ring /></div>
                <div className="disp" style={{ fontSize: 30, marginTop: 16, letterSpacing: ".02em" }}>Quadro Café</div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".3em", marginTop: 8, textTransform: "uppercase", opacity: .85 }}>Geometría del sabor</div>
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
              {tab === "menu" && <Menu carrito={carrito} add={add} quitar={quitar} lote={lote} setLote={setLote} taza={taza} setTaza={setTaza} />}
              {tab === "fincas" && <Fincas lote={lote} setLote={setLote} />}
              {tab === "maquinas" && <Laboratorio />}
              {tab === "academia" && <Academia taza={taza} setTaza={setTaza} />}
              {tab === "estudio" && <Estudio medios={medios} setMedios={setMedios} />}
              {tab === "club" && <Club email={email} setEmail={setEmail} onBack={() => setTab("inicio")} />}
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
