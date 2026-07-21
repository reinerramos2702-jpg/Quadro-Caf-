import React, { useState, useEffect, useMemo } from "react";
import {
  Coffee, Mountain, ShoppingBag, GraduationCap, Sliders, Award,
  Plus, Minus, X, Check, ChevronRight, ChevronLeft, MapPin, Instagram,
  Mail, Lock, Sparkles, Star, ArrowLeft, Play
} from "lucide-react";

import logo from "./assets/logo.png";
import loteVillaNueva from "./assets/lote-villa-nueva.jpg";
import loteBourbon from "./assets/lote-bourbon.jpg";
import menuPostres from "./assets/menu-postres.jpg";
import clubBox from "./assets/club-box.jpg";
import heroDispenser from "./assets/hero-dispenser.jpg";
import menuIced from "./assets/menu-iced.jpg";

/* ============================================================
   QUADRO CAFÉ — v2
   Branding oficial: verde #1F4D3D · hueso #EDE9E0 · negro #101311
   Datos reales: menú, lotes, fincas, caficultores, dirección, IG
   ============================================================ */

const T = {
  verde: "#1F4D3D", verdeOsc: "#153a2d", hueso: "#EDE9E0", crema: "#F7F5EF",
  ink: "#101311", dorado: "#B08B4F", linea: "#DCD6C8", tenue: "#7A8580",
  blanco: "#FFFFFF",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

const css = `
${FONTS}
*{box-sizing:border-box}
.qc{font-family:'Archivo',system-ui,sans-serif;color:${T.ink};background:${T.crema}}
.disp{font-family:'Fraunces',serif;letter-spacing:-.01em}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.qc-scroll::-webkit-scrollbar{width:0;height:0}
@keyframes qc-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes qc-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes qc-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes qc-pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes qc-bar{from{width:0}}
.rise{animation:qc-rise .45s cubic-bezier(.2,.8,.2,1) both}
.pop{animation:qc-pop .35s cubic-bezier(.2,.8,.2,1) both}
.sheet{animation:qc-sheet .34s cubic-bezier(.2,.9,.2,1) both}
.press{transition:transform .12s ease, background .2s ease, border-color .2s ease}
.press:active{transform:scale(.96)}
.pulse{animation:qc-pulse 2.4s ease-in-out infinite}
.bar{animation:qc-bar .8s cubic-bezier(.2,.8,.2,1) both}
:focus-visible{outline:2px solid ${T.verde};outline-offset:2px;border-radius:6px}
@media (prefers-reduced-motion:reduce){*{animation-duration:.001s!important;transition-duration:.001s!important}}
`;

/* ============================ DATOS REALES ============================ */

const FINCAS = [
  {
    id: "agua-fria",
    finca: "Agua Fría",
    zona: "Venezuela",
    caficultor: "José Tomás Carrillo Batalla",
    inicial: "J",
    trayectoria: "Más de 100 años de trayectoria familiar",
    detalle: "Tercera generación de caficultores. Su finca alcanzó premios en Europa a inicios del siglo XX. Modernizó los lotes con variedades como Tabí, Borbón Rosado, Geisha y Monte Claro.",
    variedad: "Bourbon Ají", altura: 1250, proceso: "Lavado", score: null,
    guion: [
      "Bienvenido a Agua Fría. Soy José Tomás Carrillo Batalla, tercera generación de mi familia en este oficio.",
      "Llevamos más de 100 años cultivando café. A inicios del siglo XX ya ganábamos premios en Europa.",
      "Hoy trabajo variedades como Tabí, Borbón Rosado, Geisha y Monte Claro, a 1.250 metros.",
      "Este lote, Bourbon Ají, se procesa lavado, seleccionado a mano y secado sobre camas africanas.",
      "En taza vas a encontrar parchita, piña, durazno, ciruela — acidez media-alta, cuerpo sedoso.",
    ],
    color: T.verde,
  },
  {
    id: "santa-anita",
    finca: "Santa Anita",
    zona: "Mérida, Venezuela",
    caficultor: "Anacelis Dávila Alessandrello",
    inicial: "A",
    trayectoria: "Tercera generación, desde los 19 años",
    detalle: "Desde los 19 años cultiva su propio café desde el semillero — Catuai amarillo, Caturra rojo, INIA 01, a 1.380 msnm en La Ranchería, Santa Cruz de Mora. Continúa el legado de su esposo, Óscar Alessandrello.",
    variedad: "Villa Nueva", altura: 1750, proceso: "Lavado", score: null,
    guion: [
      "Soy Anacelis Dávila Alessandrello. Cultivo café desde los 19 años, desde el semillero.",
      "Trabajo Catuai amarillo, Caturra rojo e INIA 01 en La Ranchería, Santa Cruz de Mora.",
      "Este lote, Villa Nueva, se selecciona a mano y se seca sobre cama africana a 1.750 metros.",
      "Para mí no es ningún trabajo, porque hago lo que me gusta. Continúo el legado de mi esposo, Óscar.",
    ],
    color: "#8C6242",
  },
  {
    id: "los-naranjos",
    finca: "Los Naranjos",
    zona: "Mérida, Venezuela",
    caficultor: "Falsir Dúran",
    inicial: "F",
    trayectoria: "99 hectáreas, 415.800 plantas",
    detalle: "Inició con 2.000 matas de Villa Nueva y hoy cuenta con 415.800 plantas de Castilla, Caturra y Villa Nueva en 99 hectáreas. Trabaja junto a su familia y comunidad por la innovación y sostenibilidad del sector.",
    variedad: "Castilla / Caturra", altura: null, proceso: "—", score: null,
    guion: [
      "Soy Falsir Dúran, propietario de Finca Los Naranjos, en Mérida.",
      "Empecé con 2.000 matas de Villa Nueva. Hoy tengo 415.800 plantas en 99 hectáreas.",
      "Trabajo Castilla, Caturra y Villa Nueva junto a mi familia y mi comunidad.",
      "Nuestro compromiso es innovación y sostenibilidad — pensando en la próxima generación de caficultores.",
    ],
    color: "#4A6741",
  },
  {
    id: "shady",
    finca: "Finca de Shady Ramírez",
    zona: "Venezuela",
    caficultor: "Shady Ramírez",
    inicial: "S",
    trayectoria: "Primera generación, tecnificación del cultivo",
    detalle: "Caficultor de primera generación, dedicado al conocimiento y la tecnificación de la caficultura. Quiere heredarle ese amor por el café a sus hijos, para que continúen el legado.",
    variedad: "—", altura: null, proceso: "—", score: null,
    guion: [
      "Soy Shady Ramírez. Soy caficultor de primera generación.",
      "Me dediqué a estudiar y tecnificar el cultivo, para hacer cada vez un mejor café.",
      "Quiero heredarle ese amor por el café a mis hijos, para que el legado continúe.",
    ],
    color: T.dorado,
  },
];

const LOTES = [
  { id: "villa-nueva", nombre: "Villa Nueva", finca: "Finca Santa Anita — Mérida", caficultor: "Anacelis Dávila Alessandrello", altura: 1750, proceso: "Lavado", origen: "Venezuela", notas: "Selección a mano · secado sobre cama africana" },
  { id: "catuai", nombre: "Catuai", finca: "—", caficultor: "—", altura: null, proceso: "—", origen: "Venezuela", notas: "Dispensador en barra" },
  { id: "bourbon-a", nombre: "Bourbon A Competencia", finca: "—", caficultor: "—", altura: 1950, proceso: "Lavado", origen: "Colombia", notas: "Flores, caramelo, maracuyá, naranja, frutos amarillos" },
];

const MENU = [
  { cat: "Café", items: ["Espresso", "Americano", "Macchiato", "Cortado", "Latte", "Capuccino", "Flat White"] },
  { cat: "Que te Quadre", items: ["Latte vainilla", "Latte caramelo", "Latte pistacho", "Mocaccino", "Chocolate caliente", "Affogato", "Affogato Pistacho"], destacado: "Latte Pistacho" },
  { cat: "Filtrados", items: ["V60", "Orea", "Origami", "Chemex", "Aeropress", "Prensa francesa", "Sifón japonés"] },
  { cat: "Matcha", items: ["Matcha Latte", "GreenBerry Matcha", "Affogato Matcha"] },
  { cat: "Bebidas naturales", items: ["Fresa", "Parchita", "Mora", "Guanábana", "Melocotón", "Limonada de fresa", "Durazno"] },
  { cat: "Iced Quadro", items: ["Frapuccino", "Frapuccino Oreo", "Frapuccino Caramelo", "Frapuccino Nutella", "Frapuccino Baileys", "ColdBrew", "Iced Latte"] },
  { cat: "Postres", items: ["Brownie", "Brownie con helado", "Marquesas", "Tiramisu", "Cheesecake", "Muffin"] },
  { cat: "Tortas", items: ["Zanahoria", "ChocoPistacho", "CoffeeCake", "Manzana", "Redvelvet", "Marmoleada"] },
  { cat: "Croissant", items: ["Clásico", "Tradicional", "Mediterráneo", "Campestre Cherry", "Pica Croiss"] },
  { cat: "Cachitos", items: ["Tocineta y queso amarillo", "Pavo y queso crema", "Jamón", "Mortadela pistacho con queso crema"] },
];

const GEOMETRIAS = [
  { id: "espiral", nombre: "Espiral continua", metodo: "V60 · vertido continuo", efecto: { extraccion: 82, cuerpo: 38, acidez: 78, dulzor: 66 }, lectura: "Moja todo el lecho por igual. Sube acidez y claridad, baja cuerpo." },
  { id: "centro", nombre: "Punto central", metodo: "AeroPress invertida", efecto: { extraccion: 68, cuerpo: 84, acidez: 46, dulzor: 74 }, lectura: "Agua concentrada al centro. Extracción más lenta, cuerpo denso." },
  { id: "pulsos", nombre: "Espiral por pulsos", metodo: "Kalita · 3 pulsos", efecto: { extraccion: 76, cuerpo: 58, acidez: 64, dulzor: 82 }, lectura: "Cada pulso reinicia la turbulencia. La ruta más estable al dulzor." },
  { id: "sifon", nombre: "Inmersión con vacío", metodo: "Sifón japonés", efecto: { extraccion: 88, cuerpo: 72, acidez: 70, dulzor: 60 }, lectura: "Temperatura sostenida y agitación total. Extrae más, perdona menos." },
];

const CLUB_NIVELES = [
  { nombre: "Grano", desde: 0, beneficio: "Acumula 1 punto por cada $1 en compras" },
  { nombre: "Tueste", desde: 100, beneficio: "10% off en filtrados de origen" },
  { nombre: "Barista", desde: 300, beneficio: "1 bebida gratis al mes + acceso anticipado a lotes nuevos" },
  { nombre: "Q Circle", desde: 600, beneficio: "Cata privada trimestral con el equipo Quadro" },
];

/* ============================ UI BASE ============================ */

const Marca = ({ size = 28, ring = false }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", overflow: "hidden",
    display: "grid", placeItems: "center", position: "relative", flexShrink: 0,
    boxShadow: ring ? `0 0 0 1.5px ${T.crema}` : "none",
  }}>
    <img src={logo} alt="Quadro Café" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </div>
);

