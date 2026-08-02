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

   Regenerate the *.webp files with the sharp-based script used for
   this pass (see git history) if the source JPGs ever change —
   this file only wires up the already-generated outputs, it does
   not generate them.
   ============================================================ */

import heroDispenserJpg from "../assets/hero-dispenser.jpg";
import heroDispenser480 from "../assets/hero-dispenser-480.webp";
import heroDispenser900 from "../assets/hero-dispenser-900.webp";
import heroDispenser1400 from "../assets/hero-dispenser-1400.webp";

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

export const ASSET_MANIFEST = {
  "hero-dispenser": {
    jpg: heroDispenserJpg,
    webp480: heroDispenser480,
    webp900: heroDispenser900,
    webp1400: heroDispenser1400,
    color: "#4e4c3e",
    width: 1400,
    height: 1011,
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
