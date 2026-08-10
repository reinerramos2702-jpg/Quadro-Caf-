/* Genera src/assets/fonts-derivados/VIOLA-Acentos.otf
 *
 * Por qué existe: VIOLA (el lettering real del logo) trae 76 glifos y
 * NINGUNA vocal acentuada ni Ñ/Ü. Hasta ahora la Á/Í/Ó/É caían al
 * siguiente font-family del stack (Fraunces), así que dentro de una misma
 * palabra —"TRIÁNGULO", "SIFÓN", "CAFÉ"— la vocal acentuada se dibujaba
 * con OTRA tipografía. `font-size-adjust`/`text-transform` igualaban el
 * tamaño pero no el carácter del glifo, que es justo lo que se nota.
 *
 * Qué hace: toma el glifo BASE real de VIOLA (la misma A, la misma O) y le
 * compone encima un acento dibujado a la medida de la fuente — es decir,
 * el fallback ya no es "otra tipografía", es la propia VIOLA con tilde.
 * El resultado es una fuente aparte, mínima (solo los glifos que faltan),
 * que se declara DESPUÉS de VIOLA en el stack: el navegador solo la usa
 * para los codepoints que VIOLA no tiene.
 *
 * VIOLA.otf original NO se toca (carpeta protegida) — esto es un derivado.
 *
 * Uso:  node scripts/generar-acentos-viola.mjs
 * Solo hace falta re-correrlo si cambia VIOLA.otf o el dibujo del acento.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEN = path.join(raiz, "src/assets/fonts/VIOLA.otf");
const DESTINO = path.join(raiz, "src/assets/fonts-derivados/VIOLA-Acentos.otf");

const buf = fs.readFileSync(ORIGEN);
const viola = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const UPEM = viola.unitsPerEm;          // 2048
const ASC = viola.ascender;             // 1987
const DESC = viola.descender;           // -373
const CAP = viola.tables.os2.sCapHeight; // 1612

// Medidas tomadas de la propia VIOLA, no inventadas: el asta de la I da el
// trazo grueso, el guion da la línea fina (es una didone: mucho contraste),
// y el punto es un círculo perfecto de diámetro = asta.
const porNombre = {};
for (let i = 0; i < viola.glyphs.length; i++) {
  const g = viola.glyphs.get(i);
  porNombre[g.name] = g;
}
const ASTA = porNombre.I.getBoundingBox().x2;          // 269 — trazo grueso
const PUNTO = porNombre.period.path.commands;          // círculo Ø269 en (0,0)-(269,269)

// Banda donde vive el acento: arranca sobre la altura de mayúscula y no
// pasa del ascendente declarado, para que ninguna línea lo recorte.
const BANDA_Y = CAP + 110;                              // 1722
const BANDA_ALTO = ASC - BANDA_Y - 25;                  // ~240

/* ---------- dibujo de los acentos (centrados en x = 0) ---------- */

// Acute: cuña inclinada, más gruesa arriba que abajo — el remate típico de
// una didone, coherente con el contraste de VIOLA.
function acute() {
  const h = BANDA_ALTO;
  // Contraste grueso-arriba / fino-abajo como el resto de la fuente, pero
  // no tan fino que el acento desaparezca a 14-19px (el tamaño real del
  // header y de los nombres de producto).
  const grosorAbajo = ASTA * 0.58;
  const grosorArriba = ASTA * 0.92;
  const inclinacion = h * 0.62;
  const ancho = inclinacion + grosorArriba;
  const x0 = -ancho / 2;
  const y0 = BANDA_Y;
  return [
    { type: "M", x: x0, y: y0 },
    { type: "L", x: x0 + grosorAbajo, y: y0 },
    { type: "L", x: x0 + inclinacion + grosorArriba, y: y0 + h },
    { type: "L", x: x0 + inclinacion, y: y0 + h },
    { type: "Z" },
  ];
}

// Diéresis: dos veces el punto real de VIOLA (mismo círculo, escalado),
// no dos círculos dibujados desde cero.
function dieresis() {
  const escala = (BANDA_ALTO * 0.85) / ASTA;
  const d = ASTA * escala;
  const separacion = d * 1.6;
  const cmds = [];
  for (const signo of [-1, 1]) {
    const dx = signo * separacion / 2 - d / 2;
    const dy = BANDA_Y + (BANDA_ALTO - d) / 2;
    for (const c of PUNTO) {
      if (c.type === "Z") { cmds.push({ type: "Z" }); continue; }
      const n = { type: c.type, x: c.x * escala + dx, y: c.y * escala + dy };
      if (c.type === "C") {
        n.x1 = c.x1 * escala + dx; n.y1 = c.y1 * escala + dy;
        n.x2 = c.x2 * escala + dx; n.y2 = c.y2 * escala + dy;
      }
      cmds.push(n);
    }
  }
  return cmds;
}