const btnMini = {
  display: "grid", placeItems: "center", border: `1px solid ${T.linea}`,
  background: T.blanco, color: T.ink, cursor: "pointer",
};

const Chip = ({ children, on }) => (
  <span className="mono" style={{
    fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
    padding: "4px 9px", borderRadius: 99, border: `1px solid ${on ? T.verde : T.linea}`,
    background: on ? T.verde : "transparent", color: on ? T.crema : T.tenue,
  }}>{children}</span>
);

/* ============================ PANTALLAS ============================ */

function Inicio({ ir }) {
  return (
    <div className="qc-scroll" style={{ height: "100%", overflowY: "auto", padding: "8px 20px 100px" }}>
      <div className="rise" style={{
        marginTop: 6, borderRadius: 20, padding: "26px 22px", color: T.crema,
        position: "relative", overflow: "hidden",
        backgroundImage: `linear-gradient(180deg, rgba(21,58,45,.55), rgba(16,19,17,.88)), url(${heroDispenser})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", opacity: .8 }}>Coffee · sustantivo</div>
        <div className="disp" style={{ fontSize: 24, fontWeight: 600, marginTop: 8, maxWidth: 240, lineHeight: 1.25 }}>
          El líquido que huele a cielo recién molido.
        </div>
        <button onClick={() => ir("menu")} className="press" style={{
          marginTop: 18, background: T.crema, color: T.verde, border: "none", borderRadius: 99,
          padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>Ver la carta <ChevronRight size={15} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        {[
          { t: "Fincas", d: "Conoce al caficultor", i: Mountain, k: "fincas" },
          { t: "Quadro Club", d: "Tu fidelidad, tus puntos", i: Award, k: "club" },
          { t: "Lab", d: "Geometría de extracción", i: Sliders, k: "lab" },
          { t: "Aula", d: "Aprende a catar", i: GraduationCap, k: "aula" },
        ].map((x) => (
          <button key={x.k} onClick={() => ir(x.k)} className="press" style={{
            textAlign: "left", background: T.blanco, border: `1px solid ${T.linea}`, borderRadius: 16,
            padding: "16px 14px", cursor: "pointer",
          }}>
            <x.i size={20} color={T.verde} />
            <div className="disp" style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>{x.t}</div>
            <div style={{ fontSize: 11.5, color: T.tenue, marginTop: 2 }}>{x.d}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${T.linea}`, paddingTop: 16, display: "flex", gap: 14, alignItems: "center" }}>
        <img src={loteVillaNueva} alt="Bolsa de café Villa Nueva" style={{
          width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: `1px solid ${T.linea}`,
        }} />
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: T.tenue, textTransform: "uppercase" }}>Lote del día</div>
          <div className="disp" style={{ fontSize: 19, fontWeight: 600, marginTop: 4 }}>Villa Nueva</div>
          <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 2 }}>Finca Santa Anita, Mérida · 1.750 msnm · Lavado</div>
        </div>
      </div>

      <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.tenue }}>
        <MapPin size={14} /> 4ª Av. de Los Palos Grandes, Edif. Los Eucaliptos · Lun–Dom 8am–8pm
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.tenue }}>
        <Instagram size={14} /> @quadro.cafe
      </div>
    </div>
  );
}
const CATEGORIA_IMG = {
  "Iced Quadro": menuIced,
  "Filtrados": loteBourbon,
  "Postres": menuPostres,
  "Tortas": menuPostres,
  "Croissant": menuPostres,
  "Cachitos": menuPostres,
};

