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
import productoAmericanoJpg from "../assets/producto-americano.jpg";
import productoAmericano480 from "../assets/producto-americano-480.webp";
import productoAmericano900 from "../assets/producto-americano-900.webp";
import productoAmericano1170 from "../assets/producto-americano-1170.webp";
import productoCapuccinoJpg from "../assets/producto-capuccino.jpg";
import productoCapuccino480 from "../assets/producto-capuccino-480.webp";
import productoCapuccino900 from "../assets/producto-capuccino-900.webp";
import productoCapuccino1170 from "../assets/producto-capuccino-1170.webp";
import productoCortadoJpg from "../assets/producto-cortado.jpg";
import productoCortado480 from "../assets/producto-cortado-480.webp";
import productoCortado900 from "../assets/producto-cortado-900.webp";
import productoCortado1170 from "../assets/producto-cortado-1170.webp";
import productoEspressoJpg from "../assets/producto-espresso.jpg";
import productoEspresso480 from "../assets/producto-espresso-480.webp";
import productoEspresso900 from "../assets/producto-espresso-900.webp";
import productoEspresso1170 from "../assets/producto-espresso-1170.webp";
import productoFlatWhiteJpg from "../assets/producto-flat-white.jpg";
import productoFlatWhite480 from "../assets/producto-flat-white-480.webp";
import productoFlatWhite900 from "../assets/producto-flat-white-900.webp";
import productoFlatWhite1170 from "../assets/producto-flat-white-1170.webp";
import productoLattePistachoJpg from "../assets/producto-latte-pistacho.jpg";
import productoLattePistacho480 from "../assets/producto-latte-pistacho-480.webp";
import productoLattePistacho900 from "../assets/producto-latte-pistacho-900.webp";
import productoLattePistacho1170 from "../assets/producto-latte-pistacho-1170.webp";
import productoLatteVainillaJpg from "../assets/producto-latte-vainilla.jpg";
import productoLatteVainilla480 from "../assets/producto-latte-vainilla-480.webp";
import productoLatteVainilla900 from "../assets/producto-latte-vainilla-900.webp";
import productoLatteVainilla1170 from "../assets/producto-latte-vainilla-1170.webp";
import productoLatteJpg from "../assets/producto-latte.jpg";
import productoLatte480 from "../assets/producto-latte-480.webp";
import productoLatte900 from "../assets/producto-latte-900.webp";
import productoLatte1170 from "../assets/producto-latte-1170.webp";
import productoMacchiatoJpg from "../assets/producto-macchiato.jpg";
import productoMacchiato480 from "../assets/producto-macchiato-480.webp";
import productoMacchiato900 from "../assets/producto-macchiato-900.webp";
import productoMacchiato1170 from "../assets/producto-macchiato-1170.webp";
import productoMatchaLatteIceJpg from "../assets/producto-matcha-latte-ice.jpg";
import productoMatchaLatteIce480 from "../assets/producto-matcha-latte-ice-480.webp";
import productoMatchaLatteIce900 from "../assets/producto-matcha-latte-ice-900.webp";
import productoMatchaLatteIce1170 from "../assets/producto-matcha-latte-ice-1170.webp";
import productoMatchaLatteJpg from "../assets/producto-matcha-latte.jpg";
import productoMatchaLatte480 from "../assets/producto-matcha-latte-480.webp";
import productoMatchaLatte900 from "../assets/producto-matcha-latte-900.webp";
import productoMatchaLatte1170 from "../assets/producto-matcha-latte-1170.webp";
import productoInfusionHotBlueberryJpg from "../assets/producto-infusion-hot-blueberry.jpg";
import productoInfusionHotBlueberry480 from "../assets/producto-infusion-hot-blueberry-480.webp";
import productoInfusionHotBlueberry900 from "../assets/producto-infusion-hot-blueberry-900.webp";
import productoInfusionHotBlueberry1170 from "../assets/producto-infusion-hot-blueberry-1170.webp";
import productoInfusionHotFireberryJpg from "../assets/producto-infusion-hot-fireberry.jpg";
import productoInfusionHotFireberry480 from "../assets/producto-infusion-hot-fireberry-480.webp";
import productoInfusionHotFireberry900 from "../assets/producto-infusion-hot-fireberry-900.webp";
import productoInfusionHotFireberry1170 from "../assets/producto-infusion-hot-fireberry-1170.webp";
import productoInfusionHotGingerPeachJpg from "../assets/producto-infusion-hot-ginger-peach.jpg";
import productoInfusionHotGingerPeach480 from "../assets/producto-infusion-hot-ginger-peach-480.webp";
import productoInfusionHotGingerPeach900 from "../assets/producto-infusion-hot-ginger-peach-900.webp";
import productoInfusionHotGingerPeach1170 from "../assets/producto-infusion-hot-ginger-peach-1170.webp";
import productoInfusionHotLemonGingerJpg from "../assets/producto-infusion-hot-lemon-ginger.jpg";
import productoInfusionHotLemonGinger480 from "../assets/producto-infusion-hot-lemon-ginger-480.webp";
import productoInfusionHotLemonGinger900 from "../assets/producto-infusion-hot-lemon-ginger-900.webp";
import productoInfusionHotLemonGinger1170 from "../assets/producto-infusion-hot-lemon-ginger-1170.webp";
import productoInfusionHotStrawberryKiwiJpg from "../assets/producto-infusion-hot-strawberry-kiwi.jpg";
import productoInfusionHotStrawberryKiwi480 from "../assets/producto-infusion-hot-strawberry-kiwi-480.webp";
import productoInfusionHotStrawberryKiwi900 from "../assets/producto-infusion-hot-strawberry-kiwi-900.webp";
import productoInfusionHotStrawberryKiwi1170 from "../assets/producto-infusion-hot-strawberry-kiwi-1170.webp";
import productoInfusionIceBlueberryJpg from "../assets/producto-infusion-ice-blueberry.jpg";
import productoInfusionIceBlueberry480 from "../assets/producto-infusion-ice-blueberry-480.webp";
import productoInfusionIceBlueberry900 from "../assets/producto-infusion-ice-blueberry-900.webp";
import productoInfusionIceBlueberry1170 from "../assets/producto-infusion-ice-blueberry-1170.webp";
import productoInfusionIceFireberryJpg from "../assets/producto-infusion-ice-fireberry.jpg";
import productoInfusionIceFireberry480 from "../assets/producto-infusion-ice-fireberry-480.webp";
import productoInfusionIceFireberry900 from "../assets/producto-infusion-ice-fireberry-900.webp";
import productoInfusionIceFireberry1170 from "../assets/producto-infusion-ice-fireberry-1170.webp";
import productoInfusionIceGingerPeachJpg from "../assets/producto-infusion-ice-ginger-peach.jpg";
import productoInfusionIceGingerPeach480 from "../assets/producto-infusion-ice-ginger-peach-480.webp";
import productoInfusionIceGingerPeach900 from "../assets/producto-infusion-ice-ginger-peach-900.webp";
import productoInfusionIceGingerPeach1170 from "../assets/producto-infusion-ice-ginger-peach-1170.webp";
import productoInfusionIceLemonGingerJpg from "../assets/producto-infusion-ice-lemon-ginger.jpg";
import productoInfusionIceLemonGinger480 from "../assets/producto-infusion-ice-lemon-ginger-480.webp";
import productoInfusionIceLemonGinger900 from "../assets/producto-infusion-ice-lemon-ginger-900.webp";
import productoInfusionIceLemonGinger1170 from "../assets/producto-infusion-ice-lemon-ginger-1170.webp";
import productoInfusionIceStrawberryKiwiJpg from "../assets/producto-infusion-ice-strawberry-kiwi.jpg";
import productoInfusionIceStrawberryKiwi480 from "../assets/producto-infusion-ice-strawberry-kiwi-480.webp";
import productoInfusionIceStrawberryKiwi900 from "../assets/producto-infusion-ice-strawberry-kiwi-900.webp";
import productoInfusionIceStrawberryKiwi1170 from "../assets/producto-infusion-ice-strawberry-kiwi-1170.webp";
import productoFrappeNutellaJpg from "../assets/producto-frappe-nutella.jpg";
import productoFrappeNutella480 from "../assets/producto-frappe-nutella-480.webp";
import productoFrappeNutella900 from "../assets/producto-frappe-nutella-900.webp";
import productoFrappeNutella1170 from "../assets/producto-frappe-nutella-1170.webp";
import productoFrappeOreoJpg from "../assets/producto-frappe-oreo.jpg";
import productoFrappeOreo480 from "../assets/producto-frappe-oreo-480.webp";
import productoFrappeOreo900 from "../assets/producto-frappe-oreo-900.webp";
import productoFrappeOreo1170 from "../assets/producto-frappe-oreo-1170.webp";
import productoFrappePistachoJpg from "../assets/producto-frappe-pistacho.jpg";
import productoFrappePistacho480 from "../assets/producto-frappe-pistacho-480.webp";
import productoFrappePistacho900 from "../assets/producto-frappe-pistacho-900.webp";
import productoFrappePistacho1170 from "../assets/producto-frappe-pistacho-1170.webp";
import productoFrappeJpg from "../assets/producto-frappe.jpg";
import productoFrappe480 from "../assets/producto-frappe-480.webp";
import productoFrappe900 from "../assets/producto-frappe-900.webp";
import productoFrappe1170 from "../assets/producto-frappe-1170.webp";
import productoIceLatteTrioCarameloNutellaJpg from "../assets/producto-ice-latte-trio-caramelo-nutella.jpg";
import productoIceLatteTrioCarameloNutella480 from "../assets/producto-ice-latte-trio-caramelo-nutella-480.webp";
import productoIceLatteTrioCarameloNutella900 from "../assets/producto-ice-latte-trio-caramelo-nutella-900.webp";
import productoIceLatteTrioCarameloNutella1170 from "../assets/producto-ice-latte-trio-caramelo-nutella-1170.webp";
import productoIceLatteJpg from "../assets/producto-ice-latte.jpg";
import productoIceLatte480 from "../assets/producto-ice-latte-480.webp";
import productoIceLatte900 from "../assets/producto-ice-latte-900.webp";
import productoIceLatte1170 from "../assets/producto-ice-latte-1170.webp";
import productoAffogatoMatchaJpg from "../assets/producto-affogato-matcha.jpg";
import productoAffogatoMatcha480 from "../assets/producto-affogato-matcha-480.webp";
import productoAffogatoMatcha900 from "../assets/producto-affogato-matcha-900.webp";
import productoAffogatoMatcha1170 from "../assets/producto-affogato-matcha-1170.webp";
import productoAffogatoPistachoJpg from "../assets/producto-affogato-pistacho.jpg";
import productoAffogatoPistacho480 from "../assets/producto-affogato-pistacho-480.webp";
import productoAffogatoPistacho900 from "../assets/producto-affogato-pistacho-900.webp";
import productoAffogatoPistacho1170 from "../assets/producto-affogato-pistacho-1170.webp";
import productoAffogatoJpg from "../assets/producto-affogato.jpg";
import productoAffogato480 from "../assets/producto-affogato-480.webp";
import productoAffogato900 from "../assets/producto-affogato-900.webp";
import productoAffogato1170 from "../assets/producto-affogato-1170.webp";
import productoBrownieConHeladoJpg from "../assets/producto-brownie-con-helado.jpg";
import productoBrownieConHelado480 from "../assets/producto-brownie-con-helado-480.webp";
import productoBrownieConHelado900 from "../assets/producto-brownie-con-helado-900.webp";
import productoBrownieConHelado1170 from "../assets/producto-brownie-con-helado-1170.webp";
import productoCheesecakeFresaJpg from "../assets/producto-cheesecake-fresa.jpg";
import productoCheesecakeFresa480 from "../assets/producto-cheesecake-fresa-480.webp";
import productoCheesecakeFresa900 from "../assets/producto-cheesecake-fresa-900.webp";
import productoCheesecakeFresa1170 from "../assets/producto-cheesecake-fresa-1170.webp";
import productoCheesecakeNutellaJpg from "../assets/producto-cheesecake-nutella.jpg";
import productoCheesecakeNutella480 from "../assets/producto-cheesecake-nutella-480.webp";
import productoCheesecakeNutella900 from "../assets/producto-cheesecake-nutella-900.webp";
import productoCheesecakeNutella1170 from "../assets/producto-cheesecake-nutella-1170.webp";
import productoCheesecakePistachoJpg from "../assets/producto-cheesecake-pistacho.jpg";
import productoCheesecakePistacho480 from "../assets/producto-cheesecake-pistacho-480.webp";
import productoCheesecakePistacho900 from "../assets/producto-cheesecake-pistacho-900.webp";
import productoCheesecakePistacho1170 from "../assets/producto-cheesecake-pistacho-1170.webp";
import productoChocolateCalienteJpg from "../assets/producto-chocolate-caliente.jpg";
import productoChocolateCaliente480 from "../assets/producto-chocolate-caliente-480.webp";
import productoChocolateCaliente900 from "../assets/producto-chocolate-caliente-900.webp";
import productoChocolateCaliente1170 from "../assets/producto-chocolate-caliente-1170.webp";
import productoMarquesaLimonJpg from "../assets/producto-marquesa-limon.jpg";
import productoMarquesaLimon480 from "../assets/producto-marquesa-limon-480.webp";
import productoMarquesaLimon900 from "../assets/producto-marquesa-limon-900.webp";
import productoMarquesaLimon1170 from "../assets/producto-marquesa-limon-1170.webp";
import productoBrookies1Jpg from "../assets/producto-brookies-1.jpg";
import productoBrookies1480 from "../assets/producto-brookies-1-480.webp";
import productoBrookies1900 from "../assets/producto-brookies-1-900.webp";
import productoBrookies11170 from "../assets/producto-brookies-1-1170.webp";
import productoBrookies2Jpg from "../assets/producto-brookies-2.jpg";
import productoBrookies2480 from "../assets/producto-brookies-2-480.webp";
import productoBrookies2900 from "../assets/producto-brookies-2-900.webp";
import productoBrookies21170 from "../assets/producto-brookies-2-1170.webp";
import productoChocoNuezCookie1Jpg from "../assets/producto-choco-nuez-cookie-1.jpg";
import productoChocoNuezCookie1480 from "../assets/producto-choco-nuez-cookie-1-480.webp";
import productoChocoNuezCookie1900 from "../assets/producto-choco-nuez-cookie-1-900.webp";
import productoChocoNuezCookie11170 from "../assets/producto-choco-nuez-cookie-1-1170.webp";
import productoChocoNuezCookie2Jpg from "../assets/producto-choco-nuez-cookie-2.jpg";
import productoChocoNuezCookie2480 from "../assets/producto-choco-nuez-cookie-2-480.webp";
import productoChocoNuezCookie2900 from "../assets/producto-choco-nuez-cookie-2-900.webp";
import productoChocoNuezCookie21170 from "../assets/producto-choco-nuez-cookie-2-1170.webp";
import productoChocolateChipCookieRaw1Jpg from "../assets/producto-chocolate-chip-cookie-raw1.jpg";
import productoChocolateChipCookieRaw1480 from "../assets/producto-chocolate-chip-cookie-raw1-480.webp";
import productoChocolateChipCookieRaw1900 from "../assets/producto-chocolate-chip-cookie-raw1-900.webp";
import productoChocolateChipCookieRaw11170 from "../assets/producto-chocolate-chip-cookie-raw1-1170.webp";
import productoChocolateChipCookieRaw2Jpg from "../assets/producto-chocolate-chip-cookie-raw2.jpg";
import productoChocolateChipCookieRaw2480 from "../assets/producto-chocolate-chip-cookie-raw2-480.webp";
import productoChocolateChipCookieRaw2900 from "../assets/producto-chocolate-chip-cookie-raw2-900.webp";
import productoChocolateChipCookieRaw21170 from "../assets/producto-chocolate-chip-cookie-raw2-1170.webp";
import productoCroissantJpg from "../assets/producto-croissant.jpg";
import productoCroissant480 from "../assets/producto-croissant-480.webp";
import productoCroissant900 from "../assets/producto-croissant-900.webp";
import productoCroissant1170 from "../assets/producto-croissant-1170.webp";
import productoEmpanadaFrontalJpg from "../assets/producto-empanada-frontal.jpg";
import productoEmpanadaFrontal480 from "../assets/producto-empanada-frontal-480.webp";
import productoEmpanadaFrontal900 from "../assets/producto-empanada-frontal-900.webp";
import productoEmpanadaFrontal1170 from "../assets/producto-empanada-frontal-1170.webp";
import productoMediaLunaNutellaJpg from "../assets/producto-media-luna-nutella.jpg";
import productoMediaLunaNutella480 from "../assets/producto-media-luna-nutella-480.webp";
import productoMediaLunaNutella900 from "../assets/producto-media-luna-nutella-900.webp";
import productoMediaLunaNutella1170 from "../assets/producto-media-luna-nutella-1170.webp";
import productoMediaLunaPistachoJpg from "../assets/producto-media-luna-pistacho.jpg";
import productoMediaLunaPistacho480 from "../assets/producto-media-luna-pistacho-480.webp";
import productoMediaLunaPistacho900 from "../assets/producto-media-luna-pistacho-900.webp";
import productoMediaLunaPistacho1170 from "../assets/producto-media-luna-pistacho-1170.webp";
import productoMediaLunaJpg from "../assets/producto-media-luna.jpg";
import productoMediaLuna480 from "../assets/producto-media-luna-480.webp";
import productoMediaLuna900 from "../assets/producto-media-luna-900.webp";
import productoMediaLuna1170 from "../assets/producto-media-luna-1170.webp";
import productoGreenCrushJpg from "../assets/producto-green-crush.jpg";
import productoGreenCrush480 from "../assets/producto-green-crush-480.webp";
import productoGreenCrush900 from "../assets/producto-green-crush-900.webp";
import productoGreenCrush1170 from "../assets/producto-green-crush-1170.webp";