// Tilde: onda seno convertida en trazo con grosor modulado (fino en las
// puntas, grueso en el centro) mediante desplazamiento perpendicular —
// muestreada, no aproximada a ojo con béziers sueltas.
function tilde() {
  const W = ASTA * 2.9;
  const amplitud = BANDA_ALTO * 0.24;
  const grosorMax = ASTA * 0.62;
  const grosorMin = ASTA * 0.3;
  const N = 48;
  const centroY = BANDA_Y + BANDA_ALTO / 2;

  const eje = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = -W / 2 + t * W;
    const y = centroY + amplitud * Math.sin(t * Math.PI * 2);
    const dy = amplitud * (Math.PI * 2 / W) * Math.cos(t * Math.PI * 2);
    const len = Math.hypot(1, dy);
    // Grosor: mínimo en las puntas, máximo en el centro.
    const g = (grosorMin + (grosorMax - grosorMin) * Math.sin(t * Math.PI)) / 2;
    eje.push({ x, y, nx: -dy / len * g, ny: 1 / len * g });
  }

  const cmds = [];
  eje.forEach((p, i) => cmds.push({ type: i === 0 ? "M" : "L", x: p.x + p.nx, y: p.y + p.ny }));
  for (let i = eje.length - 1; i >= 0; i--) {
    const p = eje[i];
    cmds.push({ type: "L", x: p.x - p.nx, y: p.y - p.ny });
  }
  cmds.push({ type: "Z" });
  return cmds;
}

const ACENTOS = { acute, dieresis, tilde };

/* ---------- composición ---------- */

function desplazar(cmds, dx) {
  return cmds.map((c) => {
    if (c.type === "Z") return { type: "Z" };
    const n = { type: c.type, x: c.x + dx, y: c.y };
    if (c.type === "C") { n.x1 = c.x1 + dx; n.y1 = c.y1; n.x2 = c.x2 + dx; n.y2 = c.y2; }
    if (c.type === "Q") { n.x1 = c.x1 + dx; n.y1 = c.y1; }
    return n;
  });
}

// VIOLA es unicase: 'a' y 'A' comparten contorno, así que un solo glifo
// sirve para el codepoint alto y el bajo (además .disp fuerza uppercase).
const COMPUESTOS = [
  { base: "A", acento: "acute", nombre: "Aacute", unicodes: [0x00c1, 0x00e1] },
  { base: "E", acento: "acute", nombre: "Eacute", unicodes: [0x00c9, 0x00e9] },
  { base: "I", acento: "acute", nombre: "Iacute", unicodes: [0x00cd, 0x00ed] },
  { base: "O", acento: "acute", nombre: "Oacute", unicodes: [0x00d3, 0x00f3] },
  { base: "U", acento: "acute", nombre: "Uacute", unicodes: [0x00da, 0x00fa] },
  { base: "U", acento: "dieresis", nombre: "Udieresis", unicodes: [0x00dc, 0x00fc] },
  { base: "N", acento: "tilde", nombre: "Ntilde", unicodes: [0x00d1, 0x00f1] },
];

const glifos = [new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 0, path: new opentype.Path() })];

for (const spec of COMPUESTOS) {
  const base = porNombre[spec.base];
  const bb = base.getBoundingBox();
  const centroBase = (bb.x1 + bb.x2) / 2;

  const path = new opentype.Path();
  path.commands = [
    ...base.path.commands.map((c) => ({ ...c })),
    ...desplazar(ACENTOS[spec.acento](), centroBase),
  ];

  glifos.push(new opentype.Glyph({
    name: spec.nombre,
    unicodes: spec.unicodes,
    advanceWidth: base.advanceWidth,
    path,
  }));
}

const fuente = new opentype.Font({
  familyName: "VIOLA Acentos",
  styleName: "Regular",
  unitsPerEm: UPEM,
  ascender: ASC,
  descender: DESC,
  glyphs: glifos,
});
fuente.tables.os2.sCapHeight = CAP;
fuente.tables.os2.sxHeight = viola.tables.os2.sxHeight;

fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
fs.writeFileSync(DESTINO, Buffer.from(fuente.toArrayBuffer()));

console.log(`OK  ${path.relative(raiz, DESTINO)}  ${glifos.length - 1} glifos  ${fs.statSync(DESTINO).size} bytes`);
console.log(`    upem=${UPEM} cap=${CAP} banda=${BANDA_Y}..${BANDA_Y + BANDA_ALTO} asta=${ASTA}`);