function Menu({ carrito, add }) {
  const [cat, setCat] = useState(MENU[0].cat);
  const activa = MENU.find((m) => m.cat === cat);
  const imgCategoria = CATEGORIA_IMG[cat];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="qc-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 20px" }}>
        {MENU.map((m) => (
          <button key={m.cat} onClick={() => setCat(m.cat)} className="press" style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 99, cursor: "pointer",
            border: `1px solid ${cat === m.cat ? T.verde : T.linea}`,
            background: cat === m.cat ? T.verde : T.blanco, color: cat === m.cat ? T.crema : T.ink,
            fontSize: 12.5, fontWeight: 600,
          }}>{m.cat}</button>
        ))}
      </div>
      <div className="qc-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px" }}>
        {imgCategoria && (
          <img key={cat} src={imgCategoria} alt={activa.cat} className="rise" style={{
            width: "100%", height: 130, objectFit: "cover", borderRadius: 14, marginBottom: 12,
          }} />
        )}
        {activa.destacado && (
          <div style={{
            marginBottom: 12, padding: "12px 14px", borderRadius: 14, background: T.verde, color: T.crema,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", opacity: .8 }}>El sello de ellos</div>
              <div className="disp" style={{ fontSize: 17, fontWeight: 600 }}>{activa.destacado}</div>
            </div>
            <Star size={18} fill={T.dorado} color={T.dorado} />
          </div>
        )}
        {activa.items.map((it) => {
          const enCarrito = carrito.filter((c) => c === it).length;
          return (
            <div key={it} className="rise" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 0", borderBottom: `1px solid ${T.linea}`,
            }}>
              <span style={{ fontSize: 14.5 }}>{it}</span>
              <button onClick={() => add(it)} className="press" style={{
                ...btnMini, width: 30, height: 30, borderRadius: 9,
                borderColor: enCarrito ? T.verde : T.linea, background: enCarrito ? T.verde : T.blanco,
                color: enCarrito ? T.crema : T.ink,
              }}>
                {enCarrito ? <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{enCarrito}</span> : <Plus size={15} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Fincas({ activa, setActiva }) {
  const [modo, setModo] = useState("slider"); // slider | ambiente
  if (modo === "ambiente" && activa) return <FincaAmbiente finca={activa} volver={() => setModo("slider")} />;

  return (
    <div className="qc-scroll" style={{ height: "100%", overflowY: "auto", padding: "12px 20px 100px" }}>
      <div className="disp" style={{ fontSize: 20, fontWeight: 600 }}>Nuestros caficultores</div>
      <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 3, marginBottom: 16 }}>Toca una tarjeta para conocer su finca</div>
      <div style={{ display: "grid", gap: 12 }}>
        {FINCAS.map((f) => (
          <button key={f.id} onClick={() => { setActiva(f); setModo("ambiente"); }} className="press tapfx" style={{
            textAlign: "left", cursor: "pointer", border: `1px solid ${T.linea}`, borderRadius: 18,
            padding: 16, background: T.blanco, display: "flex", gap: 14, alignItems: "center",
          }}>
            {f.id === "santa-anita" ? (
              <img src={loteVillaNueva} alt="Bolsa de café Villa Nueva, Finca Santa Anita" style={{
                width: 52, height: 52, borderRadius: 14, objectFit: "cover", flexShrink: 0,
              }} />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: f.color, color: T.crema,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}><span className="disp" style={{ fontSize: 20, fontWeight: 700 }}>{f.inicial}</span></div>
            )}
            <div style={{ flex: 1 }}>
              <div className="disp" style={{ fontSize: 16, fontWeight: 600 }}>{f.finca}</div>
              <div style={{ fontSize: 11.5, color: T.tenue }}>{f.caficultor} · {f.zona}</div>
              <div style={{ fontSize: 11, color: T.verde, marginTop: 3, fontWeight: 600 }}>{f.trayectoria}</div>
            </div>
            <ChevronRight size={18} color={T.tenue} />
          </button>
        ))}
      </div>
    </div>
  );
}

function FincaAmbiente({ finca, volver }) {
  const [linea, setLinea] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);

  useEffect(() => {
    if (!reproduciendo) return;
    if (linea >= finca.guion.length - 1) { setReproduciendo(false); return; }
    const t = setTimeout(() => setLinea((l) => l + 1), 3400);
    return () => clearTimeout(t);
  }, [reproduciendo, linea, finca]);

  return (
    <div className="pop" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{
        flex: 1, position: "relative", background: `linear-gradient(180deg, ${finca.color}, ${T.ink})`,
        display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20, overflow: "hidden",
      }}>
        <button onClick={volver} className="press" style={{
          position: "absolute", top: 16, left: 16, ...btnMini, width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: T.crema,
        }}><ArrowLeft size={16} /></button>

        <div style={{ color: T.crema }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", opacity: .75 }}>{finca.zona}</div>
          <div className="disp" style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{finca.finca}</div>
          <div style={{ fontSize: 12.5, opacity: .85, marginTop: 2 }}>{finca.caficultor}</div>
        </div>

        {/* Avatar placeholder — reemplazar por render Higgsfield */}
        <div style={{
          marginTop: 16, borderRadius: 16, background: "rgba(0,0,0,.28)", border: "1px solid rgba(255,255,255,.2)",
          padding: 14, display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <button onClick={() => setReproduciendo((r) => !r)} className="press" style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0, border: "none", cursor: "pointer",
            background: T.crema, color: finca.color, display: "grid", placeItems: "center",
          }}><Play size={16} fill={finca.color} /></button>
          <p key={linea} className="rise" style={{ color: T.crema, fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
            {finca.guion[linea]}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {finca.guion.map((_, i) => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i <= linea ? T.crema : "rgba(255,255,255,.25)" }} />
          ))}
        </div>
      </div>

      <div className="qc-scroll" style={{ padding: "16px 20px 100px", background: T.crema }}>
        {finca.id === "santa-anita" && (
          <img src={loteVillaNueva} alt="Bolsa de café Villa Nueva" style={{
            width: "100%", maxHeight: 220, objectFit: "cover", objectPosition: "center 55%", borderRadius: 16, marginBottom: 14,
          }} />
        )}
        <div className="disp" style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Sobre la finca</div>
        <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.55 }}>{finca.detalle}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Chip>{finca.variedad}</Chip>
          {finca.altura && <Chip>{finca.altura} msnm</Chip>}
          <Chip>{finca.proceso}</Chip>
        </div>
      </div>
    </div>
  );
}
function Laboratorio() {
  const [geo, setGeo] = useState(GEOMETRIAS[0]);
  return (
    <div className="qc-scroll" style={{ height: "100%", overflowY: "auto", padding: "12px 20px 100px" }}>
      <img src={heroDispenser} alt="Equipo de extracción Quadro Café" style={{
        width: "100%", height: 130, objectFit: "cover", borderRadius: 14, marginBottom: 14,
      }} />
      <div className="disp" style={{ fontSize: 20, fontWeight: 600 }}>Geometría de extracción</div>
      <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 3, marginBottom: 14 }}>Cada trazo de agua cambia el sabor en taza</div>

      <div className="qc-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16 }}>
        {GEOMETRIAS.map((g) => (
          <button key={g.id} onClick={() => setGeo(g)} className="press" style={{
            flexShrink: 0, padding: "9px 14px", borderRadius: 99, cursor: "pointer",
            border: `1px solid ${geo.id === g.id ? T.verde : T.linea}`,
            background: geo.id === g.id ? T.verde : T.blanco, color: geo.id === g.id ? T.crema : T.ink,
            fontSize: 12, fontWeight: 600,
          }}>{g.nombre}</button>
        ))}
      </div>

      <div style={{ background: T.blanco, border: `1px solid ${T.linea}`, borderRadius: 18, padding: 18 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: T.tenue, textTransform: "uppercase" }}>{geo.metodo}</div>
        <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{geo.lectura}</p>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {Object.entries(geo.efecto).map(([k, v]) => (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4, textTransform: "capitalize" }}>
                <span>{k}</span><span className="mono">{v}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: T.linea, overflow: "hidden" }}>
                <div key={geo.id + k} className="bar" style={{ height: "100%", width: `${v}%`, borderRadius: 99, background: T.verde }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Academia() {
  return (
    <div className="qc-scroll" style={{ height: "100%", overflowY: "auto", padding: "12px 20px 100px" }}>
      <div className="disp" style={{ fontSize: 20, fontWeight: 600 }}>Aula Quadro</div>
      <div style={{ fontSize: 12.5, color: T.tenue, marginTop: 3, marginBottom: 16 }}>Aprende a leer una taza de café</div>
      {[
        { t: "Cómo catar", d: "Aroma, acidez, cuerpo, dulzor y retrogusto — el orden en que se lee una taza." },
        { t: "El color de la taza", d: "El color de la porcelana cambia la percepción de dulzor y amargor hasta en un 20%." },
        { t: "De la cereza al grano", d: "Cosecha, despulpado, fermentación, secado — el viaje antes del tueste." },
        { t: "Leer una etiqueta", d: "Finca, altura, proceso, puntaje SCA: lo que cada dato te dice del café." },
      ].map((m) => (
        <div key={m.t} style={{ background: T.blanco, border: `1px solid ${T.linea}`, borderRadius: 16, padding: 16, marginBottom: 10 }}>
          <div className="disp" style={{ fontSize: 15, fontWeight: 600 }}>{m.t}</div>
          <p style={{ fontSize: 12.5, color: T.ink, marginTop: 4, lineHeight: 1.5 }}>{m.d}</p>
        </div>
      ))}
    </div>
  );
}

function Club({ email, setEmail }) {
  const [enviado, setEnviado] = useState(!!email);
  const [valor, setValor] = useState(email || "");
  const puntos = enviado ? 40 : 0;
  const nivel = [...CLUB_NIVELES].reverse().find((n) => puntos >= n.desde) || CLUB_NIVELES[0];

  return (
    <div className="qc-scroll" style={{ height: "100%", overflowY: "auto", padding: "12px 20px 100px" }}>
      <div style={{
        color: T.crema, borderRadius: 20, padding: "20px 18px", position: "relative", overflow: "hidden",
        backgroundImage: `linear-gradient(180deg, rgba(21,58,45,.6), rgba(16,19,17,.88)), url(${clubBox})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <Award size={22} />
        <div className="disp" style={{ fontSize: 21, fontWeight: 700, marginTop: 8 }}>Quadro Club</div>
        <div style={{ fontSize: 12.5, opacity: .85, marginTop: 2 }}>Tu fidelidad, en puntos y beneficios reales</div>
      </div>

      {!enviado ? (
        <div className="rise" style={{ marginTop: 16, background: T.blanco, border: `1px solid ${T.linea}`, borderRadius: 16, padding: 18 }}>
          <Lock size={18} color={T.verde} />
          <div className="disp" style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>Desbloquea tu ficha de cata</div>
          <p style={{ fontSize: 12.5, color: T.tenue, marginTop: 4, lineHeight: 1.5 }}>
            Déjanos tu correo y te enviamos tu Guía de Cata Quadro — además te suma tu primer punto en el Club.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.linea}`, borderRadius: 12, padding: "10px 12px" }}>
              <Mail size={15} color={T.tenue} />
              <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="tucorreo@email.com"
                style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} />
            </div>
          </div>
          <button onClick={() => { if (valor.includes("@")) { setEmail(valor); setEnviado(true); } }} className="press" style={{
            marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
            background: T.verde, color: T.crema, fontSize: 13.5, fontWeight: 700,
          }}>Quiero mi guía</button>
        </div>
      ) : (
        <>
          <div className="pop" style={{ marginTop: 16, background: T.blanco, border: `1px solid ${T.linea}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: T.tenue, textTransform: "uppercase" }}>Nivel actual</div>
                <div className="disp" style={{ fontSize: 18, fontWeight: 700 }}>{nivel.nombre}</div>
              </div>
              <div className="disp" style={{ fontSize: 26, fontWeight: 700, color: T.verde }}>{puntos}<span style={{ fontSize: 12, color: T.tenue, fontWeight: 400 }}> pts</span></div>
            </div>
            <p style={{ fontSize: 12.5, marginTop: 8, color: T.ink }}>{nivel.beneficio}</p>
          </div>
          <div style={{ marginTop: 14 }}>
            {CLUB_NIVELES.map((n) => (
              <div key={n.nombre} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.linea}` }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                  background: puntos >= n.desde ? T.verde : T.linea, color: puntos >= n.desde ? T.crema : T.tenue,
                }}>{puntos >= n.desde && <Check size={13} />}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{n.nombre} <span className="mono" style={{ fontSize: 10, color: T.tenue, fontWeight: 400 }}>· {n.desde}+ pts</span></div>
                  <div style={{ fontSize: 11.5, color: T.tenue }}>{n.beneficio}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function Carrito({ carrito, cerrar, quitar, confirmar }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40 }}>
      <div onClick={cerrar} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }} />
      <div className="sheet" style={{
        position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "78%", background: T.crema,
        borderRadius: "22px 22px 0 0", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 10px" }}>
          <div className="disp" style={{ fontSize: 17, fontWeight: 700 }}>Tu pedido</div>
          <button onClick={cerrar} className="press" style={{ ...btnMini, width: 30, height: 30, borderRadius: 9 }}><X size={15} /></button>
        </div>
        {carrito.length === 0 ? (
          <p style={{ padding: "0 20px 24px", fontSize: 13, color: T.tenue }}>Aún no agregaste nada de la carta.</p>
        ) : (
          <>
            <div className="qc-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
              {[...new Set(carrito)].map((it) => {
                const n = carrito.filter((c) => c === it).length;
                return (
                  <div key={it} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.linea}` }}>
                    <span style={{ fontSize: 13.5 }}>{it} <span className="mono" style={{ fontSize: 11, color: T.tenue }}>×{n}</span></span>
                    <button onClick={() => quitar(it)} className="press" style={{ ...btnMini, width: 26, height: 26, borderRadius: 8 }}><Minus size={13} /></button>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 20 }}>
              <button onClick={confirmar} className="press" style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
                background: T.verde, color: T.crema, fontSize: 14, fontWeight: 700,
              }}>Confirmar pedido</button>
              <p style={{ fontSize: 10.5, color: T.tenue, textAlign: "center", marginTop: 8 }}>Precios sujetos a confirmación en caja · Pago en app próximamente</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Ticket({ n, cerrar }) {
  const [paso, setPaso] = useState(0);
  const pasos = ["Recibido en barra", "Moliendo", "Extrayendo", "Listo para retirar"];
  useEffect(() => {
    if (paso >= pasos.length - 1) return;
    const t = setTimeout(() => setPaso((p) => p + 1), 2000);
    return () => clearTimeout(t);
  }, [paso]);

  return (
    <div style={{ position: "absolute", inset: 0, background: T.crema, zIndex: 50, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="pop" style={{ textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 20 }}>
          <div className={paso < 3 ? "pulse" : ""} style={{
            width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center",
            border: `2px solid ${T.verde}`,
          }}>{paso === 3 ? <Check size={30} color={T.verde} /> : <Coffee size={28} color={T.verde} />}</div>
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: T.dorado, textTransform: "uppercase" }}>Orden</div>
        <div className="disp" style={{ fontSize: 48, lineHeight: 1, margin: "6px 0 20px", fontWeight: 700 }}>#{n}</div>
        <div style={{ textAlign: "left", maxWidth: 260, margin: "0 auto" }}>
          {pasos.map((p, i) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, opacity: i <= paso ? 1 : .35 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", background: i <= paso ? T.verde : "transparent", border: `1px solid ${i <= paso ? T.verde : T.linea}`, color: T.crema }}>{i <= paso && <Check size={12} />}</span>
              <span style={{ fontSize: 14, fontWeight: i === paso ? 700 : 400 }}>{p}</span>
            </div>
          ))}
        </div>
        <button onClick={cerrar} className="press" style={{ marginTop: 22, padding: "13px 26px", borderRadius: 99, cursor: "pointer", border: `1px solid ${T.linea}`, background: "transparent", color: T.ink, fontSize: 14 }}>Volver a la carta</button>
      </div>
    </div>
  );
}

/* ============================ APP ============================ */

export default function QuadroCafe() {
  const [tab, setTab] = useState("inicio");
  const [carrito, setCarrito] = useState([]);
  const [verCarrito, setVerCarrito] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [fincaActiva, setFincaActiva] = useState(FINCAS[0]);
  const [email, setEmail] = useState("");
  const [splash, setSplash] = useState(true);

  useEffect(() => { const t = setTimeout(() => setSplash(false), 1500); return () => clearTimeout(t); }, []);

  const add = (it) => setCarrito((c) => [...c, it]);
  const quitar = (it) => setCarrito((c) => { const i = c.findIndex((x) => x === it); if (i < 0) return c; const n = [...c]; n.splice(i, 1); return n; });

  const TABS = [
    { k: "inicio", t: "Inicio", i: Coffee },
    { k: "menu", t: "Carta", i: ShoppingBag },
    { k: "fincas", t: "Fincas", i: Mountain },
    { k: "club", t: "Club", i: Award },
    { k: "lab", t: "Lab", i: Sliders },
  ];

  return (
    <div className="qc" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: T.ink, padding: 0 }}>
      <style>{css}</style>
      <div style={{ position: "relative", width: "100%", maxWidth: 430, height: "100vh", maxHeight: 940, background: T.crema, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {splash && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: T.verde, zIndex: 60 }}>
            <div className="pop" style={{ textAlign: "center", color: T.crema }}>
              <div style={{ display: "grid", placeItems: "center" }}>
                <Marca size={72} ring />
              </div>
              <div className="disp" style={{ fontSize: 26, marginTop: 14, fontWeight: 700 }}>QUADRO CAFÉ</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: ".24em", marginTop: 6, textTransform: "uppercase", opacity: .8 }}>Los Palos Grandes · Caracas</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Marca size={26} />
            <span className="disp" style={{ fontSize: 15, fontWeight: 700 }}>Quadro Café</span>
          </div>
          <button onClick={() => setVerCarrito(true)} className="press" aria-label="Ver pedido" style={{
            position: "relative", ...btnMini, width: 36, height: 36, borderRadius: 11,
            borderColor: carrito.length ? T.verde : T.linea,
          }}>
            <ShoppingBag size={16} />
            {carrito.length > 0 && (
              <span className="mono pop" style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 99, background: T.verde, color: T.crema, fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center" }}>{carrito.length}</span>
            )}
          </button>
        </div>

        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div key={tab} className="rise" style={{ height: "100%" }}>
            {tab === "inicio" && <Inicio ir={setTab} />}
            {tab === "menu" && <Menu carrito={carrito} add={add} />}
            {tab === "fincas" && <Fincas activa={fincaActiva} setActiva={setFincaActiva} />}
            {tab === "club" && <Club email={email} setEmail={setEmail} />}
            {tab === "lab" && <Laboratorio />}
            {tab === "aula" && <Academia />}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-around", borderTop: `1px solid ${T.linea}`, background: T.blanco, padding: "9px 4px 12px" }}>
          {TABS.map((x) => {
            const Icono = x.i, on = tab === x.k;
            return (
              <button key={x.k} onClick={() => setTab(x.k)} className="press" style={{
                background: "none", border: "none", cursor: "pointer", padding: "5px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: on ? T.verde : T.tenue,
              }}>
                <Icono size={19} />
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase" }}>{x.t}</span>
                <span style={{ width: on ? 14 : 0, height: 2, borderRadius: 99, background: T.verde, transition: "width .25s" }} />
              </button>
            );
          })}
        </div>

        {verCarrito && <Carrito carrito={carrito} cerrar={() => setVerCarrito(false)} quitar={quitar}
          confirmar={() => { setTicket(Math.floor(100 + Math.random() * 800)); setVerCarrito(false); setCarrito([]); }} />}
        {ticket && <Ticket n={ticket} cerrar={() => setTicket(null)} />}
      </div>
    </div>
  );
}
