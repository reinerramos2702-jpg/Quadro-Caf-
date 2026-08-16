/* ============================================================
   assetManifest.js
   Static manifest of responsive image assets used by <ResponsiveImg>.
   Every entry provides:
     - jpg: raster fallback (the <img> source)
     - webp: [[import, width], …] — the WebP variants and their real pixel
       widths, in ascending order. It's a list and not fixed `webp480/900/…`
       fields because different assets top out at different widths: the
       banners cap at 1170 (390 CSS px × DPR 3, beyond which no screen can
       use the extra pixels) while older entries were generated at 1400.
     - color: average/dominant color of the source image, used as
       a solid placeholder background while the image loads
     - width / height: native pixel dimensions of the source

   Generate the variants with `npm run assets:generar <archivo>` whenever a
   source image changes or a new one arrives — that script emits the JPG
   fallback and the WebP widths, reads the dominant color and prints the
   entry to paste here. This file only wires up already-generated outputs.

   RESERVED SLOTS (`placeholder: true`)
   An entry may instead reserve a slot that has no artwork yet: it declares
   only `color` + `width`/`height` (the intended box), no image sources.
   <ResponsiveImg> then paints a solid block of exactly the final geometry,
   so layout is already correct and dropping the real image in later changes
   nothing else. To fill one: add the imports, swap `placeholder: true` for
   `jpg`/`webp`, and set width/height to the file's native size. Nothing at
   the call sites changes.
   ============================================================ */

import menuFiltradoJpg from "../assets/menu-filtrado.jpg";
import menuFiltrado480 from "../assets/menu-filtrado-480.webp";
import menuFiltrado900 from "../assets/menu-filtrado-900.webp";
import menuFiltrado1170 from "../assets/menu-filtrado-1170.webp";

import menuEspressoJpg from "../assets/menu-espresso.jpg";
import menuEspresso480 from "../assets/menu-espresso-480.webp";
import menuEspresso900 from "../assets/menu-espresso-900.webp";
import menuEspresso1170 from "../assets/menu-espresso-1170.webp";

import menuPanaderiaJpg from "../assets/menu-panaderia.jpg";
import menuPanaderia480 from "../assets/menu-panaderia-480.webp";
import menuPanaderia900 from "../assets/menu-panaderia-900.webp";
import menuPanaderia1170 from "../assets/menu-panaderia-1170.webp";

import menuPostresV2Jpg from "../assets/menu-postres-v2.jpg";
import menuPostresV2480 from "../assets/menu-postres-v2-480.webp";
import menuPostresV2900 from "../assets/menu-postres-v2-900.webp";
import menuPostresV21170 from "../assets/menu-postres-v2-1170.webp";

import menuFrioJpg from "../assets/menu-frio.jpg";
import menuFrio480 from "../assets/menu-frio-480.webp";
import menuFrio900 from "../assets/menu-frio-900.webp";
import menuFrio1170 from "../assets/menu-frio-1170.webp";

import labTubosJpg from "../assets/lab-tubos.jpg";
import labTubos480 from "../assets/lab-tubos-480.webp";
import labTubos900 from "../assets/lab-tubos-900.webp";
import labTubos1170 from "../assets/lab-tubos-1170.webp";

import clubBoxJpg from "../assets/club-box.jpg";
import clubBox480 from "../assets/club-box-480.webp";
import clubBox900 from "../assets/club-box-900.webp";
import clubBox1400 from "../assets/club-box-1400.webp";

import loteBourbonJpg from "../assets/lote-bourbon.jpg";
import loteBourbon480 from "../assets/lote-bourbon-480.webp";
import loteBourbon900 from "../assets/lote-bourbon-900.webp";
import loteBourbon1400 from "../assets/lote-bourbon-1400.webp";

import loteVillaNuevaJpg from "../assets/lote-villa-nueva.jpg";
import loteVillaNueva480 from "../assets/lote-villa-nueva-480.webp";
import loteVillaNueva900 from "../assets/lote-villa-nueva-900.webp";
import loteVillaNueva1400 from "../assets/lote-villa-nueva-1400.webp";

export const ASSET_MANIFEST = {
  /* Banners de 3.25:1 — los cinco de categoría de Carta más el de
     Laboratorio. Fotos encuadradas a medida para esta caja (2260x696, salvo
     `menu-espresso` a 2172x724), así que `cover` casi no recorta. */
  // Dispensadores de pared. Trae el logotipo dibujado en la foto, arriba a la
  // izquierda — por eso es la única de las seis que no lleva <Marca> encima.
  "menu-filtrado": {
    jpg: menuFiltradoJpg,
    webp: [[menuFiltrado480, 480], [menuFiltrado900, 900], [menuFiltrado1170, 1170]],
    color: "#283828",
    width: 2260,
    height: 696,
  },
  // Única de las seis a 3.00 en vez de 3.25: `cover` le recorta un 7.7% del
  // alto, repartido arriba y abajo. El bowl está centrado, así que no lo toca.
  "menu-espresso": {
    jpg: menuEspressoJpg,
    webp: [[menuEspresso480, 480], [menuEspresso900, 900], [menuEspresso1170, 1170]],
    color: "#080808",
    width: 2172,
    height: 724,
  },
  "menu-panaderia": {
    jpg: menuPanaderiaJpg,
    webp: [[menuPanaderia480, 480], [menuPanaderia900, 900], [menuPanaderia1170, 1170]],
    color: "#e8d8c8",
    width: 2260,
    height: 696,
  },
  // `-v2` para no pisar el render viejo `menu-postres`, que sigue en
  // src/assets/ por si el dueño lo quiere recuperar.
  "menu-postres-v2": {
    jpg: menuPostresV2Jpg,
    webp: [[menuPostresV2480, 480], [menuPostresV2900, 900], [menuPostresV21170, 1170]],
    color: "#b89878",
    width: 2260,
    height: 696,
  },
  "menu-frio": {
    jpg: menuFrioJpg,
    webp: [[menuFrio480, 480], [menuFrio900, 900], [menuFrio1170, 1170]],
    color: "#a8a8a8",
    width: 2260,
    height: 696,
  },
  // Tubos de grano en gradilla. Es la única sin logotipo dibujado, así que es
  // la que lleva <Marca> como capa CSS encima (ver `logo` en ResponsiveImg).
  "lab-tubos": {
    jpg: labTubosJpg,
    webp: [[labTubos480, 480], [labTubos900, 900], [labTubos1170, 1170]],
    color: "#888888",
    width: 2260,
    height: 696,
  },

  /* Renders anteriores. `club-box` y `lote-villa-nueva` no los consume ningún
     componente hoy; quedan disponibles (p. ej. para la ficha de lote de
     Fincas) y por eso siguen declarados. */
  "club-box": {
    jpg: clubBoxJpg,
    webp: [[clubBox480, 480], [clubBox900, 900], [clubBox1400, 1400]],
    color: "#737f7d",
    width: 1100,
    height: 794,
  },
  "lote-bourbon": {
    jpg: loteBourbonJpg,
    webp: [[loteBourbon480, 480], [loteBourbon900, 900], [loteBourbon1400, 1400]],
    color: "#ac9c8e",
    width: 700,
    height: 1066,
  },
  "lote-villa-nueva": {
    jpg: loteVillaNuevaJpg,
    webp: [[loteVillaNueva480, 480], [loteVillaNueva900, 900], [loteVillaNueva1400, 1400]],
    color: "#8d8a87",
    width: 700,
    height: 1363,
  },
};
