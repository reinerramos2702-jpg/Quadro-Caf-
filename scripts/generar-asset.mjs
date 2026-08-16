/* Prepara una imagen para <ResponsiveImg>: genera el JPG de respaldo, las
 * variantes WebP responsivas y el color dominante, e imprime la entrada lista
 * para pegar en src/data/assetManifest.js.
 *
 * Existe porque el pipeline de assets se corrió una sola vez y quedó sin
 * script en el repo (el manifiesto se integró a mano). Sin esto, cada imagen
 * nueva obliga a reconstruir a ojo los imports y la entrada.
 *
 * Uso:  npm run assets:generar src/assets/menu-espresso.png
 *
 * Acepta PNG o JPG de entrada. Si es PNG, emite además un `.jpg` — el
 * <picture> necesita un fallback raster clásico, y un PNG fotográfico pesa
 * varias veces lo que el JPG equivalente.
 *
 * Nunca sobre-escala: si la fuente es más angosta que un breakpoint, esa
 * variante se emite al ancho nativo (mismo criterio que el pase original).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* 1170 y no 1400: el uso más grande de estos banners es 390 px CSS, así que
   1170 cubre hasta devicePixelRatio 3 y cualquier ancho mayor sería peso que
   ninguna pantalla llega a usar. Las entradas viejas del manifiesto siguen
   declarando 1400 — por eso el manifiesto lista sus anchos en vez de asumirlos. */
const ANCHOS = [480, 900, 1170];

// Relación de los banners de Carta y Laboratorio. Solo se usa para avisar si
// la fuente no la respeta — el recorte lo hace object-fit:cover en el
// navegador, este script no recorta nada.
const BANNER_RATIO = 390 / 120;

const entrada = process.argv[2];
if (!entrada) {
  console.error("Falta la ruta de la imagen.\n  npm run assets:generar src/assets/mi-imagen.png");
  process.exit(1);
}

const abs = path.resolve(raiz, entrada);
if (!fs.existsSync(abs)) {
  console.error(`No existe: ${abs}`);
  process.exit(1);
}

const dir = path.dirname(abs);
const ext = path.extname(abs);
const id = path.basename(abs, ext);
const { width, height } = await sharp(abs).metadata();
const { dominant } = await sharp(abs).stats();
const hex = "#" + [dominant.r, dominant.g, dominant.b]
  .map((v) => v.toString(16).padStart(2, "0")).join("");

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + " KB";

// Fallback raster. Si la fuente ya es JPG se usa tal cual.
let jpgNombre = path.basename(abs);
if (ext.toLowerCase() !== ".jpg" && ext.toLowerCase() !== ".jpeg") {
  jpgNombre = `${id}.jpg`;
  const destino = path.join(dir, jpgNombre);
  await sharp(abs).jpeg({ quality: 86, mozjpeg: true }).toFile(destino);
  console.log(`  ${path.relative(raiz, destino)}  ${width}w  ${kb(destino)}  (fallback)`);
}

const emitidos = [];
for (const w of ANCHOS) {
  const real = Math.min(w, width);
  const destino = path.join(dir, `${id}-${w}.webp`);
  await sharp(abs).resize({ width: real, withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(destino);
  emitidos.push({ w, real });
  console.log(`  ${path.relative(raiz, destino)}  ${real}w  ${kb(destino)}`);
}

const ratio = width / height;
console.log(`\n${id}: ${width}x${height} (ratio ${ratio.toFixed(3)}), color dominante ${hex}`);
if (Math.abs(ratio - BANNER_RATIO) > 0.05) {
  const visible = Math.round(width / BANNER_RATIO);
  const pct = (100 - visible / height * 100).toFixed(1);
  console.log(
    `AVISO: los banners son 3.25:1. Con esta fuente, object-fit:cover mostraría\n` +
    `       una franja central de ${width}x${visible} — se recorta el ${pct}% del alto.`,
  );
}

const camel = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
console.log(`
--- imports para src/data/assetManifest.js ---
import ${camel}Jpg from "../assets/${jpgNombre}";
${ANCHOS.map((w) => `import ${camel}${w} from "../assets/${id}-${w}.webp";`).join("\n")}

--- entrada (reemplaza el slot reservado si existe) ---
  "${id}": {
    jpg: ${camel}Jpg,
    webp: [${emitidos.map(({ w, real }) => `[${camel}${w}, ${real}]`).join(", ")}],
    color: "${hex}",
    width: ${width},
    height: ${height},
  },`);
