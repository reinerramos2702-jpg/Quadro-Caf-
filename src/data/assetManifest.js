/* ============================================================
   assetManifest.js
   Static manifest of responsive image assets used by <ResponsiveImg>.
   Every entry provides:
     - jpg: the original full-size JPEG (fallback source)
     - webp480 / webp900 / webp1400: WebP variants at those widths
       (never upscaled past the source image's native resolution —
       some entries reuse the same file across widths when the
       source is smaller than a given breakpoint)
     - color: average/dominant color of the source image, used as
       a solid placeholder background while the image loads
     - width / height: native pixel dimensions of the source JPEG

   Regenerate the *.webp variants with `npm run assets:generar <archivo>`
   whenever a source image changes or a new one arrives — that script
   emits the three WebP widths, reads the dominant color and prints the
   entry to paste here. This file only wires up already-generated
   outputs, it does not generate them.

   RESERVED SLOTS (`placeholder: true`)
   An entry may instead reserve a slot that has no artwork yet: it
   declares only `color` + `width`/`height` (the intended box), no image
   sources. <ResponsiveImg> then paints a solid block of exactly the
   final geometry, so layout is already correct and dropping the real
   image in later changes nothing else. To fill one: add the imports,
   swap `placeholder: true` for the four source fields, and set
   width/height to the file's native size. Nothing at the call sites
   changes.
   ============================================================ */

import clubBoxJpg from "../assets/club-box.jpg";
import clubBox480 from "../assets/club-box-480.webp";
import clubBox900 from "../assets/club-box-900.webp";
import clubBox1400 from "../assets/club-box-1400.webp";

import menuPostresJpg from "../assets/menu-postres.jpg";
import menuPostres480 from "../assets/menu-postres-480.webp";
import menuPostres900 from "../assets/menu-postres-900.webp";
import menuPostres1400 from "../assets/menu-postres-1400.webp";

import menuIcedJpg from "../assets/menu-iced.jpg";
import menuIced480 from "../assets/menu-iced-480.webp";
import menuIced900 from "../assets/menu-iced-900.webp";
import menuIced1400 from "../assets/menu-iced-1400.webp";

import loteBourbonJpg from "../assets/lote-bourbon.jpg";
import loteBourbon480 from "../assets/lote-bourbon-480.webp";
import loteBourbon900 from "../assets/lote-bourbon-900.webp";
import loteBourbon1400 from "../assets/lote-bourbon-1400.webp";

import loteVillaNuevaJpg from "../assets/lote-villa-nueva.jpg";
import loteVillaNueva480 from "../assets/lote-villa-nueva-480.webp";
import loteVillaNueva900 from "../assets/lote-villa-nueva-900.webp";
import loteVillaNueva1400 from "../assets/lote-villa-nueva-1400.webp";

/* Caja real de los banners de 3.25:1 (Carta y Laboratorio), en px CSS a su
   ancho máximo: la columna de la app llega a 430 y el wrapper le quita 40 de
   padding lateral. Sirve como `width`/`height` de los slots reservados para
   que la caja sólida ya tenga la geometría final. */
const BANNER = { width: 390, height: 120 };

export const ASSET_MANIFEST = {
  /* Slot reservado — banner superior de Laboratorio.
     Antes existía un `hero-dispenser.jpg` real de 1400x1011 (sigue en
     src/assets/, sin usar): era vertical y en esta caja de 3.25:1 perdía el
     78% de la imagen, así que se reemplaza por una foto encuadrada a medida
     en vez de recortar aquella. */
  "hero-dispenser": {
    placeholder: true,
    color: "#4e4c3e",
    ...BANNER,
  },
  /* Slots reservados — banners de categoría de Carta que hasta ahora no
     tenían imagen (ver CAT_IMG en App.jsx). */
  "menu-espresso": {
    placeholder: true,
    color: "#6f4b32",
    ...BANNER,
  },
  "menu-panaderia": {
    placeholder: true,
    color: "#b08b58",
    ...BANNER,
  },
  "club-box": {
    jpg: clubBoxJpg,
    webp480: clubBox480,
    webp900: clubBox900,
    webp1400: clubBox1400,
    color: "#737f7d",
    width: 1100,
    height: 794,
  },
  "menu-postres": {
    jpg: menuPostresJpg,
    webp480: menuPostres480,
    webp900: menuPostres900,
    webp1400: menuPostres1400,
    color: "#847154",
    width: 1100,
    height: 706,
  },
  "menu-iced": {
    jpg: menuIcedJpg,
    webp480: menuIced480,
    webp900: menuIced900,
    webp1400: menuIced1400,
    color: "#dbc49d",
    width: 700,
    height: 887,
  },
  "lote-bourbon": {
    jpg: loteBourbonJpg,
    webp480: loteBourbon480,
    webp900: loteBourbon900,
    webp1400: loteBourbon1400,
    color: "#ac9c8e",
    width: 700,
    height: 1066,
  },
  "lote-villa-nueva": {
    jpg: loteVillaNuevaJpg,
    webp480: loteVillaNueva480,
    webp900: loteVillaNueva900,
    webp1400: loteVillaNueva1400,
    color: "#8d8a87",
    width: 700,
    height: 1363,
  },
};
