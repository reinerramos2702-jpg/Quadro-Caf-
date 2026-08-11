/* Prepara una imagen para <ResponsiveImg>: genera las tres variantes WebP,
 * lee el color dominante y muestra la entrada lista para pegar en
 * src/data/assetManifest.js.
 *
 * Existe porque el pipeline de assets se corrió una sola vez y quedó sin
 * script en el repo (el manifiesto se integró a mano). Sin esto, cada imagen
 * nueva obliga a reconstruir a ojo cuatro imports y una entrada.
 *
 * Uso:  npm run assets:generar src/assets/menu-espresso.jpg
 *
 * Nunca sobre-escala: si la fuente es más angosta que un breakpoint, esa
 * variante se emite al ancho nativo (mismo criterio que el pase original).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANCHOS = [480, 900, 1400];

// Relación de los banners de Carta y Laboratorio. Solo se usa para avisar si
// la fuente no la respeta — el recorte lo hace object-fit:cover en el
// navegador, este script no recorta nada.
const BANNER_RATIO = 390 / 120;

const entrada = process.argv[2];
if (!entrada) {
  console.error("Falta la ruta de la imagen.\n  npm run assets:generar src/assets/mi-imagen.jpg");
  process.exit(1);
}

const abs = path.resolve(raiz, entrada);
if (!fs.existsSync(abs)) {
  console.error(`No existe: ${abs}`);
  process.exit(1);
}

const dir = path.dirname(abs);
const id = path.basename(abs, path.extname(abs));
const src = sharp(abs);
const { width, height } = await src.metadata();

const { dominant } = await src.stats();
const hex = "#" + [dominant.r, dominant.g, dominant.b]
  .map((v) => v.toString(16).padStart(2, "0")).join("");

for (const w of ANCHOS) {
  const destino = path.join(dir, `${id}-${w}.webp`);
  await sharp(abs).resize({ width: Math.min(w, width), withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(destino);
  const kb = (fs.statSync(destino).size / 1024).toFixed(0);
  console.log(`  ${path.relative(raiz, destino)}  ${Math.min(w, width)}w  ${kb} KB`);
}

const ratio = width / height;
console.log(`\n${id}: ${width}x${height} (ratio ${ratio.toFixed(3)}), color dominante ${hex}`);
if (Math.abs(ratio - BANNER_RATIO) > 0.05) {
  const visible = Math.round(height * Math.min(1, (120 / 390) * ratio));
  console.log(
    `AVISO: los banners son 3.25:1. Con esta fuente, object-fit:cover mostraría\n` +
    `       una franja central de ${width}x${visible} — se recorta el ${(100 - visible / height * 100).toFixed(0)}% del alto.`,
  );
}

const camel = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
console.log(`
--- imports para src/data/assetManifest.js ---
import ${camel}Jpg from "../assets/${path.basename(abs)}";
${ANCHOS.map((w) => `import ${camel}${w} from "../assets/${id}-${w}.webp";`).join("\n")}

--- entrada (reemplaza el slot reservado si existe) ---
  "${id}": {
    jpg: ${camel}Jpg,
${ANCHOS.map((w) => `    webp${w}: ${camel}${w},`).join("\n")}
    color: "${hex}",
    width: ${width},
    height: ${height},
  },`);