export const ASSET_MANIFEST = {
  "producto-americano": {
    jpg: productoAmericanoJpg,
    webp: [[productoAmericano480, 480], [productoAmericano900, 900], [productoAmericano1170, 1170]],
    color: "#f8e8d8",
    width: 1254,
    height: 1254,
  },
  "producto-capuccino": {
    jpg: productoCapuccinoJpg,
    webp: [[productoCapuccino480, 480], [productoCapuccino900, 900], [productoCapuccino1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-cortado": {
    jpg: productoCortadoJpg,
    webp: [[productoCortado480, 480], [productoCortado900, 900], [productoCortado1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-espresso": {
    jpg: productoEspressoJpg,
    webp: [[productoEspresso480, 480], [productoEspresso900, 900], [productoEspresso1170, 1170]],
    color: "#f8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-flat-white": {
    jpg: productoFlatWhiteJpg,
    webp: [[productoFlatWhite480, 480], [productoFlatWhite900, 900], [productoFlatWhite1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-latte-pistacho": {
    jpg: productoLattePistachoJpg,
    webp: [[productoLattePistacho480, 480], [productoLattePistacho900, 900], [productoLattePistacho1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-latte-vainilla": {
    jpg: productoLatteVainillaJpg,
    webp: [[productoLatteVainilla480, 480], [productoLatteVainilla900, 900], [productoLatteVainilla1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-latte": {
    jpg: productoLatteJpg,
    webp: [[productoLatte480, 480], [productoLatte900, 900], [productoLatte1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-macchiato": {
    jpg: productoMacchiatoJpg,
    webp: [[productoMacchiato480, 480], [productoMacchiato900, 900], [productoMacchiato1170, 1170]],
    color: "#f8e8d8",
    width: 1254,
    height: 1254,
  },
  "producto-matcha-latte-ice": {
    jpg: productoMatchaLatteIceJpg,
    webp: [[productoMatchaLatteIce480, 480], [productoMatchaLatteIce900, 900], [productoMatchaLatteIce1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-matcha-latte": {
    jpg: productoMatchaLatteJpg,
    webp: [[productoMatchaLatte480, 480], [productoMatchaLatte900, 900], [productoMatchaLatte1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-hot-blueberry": {
    jpg: productoInfusionHotBlueberryJpg,
    webp: [[productoInfusionHotBlueberry480, 480], [productoInfusionHotBlueberry900, 900], [productoInfusionHotBlueberry1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-hot-fireberry": {
    jpg: productoInfusionHotFireberryJpg,
    webp: [[productoInfusionHotFireberry480, 480], [productoInfusionHotFireberry900, 900], [productoInfusionHotFireberry1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-hot-ginger-peach": {
    jpg: productoInfusionHotGingerPeachJpg,
    webp: [[productoInfusionHotGingerPeach480, 480], [productoInfusionHotGingerPeach900, 900], [productoInfusionHotGingerPeach1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-hot-lemon-ginger": {
    jpg: productoInfusionHotLemonGingerJpg,
    webp: [[productoInfusionHotLemonGinger480, 480], [productoInfusionHotLemonGinger900, 900], [productoInfusionHotLemonGinger1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-hot-strawberry-kiwi": {
    jpg: productoInfusionHotStrawberryKiwiJpg,
    webp: [[productoInfusionHotStrawberryKiwi480, 480], [productoInfusionHotStrawberryKiwi900, 900], [productoInfusionHotStrawberryKiwi1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-ice-blueberry": {
    jpg: productoInfusionIceBlueberryJpg,
    webp: [[productoInfusionIceBlueberry480, 480], [productoInfusionIceBlueberry900, 900], [productoInfusionIceBlueberry1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-ice-fireberry": {
    jpg: productoInfusionIceFireberryJpg,
    webp: [[productoInfusionIceFireberry480, 480], [productoInfusionIceFireberry900, 900], [productoInfusionIceFireberry1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-ice-ginger-peach": {
    jpg: productoInfusionIceGingerPeachJpg,
    webp: [[productoInfusionIceGingerPeach480, 480], [productoInfusionIceGingerPeach900, 900], [productoInfusionIceGingerPeach1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-ice-lemon-ginger": {
    jpg: productoInfusionIceLemonGingerJpg,
    webp: [[productoInfusionIceLemonGinger480, 480], [productoInfusionIceLemonGinger900, 900], [productoInfusionIceLemonGinger1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-infusion-ice-strawberry-kiwi": {
    jpg: productoInfusionIceStrawberryKiwiJpg,
    webp: [[productoInfusionIceStrawberryKiwi480, 480], [productoInfusionIceStrawberryKiwi900, 900], [productoInfusionIceStrawberryKiwi1170, 1170]],
    color: "#f8e8d8",
    width: 1254,
    height: 1254,
  },
  "producto-frappe-nutella": {
    jpg: productoFrappeNutellaJpg,
    webp: [[productoFrappeNutella480, 480], [productoFrappeNutella900, 900], [productoFrappeNutella1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-frappe-oreo": {
    jpg: productoFrappeOreoJpg,
    webp: [[productoFrappeOreo480, 480], [productoFrappeOreo900, 900], [productoFrappeOreo1170, 1170]],
    color: "#e8c8b8",
    width: 1254,
    height: 1254,
  },
  "producto-frappe-pistacho": {
    jpg: productoFrappePistachoJpg,
    webp: [[productoFrappePistacho480, 480], [productoFrappePistacho900, 900], [productoFrappePistacho1170, 1170]],
    color: "#e8c8b8",
    width: 1254,
    height: 1254,
  },
  "producto-frappe": {
    jpg: productoFrappeJpg,
    webp: [[productoFrappe480, 480], [productoFrappe900, 900], [productoFrappe1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-ice-latte-trio-caramelo-nutella": {
    jpg: productoIceLatteTrioCarameloNutellaJpg,
    webp: [[productoIceLatteTrioCarameloNutella480, 480], [productoIceLatteTrioCarameloNutella900, 900], [productoIceLatteTrioCarameloNutella1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-ice-latte": {
    jpg: productoIceLatteJpg,
    webp: [[productoIceLatte480, 480], [productoIceLatte900, 900], [productoIceLatte1170, 1170]],
    color: "#e8c8a8",
    width: 1254,
    height: 1254,
  },
  "producto-affogato-matcha": {
    jpg: productoAffogatoMatchaJpg,
    webp: [[productoAffogatoMatcha480, 480], [productoAffogatoMatcha900, 900], [productoAffogatoMatcha1170, 1170]],
    color: "#e8c8b8",
    width: 1254,
    height: 1254,
  },
  "producto-affogato-pistacho": {
    jpg: productoAffogatoPistachoJpg,
    webp: [[productoAffogatoPistacho480, 480], [productoAffogatoPistacho900, 900], [productoAffogatoPistacho1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-affogato": {
    jpg: productoAffogatoJpg,
    webp: [[productoAffogato480, 480], [productoAffogato900, 900], [productoAffogato1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-brownie-con-helado": {
    jpg: productoBrownieConHeladoJpg,
    webp: [[productoBrownieConHelado480, 480], [productoBrownieConHelado900, 900], [productoBrownieConHelado1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-cheesecake-fresa": {
    jpg: productoCheesecakeFresaJpg,
    webp: [[productoCheesecakeFresa480, 480], [productoCheesecakeFresa900, 900], [productoCheesecakeFresa1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-cheesecake-nutella": {
    jpg: productoCheesecakeNutellaJpg,
    webp: [[productoCheesecakeNutella480, 480], [productoCheesecakeNutella900, 900], [productoCheesecakeNutella1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-cheesecake-pistacho": {
    jpg: productoCheesecakePistachoJpg,
    webp: [[productoCheesecakePistacho480, 480], [productoCheesecakePistacho900, 900], [productoCheesecakePistacho1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-chocolate-caliente": {
    jpg: productoChocolateCalienteJpg,
    webp: [[productoChocolateCaliente480, 480], [productoChocolateCaliente900, 900], [productoChocolateCaliente1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-marquesa-limon": {
    jpg: productoMarquesaLimonJpg,
    webp: [[productoMarquesaLimon480, 480], [productoMarquesaLimon900, 900], [productoMarquesaLimon1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-brookies-1": {
    jpg: productoBrookies1Jpg,
    webp: [[productoBrookies1480, 480], [productoBrookies1900, 900], [productoBrookies11170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-brookies-2": {
    jpg: productoBrookies2Jpg,
    webp: [[productoBrookies2480, 480], [productoBrookies2900, 900], [productoBrookies21170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-choco-nuez-cookie-1": {
    jpg: productoChocoNuezCookie1Jpg,
    webp: [[productoChocoNuezCookie1480, 480], [productoChocoNuezCookie1900, 900], [productoChocoNuezCookie11170, 1170]],
    color: "#f8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-choco-nuez-cookie-2": {
    jpg: productoChocoNuezCookie2Jpg,
    webp: [[productoChocoNuezCookie2480, 480], [productoChocoNuezCookie2900, 900], [productoChocoNuezCookie21170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-chocolate-chip-cookie-raw1": {
    jpg: productoChocolateChipCookieRaw1Jpg,
    webp: [[productoChocolateChipCookieRaw1480, 480], [productoChocolateChipCookieRaw1900, 900], [productoChocolateChipCookieRaw11170, 1170]],
    color: "#f8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-chocolate-chip-cookie-raw2": {
    jpg: productoChocolateChipCookieRaw2Jpg,
    webp: [[productoChocolateChipCookieRaw2480, 480], [productoChocolateChipCookieRaw2900, 900], [productoChocolateChipCookieRaw21170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-croissant": {
    jpg: productoCroissantJpg,
    webp: [[productoCroissant480, 480], [productoCroissant900, 900], [productoCroissant1170, 1170]],
    color: "#e8c8a8",
    width: 1254,
    height: 1254,
  },
  "producto-empanada-frontal": {
    jpg: productoEmpanadaFrontalJpg,
    webp: [[productoEmpanadaFrontal480, 480], [productoEmpanadaFrontal900, 900], [productoEmpanadaFrontal1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-media-luna-nutella": {
    jpg: productoMediaLunaNutellaJpg,
    webp: [[productoMediaLunaNutella480, 480], [productoMediaLunaNutella900, 900], [productoMediaLunaNutella1170, 1170]],
    color: "#e8d8b8",
    width: 1254,
    height: 1254,
  },
  "producto-media-luna-pistacho": {
    jpg: productoMediaLunaPistachoJpg,
    webp: [[productoMediaLunaPistacho480, 480], [productoMediaLunaPistacho900, 900], [productoMediaLunaPistacho1170, 1170]],
    color: "#e8c8b8",
    width: 1254,
    height: 1254,
  },
  "producto-media-luna": {
    jpg: productoMediaLunaJpg,
    webp: [[productoMediaLuna480, 480], [productoMediaLuna900, 900], [productoMediaLuna1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
  "producto-green-crush": {
    jpg: productoGreenCrushJpg,
    webp: [[productoGreenCrush480, 480], [productoGreenCrush900, 900], [productoGreenCrush1170, 1170]],
    color: "#e8d8c8",
    width: 1254,
    height: 1254,
  },
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
