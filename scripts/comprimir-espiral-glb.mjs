/* Comprime public/models/espiral.glb (el cono del dripper).
 *
 * El original pesaba 6,88 MB y el reparto era claro: 5,85 MB de texturas
 * (las cuatro a 2048×2048, el normal map en PNG él solo 3,5 MB) contra
 * 1,04 MB de geometría. El modelo se dibuja a 230 px en Lab, 132 px en la
 * tarjeta de Inicio y 340 px en el hero — con devicePixelRatio 2 son ~460 px
 * como máximo, así que 2048² es entre 4 y 16 veces más de lo que la pantalla
 * puede mostrar. Ahí está casi todo el ahorro.
 *
 * MESHOPT, NO DRACO — y no es una preferencia estética. El decoder de Draco
 * de three.js referencia sus .wasm/.js con `new URL(..., import.meta.url)`,
 * un patrón que Vite detecta en build time y empaqueta como assets propios,
 * duplicados (hace lo mismo para la ruta genérica y para la variante "gltf/"),
 * sin importar que en runtime siempre se sobreescriba esa ruta. Eso agregaba
 * ~1 MB de peso muerto que el service worker además precachea. El decoder de
 * meshopt lleva el WASM embebido en el propio módulo JS (~29 KB), sin asset
 * aparte. Este razonamiento ya estaba documentado en el repo para el
 * `dripper.glb` de una sesión anterior; se mantiene.
 *
 * El normal map se trata aparte del resto: es el que dibuja las aristas del
 * cono, o sea justo el detalle que hay que conservar. Se probaron tres
 * variantes contra el original, midiendo la diferencia por píxel en 8
 * azimuts de cámara (el hero orbita, y los artefactos de un normal map con
 * pérdida se delatan al cambiar el ángulo de luz, no en una sola pose):
 *
 *     normal WebP sin pérdida  → 641 KB, diferencia media 1,19/255
 *     normal WebP calidad 95   → 395 KB, diferencia media 1,97/255
 *     normal WebP calidad 90   → 375 KB, diferencia media 2,10/255
 *
 * Ninguna muestra bandeado ni facetas en ningún ángulo; la diferencia de
 * fondo (~1/255) ya la ponen los mapas de color y la cuantización de
 * geometría, no el normal map. Se eligió calidad 95: 0,8/255 de diferencia
 * extra sobre el lossless — muy por debajo del umbral perceptible — a cambio
 * de 246 KB menos en el asset que carga la primera pantalla. Si alguna vez
 * hay que ser conservador, subir NORMAL_CALIDAD a `lossless`.
 *
 * El original siempre es recuperable desde el historial de git.
 *
 * Uso:  npm run modelo:comprimir
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, EXTTextureWebP } from "@gltf-transform/extensions";
import { meshopt, textureCompress, dedup, prune } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELO = path.join(raiz, "public/models/espiral.glb");

// Lado máximo de textura. El uso más grande en pantalla es el hero (340 px
// lógicos, ~680 físicos), pero el modelo ocupa una fracción de ese cuadro y
// está siempre en movimiento o de fondo: 512 no muestra diferencia a ojo y
// divide el peso por ~16 respecto a 2048.
const LADO = 512;
// Calidad WebP del normal map — ver la medición en el encabezado.
const NORMAL_CALIDAD = 95;

await MeshoptEncoder.ready;

// EXT_texture_webp hay que registrarlo o el .glb sale con imágenes WebP sin
// declarar la extensión que las habilita: fuera de spec, y un loader
// estricto no sabría leerlas.
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, EXTTextureWebP])
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });

const antes = fs.statSync(MODELO).size;
const doc = await io.read(MODELO);

// El normal map se separa por su slot real en el material, no por nombre de
// archivo: los nombres del .glb ("normal", "Image_0"…) son los que dejó el
// exportador y no hay que confiar en ellos.
const normales = new Set();
for (const material of doc.getRoot().listMaterials()) {
  const tex = material.getNormalTexture();
  if (tex) normales.add(tex);
}

await doc.transform(
  dedup(),
  // prune() además pliega texturas de color uniforme al factor del material.
  // Aquí eso elimina el emissiveTexture, que se verificó negro puro en todos
  // sus píxeles (min = max = 0 en los tres canales): no aportaba nada, así
  // que quitarlo es exactamente equivalente y ahorra 65 KB.
  prune(),
  // Mapas de color (base, emisivo, metallic-roughness): WebP con pérdida.
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    resize: [LADO, LADO],
    quality: 82,
    slots: /^(?!normalTexture).*$/,
  }),
  // Normal map: calidad alta y aparte del resto, por lo medido arriba.
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    resize: [LADO, LADO],
    quality: NORMAL_CALIDAD,
    slots: /^normalTexture$/,
  }),
  // Geometría: weld + cuantización + EXT_meshopt_compression en un paso.
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);

await io.write(MODELO, doc);

const despues = fs.statSync(MODELO).size;
const kb = (n) => (n / 1024).toFixed(0) + " KB";
console.log(`espiral.glb  ${kb(antes)} → ${kb(despues)}  (${(100 - (despues / antes) * 100).toFixed(1)}% menos, ${(antes / despues).toFixed(1)}× más liviano)`);

for (const tex of doc.getRoot().listTextures()) {
  const img = tex.getImage();
  console.log(`  ${tex.getName() || "(sin nombre)"}  ${tex.getMimeType()}  ${kb(img.byteLength)}${normales.has(tex) ? `  [normal, calidad ${NORMAL_CALIDAD}]` : ""}`);
}
