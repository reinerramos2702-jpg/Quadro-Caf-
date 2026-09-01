import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useContext, createContext, Suspense, lazy } from "react";
import {
  Coffee, Mountain, Waves, ShoppingBag, GraduationCap, Award,
  Plus, Minus, X, Play, Pause, Check, ChevronRight, ChevronLeft, MapPin, Instagram,
  Mail, Lock, ArrowLeft, Sun, Moon, Settings, LogOut,
  Banknote, Smartphone, Landmark, DollarSign,
  Volume2, VolumeX, Bell, XCircle, Home, Package, User, Mic, Flame,
} from "lucide-react";

import { supabase } from "./lib/supabase";
import { ASSET_MANIFEST } from "./data/assetManifest";
import logo from "./assets/logo.png";
import clubBox from "./assets/club-box.jpg";
import joseTomas from "./assets/jose-tomas.jpg";
import tazaBlanca from "./assets/taza-blanca.jpg";
import tazaAzulMarino from "./assets/taza-azul-marino.jpg";
import tazaRoja from "./assets/taza-roja.jpg";
import tazaVerdeBosque from "./assets/taza-verde-bosque.jpg";
import tazaTerracota from "./assets/taza-terracota.jpg";
import violaFont from "./assets/fonts/VIOLA.otf";
import violaAcentosFont from "./assets/fonts-derivados/VIOLA-Acentos.otf";
import nexaBoldFont from "./assets/fonts/Nexa-Bold.otf";
import nexaLightFont from "./assets/fonts/Nexa-Light.otf";

// three.js pesa varios cientos de KB — se carga bajo demanda (chunk propio,
// se descarga solo cuando alguien abre Inicio o Lab, no bloquea el resto).
const EspiralTubo3D = lazy(() => import("./lib/espiral3d.jsx"));
const EspiralHero = lazy(() => import("./lib/espiral3d.jsx").then((m) => ({ default: m.EspiralHero })));

/* ============================================================
   QUADRO CAFÉ — v4 "alta gama"
   Dos temas, mismos datos reales.
   claro   verde #3b574c · crema #e9d8c6 · terracota #b5613c · marino #243b57   (branding oficial v4)
   oscuro  ink #0B0F0D · mocoties #1E5C4A · latón #C9873A · nebulosa #5B2E8C · alien #7FE3C0
   ============================================================ */

const PALETAS = {
  claro: {
    id: "claro", shell: "#1a1f1c",
    surface: "#e9d8c6", card: "#f5efe6", line: "#d8c7ae",
    text: "#1a1f1c", textMuted: "#6f6459",
    brand: "#3b574c", onBrand: "#e9d8c6", deep: "#26382f",
    brandAlt: "#b5613c", onBrandAlt: "#f5efe6",
    purple: "#243b57", amarillo: "#c79a3b", warn: "#9c3b28",
    // Tinte del cono 3D dondequiera que aparezca (hero y comparador de
    // Inicio, simulador de Lab). `null` = sin tinte: el modelo conserva su
    // propia textura, que sobre los fondos claros de este tema ya contrasta
    // de sobra. Ver `modelo` en el tema oscuro.
    modelo: null,
    // Opacidad (alfa hex, mismo idioma que el resto del archivo) del velo que
    // separa ese cono del titular. Aquí hace falta fuerte: modelo oscuro sobre
    // fondo claro es el caso de MÁS contraste, y sin velo el cono compite con
    // "EL SABOR / TIENE UNA".
    veloHero: "cc",
  },
  oscuro: {
    id: "oscuro", shell: "#07100D",
    surface: "#0B0F0D", card: "#131A17", line: "#243029",
    text: "#F2EDE3", textMuted: "#8AA096",
    brand: "#7FE3C0", onBrand: "#0B0F0D", deep: "#050807",
    brandAlt: "#C9873A", onBrandAlt: "#0B0F0D",
    purple: "#A47BE0", amarillo: "#E0C24B", warn: "#E08C6B",
    // Tinte del cono 3D dondequiera que aparezca (hero y comparador de
    // Inicio, simulador de Lab): un mismo objeto de marca no puede leerse
    // distinto según el módulo. El modelo es negro (su baseColor promedia
    // 31/255) y contra los fondos de este tema desaparecía.
    //
    // Topo medio, no crema: el valor sale de barrer seis tonos midiendo las
    // DOS relaciones que compiten entre sí — subir el cono lo despega del
    // fondo pero se come la espiral, que es el dato del simulador.
    //   #CFC3AE  espiral/cono 1.09  ·  cono/fondo 10.58
    //   #9A8E80  espiral/cono 1.98  ·  cono/fondo  5.77
    //   #746A5F  espiral/cono 3.27  ·  cono/fondo  3.45   <- único con ambas >3
    //   #615950  espiral/cono 4.51  ·  cono/fondo  2.48
    modelo: "#746A5F",
    // Velo más suave que en claro: aquí el problema es el inverso — el cono
    // apenas se despega del fondo, así que taparlo al 80% lo borraba.
    // Bajó de b3 a 8c al oscurecer `modelo`: el topo llega al hero ya
    // atenuado por este velo, y con b3 la separación contra el fondo caía a
    // 1.21:1. A 8c vuelve a 1.38:1 sin tocar el titular — su luminancia no
    // cambia (p95 = 237 en las tres variantes medidas), solo sube la del cono.
    veloHero: "8c",
  },
};

const FINCA_TINTS = {
  // 4º valor de claro reservado para Agua Fría (verde profundo, confirmado por
  // el dueño 2026-08-11) — inerte hasta que esa finca entre a FINCAS (índice 3).
  claro: ["#243b57", "#3b574c", "#b5613c", "#26382f"],
  // Oscuro todavía sin 4º valor: el candidato #7FE3C0 (alien) fue descartado
  // por el dueño, sin reemplazo definido aún. No agregar nada acá sin confirmar.
  oscuro: ["#5B2E8C", "#1E5C4A", "#C9873A"],
};

/* Tipografía real de marca (reemplaza las aproximaciones Fraunces/Inter
   Tight de Google Fonts): VIOLA es el lettering real del logo quadrocafe.com
   — se usa solo en display/headers. Nexa (Light 300 / Bold 700) es la sans
   de marca para cuerpo y labels.

   'VIOLA Acentos' es un derivado generado por scripts/generar-acentos-viola.mjs:
   VIOLA no trae ninguna vocal acentuada ni Ñ/Ü, así que esos glifos son la
   letra base REAL de VIOLA con el acento compuesto encima. Va justo después
   de 'VIOLA' en el stack para que el navegador lo use solo en los codepoints
   que faltan — ver el bloque de .disp más abajo. */
const FONTS = `
@font-face{font-family:'VIOLA';src:url(${violaFont}) format('opentype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'VIOLA Acentos';src:url(${violaAcentosFont}) format('opentype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Nexa';src:url(${nexaLightFont}) format('opentype');font-weight:300;font-style:normal;font-display:swap}
@font-face{font-family:'Nexa';src:url(${nexaBoldFont}) format('opentype');font-weight:700;font-style:normal;font-display:swap}
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Fraunces:ital,opsz,wght@1,9..144,600&display=swap');
`;

function buildCss(C) {
  return `
${FONTS}
*{box-sizing:border-box}
/* html,body (2026-09-01, junto con .qc-vh/.qc-frame-vh más abajo): sin
   este reset, el margin de 8px que el navegador pone en <body> por
   default sumaba a la altura de .qc (min-height:100dvh) y hacía que el
   documento entero terminara ~16px más alto que el viewport — es decir,
   la página raíz SÍ podía scrollear un poquito, aunque la intención de la
   app es que solo scrolleen los .qc-scroll internos de cada tab. Ese
   scroll residual del documento (más el "scroll chaining" por defecto:
   cuando un .qc-scroll interno llega a su límite arriba/abajo, el gesto
   sigue empujando al documento si nada lo frena) es lo que probablemente
   dispara el show/hide de la barra de direcciones del navegador, incluso
   cuando visualmente "no se ve" nada scrolleando fuera del frame del
   teléfono. overflow:hidden en html,body bloquea que el documento mismo
   scrollee; overscroll-behavior:none es el respaldo para navegadores que
   igual dejan pasar el gesto. */
html,body{margin:0;padding:0;height:100%;overflow:hidden;overscroll-behavior:none}
/* ============================ SISTEMA DE MOTION (Sprint "Alta Gama" — Fase 2, 2026-08-17) ============================
   Tokens de duración/easing para el resto del sprint de animaciones. Es
   vocabulario NUEVO y aditivo — no reemplaza ni retoca ninguna animación
   existente (.rise/.pop/.slide/.sheet/.press/.tapfx/.pulse/etc. siguen
   exactamente igual; Fincas/Elio y todo lo ya animado no se tocó en esta
   fase). Las fases siguientes del sprint usan estas variables en vez de
   valores sueltos, para que toda animación nueva hable el mismo idioma.

   Se evaluó sumar Framer Motion y se descartó (62KB gzip completo, ~43KB
   real medido incluso con LazyMotion+domAnimation según un issue de su
   propio repo — el sistema CSS que ya tenía la app cubre lo que pide el
   sprint a costo ~0KB). Detalle completo en memoria.md.

   - --motion-fast (150ms): toque/micro-interacción — feedback inmediato de un tap.
   - --motion-base (300ms): transición de contenido — cambios de vista/estado.
   - --motion-slow (500ms): elementos grandes — hero, entradas destacadas.
   - --ease-out: para entradas (algo aparece/llega a la pantalla).
   - --ease-in-out: para transiciones de estado (algo pasa de un estado a otro).
   - --ease-spring: overshoot sutil, para elementos táctiles (botones, chips).
   Hereda gratis el respeto a prefers-reduced-motion que ya tiene el archivo
   más abajo (esa regla @media apaga cualquier transition/animation-duration,
   ésta incluida, sin que haga falta declararlo dos veces). */
:root{
  --motion-fast:150ms;
  --motion-base:300ms;
  --motion-slow:500ms;
  --ease-out:cubic-bezier(.16,1,.3,1);
  --ease-in-out:cubic-bezier(.45,0,.15,1);
  --ease-spring:cubic-bezier(.34,1.56,.64,1);
}
/* .qc-vh / .qc-frame-vh (2026-09-01): el nav inferior es position:absolute
   anclado al frame del teléfono (ver comentario junto al nav más abajo en
   el archivo), y ese fix de 2026-08-31 asumía que el problema era solo de
   layout flex — pero tanto .qc como el frame seguían midiéndose con 100vh
   puro. En mobile, 100vh es el alto de layout viewport, que NO se re-mide
   cuando la barra de direcciones del navegador se expande/contrae al
   scrollear — el alto visible real cambia sin que el layout reaccione, así
   que el frame (anclado a ese vh fijo) queda desfasado del área visible y
   el nav que cuelga de su bottom:0 parece moverse. 100dvh (dynamic
   viewport height) sí se re-mide con cada cambio de chrome del navegador.
   Declarado dos veces a propósito — un navegador sin soporte de dvh
   simplemente ignora esa línea y se queda con el vh de arriba, así que
   sirve de fallback sin necesidad de @supports. No se puede hacer esto en
   un style inline (no admite la misma propiedad dos veces en un objeto
   JS), por eso vive acá como clase en vez de en el style={{...}} de
   .qc/el frame.

   Iteración 2 (2026-09-01, probado en Chrome Android real): el dueño
   confirmó que el nav queda fijo mientras se scrollea, PERO al llegar
   arriba del todo — el instante exacto en que la barra de direcciones
   termina de expandirse — el nav "baja" de nuevo un momento. dvh solo no
   alcanza ahí: el recálculo interno del navegador para esa unidad le
   llega con retraso respecto a la animación real de su propia barra.
   height:var(--vvh, 100dvh) agrega una tercera capa que gana en la
   cascada cuando existe: --vvh la escribe en tiempo real un listener de
   window.visualViewport ("resize", ver el useEffect en QuadroCafe) con
   el alto real en px, en sincronía con la animación de la barra (para eso
   existe esa API). Si --vvh todavía no está seteada (SSR, o el navegador
   no soporta visualViewport) cae al fallback 100dvh sin romper nada. */
.qc-vh{min-height:100vh;min-height:100dvh;min-height:var(--vvh, 100dvh)}
.qc-frame-vh{height:100vh;height:100dvh;height:var(--vvh, 100dvh)}
/* .mo-tap: reemplazo puntual de .press pensado para elementos táctiles
   chicos (íconos, chips) — mismo gesto de "hundirse" al tocar pero con el
   spring sutil del sistema nuevo en vez de un ease genérico. Primer uso:
   ThemeToggle (ver PIEZAS más abajo). El resto de los botones de la app
   sigue usando .press sin cambios — no se migró nada más en esta fase. */
.mo-tap{transition:transform var(--motion-fast) var(--ease-spring)}
.mo-tap:active{transform:scale(.94)}
/* .mo-enter/.mo-hero: reutilizan el keyframe qc-rise que ya existía (mismo
   translateY(16px)→0, sin tocarlo) pero con duración/easing del sistema
   nuevo en vez del cubic-bezier suelto que usa .rise. */
.mo-enter{animation:qc-rise var(--motion-base) var(--ease-out) both}
.mo-hero{animation:qc-rise var(--motion-slow) var(--ease-out) both}
.qc{font-family:'Nexa','Inter Tight',system-ui,sans-serif;font-weight:300;color:${C.text};background:${C.surface}}
/* Fase 7 (transversal, 2026-08-17) — crossfade de tema en vez de flash.
   :where() mantiene la especificidad SOLO del selector de tipo (button/div/
   etc, 0-0-1) — más baja que cualquier clase suelta como .press/.mo-press/
   .mo-tap (0-1-0) — así que cualquier regla más específica de esas gana
   siempre, sin importar el orden en el archivo, y el elemento sigue con SU
   transition propia (feedback de tap) en vez de perderla. Los elementos que
   no declaran su propio transition (la gran mayoría de fondos/bordes lisos:
   cards, superficies, texto) heredan este crossfade suave "gratis". No
   incluye box-shadow/transform a propósito — esos son gestos táctiles, no
   parte del swap de tema. */
:where(.qc) button,:where(.qc) div,:where(.qc) span,:where(.qc) p,:where(.qc) input{transition:background-color var(--motion-slow) var(--ease-in-out),border-color var(--motion-slow) var(--ease-in-out),color var(--motion-slow) var(--ease-in-out)}
/* Slide direccional entre tabs del nav inferior — reemplaza el .rise vertical
   (pensado para entradas, no para "pestañas de app nativa") por un
   desplazamiento horizontal cuya dirección depende de si el tab nuevo queda
   a la derecha o la izquierda del anterior (--tabdir, seteada inline por
   QuadroCafe). Con --tabdir sin definir (ej. Club/Admin, fuera del nav
   inferior) cae a 1 por el fallback del var(), mismo comportamiento que un
   swap "hacia adelante". */
@keyframes qc-tabswitch{from{opacity:0;transform:translateX(calc(14px * var(--tabdir, 1)))}to{opacity:1;transform:none}}
.mo-tabswitch{animation:qc-tabswitch var(--motion-base) var(--ease-out) both}
/* Pill "líquida" del nav inferior (evolución del underline de 14x2 de Fase 7,
   ver PIEZAS/QuadroCafe) — burbuja detrás del ícono activo que se desplaza y
   asoma por encima del borde del nav, al estilo del selector de tabs de apps
   nativas. Nada de filtro SVG gooey (feGaussianBlur+feColorMatrix): es caro
   en Android gama media y este componente está siempre visible en pantalla.
   El look "líquido" se falsea con dos animaciones separadas sobre dos nodos
   distintos, a propósito, para no pisar transform con transition+animation
   a la vez en el mismo elemento:
   - el wrapper (.mo-navpill) sólo hace transition:transform con
     --ease-spring — el propio overshoot del spring en el eje de traslado ya
     lee como líquido, sin animar nada más ahí.
   - el nodo interno (.mo-navpill-squish) es el que retriggerea el keyframe
     de "squish" (estira/achata) cada vez que cambia el tab activo, vía
     useRetriggerAnim(tab, "mo-navpill-squish") — mismo hook que ya usa el
     bounce del badge del carrito y la racha de Aula, sin tocarlo.
   border-radius fijo en px (no %) para que la forma no se deforme al
   escalar en X/Y durante el squish. */
@keyframes qc-navpill-squish{0%{transform:scaleX(1) scaleY(1)}35%{transform:scaleX(1.32) scaleY(.8)}100%{transform:scaleX(1) scaleY(1)}}
/* width/height/top/border-radius vienen por instancia (inline, calculados en
   QuadroCafe a partir del botón más ancho de los 5) desde que la pill pasó a
   envolver ícono+label juntos (2026-08-31) — antes eran fijos acá (40x40)
   cuando la pill sólo cubría el ícono. */
.mo-navpill{position:absolute;left:0;pointer-events:none;transition:transform var(--motion-base) var(--ease-spring)}
.mo-navpill-squish{animation:qc-navpill-squish var(--motion-base) var(--ease-spring)}
/* Acentos en VIOLA — por qué el fix anterior no alcanzaba:
   VIOLA trae 76 glifos y CERO vocales acentuadas (ni Ñ ni Ü), así que la
   Á/É/Í/Ó de "TRIÁNGULO", "SIFÓN", "CAFÉ" caía a Fraunces: otra tipografía
   dentro de la misma palabra. text-transform:uppercase arregló el caso
   (antes caía en minúscula real) y font-size-adjust:from-font igualó el
   tamaño, pero ninguno de los dos podía igualar lo que se nota de verdad,
   que es el CARÁCTER del glifo — Fraunces no se parece a VIOLA.
   Fix real: 'VIOLA Acentos', una fuente derivada donde cada glifo es la
   letra base real de VIOLA con el acento compuesto encima (ver
   scripts/generar-acentos-viola.mjs). Va segunda en el stack, así que
   solo entra en los codepoints que VIOLA no cubre, con el mismo upem,
   la misma altura de mayúscula y el mismo ancho de avance que la base:
   la palabra se dibuja entera con la misma letra.
   Fraunces queda de tercera, ya solo como red de seguridad.
   Nexa (.mono/.label/.micro) sí trae los acentos completos — ahí nunca
   hubo fallback, from-font se mantiene por los glifos sueltos que no
   cubra (símbolos raros). */
.disp{font-family:'VIOLA','VIOLA Acentos','Fraunces',serif;font-weight:400;letter-spacing:-.01em;font-optical-sizing:auto;font-size-adjust:from-font;text-transform:uppercase}
.script{font-family:'Fraunces',serif;font-style:italic;font-weight:600}
.mono{font-family:'Nexa','Inter Tight',system-ui,sans-serif;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size-adjust:from-font}
.disp-xl{font-family:'VIOLA','VIOLA Acentos','Fraunces',serif;font-weight:400;font-size:40px;line-height:44px;letter-spacing:-.02em;margin:0;font-size-adjust:from-font;text-transform:uppercase}
.disp-l{font-family:'VIOLA','VIOLA Acentos','Fraunces',serif;font-weight:400;font-size:30px;line-height:34px;letter-spacing:-.015em;margin:0;font-size-adjust:from-font;text-transform:uppercase}
.disp-m{font-family:'VIOLA','VIOLA Acentos','Fraunces',serif;font-weight:400;font-size:22px;line-height:28px;margin:0;font-size-adjust:from-font;text-transform:uppercase}
.body-l{font-family:'Nexa','Inter Tight',sans-serif;font-weight:300;font-size:17px;line-height:26px;font-size-adjust:from-font}
.label{font-family:'Nexa','Inter Tight',sans-serif;font-weight:700;font-size:13px;line-height:16px;letter-spacing:.06em;text-transform:uppercase;font-size-adjust:from-font}
.micro{font-family:'Nexa','Inter Tight',sans-serif;font-weight:700;font-size:11px;line-height:14px;letter-spacing:.08em;text-transform:uppercase;font-size-adjust:from-font}
.qc-scroll::-webkit-scrollbar{width:0;height:0}
/* overscroll-behavior-y:contain (2026-09-01, junto con el reset de
   html,body de arriba): sin esto, cuando un .qc-scroll llega a su límite
   (típicamente arriba del todo) el gesto de swipe puede seguir de largo
   ("scroll chaining") y mover el documento real por detrás, que es lo que
   dispara el show/hide de la barra de direcciones del navegador. contain
   detiene el scroll ahí mismo en vez de dejarlo pasar. */
.qc-scroll{overscroll-behavior-y:contain}
@keyframes qc-spiral-enter{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes qc-spiral-spin{to{transform:rotate(360deg)}}
.spiral-enter{animation:qc-spiral-enter .9s cubic-bezier(.2,.8,.2,1) both}
.spiral-spin{transform-origin:100px 100px;animation:qc-spiral-spin 16s cubic-bezier(.45,0,.55,1) infinite}
@keyframes qc-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes qc-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes qc-slide{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes qc-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes qc-drip{0%{transform:translateY(-6px);opacity:0}20%{opacity:1}100%{transform:translateY(26px);opacity:0}}
@keyframes qc-pulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.9;transform:scale(1.06)}}
@keyframes qc-steam{0%{transform:translateY(0) scaleX(1);opacity:0}30%{opacity:.55}100%{transform:translateY(-22px) scaleX(1.5);opacity:0}}
@keyframes qc-bar{from{width:0}}
@keyframes qc-frame-square{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes qc-frame-fade{from{opacity:0}to{opacity:1}}
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
/* Fase 3 (Carta, 2026-08-17) — piezas nuevas del sistema de motion. Igual
   que en Fase 2: aditivo, nada de lo de arriba se tocó. .mo-press es un
   .press "con sombra" para los botones propios de Carta (cantidad, agregar,
   "elegir finca y taza") — el .press global (usado por Fincas/Elio y el
   resto de la app) sigue exactamente igual, no se migró nada más. */
@keyframes qc-badge-bounce{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes qc-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.mo-press{transition:transform var(--motion-fast) var(--ease-spring), box-shadow var(--motion-fast) var(--ease-out)}
.mo-press:active{transform:scale(.96);box-shadow:0 3px 12px rgba(0,0,0,.22)}
.mo-bounce{animation:qc-badge-bounce var(--motion-base) var(--ease-spring)}
.mo-skeleton{background:linear-gradient(90deg, ${C.line} 25%, ${C.surface} 50%, ${C.line} 75%);background-size:200% 100%;animation:qc-shimmer 1.1s ease-in-out infinite}
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
  {
    id: "aguafria",
    finca: "Agua Fría",
    zona: "Cortada de Maturín, Municipio Guaicaipuro, Miranda",
    altura: 1200, varietal: "Tabi, Borbón Rosado, Geisha (insignia), Monte Claro",
    // proceso / score / notas: el dueño (José Tomás Carrillo Batalla) todavía no
    // los confirma — NO inventar cifras. FichaLote y el card "Lote en barra hoy"
    // en Inicio ya ocultan esos campos cuando faltan; agregarlos acá en cuanto
    // lleguen confirmados (ver CLAUDE.md § Real-data policy).
    avatar: {
      nombre: "José Tomás", rol: "Caficultor · 3ra generación",
      inicial: "J",
      // Foto real (recorte 300×375 = 4:5, la misma que José Tomás ya tiene
      // cargada en D-ID — extraída de ahí, sin marca de agua) — se muestra
      // estática en el card en vez del iframe embebido directo. Se probó
      // embeber el iframe de D-ID inline primero (ver historial en
      // memoria.md), pero el widget de D-ID tiene un piso de ancho fijo de
      // ~350px y un zoom interno del 105% en su preview que no se pueden
      // ajustar por CSS desde afuera — en una card angosta (la mayoría de
      // celulares reales) eso descentraba el botón "Start call" y recortaba
      // el sombrero. Se movió a foto fija + botón que abre el agente en un
      // overlay a pantalla completa (`AgenteFincaOverlay`, mismo patrón
      // position:absolute inset:0 que usaba el módulo Estudio, eliminado
      // 2026-08-17), donde sí tiene ancho de sobra.
      foto: joseTomas,
      // Agente conversacional real (D-ID Agents). Plan free trial: trae
      // watermark de marca hasta que se active un plan pago.
      agentUrl: "https://studio.d-id.com/agents/share?id=v2_agt_UyhXfVTo&key=Y2tfRWlCRVlEcTE3RlFlSThtSWc1dngw",
    },
    guion: [
      "Bienvenido a Agua Fría. Soy José Tomás Carrillo Batalla, y esto es un café de familia.",
      "Estamos en el Sector Cortada de Maturín, Municipio Guaicaipuro, Estado Miranda, a 1.200 metros de altura.",
      "Esta finca lleva más de 100 años de trayectoria, con premios en Europa desde inicios del siglo XX. Soy la tercera generación.",
      "Sembramos Tabi, Borbón Rosado, Monte Claro, y nuestra variedad insignia: Geisha.",
      "Arriba puedes hablar conmigo en vivo — soy un avatar conversacional, no una grabación.",
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

// Fotos reales (2026-08-17): swap 1:1 de las 5 tazas de siempre por fotos de
// producto reales, confirmado por Reiner — mismo `pct`/`efecto` (el dato de
// "dulzor percibido" ya aprobado, sin tocar), solo cambia `nombre`/`hex`
// (`hex` re-muestreado del cuerpo real de cada foto, ver `foto`) y se agrega
// `foto`. `id` se deja igual a propósito (no hay nada persistido que dependa
// de él, pero tampoco hace falta tocarlo). Queda afuera a propósito una 6ta
// taza "Marrón caramelo" (#A87456) — Reiner todavía no generó esa foto ni
// pasó su pct/efecto real; no se inventa acá, se suma en un paso aparte
// cuando la tenga.
const TAZAS = [
  { id: "blanca", nombre: "Blanca", hex: "#F2EDE3", foto: tazaBlanca, pct: 0, efecto: "Referencia. Percepción neutra de dulzor y amargor." },
  { id: "azul", nombre: "Azul Marino", hex: "#415065", foto: tazaAzulMarino, pct: 18, efecto: "Se percibe más dulce. Baja la lectura de amargor." },
  { id: "roja", nombre: "Roja", hex: "#BA5340", foto: tazaRoja, pct: -12, efecto: "Realza cuerpo e intensidad. Sube el amargor percibido." },
  { id: "verde", nombre: "Verde Bosque", hex: "#535C4C", foto: tazaVerdeBosque, pct: 8, efecto: "Acentúa las notas vegetales y de té verde." },
  { id: "barro", nombre: "Terracota", hex: "#BA7554", foto: tazaTerracota, pct: 4, efecto: "Suaviza la acidez. Alarga el retrogusto." },
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
/* Banner de cada categoría de Carta — las cinco con foto propia, encuadrada
   a la caja de 3.25:1 (ver assetManifest.js). */
const CAT_IMG = {
  Filtrado: "menu-filtrado",
  Espresso: "menu-espresso",
  Frío: "menu-frio",
  Panadería: "menu-panaderia",
  Postres: "menu-postres-v2",
};

/* Aviso de "estamos usando el respaldo local" — nunca silencioso. En consola
   siempre (el dueño puede revisarla en prod si algo no cuadra); en pantalla
   solo en dev, para no asustar a un cliente real con un banner de deploy. */
function avisarFallbackCarta(motivo) {
  console.warn(`[Carta] Usando MENU local de respaldo — ${motivo}`);
}

/* Carta viva: lee la tabla `productos` de Supabase (la misma que edita el
   Panel Admin) y cae de vuelta a la constante MENU local si Supabase no está
   configurado, la consulta falla, o la tabla todavía está vacía — la app
   nunca debe quedarse sin carta que mostrar. */
function useCarta() {
  const [items, setItems] = useState(MENU);
  const [fuente, setFuente] = useState("local");

  useEffect(() => {
    if (!supabase) {
      avisarFallbackCarta("faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY en esta build.");
      return;
    }
    let cancelado = false;
    supabase.from("productos").select("*").order("orden").then(({ data, error }) => {
      if (cancelado) return;
      if (error) { avisarFallbackCarta(`error de Supabase — ${error.message}`); return; }
      if (!data || !data.length) { avisarFallbackCarta("la tabla productos está vacía."); return; }
      setItems(data.map((p) => ({
        id: p.id, cat: p.cat, nombre: p.nombre, precio: Number(p.precio),
        desc: p.descripcion, tag: p.tag || undefined, geo: p.geo || undefined,
        finca: p.finca, disponible: p.disponible,
      })));
      setFuente("supabase");
    }).catch((err) => {
      if (cancelado) return;
      avisarFallbackCarta(`fallo de red hacia Supabase — ${err?.message || err}`);
    });
    return () => { cancelado = true; };
  }, []);

  return { items, fuente };
}

const EQUIPO = [
  { nombre: "Comandante C40", detalle: "Nitro Blade · Alpine Lagoon y Sunset", uso: "Molienda de barra y competencia", clicks: "18–24 clics para filtrado" },
  { nombre: "AeroPress", detalle: "Presión de aire + microfiltro", uso: "Recetas de campeonato", clicks: "Invertida, 2:00 min" },
  { nombre: "Sifón de vacío", detalle: "Balón, mechero, filtro de tela", uso: "Servicio a la mesa", clicks: "93 °C sostenidos" },
  { nombre: "Copas de perfil", detalle: "Pinot · Aroma · Barrel", uso: "Catación y cierre de venta", clicks: "Cambian el aroma percibido" },
];

const ACADEMIA = [
  { id: "a1", titulo: "Leer una etiqueta de lote", min: 4,
    puntos: ["Origen y altura definen acidez", "El proceso define dulzor y cuerpo", "La fecha de tueste manda sobre todo lo demás"],
    quiz: [
      { q: "¿Qué define la acidez de un café, según la etiqueta del lote?", opciones: ["El logo de la marca", "Origen y altura", "El precio impreso"], correcta: 1 },
      { q: "Verdadero o falso: el proceso de beneficio es lo que define el dulzor y el cuerpo del café.", opciones: ["Verdadero", "Falso"], correcta: 0 },
      { q: "De estos datos de una etiqueta, ¿cuál manda sobre todos los demás?", opciones: ["El precio", "El logo de la marca", "La fecha de tueste"], correcta: 2 },
    ] },
  { id: "a2", titulo: "Molienda: por qué el clic importa", min: 6,
    puntos: ["Más fino, más superficie, más extracción", "Los finos ahogan el lecho y amargan", "Ajusta molienda antes que tiempo"],
    quiz: [
      { q: "Si un shot sale agrio y sub-extraído, ¿hacia qué lado ajustas la molienda?", opciones: ["Más gruesa", "No se toca la molienda", "Más fina"], correcta: 2 },
      { q: "Verdadero o falso: demasiados finos en la molienda ahogan el lecho y producen amargor.", opciones: ["Verdadero", "Falso"], correcta: 0 },
      { q: "Para corregir una extracción, ¿qué se ajusta primero?", opciones: ["El tiempo de preparación", "La molienda", "La cantidad de tazas servidas"], correcta: 1 },
    ] },
  { id: "a3", titulo: "Geometría del vertido", min: 7,
    puntos: ["La espiral reparte, el centro concentra", "Los pulsos estabilizan la temperatura", "La turbulencia es sabor, no adorno"],
    quiz: [
      { q: "¿Qué patrón de vertido concentra el agua en vez de repartirla por el lecho?", opciones: ["La espiral continua", "El vertido al centro", "Ambos reparten igual"], correcta: 1 },
      { q: "Verdadero o falso: verter por pulsos ayuda a estabilizar la temperatura.", opciones: ["Verdadero", "Falso"], correcta: 0 },
      { q: "Según la lección, ¿qué es la turbulencia del vertido?", opciones: ["Un error que siempre hay que evitar", "Solo un efecto visual, sin impacto en sabor", "Parte del sabor, no solo adorno"], correcta: 2 },
    ] },
  { id: "a4", titulo: "Catación y vocabulario de barra", min: 5,
    puntos: ["Describe con comida, no con adjetivos vacíos", "Primero dulzor, luego acidez, luego cuerpo", "El cliente compra lo que entiende"],
    quiz: [
      { q: "¿Cómo se recomienda describir un café en catación?", opciones: ["Con adjetivos vacíos como \"rico\"", "Con referencias de comida (caramelo, panela, etc.)", "Solo con el puntaje SCA"], correcta: 1 },
      { q: "¿En qué orden se cata un café, según la lección?", opciones: ["Cuerpo, acidez, dulzor", "Acidez, cuerpo, dulzor", "Dulzor, acidez, cuerpo"], correcta: 2 },
      { q: "Verdadero o falso: el cliente compra lo que entiende, por eso el vocabulario claro importa al vender.", opciones: ["Verdadero", "Falso"], correcta: 0 },
    ] },
];

const CLUB_NIVELES = [
  { nombre: "Grano", desde: 0, beneficio: "Acumula 1 punto por cada $1 en compras" },
  { nombre: "Tueste", desde: 100, beneficio: "10% off en filtrados de origen" },
  { nombre: "Barista", desde: 300, beneficio: "1 bebida gratis al mes + acceso anticipado a lotes nuevos" },
  { nombre: "Q Circle", desde: 600, beneficio: "Cata privada trimestral con el equipo Quadro" },
];

// Selección de método al confirmar el pedido — no cobra nada dentro de la
// app, solo le avisa a la barra cómo va a pagar el cliente. Sin datos de
// cuenta/banco: esos se confirman en caja, no se inventan aquí.
const METODOS_PAGO = [
  { id: "efectivo", nombre: "Efectivo", nota: "Paga en caja al retirar", icono: Banknote },
  { id: "movil", nombre: "Pago móvil", nota: "Datos en caja al confirmar", icono: Smartphone },
  { id: "zelle", nombre: "Zelle", nota: "Datos en caja al confirmar", icono: DollarSign },
  { id: "transferencia", nombre: "Transferencia", nota: "Datos en caja al confirmar", icono: Landmark },
];

// Para acá / para llevar — el cliente elige antes de enviar a barra, viaja con la orden.
const ENTREGA_OPCIONES = [
  { id: "aca", nombre: "Para acá", icono: Home },
  { id: "llevar", nombre: "Para llevar", icono: Package },
];

// Pasos reales de preparación — comparten forma entre el ticket del cliente
// (Realtime, Bloque 8) y el dashboard de barra. "completada" no tiene paso
// visible: es el estado que saca la orden de la cola activa tras entregarla.
const ESTADOS_ORDEN = [
  { id: "recibido", label: "Recibido en barra" },
  { id: "moliendo", label: "Moliendo" },
  { id: "extrayendo", label: "Extrayendo" },
  { id: "listo", label: "Listo para retirar" },
];

/* ============================ UTILES ============================ */

const money = (n) => `$${n.toFixed(2)}`;
const ACENTOS = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n", ü: "u" };
const slugify = (s) => s.toLowerCase()
  .replace(/[áéíóúñü]/g, (c) => ACENTOS[c])
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
    <button onClick={() => setTema(oscuro ? "claro" : "oscuro")} className="mo-tap" aria-label="Cambiar tema" style={{
      display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 11,
      border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer", position: "relative",
    }}>
      {/* Fase 7: crossfade sol/luna en vez de swap instantáneo — antes era
         un ternario (`{oscuro ? <Sun/> : <Moon/>}`) que desmontaba un ícono
         y montaba el otro de golpe, sin nada que interpolar entre dos <svg>
         distintos. Ahora los dos quedan siempre montados, superpuestos
         (position:absolute sobre el grid del botón), y solo cambian
         opacity/rotate/scale — eso sí es interpolable. */}
      <Sun size={16} style={{
        position: "absolute", opacity: oscuro ? 1 : 0,
        transform: oscuro ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(.5)",
        transition: "opacity var(--motion-base) var(--ease-in-out), transform var(--motion-base) var(--ease-spring)",
      }} />
      <Moon size={16} style={{
        position: "absolute", opacity: oscuro ? 0 : 1,
        transform: oscuro ? "rotate(90deg) scale(.5)" : "rotate(0deg) scale(1)",
        transition: "opacity var(--motion-base) var(--ease-in-out), transform var(--motion-base) var(--ease-spring)",
      }} />
    </button>
  );
}

// Fase 7 — toggle de sonido, opt-in y apagado por defecto (ver `sonar` más
// abajo): solo lee/escribe `localStorage["qc-sonido"]`, la fuente de verdad
// real que consulta el delegado `manejarTapSonido` en cada tap; este estado
// local es nomás para repintar el ícono.
function SonidoToggle() {
  const { C } = useTheme();
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem("qc-sonido") === "1"; } catch { return false; }
  });
  const alternar = () => {
    setOn((v) => {
      const next = !v;
      try { localStorage.setItem("qc-sonido", next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  };
  return (
    <button onClick={alternar} className="mo-tap" aria-label={on ? "Silenciar sonidos" : "Activar sonidos"} aria-pressed={on} style={{
      display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 11,
      border: `1px solid ${C.line}`, background: "transparent", color: on ? C.brand : C.text, cursor: "pointer",
    }}>
      {on ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}

/* ============================ PIEZAS ============================ */

/* <picture> con WebP responsivo (anchos declarados por cada asset en el
   manifiesto) + fallback JPG, con el color dominante del asset pintado en el
   wrapper hasta que la imagen cargue (sin blur — placeholder sólido).
   `eager` solo para imagen above-the-fold.

   `logo`: superpone la marca arriba a la izquierda como capa CSS aparte, sin
   tocar el archivo. Solo lo usan las fotos que NO traen el logotipo ya
   dibujado — hoy `lab-tubos`; las demás lo traen integrado en el producto
   (el bowl, el plato, la caja, el vaso) o en la propia escena, y una segunda
   marca encima quedaría duplicada. */
function ResponsiveImg({ id, alt = "", style = {}, className, eager = false, logo = false }) {
  const asset = ASSET_MANIFEST[id];
  if (!asset) return null;
  const { objectFit, objectPosition, ...wrapperStyle } = style;

  /* Slot reservado: el manifiesto declara la caja pero todavía no hay
     imagen (ver el encabezado de assetManifest.js). Se pinta el bloque de
     color con la geometría final para que el layout ya sea el definitivo;
     cuando el asset entre, este componente vuelve solo al camino de
     <picture> sin tocar el punto de uso. `role="presentation"` porque un
     bloque de color no comunica nada — no debe anunciarse como imagen. */
  if (asset.placeholder) {
    return (
      <div className={className} role="presentation" style={{
        display: "block", overflow: "hidden", background: asset.color,
        aspectRatio: `${asset.width} / ${asset.height}`,
        ...wrapperStyle,
      }} />
    );
  }

  const foto = (
    <picture className={logo ? undefined : className} style={{
      display: "block", overflow: "hidden", background: asset.color,
      aspectRatio: `${asset.width} / ${asset.height}`,
      ...(logo ? { width: "100%", height: "100%", borderRadius: "inherit" } : wrapperStyle),
    }}>
      <source type="image/webp"
        srcSet={asset.webp.map(([src, w]) => `${src} ${w}w`).join(", ")}
        sizes="(max-width: 430px) calc(100vw - 56px), 374px" />
      <img src={asset.jpg} alt={alt} loading={eager ? "eager" : "lazy"} style={{
        width: "100%", height: "100%", display: "block",
        objectFit: objectFit || "cover",
        ...(objectPosition ? { objectPosition } : {}),
      }} />
    </picture>
  );

  if (!logo) return foto;

  /* La marca va en un contenedor propio en vez de dentro del <picture>: ese
     elemento solo admite <source>/<img>, meterle un div rompería el HTML.
     El wrapper toma la geometría (incluido el borderRadius) y la foto la
     hereda, así el recorte de la esquina sigue aplicando a ambos. */
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", ...wrapperStyle }}>
      {foto}
      <span aria-hidden style={{
        position: "absolute", top: 12, left: 12,
        // Sombra suave detrás: la marca cae sobre foto, y sin ella se pierde
        // en las zonas claras (la gradilla tiene fondo gris medio).
        filter: "drop-shadow(0 1px 5px rgba(0,0,0,.45))",
      }}>
        <Marca size={26} />
      </span>
    </div>
  );
}

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

// `.bar`/`qc-bar` (Fase 2) ya hacía fill-on-load: `@keyframes qc-bar{from{width:0}}`
// deja que el navegador construya el "to" implícito desde el width inline,
// así que la barra siempre nace en 0 y crece al valor real. Lo que le
// faltaba (documentado en memoria.md, Fase 2) era el trigger para
// re-dispararlo cuando el VALOR cambia sin que el elemento se desmonte —
// por ejemplo, al tocar una ruta distinta en el comparador de Inicio.
// `triggerKey` es opcional: sin él, `useRetriggerAnim(undefined, ...)` nunca
// re-dispara (su dependencia nunca cambia), o sea el resto de los usos de
// `Meter` (Fincas, Laboratorio) queda exactamente igual que antes.
function Meter({ label, value, tone, delay = 0, triggerKey }) {
  const { C } = useTheme();
  const t = tone || C.brand;
  const fillRef = useRetriggerAnim(triggerKey, "bar");
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: ".1em", color: C.textMuted, marginBottom: 5, textTransform: "uppercase" }}>
        <span>{label}</span><span style={{ color: t }}>{value}</span>
      </div>
      <div style={{ height: 4, background: C.line, borderRadius: 99, overflow: "hidden" }}>
        <div ref={fillRef} className="bar" style={{ height: "100%", width: `${value}%`, background: t, borderRadius: 99, animationDelay: `${delay}ms`, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
    </div>
  );
}

function Header({ titulo, sub, right, onBack }) {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "22px 20px 14px", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} className="press" aria-label="Volver a inicio" style={{ ...btnMiniStyle(C), flexShrink: 0, marginBottom: 3 }}>
            <ArrowLeft size={15} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 6 }}>{sub}</div>
          <h1 className="disp" style={{ fontSize: 30, lineHeight: .95, margin: 0 }}>{titulo}</h1>
        </div>
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

function SplashFrame({ size = 96 }) {
  const { C } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ position: "absolute", inset: 0 }}>
      <rect x="4" y="4" width="92" height="92" rx="6" pathLength="1" fill="none" stroke={C.onBrand}
        strokeWidth="2" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation: "qc-frame-square .4s cubic-bezier(.4,0,.2,1) forwards" }} />
      <rect x="20" y="20" width="60" height="60" rx="3" pathLength="1" fill="none" stroke={C.onBrand}
        strokeWidth="2" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation: "qc-frame-square .3s cubic-bezier(.4,0,.2,1) .25s forwards" }} />
      <path d="M56 80 L68 62 L80 80 Z" pathLength="1" fill="none" stroke={C.onBrand}
        strokeWidth="2" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation: "qc-frame-square .25s cubic-bezier(.4,0,.2,1) .5s forwards" }} />
    </svg>
  );
}

function btnMiniStyle(C) {
  return {
    width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center",
    background: "transparent", border: `1px solid ${C.line}`, color: C.text, cursor: "pointer",
  };
}

/* ============================ INICIO ============================ */

/* Encoge el tamaño de fuente hasta que el texto quepa en UNA sola línea
   dentro del ancho de su contenedor. Existe por el titular de Inicio:
   "geometría." en Fraunces itálica a 44px no entra en un teléfono angosto
   y se cortaba contra el borde derecho. Partirlo en dos líneas no es
   opción (es la palabra que remata la frase), así que se reduce el cuerpo.

   El ancho del texto es lineal respecto al font-size, así que basta con
   medirlo una vez a `max` y escalar por la razón que falte — no hace falta
   iterar. Se vuelve a medir cuando cambia el ancho (ResizeObserver, o sea
   también al rotar el teléfono) y cuando terminan de cargar las webfonts,
   porque medir con la fuente de fallback da un ancho distinto. */
function UnaLinea({ children, max, min = 20, className, style }) {
  const ref = useRef(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const el = ref.current;
    const cont = el?.parentElement;
    if (!el || !cont) return;

    const medir = () => {
      const disponible = cont.clientWidth;
      if (!disponible) return;
      el.style.fontSize = `${max}px`;
      const natural = el.scrollWidth;
      const ajustado = natural > disponible
        ? Math.max(min, Math.floor(max * (disponible / natural)))
        : max;
      // Se reescribe el estilo en vez de limpiarlo: si el valor calculado
      // no cambia, React no re-renderiza y limpiarlo dejaría el elemento
      // sin tamaño hasta el próximo render.
      el.style.fontSize = `${ajustado}px`;
      setSize(ajustado);
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(cont);
    document.fonts?.ready.then(medir).catch(() => {});
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <span ref={ref} className={className}
      style={{ ...style, fontSize: size, display: "inline-block", whiteSpace: "nowrap", maxWidth: "100%" }}>
      {children}
    </span>
  );
}

/* ============================ TAZA POR COLOR (Fase 4, Inicio) ============================
   Indicador nuevo en el comparador de rutas de Inicio: qué color de taza
   deja cada geometría. No es el widget "La taza también sabe" de Aula (ese
   compara tazas de color fijo y su efecto en el dulzor percibido, dato
   confirmado); esto es al revés — el color nace del propio `efecto.cuerpo`
   que ya calcula GEOMETRIAS, mismo espíritu que la fórmula del simulador
   (un modelo razonable, no medido en laboratorio — ver CLAUDE.md). SVG por
   ahora: cuando el dueño pase fotos reales de taza, esto es lo que se
   reemplaza, sin tocar el resto del widget. */
function mezclarHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const mezcla = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${mezcla(ar, br)}${mezcla(ag, bg)}${mezcla(ab, bb)}`;
}

// Nunca un hex suelto: los dos extremos salen de PALETAS (card = taza vacía,
// brandAlt = acento cálido de marca) para que el gradiente sea correcto en
// los dos temas sin declarar nada nuevo.
//
// Bug reportado (2026-08-17): Sifón (extracción 88/cuerpo 72) y AeroPress
// Punto Central (extracción 68/cuerpo 84) se veían casi idénticos. Causa:
// esta fórmula solo miraba `cuerpo` normalizado contra 0-100, y el `cuerpo`
// real de las 4 rutas nunca baja de 38 ni sube de 84 — o sea usaba solo el
// 46% central del gradiente card→brandAlt, y encima ese par puntual queda a
// 12 puntos de distancia ahí adentro, casi imperceptible. Fix: normalizar
// cada eje contra su rango REAL en GEOMETRIAS (estira lo poco que hay a
// todo el gradiente disponible) y sumar `extracción` como segundo eje —
// que es justo donde ese par sí difiere fuerte (88 vs 68). Cuerpo pesa más
// (.6) por ser lo que más se lee como densidad visual; extracción amplifica
// (.4). Con esto el mismo par pasa de 12 a ~24 puntos de separación.
function normalizar(valor, min, max) {
  if (max === min) return .5;
  return Math.min(1, Math.max(0, (valor - min) / (max - min)));
}
const CUERPO_RANGO = GEOMETRIAS.reduce((r, g) => [Math.min(r[0], g.efecto.cuerpo), Math.max(r[1], g.efecto.cuerpo)], [Infinity, -Infinity]);
const EXTRACCION_RANGO = GEOMETRIAS.reduce((r, g) => [Math.min(r[0], g.efecto.extraccion), Math.max(r[1], g.efecto.extraccion)], [Infinity, -Infinity]);
function colorTaza(efecto, C) {
  const nCuerpo = normalizar(efecto.cuerpo, CUERPO_RANGO[0], CUERPO_RANGO[1]);
  const nExtraccion = normalizar(efecto.extraccion, EXTRACCION_RANGO[0], EXTRACCION_RANGO[1]);
  const t = nCuerpo * .6 + nExtraccion * .4;
  return mezclarHex(C.card, C.brandAlt, t);
}

// Variante de `colorTaza` para Laboratorio (Fase 5): ahí `extracción` ya es
// el resultado en vivo del simulador (perfil.extraccion), no un dato fijo
// de GEOMETRIAS, y los sliders la mueven por casi todo 0-100 con solo mover
// un extremo (radio a tope o molienda a tope ya la acercan a 0/98) — a
// diferencia del `cuerpo` de las 4 rutas fijas, no hace falta estirar un
// rango angosto: normalizar directo contra 0-100 (una extracción "es" un
// porcentaje) ya usa el gradiente completo. Mismos extremos de `colorTaza`
// (`C.card`/`C.brandAlt`), nunca un hex nuevo.
function colorExtraccion(extraccion, C) {
  const t = Math.min(1, Math.max(0, extraccion / 100));
  return mezclarHex(C.card, C.brandAlt, t);
}

function TazaColor({ color, C, size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 16h26" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
      <path d="M32 20h3a5 5 0 0 1 0 10h-3" stroke={C.line} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M10 16h22v14a11 11 0 0 1-11 11 11 11 0 0 1-11-11V16Z"
        stroke={C.line} strokeWidth="2"
        style={{ fill: color, transition: "fill var(--motion-base) var(--ease-in-out)" }} />
    </svg>
  );
}

// Goteo del Laboratorio (Fase 5): tres gotas en bucle infinito (`.drip`,
// definida desde antes en la hoja de estilos junto a `.steam` pero sin
// ningún uso todavía) cayendo sobre la misma `TazaColor` de Inicio, coloreadas
// con `colorExtraccion`. La animación corre siempre (no depende de "Simular
// vertido" — el goteo es la lectura continua del perfil, el botón es el
// trazo puntual del tubo 3D, son dos cosas distintas a propósito). El tono
// sigue el mismo mecanismo de crossfade que la taza de Inicio: `transition:
// fill` en el propio SVG, así que al arrastrar un slider el color se mueve
// en vivo, no solo al soltar.
function GoteoTaza({ extraccion, C }) {
  const color = colorExtraccion(extraccion, C);
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: 12, height: 20 }}>
        {[0, .5, 1].map((d) => (
          <span key={d} className="drip" style={{
            position: "absolute", left: "50%", top: 0, width: 5, height: 5, marginLeft: -2.5,
            borderRadius: "50%", background: color, animationDelay: `${d * .53}s`,
            transition: "background var(--motion-base) var(--ease-in-out)",
          }} />
        ))}
      </div>
      <TazaColor color={color} C={C} size={22} />
    </div>
  );
}

function Inicio({ ir, lote }) {
  const { C, tema } = useTheme();
  const [geo, setGeo] = useState(GEOMETRIAS[0]);
  // "Simular vertido" (nuevo en Inicio, no toca el botón homónimo de
  // Laboratorio): reusa el mismo mecanismo que ya tenía EspiralTubo3D — su
  // prop `prog` dibuja el tubo progresivamente — así el trazo de agua en
  // tiempo real es el componente real, no una animación CSS aparte que
  // pudiera desincronizarse de la ruta 3D. prog=1 es el reposo (trazo
  // completo, como estaba antes de esta fase); tocar el botón lo corre de
  // 0 a 1 en un rAF, igual que Laboratorio (misma duración, 4200ms, para no
  // inventar un segundo ritmo de "vertido" en la misma app).
  const [prog, setProg] = useState(1);
  const [corriendo, setCorriendo] = useState(false);
  useEffect(() => { setProg(1); setCorriendo(false); }, [geo]);
  useEffect(() => {
    if (!corriendo) return;
    let raf, t0 = performance.now();
    const dur = 4200;
    const loop = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setProg(p);
      if (p < 1) raf = requestAnimationFrame(loop); else setCorriendo(false);
    };
    setProg(0);
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [corriendo]);
  const simularVertido = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setProg(1); return; }
    setCorriendo(true);
  };
  // Taza por color: elemento estable (no remonta con `key={geo.id}` como el
  // tubo 3D) para que la transición CSS de `fill` pueda cruzar de un color
  // al otro de verdad — un remount no tiene "desde" que animar. El bounce
  // sí necesita el mismo truco de siempre (useRetriggerAnim), y por eso
  // también necesita un elemento que sobreviva entre renders.
  const tazaRef = useRetriggerAnim(geo.id);

  // Parallax sutil del hero: la capa 3D se mueve una fracción del scroll de
  // la pantalla (con techo, para que "sutil" sea literal), el titular no se
  // toca — throttled a un frame con rAF, y respeta prefers-reduced-motion a
  // mano porque mover un transform por scroll no es una transition/animation
  // CSS que la regla global ya cubra.
  const heroCapaRef = useRef(null);
  const parallaxRaf = useRef(null);
  useEffect(() => () => cancelAnimationFrame(parallaxRaf.current), []);
  const onScrollParallax = (e) => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (parallaxRaf.current) return;
    const top = e.currentTarget.scrollTop;
    parallaxRaf.current = requestAnimationFrame(() => {
      parallaxRaf.current = null;
      if (heroCapaRef.current) heroCapaRef.current.style.transform = `translateY(${Math.min(36, top * .2)}px)`;
    });
  };

  const tint = FINCA_TINTS[tema][FINCAS.findIndex((f) => f.id === lote.id)] || C.brand;

  return (
    <div className="qc-scroll" onScroll={onScrollParallax} style={{ overflowY: "auto", height: "100%", paddingBottom: 100 }}>
      <button onClick={() => ir("club")} className="press tapfx rise" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        width: "calc(100% - 40px)", margin: "12px 20px 0", textAlign: "left", cursor: "pointer",
        border: `1px solid ${C.brandAlt}`, borderRadius: 16, padding: "13px 16px",
        background: `linear-gradient(120deg, ${C.brandAlt}26, ${C.card})`, color: C.text,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ color: C.brandAlt }}><Award size={19} /></span>
          <div>
            <div className="disp" style={{ fontSize: 14 }}>Quadro Club</div>
            <div className="mono" style={{ fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>Tu fidelidad, tus puntos</div>
          </div>
        </div>
        <ChevronRight size={16} color={C.textMuted} />
      </button>

      <div className="rise" style={{ position: "relative", padding: "26px 20px 8px", overflow: "hidden", minHeight: 300 }}>
        {/* Hero 3D: mismo modelo que Lab (public/models/espiral.glb) más la
           espiral encendida con los colores de marca, orbitando solo, sin
           interacción, de fondo. Reemplaza el <model-viewer> de la primera
           pasada — ese mostraba solo el modelo apagado y se perdía contra
           el fondo en ambos temas; la espiral con brillo (igual que en Lab
           y en el comparador de rutas de abajo, mismo componente) es lo
           que le da presencia sin depender de afinar luces a ciegas. */}
        <div ref={heroCapaRef} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", willChange: "transform" }}>
          <Suspense fallback={null}>
            <EspiralHero vueltas={4.2} radio={1} width={340} height={300}
              colorLinea={C.line} colorBrand={C.brand} colorAcento={C.brandAlt}
              colorModelo={C.modelo} />
          </Suspense>
        </div>
        {/* Velo que separa el cono 3D del titular. Su fuerza va por tema
           (`veloHero`): los dos temas tienen el problema opuesto — ver los
           comentarios en PALETAS. */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, ${C.surface}${C.veloHero}, ${C.surface})`,
        }} />
        <div style={{ position: "relative" }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".24em", color: C.brandAlt, textTransform: "uppercase" }}>
            Barra abierta · 7:00 a 20:00
          </div>
          {/* lineHeight .88 apretaba tanto las líneas que la itálica de
             "geometría" (ascendentes largas) chocaba con "tiene una"; el
             tracking negativo que hereda .disp además pegaba las letras
             entre sí. Aquí se sueltan las dos cosas. El remate va en
             <UnaLinea> porque a 44px se salía del ancho del teléfono. */}
          <h1 className="disp" style={{ fontSize: 44, lineHeight: 1.02, letterSpacing: ".012em", margin: "10px 0 4px" }}>
            El sabor<br />tiene una<br />
            <UnaLinea className="script" max={44} min={24} style={{ color: C.brand }}>geometría.</UnaLinea>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.5, margin: "10px 0 0", maxWidth: 300 }}>
            Cada método dibuja una ruta distinta del agua sobre el café. Toca una ruta y mira cómo cambia la taza.
          </p>
        </div>
      </div>

      <div className="pop" style={{ position: "relative", margin: "14px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {/* La taza vive FUERA del div con key={geo.id}: ese remonta a
             propósito (retrigger del spiral-enter del tubo), pero un
             remount no tiene "desde" que animar — el crossfade de color de
             la taza necesita el mismo nodo vivo entre renders. */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <div key={geo.id} className="spiral-enter">
              {/* Fase 7: fallback con shimmer (`.mo-skeleton`, mismo patrón
                 que Carta/Fincas) en vez de un div en blanco — acá SÍ es
                 carga real (el chunk de three.js/espiral3d.jsx se pide con
                 lazy()), no una transición fingida como en esos otros casos. */}
              <Suspense fallback={<div className="mo-skeleton" style={{ width: 132, height: 132, borderRadius: "50%" }} />}>
                <EspiralTubo3D vueltas={geo.vueltas} radio={geo.radio} prog={prog} tam={132}
                  colorLinea={C.line} colorBrand={C.brand} colorAcento={C.brandAlt}
                  colorModelo={C.modelo} />
              </Suspense>
            </div>
            <div ref={tazaRef} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <TazaColor color={colorTaza(geo.efecto, C)} C={C} size={26} />
              <span className="mono" style={{ fontSize: 8, color: C.textMuted, letterSpacing: ".06em" }}>Color en taza</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 10, color: C.brandAlt, letterSpacing: ".16em", textTransform: "uppercase" }}>{geo.metodo}</div>
            <div className="disp" style={{ fontSize: 19, margin: "4px 0 10px" }}>{geo.nombre}</div>
            <Meter label="Extracción" value={geo.efecto.extraccion} triggerKey={geo.id} delay={0} />
            <Meter label="Cuerpo" value={geo.efecto.cuerpo} tone={C.brandAlt} triggerKey={geo.id} delay={90} />
            <Meter label="Acidez" value={geo.efecto.acidez} tone={C.purple} triggerKey={geo.id} delay={180} />
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5, margin: "12px 0 12px" }}>{geo.lectura}</p>
        <button onClick={simularVertido} disabled={corriendo} className="mo-press" style={{
          width: "100%", marginBottom: 14, padding: "11px", borderRadius: 12, border: `1px solid ${C.brand}`,
          background: corriendo ? C.brand : "transparent", color: corriendo ? C.onBrand : C.brand,
          cursor: corriendo ? "default" : "pointer", fontWeight: 600, fontSize: 12.5,
        }}>
          {corriendo ? "Vertiendo…" : "Simular vertido"}
        </button>
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
            {lote.score != null && (
              <div style={{ textAlign: "right" }}>
                <div className="disp" style={{ fontSize: 24, color: C.brand }}>{lote.score}</div>
                <div className="mono" style={{ fontSize: 9, color: C.textMuted, letterSpacing: ".1em" }}>SCA</div>
              </div>
            )}
          </div>
          {/* Agua Fría todavía no tiene notas de cata confirmadas — no se
             inventan, este bloque simplemente no aparece hasta que existan. */}
          {lote.notas && lote.notas.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {lote.notas.map((n) => (
                <span key={n} className="mono" style={{ fontSize: 10, padding: "4px 9px", borderRadius: 99, border: `1px solid ${C.line}`, color: C.text, display: "inline-grid", placeItems: "center" }}>{n}</span>
              ))}
            </div>
          )}
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 11, color: C.brand }}>
            Ver el guion de la finca <ChevronRight size={13} />
          </div>
        </button>
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

/* ============================ MOTION — PIEZAS COMPARTIDAS (Fase 3) ============================ */

// Retriggerea una animación CSS por clase cada vez que `dep` cambia, sin
// desmontar el elemento (así un hijo con estado propio — como
// AnimatedNumber de abajo — no pierde ese estado). No anima en el montaje
// inicial (ya sea que el elemento nazca invisible o que el propio montaje
// dispare su animación de "aparecer" — este hook es para lo que pasa
// DESPUÉS de eso). El truco es el clásico: sacar la clase, forzar reflow
// leyendo `offsetWidth`, y volver a ponerla — así el navegador la trata
// como una animación nueva en vez de ignorar el reinicio.
function useRetriggerAnim(dep, className = "mo-bounce") {
  const ref = useRef(null);
  const primero = useRef(true);
  useEffect(() => {
    if (primero.current) { primero.current = false; return; }
    const el = ref.current;
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }, [dep, className]);
  return ref;
}

// Número que cuenta hacia su valor nuevo en vez de saltar de golpe —
// usado en el badge del carrito y en los precios que cambian por selección.
// Respeta prefers-reduced-motion a mano (acá no alcanza con la regla CSS
// global, porque el conteo lo mueve JS/rAF, no una `transition`/`animation`).
function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(null);
  useEffect(() => {
    const desde = prevRef.current;
    const hasta = value;
    if (desde === hasta) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(hasta);
      prevRef.current = hasta;
      return;
    }
    const inicio = performance.now();
    const dur = 300; // --motion-base
    cancelAnimationFrame(rafRef.current);
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / dur);
      const suavizado = 1 - Math.pow(1 - p, 3); // aproxima --ease-out
      const actual = desde + (hasta - desde) * suavizado;
      // Sin `format` (conteos enteros, ej. el badge del carrito) redondeamos
      // en cada frame. Con `format` (precios) NO redondeamos acá — money()
      // ya formatea a 2 decimales, y redondear a entero de paso perdería
      // los centavos ($4.50 quedaría en $5 y ahí se quedaría).
      setDisplay(format ? actual : Math.round(actual));
      if (p < 1) rafRef.current = requestAnimationFrame(paso);
      else { setDisplay(hasta); prevRef.current = hasta; }
    };
    rafRef.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return format ? format(display) : display;
}

// "Fly to cart": un puntito que viaja desde el botón "+" tocado hasta el
// ícono del carrito en el header, vía Web Animations API — no puede ser un
// @keyframes fijo en CSS porque el origen cambia con cada tarjeta de
// producto (posiciones distintas en cada tap). Se crea y se destruye solo;
// no toca el DOM de React, así que no puede desincronizar el estado.
function volarAlCarrito(desdeEl, haciaEl, color) {
  if (!desdeEl || !haciaEl) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const from = desdeEl.getBoundingClientRect();
  const to = haciaEl.getBoundingClientRect();
  const dot = document.createElement("div");
  dot.style.cssText = `position:fixed;left:${from.left + from.width / 2 - 6}px;top:${from.top + from.height / 2 - 6}px;width:12px;height:12px;border-radius:50%;background:${color};z-index:999;pointer-events:none;`;
  document.body.appendChild(dot);
  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
  const anim = dot.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * .5}px, ${dy * .7}px) scale(.8)`, opacity: 1, offset: .6 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0 },
  ], { duration: 550, easing: "cubic-bezier(.34,1.56,.64,1)" });
  anim.onfinish = () => dot.remove();
}

// Sonido sutil opt-in (Fase 7) — toque de botón / agregar al carrito.
// Apagado por defecto: `localStorage["qc-sonido"]` solo vale "1" si el
// usuario lo prendió a mano desde `SonidoToggle` en el header — nunca suena
// sin ese gesto explícito. Un solo `AudioContext` compartido y creado recién
// al primer toque real (los navegadores bloquean `AudioContext` sin gesto
// del usuario, así que crearlo antes no serviría de nada); dos osciladores
// cortos en vez de archivos de audio, así que esto pesa 0KB de bundle. Todo
// dentro de un try/catch — si Web Audio no está disponible o el navegador
// lo bloquea, esto queda en silencio, nunca rompe el tap real.
let sonidoCtx = null;
function sonar(freq, dur, vol) {
  try {
    if (localStorage.getItem("qc-sonido") !== "1") return;
    if (!sonidoCtx) sonidoCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (sonidoCtx.state === "suspended") sonidoCtx.resume();
    const osc = sonidoCtx.createOscillator(), gain = sonidoCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, sonidoCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, sonidoCtx.currentTime + dur);
    osc.connect(gain).connect(sonidoCtx.destination);
    osc.start();
    osc.stop(sonidoCtx.currentTime + dur);
  } catch { /* Web Audio no disponible/bloqueado — silencioso a propósito */ }
}
const sonarTap = () => sonar(680, .045, .045);
const sonarCarrito = () => sonar(880, .09, .06);
// Delegado en un único listener (en vez de uno por botón) sobre el `.qc`
// raíz: cualquier tap dentro de `.press`/`.mo-press`/`.mo-tap` suena el tono
// genérico, salvo que el propio botón marque `data-sonido="carrito"` (el
// "+"/agregar de Carta), que usa el tono distinto de `sonarCarrito`.
function manejarTapSonido(e) {
  const el = e.target.closest(".press, .mo-press, .mo-tap");
  if (!el) return;
  if (el.dataset.sonido === "carrito") sonarCarrito(); else sonarTap();
}

/* ============================ MENÚ ============================ */

function Menu({ carrito, add, quitar, lote, setLote, taza, setTaza, onBack, carritoBtnRef }) {
  const { C } = useTheme();
  const [cat, setCat] = useState("Filtrado");
  const [abierto, setAbierto] = useState(null);
  const { items: carta, fuente } = useCarta();
  const items = carta.filter((m) => m.cat === cat);
  const imgCategoria = CAT_IMG[cat];

  // Underline animado que se desliza al chip de categoría activo — se mide
  // la posición real del chip tocado (offsetLeft/offsetWidth, en vez de
  // asumir un ancho fijo) porque cada nombre de categoría mide distinto.
  const chipRefs = useRef({});
  const [indicador, setIndicador] = useState(null);
  useLayoutEffect(() => {
    const el = chipRefs.current[cat];
    if (el) setIndicador({ left: el.offsetLeft, width: el.offsetWidth });
  }, [cat]);

  // Skeleton breve al cambiar de categoría. useCarta() ya tiene todo en
  // memoria (no hay fetch por categoría, es un filtro local), así que esto
  // es una transición deliberada, no una carga real que se esté fingiendo
  // — sincronizada con --motion-base para que el slide de contenido de
  // abajo entre justo cuando termina el shimmer.
  //
  // `cambiando` se prende en el MISMO handler de click que cambia `cat`
  // (cambiarCategoria de abajo), no reactivamente en un efecto que observa
  // `cat` — si se prendiera reactivamente, React ya habría re-renderizado
  // `items` con la categoría nueva ANTES de que el efecto alcance a poner
  // `cambiando=true`, y se alcanzaba a ver un flash del contenido real
  // viejo/nuevo por un frame antes de que apareciera el skeleton. Al
  // setear los dos estados juntos en el mismo evento, React los aplica en
  // el mismo render — nunca hay un frame con `cat` nuevo y `cambiando`
  // todavía en `false`.
  const [cambiando, setCambiando] = useState(false);
  const cambiarCategoria = (c) => {
    if (c === cat) return;
    setCambiando(true);
    setCat(c);
  };
  useEffect(() => {
    if (!cambiando) return;
    const t = setTimeout(() => setCambiando(false), 260);
    return () => clearTimeout(t);
  }, [cambiando]);

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 120 }}>
      <Header sub="Carta viva" titulo="Pedir en barra" onBack={onBack} />
      {import.meta.env.DEV && fuente === "local" && (
        <div className="mono" style={{
          margin: "0 20px 12px", padding: "8px 12px", borderRadius: 10, fontSize: 10.5,
          letterSpacing: ".02em", background: C.warn, color: C.onBrandAlt,
        }}>
          ⚠ Modo dev: mostrando MENU local — Supabase no respondió. Revisa la consola.
        </div>
      )}
      <div style={{ position: "relative", padding: "0 20px 14px" }}>
        <div className="qc-scroll" style={{ display: "flex", gap: 7, overflowX: "auto" }}>
          {CATS.map((c) => (
            <div key={c} ref={(el) => { chipRefs.current[c] = el; }}>
              <Chip active={c === cat} onClick={() => cambiarCategoria(c)}>{c}</Chip>
            </div>
          ))}
        </div>
        {indicador && (
          <span style={{
            position: "absolute", bottom: 8, left: indicador.left, width: indicador.width,
            height: 2, borderRadius: 99, background: C.brand, pointerEvents: "none",
            transition: "left var(--motion-base) var(--ease-in-out), width var(--motion-base) var(--ease-in-out)",
          }} />
        )}
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Un solo wrapper con key={cat} en vez de dos hermanos con su
           propia key cada uno (el banner por un lado, el slide de items
           por el otro) — con dos keys independientes en el mismo nivel,
           en este entorno quedaban imágenes de categorías previas sin
           limpiar en el DOM al cambiar rápido de categoría (reproducido
           y confirmado con build de producción, no era un artefacto de
           StrictMode). Con un único wrapper, todo el bloque de la
           categoría remonta como una unidad atómica — no hay forma de que
           el banner y el contenido queden desincronizados entre sí. */}
        <div key={cat}>
          {imgCategoria && (
            <ResponsiveImg id={imgCategoria} alt={cat} className="rise" style={{
              width: "100%", height: 120, borderRadius: 14, marginBottom: 12,
            }} />
          )}
          {cambiando ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="mo-skeleton" style={{ height: 92, borderRadius: 16, marginBottom: 10 }} />
            ))
          ) : (
            <div className="slide">
              {items.map((m) => {
              const n = carrito.filter((x) => x.id === m.id).length;
              const open = abierto === m.id;
              const agotado = m.disponible === false;
              return (
                <div key={m.id} style={{
                  background: C.card, border: `1px solid ${n ? C.brand : C.line}`,
                  borderRadius: 16, padding: 14, marginBottom: 10, transition: "border-color .25s",
                  opacity: agotado ? .55 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className="disp" style={{ fontSize: 15 }}>{m.nombre}</span>
                        {agotado ? (
                          <span className="mono" style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: C.warn, color: C.onBrandAlt, fontWeight: 600, display: "inline-grid", placeItems: "center" }}>Agotado hoy</span>
                        ) : m.tag && (
                          <span className="mono" style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: C.brandAlt, color: C.onBrandAlt, fontWeight: 600, display: "inline-grid", placeItems: "center" }}>{m.tag}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: C.textMuted, margin: "5px 0 0", lineHeight: 1.45 }}>{m.desc}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{money(m.precio)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                    {agotado ? <span /> : m.finca ? (
                      <button onClick={() => setAbierto(open ? null : m.id)} className="mo-press mono" style={{
                        fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: C.brand,
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                      }}>
                        {open ? "Ocultar opciones" : "Elegir finca y taza"}
                      </button>
                    ) : <span />}
                    {agotado ? (
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: C.textMuted }}>Vuelve mañana</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {n > 0 && (
                          <>
                            <button onClick={() => quitar(m.id)} className="mo-press" aria-label="Quitar uno" style={btnMiniStyle(C)}><Minus size={14} /></button>
                            <span className="mono" style={{ width: 16, textAlign: "center", fontSize: 13 }}><AnimatedNumber value={n} /></span>
                          </>
                        )}
                        <button
                          onClick={(e) => { volarAlCarrito(e.currentTarget, carritoBtnRef?.current, C.brand); add(m); }}
                          className="mo-press" aria-label={`Agregar ${m.nombre}`} data-sonido="carrito"
                          style={{ ...btnMiniStyle(C), background: C.brand, color: C.onBrand, borderColor: C.brand }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {!agotado && m.finca && (
                    <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows var(--motion-base) var(--ease-in-out)" }} aria-hidden={!open}>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                          <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Finca</div>
                          <div className="qc-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }}>
                            {FINCAS.map((f) => <Chip key={f.id} active={f.id === lote.id} onClick={() => setLote(f)} tone={C.brandAlt} onTone={C.onBrandAlt}>{f.finca}</Chip>)}
                          </div>
                          <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".14em", textTransform: "uppercase", margin: "14px 0 8px" }}>Taza</div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            {TAZAS.map((t) => (
                              <button key={t.id} onClick={() => setTaza(t)} className="mo-press" aria-label={`Taza ${t.nombre}`} style={{
                                width: 30, height: 30, borderRadius: 8, background: t.hex, cursor: "pointer",
                                border: `2px solid ${taza.id === t.id ? C.brand : "transparent"}`,
                              }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 10, lineHeight: 1.45 }}>
                            <strong style={{ color: C.text }}>{taza.nombre}:</strong> {taza.efecto}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ FINCAS + AVATAR ============================ */

function FichaLote({ lote, compact, titulo }) {
  const { C } = useTheme();
  // Agua Fría todavía no tiene proceso de beneficio / puntaje SCA / notas de
  // cata confirmados por el dueño (ver CLAUDE.md § Real-data policy) — nunca
  // inventar esas cifras. Cada campo derivado se oculta si su dato base falta,
  // en vez de reventar con `undefined.includes` o mostrar un "NaN".
  const dulzor = lote.score != null ? Math.round(lote.score - 12) : null;
  const acidez = Math.round(lote.altura / 26);
  const cuerpo = lote.proceso ? (lote.proceso.includes("Honey") ? 80 : 58) : null;
  const campos = [
    ["Altura", `${lote.altura} msnm`], ["Varietal", lote.varietal],
  ];
  if (lote.proceso) campos.push(["Proceso", lote.proceso]);
  if (lote.score != null) campos.push(["Puntaje", `${lote.score} SCA`]);
  return (
    <div style={{
      flex: compact ? 1 : "initial", minWidth: 0, background: C.card, border: `1px solid ${C.line}`,
      borderRadius: compact ? 14 : 18, padding: compact ? 12 : 16,
    }}>
      {titulo && (
        <div className="disp" style={{ fontSize: 14, lineHeight: 1.15, marginBottom: 8 }}>{titulo}</div>
      )}
      <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase", marginBottom: compact ? 8 : 12 }}>Ficha del lote</div>
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: compact ? 8 : 14 }}>
        {campos.map(([k, v]) => (
          <div key={k}>
            <div className="mono" style={{ fontSize: 9.5, color: C.textMuted, letterSpacing: ".12em", textTransform: "uppercase" }}>{k}</div>
            <div className="disp" style={{ fontSize: compact ? 13 : 16, lineHeight: 1.15, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: compact ? 12 : 16 }}>
        {/* triggerKey={lote.id} (Fase 6): FichaLote no remonta al cambiar de
           finca (solo la card superior de arriba lo hace, vía su propio
           key={lote.id}), así que sin esto las barras saltaban directo al
           valor nuevo sin volver a llenarse — mismo mecanismo `triggerKey`
           que ya usa `Meter` desde Fase 4 (Inicio) y Fase 5 (Lab). */}
        {dulzor != null && <Meter label="Dulzor" value={dulzor} tone={C.brandAlt} triggerKey={lote.id} />}
        <Meter label="Acidez" value={acidez} triggerKey={lote.id} />
        {cuerpo != null && <Meter label="Cuerpo" value={cuerpo} tone={C.purple} triggerKey={lote.id} />}
      </div>
    </div>
  );
}

function Fincas({ lote, setLote, onBack }) {
  const { C, tema } = useTheme();
  const [linea, setLinea] = useState(0);
  const [reproduciendo, setRepro] = useState(false);
  const [transcripcion, setTrans] = useState(false);
  const [comparar, setComparar] = useState(false);
  const [comparados, setComparados] = useState([FINCAS[0].id, FINCAS[1].id]);
  const [agenteAbierto, setAgenteAbierto] = useState(false);
  const timer = useRef(null);

  // Fase 7 — skeleton breve al cambiar de finca, mismo patrón y misma razón
  // que `cambiando`/`cambiarCategoria` de Carta (Fase 3): `cambiandoFinca`
  // se prende en el MISMO handler que llama a `setLote`, no reactivamente
  // en un efecto que observa `lote`, para no dejar pasar un frame con el
  // lote nuevo ya renderizado y el skeleton todavía apagado.
  const [cambiandoFinca, setCambiandoFinca] = useState(false);
  const elegirFinca = (f) => {
    if (f.id === lote.id) return;
    setCambiandoFinca(true);
    setLote(f);
  };
  useEffect(() => {
    if (!cambiandoFinca) return;
    const t = setTimeout(() => setCambiandoFinca(false), 260);
    return () => clearTimeout(t);
  }, [cambiandoFinca]);

  useEffect(() => { setLinea(0); setRepro(false); setAgenteAbierto(false); }, [lote.id]);

  useEffect(() => {
    if (!reproduciendo) { clearTimeout(timer.current); return; }
    if (linea >= lote.guion.length - 1) { setRepro(false); return; }
    timer.current = setTimeout(() => setLinea((l) => l + 1), 3400);
    return () => clearTimeout(timer.current);
  }, [reproduciendo, linea, lote]);

  const tint = FINCA_TINTS[tema][FINCAS.findIndex((f) => f.id === lote.id)] || C.brand;

  const toggleComparado = (id) => {
    setComparados((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= 2) return [sel[1], id];
      return [...sel, id];
    });
  };

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Origen" titulo="Fincas" onBack={onBack}
        right={<Chip active={comparar} onClick={() => setComparar((v) => !v)} tone={C.purple} onTone={C.surface}>Comparar</Chip>} />

      {/* Fase 6: key={comparar} + .slide en los dos wrappers de abajo —
         antes el swap entre el chip-row normal y el de "elige 2 fincas" era
         instantáneo (un ternario plano, sin animación de entrada). No se
         tocó ningún .press/Chip compartido, solo se envolvió el contenido
         que ya existía. */}
      {!comparar ? (
        <div key="fila-normal" className="qc-scroll slide" style={{ display: "flex", gap: 7, padding: "0 20px 16px", overflowX: "auto" }}>
          {FINCAS.map((f) => <Chip key={f.id} active={f.id === lote.id} onClick={() => elegirFinca(f)} tone={C.brandAlt} onTone={C.onBrandAlt}>{f.finca}</Chip>)}
        </div>
      ) : (
        <div key="fila-comparar" className="slide" style={{ padding: "0 20px 16px" }}>
          <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
            Elige 2 fincas para comparar
          </div>
          <div className="qc-scroll" style={{ display: "flex", gap: 7, overflowX: "auto" }}>
            {FINCAS.map((f) => <Chip key={f.id} active={comparados.includes(f.id)} onClick={() => toggleComparado(f.id)} tone={C.purple} onTone={C.surface}>{f.finca}</Chip>)}
          </div>
        </div>
      )}

      {!comparar && (cambiandoFinca ? (
        // Fase 7: mismo patrón de skeleton "deliberado" que Carta (Fase 3) —
        // FINCAS también vive entero en memoria (sin fetch por finca), así
        // que esto es una transición a propósito, no una carga real fingida.
        // Cubre el mismo alto aproximado que la card real de abajo, para que
        // no salte el layout al resolver.
        <div style={{ margin: "0 20px" }}>
          <div className="mo-skeleton" style={{ height: 216, borderRadius: "22px 22px 0 0" }} />
          <div style={{
            background: C.surface, padding: "14px 16px", minHeight: 86,
            borderRadius: "0 0 22px 22px", border: `1px solid ${C.line}`, borderTop: "none",
          }}>
            <div className="mo-skeleton" style={{ height: 14, borderRadius: 7, width: "85%" }} />
            <div className="mo-skeleton" style={{ height: 14, borderRadius: 7, width: "60%", marginTop: 8 }} />
          </div>
        </div>
      ) : (
        <div className="pop" key={lote.id} style={{
          margin: "0 20px", borderRadius: 22, overflow: "hidden",
          border: `1px solid ${C.line}`, background: `linear-gradient(165deg, ${tint}55, ${C.card} 55%)`,
        }}>
          {lote.avatar.agentUrl ? (
            // Agente conversacional real (D-ID Agents, voz + cámara). Primer intento:
            // el iframe de D-ID embebido directo acá adentro (círculo, después
            // rectángulo). Se descartó tras medirlo con CDP: el widget de D-ID tiene
            // un piso de ancho fijo de ~350px (no se achica más) y un zoom del 105%
            // en su preview estático — ninguno de los dos se puede tocar por CSS
            // desde afuera (contenido cross-origin). En una card angosta como esta
            // (la mayoría de celulares reales quedan por debajo de esos 350px una
            // vez restados margen/padding/borde), eso descentraba el botón "Start
            // call" del widget y recortaba el sombrero — confirmado reproduciendo el
            // iframe en un harness aparte y midiendo el DOM interno de D-ID por CDP,
            // no es algo que dependa de la foto ni del aspect ratio del contenedor.
            // Fix: foto fija (mismo recorte que ya tiene el agente en D-ID, sin
            // marca de agua) acá en el card, con un botón que abre el agente en un
            // overlay a pantalla completa (`AgenteFincaOverlay`, mismo patrón
            // position:absolute inset:0 que usaba el módulo Estudio, eliminado
            // 2026-08-17) — ahí sí tiene ancho de sobra y se ve como en la
            // página completa de D-ID (probado directo, sin iframe, se ve bien).
            <div style={{ padding: "18px 18px 4px" }}>
              <button onClick={() => setAgenteAbierto(true)} className="mo-press tapfx" style={{
                width: "100%", aspectRatio: "4 / 5", borderRadius: 20, overflow: "hidden", position: "relative",
                background: C.surface, border: `2px solid ${C.brandAlt}`, padding: 0, cursor: "pointer", display: "block",
              }}>
                <img src={lote.avatar.foto} alt={`${lote.avatar.nombre}, ${lote.avatar.rol}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span className="mono" style={{
                  position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)",
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 99,
                  background: C.brand, color: C.onBrand, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap",
                }}>
                  <Mic size={13} /> Hablar con {lote.avatar.nombre}
                </span>
              </button>
              <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
                <div className="disp" style={{ fontSize: 16 }}>{lote.avatar.nombre}</div>
                <div className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".12em", textTransform: "uppercase" }}>{lote.avatar.rol}</div>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative", height: 216, display: "grid", placeItems: "center" }}>
              <svg viewBox="0 0 320 160" style={{ position: "absolute", bottom: 0, width: "100%", opacity: .35 }}>
                <path d="M0 160 L60 78 L104 122 L156 44 L212 118 L262 70 L320 160 Z" fill={C.surface} />
              </svg>
              <div style={{ position: "relative", textAlign: "center" }}>
                <div className={reproduciendo ? "pulse" : ""} style={{
                  width: 92, height: 92, borderRadius: "50%", margin: "0 auto", overflow: "hidden",
                  display: "grid", placeItems: "center", background: C.surface,
                  border: `2px solid ${reproduciendo ? C.brand : C.brandAlt}`,
                }}>
                  {lote.avatar.video ? (
                    // Mismo patrón que Marca (logo circular): wrapper de tamaño fijo con
                    // overflow:hidden + media a 100%/100% con objectFit cover — el archivo
                    // no necesita venir pre-recortado en círculo.
                    <video key={lote.avatar.video} src={lote.avatar.video} autoPlay loop muted playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <span className="disp" style={{ fontSize: 34, color: reproduciendo ? C.brand : C.brandAlt }}>{lote.avatar.inicial}</span>
                  )}
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
          )}

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
              <button onClick={() => { if (linea >= lote.guion.length - 1) setLinea(0); setRepro(!reproduciendo); }} className="mo-press"
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 99, border: "none", background: C.brand, color: C.onBrand, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                {reproduciendo ? <Pause size={14} /> : <Play size={14} />}
                {/* Nunca hubo audio real acá — es un guion en texto que avanza solo.
                   El copy decía "Reproducir"/"Pausar" como si fuera un audio real;
                   se corrigió a "Ver guion" para no prometer algo que no pasa (ver
                   memoria.md/CLAUDE.md — pendiente real: videos Higgsfield o TTS). */}
                {reproduciendo ? "Pausar" : linea === 0 ? "Ver guion" : "Continuar"}
              </button>
              <button onClick={() => setTrans(!transcripcion)} className="mo-press mono" style={{
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
      ))}

      {!comparar ? (
        <div key="ficha-normal" className="slide" style={{ margin: "16px 20px 0" }}>
          <FichaLote lote={lote} />
        </div>
      ) : (
        <div key="ficha-comparar" style={{ display: "flex", gap: 10, margin: "16px 20px 0", alignItems: "stretch" }}>
          {[0, 1].map((slot) => {
            const id = comparados[slot];
            const f = id && FINCAS.find((x) => x.id === id);
            return f ? (
              // .rise con stagger (slot 0/1) — mismo patrón ya usado en Equipo
              // de Laboratorio y ACADEMIA, para que las dos fichas entren una
              // detrás de otra en vez de las dos a la vez.
              <div key={id} className="rise" style={{ animationDelay: `${slot * 60}ms`, flex: 1, minWidth: 0, display: "flex" }}>
                <FichaLote lote={f} compact titulo={f.finca} />
              </div>
            ) : (
              <div key={`vacio-${slot}`} style={{
                flex: 1, minWidth: 0, border: `1px dashed ${C.line}`, borderRadius: 14,
                display: "grid", placeItems: "center", padding: 18, color: C.textMuted,
                fontSize: 11.5, textAlign: "center", lineHeight: 1.4,
              }}>Elige otra finca arriba</div>
            );
          })}
        </div>
      )}

      {agenteAbierto && lote.avatar.agentUrl && (
        <AgenteFincaOverlay lote={lote} cerrar={() => setAgenteAbierto(false)} />
      )}
    </div>
  );
}

// Overlay a pantalla completa para el agente D-ID (mismo patrón
// position:absolute inset:0 que usaba el módulo Estudio, eliminado
// 2026-08-17 — sobre el frame de la app).
// El iframe queda con ancho de sobra (solo 8px de aire a cada lado) para no
// pisar el piso de ~350px del widget de D-ID — ver el comentario largo en
// `Fincas` sobre por qué ya no vive embebido dentro de la card angosta.
function AgenteFincaOverlay({ lote, cerrar }) {
  const { C } = useTheme();
  return (
    <div onClick={cerrar} style={{ position: "absolute", inset: 0, background: "rgba(5,8,7,.92)", zIndex: 45, display: "flex", flexDirection: "column" }}>
      {/* Fase 6: .pop (fade+scale, pensado para tarjetas) → .sheet (mismo
         keyframe qc-sheet que ya usa el carrito, translateY(100%)→0) — se
         lee más como "se abre una hoja a pantalla completa" que como una
         tarjeta apareciendo, coherente con lo que es: un overlay full-bleed. */}
      <div onClick={(e) => e.stopPropagation()} className="sheet" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px 10px" }}>
          <span className="mono" style={{ fontSize: 10, color: C.textMuted, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {lote.avatar.nombre} · {lote.finca}
          </span>
          <button onClick={cerrar} className="mo-press" aria-label="Cerrar" style={{ ...btnMiniStyle(C), background: C.card }}><X size={15} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}` }}>
          <iframe
            src={lote.avatar.agentUrl}
            title={`${lote.avatar.nombre} · Finca ${lote.finca}`}
            allow="microphone; camera"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
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

function Laboratorio({ onBack }) {
  const { C } = useTheme();
  const [geo, setGeo] = useState(GEOMETRIAS[0]);
  const [vueltas, setVueltas] = useState(GEOMETRIAS[0].vueltas);
  const [radio, setRadio] = useState(GEOMETRIAS[0].radio);
  const [temp, setTemp] = useState(93);
  const [molienda, setMolienda] = useState(22);
  const [corriendo, setCorriendo] = useState(false);
  const [prog, setProg] = useState(1);

  // Al cambiar de método (chip) también se corta cualquier vertido en curso
  // y el tubo vuelve a reposo (prog=1) — mismo reset que ya hace el
  // comparador de Inicio al tocar una ruta distinta, para que el
  // "spiral-enter" de abajo entre limpio y no arrastre un vertido a medias
  // del método anterior.
  useEffect(() => { setVueltas(geo.vueltas); setRadio(geo.radio); setProg(1); setCorriendo(false); }, [geo]);

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

  // Mismo patrón que "Simular vertido" de Inicio (Fase 4): respeta
  // prefers-reduced-motion a mano porque el trazo corre por rAF, no por una
  // transition/animation CSS que la regla global ya cubra.
  const simularVertido = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setProg(1); return; }
    setCorriendo(true);
  };

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
      {/* Banner superior, con la misma geometría que los de Carta (3.25:1).
         Aquí los 20px laterales van en el propio componente, no heredados de
         un wrapper con padding. `eager`: es lo primero de la pantalla. */}
      <ResponsiveImg id="lab-tubos" alt="Tubos de grano por nivel de tueste en la barra de Quadro Café" eager logo style={{
        width: "calc(100% - 40px)", margin: "0 20px", height: 120, borderRadius: 14,
      }} />
      <Header sub="Geometría de extracción" titulo="Laboratorio" onBack={onBack} />
      <p style={{ padding: "0 20px", fontSize: 13.5, color: C.textMuted, lineHeight: 1.5, margin: "0 0 16px" }}>
        Mueve la ruta del agua y mira cómo se desplaza el perfil. Lo mismo que hace la máquina, en tu mano.
      </p>

      {/* Un solo elemento 3D real (espiral.glb + tubo procedural que
         responde a vueltas/radio/prog) — antes eran dos cosas separadas
         (un <model-viewer> decorativo arriba, un SVG plano abajo con el
         propio simulador); se fusionaron para eliminar la duplicación. */}
      <div style={{ margin: "0 20px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16 }}>
        {/* `key={geo.id}` + `spiral-enter`: mismo micro-crossfade que ya usa
           el tubo del comparador de Inicio al cambiar de ruta (opacity+scale,
           .9s) — remonta a propósito para que el cambio de método se sienta
           como una entrada nueva, no un salto instantáneo de geometría. */}
        <div key={geo.id} className="spiral-enter" style={{ display: "grid", placeItems: "center" }}>
          {/* Fase 7: mismo fallback con shimmer que el comparador de Inicio
             — acá también es carga real del chunk lazy de three.js. */}
          <Suspense fallback={<div className="mo-skeleton" style={{ width: 230, height: 230, borderRadius: "50%" }} />}>
            <EspiralTubo3D vueltas={vueltas} radio={radio} prog={prog} tam={230}
              colorLinea={C.line} colorBrand={C.brand} colorAcento={C.brandAlt}
              colorModelo={C.modelo} />
          </Suspense>
        </div>

        <button onClick={simularVertido} disabled={corriendo} className="mo-press" style={{
          width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, border: `1px solid ${C.brand}`,
          background: corriendo ? C.brand : "transparent", color: corriendo ? C.onBrand : C.brand,
          cursor: corriendo ? "default" : "pointer", fontWeight: 600, fontSize: 13,
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: C.brandAlt, textTransform: "uppercase" }}>Perfil resultante</div>
          <GoteoTaza extraccion={perfil.extraccion} C={C} />
        </div>
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

function Academia({ taza, setTaza, onBack }) {
  const { C } = useTheme();

  const [estado, setEstado] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qc-academia"));
      return saved && typeof saved === "object" ? saved : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("qc-academia", JSON.stringify(estado)); } catch { /* noop */ }
  }, [estado]);

  const [abierta, setAbierta] = useState(null);

  const hechos = ACADEMIA.filter((a) => estado[a.id]?.done).map((a) => a.id);
  const pct = Math.round((hechos.length / ACADEMIA.length) * 100);
  const insigniaLista = hechos.length === ACADEMIA.length;

  // Racha (Fase 6) — DECISIÓN TEMPORAL REVERSIBLE: el dueño todavía no
  // confirmó si la racha/badges de Aula debe ser solo visual o persistir en
  // Supabase (decisión propia pendiente, ver memoria.md). Sin esa respuesta,
  // se implementa la versión más simple y reversible: local-only en
  // localStorage, mismo patrón que ya usa `estado` un poco más arriba. Si el
  // dueño pide Supabase después, esto se reemplaza por una tabla/columna sin
  // tocar la UI (misma forma { dias, ultimaFecha }).
  // Cuenta "días distintos con al menos una lección completada", no visitas:
  // sube 1 cuando `hechos.length` crece en un día distinto al de la última
  // vez que subió; si el día anterior no tuvo actividad, la racha se corta a 1
  // en vez de seguir sumando.
  const [racha, setRacha] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qc-academia-racha"));
      return saved && typeof saved === "object" && typeof saved.dias === "number" ? saved : { dias: 0, ultimaFecha: null };
    } catch { return { dias: 0, ultimaFecha: null }; }
  });
  const hechosPrevRef = useRef(hechos.length);
  useEffect(() => {
    if (hechos.length > hechosPrevRef.current) {
      const hoy = new Date().toISOString().slice(0, 10);
      setRacha((r) => {
        if (r.ultimaFecha === hoy) return r; // ya se contó una lección hoy
        const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const dias = r.ultimaFecha === ayer ? r.dias + 1 : 1;
        const next = { dias, ultimaFecha: hoy };
        try { localStorage.setItem("qc-academia-racha", JSON.stringify(next)); } catch { /* noop */ }
        return next;
      });
    }
    hechosPrevRef.current = hechos.length;
  }, [hechos.length]);
  const flameRef = useRetriggerAnim(racha.dias);

  const responder = (leccionId, qIdx, opIdx) => {
    setEstado((prev) => {
      const leccion = ACADEMIA.find((a) => a.id === leccionId);
      const actual = prev[leccionId] || { respuestas: [] };
      if (actual.done) return prev;
      const respuestas = [...actual.respuestas];
      respuestas[qIdx] = opIdx;
      const done = respuestas.length === leccion.quiz.length && respuestas.every((r) => r !== undefined && r !== null);
      return { ...prev, [leccionId]: { respuestas, done } };
    });
  };

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Formación de barra" titulo="Academia" onBack={onBack} />

      <div style={{ margin: "0 20px 18px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase" }}>Tu avance</span>
          <span className="disp" style={{ fontSize: 24, color: C.brand }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: C.line, borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.brand, borderRadius: 99, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
        </div>
        {racha.dias > 0 && (
          // Racha visual/local (ver comentario junto al estado más arriba) —
          // solo aparece una vez que hay al menos 1 día contado, para no
          // mostrar "0 días de racha" a alguien que recién entra.
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <span ref={flameRef} className="mo-bounce" style={{ display: "grid", placeItems: "center", color: C.brandAlt }}>
              <Flame size={14} fill={C.brandAlt} />
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: C.textMuted, letterSpacing: ".06em" }}>
              {racha.dias} {racha.dias === 1 ? "día de racha" : "días de racha"}
            </span>
          </div>
        )}
      </div>

      {insigniaLista && (
        <div className="pop" style={{
          margin: "0 20px 18px", background: C.brand, color: C.onBrand, borderRadius: 18,
          padding: 15, display: "flex", gap: 12, alignItems: "center",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "grid", placeItems: "center",
            background: `${C.onBrand}22`,
          }}>
            <Award size={20} />
          </div>
          <div>
            <div className="disp" style={{ fontSize: 16, lineHeight: 1.1 }}>Insignia desbloqueada</div>
            <div className="mono" style={{ fontSize: 10, opacity: .85, marginTop: 4, lineHeight: 1.5 }}>
              Logro dentro de la app · completaste las 4 lecciones de Academia
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        {ACADEMIA.map((a, i) => {
          const info = estado[a.id] || { respuestas: [] };
          const done = !!info.done;
          const abierto = abierta === a.id;
          const aciertos = info.respuestas.filter((r, qi) => r === a.quiz[qi]?.correcta).length;
          return (
            <div key={a.id} className="rise" style={{ animationDelay: `${i * 55}ms`, marginBottom: 10 }}>
              <button onClick={() => setAbierta(abierto ? null : a.id)} className="mo-press tapfx" style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: C.card, border: `1px solid ${done ? C.brand : C.line}`,
                borderRadius: abierto ? "16px 16px 0 0" : 16, padding: 15, color: C.text,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="disp" style={{ fontSize: 15 }}>{a.titulo}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                    border: `1px solid ${done ? C.brand : C.line}`, background: done ? C.brand : "transparent", color: C.onBrand,
                    transition: "background var(--motion-fast) var(--ease-spring), border-color var(--motion-fast) var(--ease-spring)",
                  }}>{done && <Check size={13} className="pop" />}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 5 }}>
                  {a.min} min de lectura{done ? ` · ${aciertos}/${a.quiz.length} correctas` : ""}
                </div>
                <ul style={{ margin: "10px 0 0", padding: "0 0 0 16px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.6 }}>
                  {a.puntos.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </button>

              {/* Fase 6: técnica grid-template-rows 0fr→1fr, portada tal cual
                 del acordeón "Elegir finca y taza" de Carta (Fase 3) — antes
                 era un conditional-mount (`{abierto && <div className="slide">}`)
                 que producía el mismo salto instantáneo de layout que ese otro
                 acordeón tenía antes de arreglarse. Siempre montado, oculto por
                 altura 0 + aria-hidden, sin medir nada por JS. */}
              <div style={{ display: "grid", gridTemplateRows: abierto ? "1fr" : "0fr", transition: "grid-template-rows var(--motion-base) var(--ease-in-out)" }} aria-hidden={!abierto}>
                <div style={{ overflow: "hidden" }}>
                  <div style={{
                    background: C.card, border: `1px solid ${done ? C.brand : C.line}`, borderTop: "none",
                    borderRadius: "0 0 16px 16px", padding: 15,
                  }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: C.brandAlt, textTransform: "uppercase", marginBottom: 12 }}>
                      Comprueba lo que leíste
                    </div>
                    {a.quiz.map((qz, qi) => {
                      const resp = info.respuestas[qi];
                      const respondido = resp !== undefined && resp !== null;
                      return (
                        <div key={qi} style={{ marginBottom: qi === a.quiz.length - 1 ? 0 : 16 }}>
                          <div style={{ fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>{qz.q}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {qz.opciones.map((op, oi) => {
                              const elegido = resp === oi;
                              const esCorrecta = oi === qz.correcta;
                              let borde = C.line, color2 = C.textMuted;
                              if (respondido && (elegido || esCorrecta)) {
                                const tono = esCorrecta ? C.brand : C.warn;
                                borde = tono; color2 = tono;
                              }
                              return (
                                <button key={oi} onClick={() => responder(a.id, qi, oi)} disabled={respondido}
                                  className={respondido ? "" : "mo-press"} style={{
                                    textAlign: "left", padding: "9px 11px", borderRadius: 10, fontSize: 12.5,
                                    border: `1px solid ${borde}`, background: "transparent", color: color2,
                                    cursor: respondido ? "default" : "pointer",
                                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                                  }}>
                                  <span>{op}</span>
                                  {respondido && elegido && (esCorrecta ? <Check size={13} /> : <X size={13} />)}
                                </button>
                              );
                            })}
                          </div>
                          {respondido && (
                            <div className="mono slide" style={{ fontSize: 10.5, marginTop: 6, color: resp === qz.correcta ? C.brand : C.warn }}>
                              {resp === qz.correcta ? "Correcto." : `Incorrecto — la respuesta era: ${qz.opciones[qz.correcta]}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
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
            {/* Foto real del producto (2026-08-17) reemplaza la taza dibujada
               con divs (cuerpo de color plano + franja oscura simulando el
               café) para las 5 que ya tienen foto — `.pop` sigue haciendo el
               crossfade al cambiar de taza, igual que antes. `foto` es
               opcional a propósito: si algún día se agrega una taza sin foto
               todavía (ej. la 6ta, "Marrón caramelo", pendiente de Reiner),
               cae de vuelta al dibujo CSS en vez de romper o mostrar un
               `<img>` vacío. */}
            <div key={taza.id} className="pop" style={{ position: "relative" }}>
              {taza.foto ? (
                <img src={taza.foto} alt={`Taza ${taza.nombre}`} style={{
                  width: 120, height: 120, objectFit: "cover", borderRadius: 18,
                  border: `2px solid ${C.line}`, display: "block",
                }} />
              ) : (
                <>
                  <div style={{
                    width: 94, height: 78, borderRadius: "10px 10px 40px 40px",
                    background: taza.hex, border: `2px solid ${C.line}`,
                  }} />
                  <div style={{
                    position: "absolute", top: 8, left: 10, right: 10, height: 16,
                    borderRadius: 99, background: "#2B1A10",
                  }} />
                </>
              )}
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

/* ============================ QUADRO CLUB ============================ */

function Club({ email, setEmail, onBack, onAdmin }) {
  const { C } = useTheme();
  const [enviado, setEnviado] = useState(!!email);
  const [valor, setValor] = useState(email || "");
  const puntos = enviado ? 40 : 0;
  const nivel = [...CLUB_NIVELES].reverse().find((n) => puntos >= n.desde) || CLUB_NIVELES[0];

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Fidelidad" titulo="Quadro Club" onBack={onBack} right={
        <button onClick={onAdmin} className="press" aria-label="Panel del dueño" style={{ ...btnMiniStyle(C), marginBottom: 3 }}>
          <Settings size={15} />
        </button>
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

/* ============================ ADMIN ============================ */

function AdminLogin({ onLogged, origen = "admin" }) {
  const { C } = useTheme();
  const [modo, setModo] = useState("login"); // "login" | "recuperar" | "enviado"
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError(""); setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
    setCargando(false);
    if (err) setError("Correo o clave incorrectos.");
    else onLogged();
  };

  const enviarRecuperacion = async (e) => {
    e.preventDefault();
    setError(""); setCargando(true);
    // El enlace de recuperación de Supabase pisa el hash con su propio
    // #access_token=...&type=recovery, así que "a dónde volver" no puede
    // viajar en el hash (por eso "?admin=1", ya existente, usa query string).
    // "origen" hace lo mismo para /#barra: sin esto, el dueño que pide la
    // clave desde el Dashboard de Barra volvía siempre al Panel Admin.
    await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}${window.location.pathname}?${origen}=1`,
    });
    setCargando(false);
    setModo("enviado"); // Supabase nunca confirma si el correo existe — el mensaje es siempre el mismo.
  };

  if (modo === "enviado") {
    return (
      <div style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
        <Mail size={18} color={C.brand} />
        <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>Revisa tu correo</div>
        <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
          Si <strong style={{ color: C.text }}>{correo}</strong> tiene una cuenta, te enviamos un enlace para elegir una clave nueva.
        </p>
        <button onClick={() => setModo("login")} className="press mono" style={{
          marginTop: 12, fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.brand,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>Volver a entrar</button>
      </div>
    );
  }

  const recuperando = modo === "recuperar";

  return (
    <form onSubmit={recuperando ? enviarRecuperacion : entrar} style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <Lock size={18} color={C.brand} />
      <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>{recuperando ? "Recuperar clave" : "Entrar como dueño"}</div>
      <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
        {recuperando ? "Te mandamos un enlace a tu correo para elegir una clave nueva." : "Acceso privado para editar la carta. Pide tu usuario si no lo tienes."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
          <Mail size={15} color={C.textMuted} />
          <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="dueño@quadrocafe.com"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
        </div>
        {!recuperando && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
            <Lock size={15} color={C.textMuted} />
            <input type="password" required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave"
              style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={cargando} className="press" style={{
        marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontSize: 13.5, fontWeight: 700, opacity: cargando ? .6 : 1,
      }}>{cargando ? "Enviando…" : recuperando ? "Enviar enlace" : "Entrar"}</button>
      <button type="button" onClick={() => { setModo(recuperando ? "login" : "recuperar"); setError(""); }} className="press mono" style={{
        marginTop: 10, width: "100%", textAlign: "center", fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase",
        color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 4,
      }}>{recuperando ? "Volver a entrar" : "¿Olvidaste tu clave?"}</button>
    </form>
  );
}

function AdminNuevaClave({ onListo }) {
  const { C } = useTheme();
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (clave.length < 6) { setError("La clave debe tener al menos 6 caracteres."); return; }
    if (clave !== clave2) { setError("Las claves no coinciden."); return; }
    setGuardando(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password: clave });
    setGuardando(false);
    if (err) setError("No se pudo actualizar la clave. Pide un enlace nuevo e intenta de nuevo.");
    else onListo();
  };

  return (
    <form onSubmit={guardar} style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <Lock size={18} color={C.brand} />
      <div className="disp" style={{ fontSize: 15, marginTop: 8 }}>Elige una clave nueva</div>
      <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
        Veniste desde el enlace de recuperación. Escribe tu clave nueva dos veces.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
          <Lock size={15} color={C.textMuted} />
          <input type="password" required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave nueva"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
          <Lock size={15} color={C.textMuted} />
          <input type="password" required value={clave2} onChange={(e) => setClave2(e.target.value)} placeholder="Repite la clave"
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: C.text }} />
        </div>
      </div>
      {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={guardando} className="press" style={{
        marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontSize: 13.5, fontWeight: 700, opacity: guardando ? .6 : 1,
      }}>{guardando ? "Guardando…" : "Guardar clave"}</button>
    </form>
  );
}

function AdminFila({ p, onCambio }) {
  const { C } = useTheme();
  const [precio, setPrecio] = useState(String(p.precio));
  const [guardando, setGuardando] = useState(false);

  const guardarPrecio = async () => {
    const n = parseFloat(precio.replace(",", "."));
    if (Number.isNaN(n) || n === p.precio) { setPrecio(String(p.precio)); return; }
    setGuardando(true);
    await onCambio({ precio: n });
    setGuardando(false);
  };

  const toggleDisponible = async () => {
    setGuardando(true);
    await onCambio({ disponible: !p.disponible });
    setGuardando(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 0",
      borderBottom: `1px solid ${C.line}`, opacity: p.disponible ? 1 : .5,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
        <div className="mono" style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>{p.cat}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 10, padding: "6px 8px" }}>
        <span className="mono" style={{ fontSize: 12, color: C.textMuted }}>$</span>
        <input value={precio} onChange={(e) => setPrecio(e.target.value)} onBlur={guardarPrecio}
          inputMode="decimal" style={{
            width: 44, border: "none", outline: "none", background: "transparent",
            fontSize: 13, fontWeight: 700, color: C.text,
          }} />
      </div>
      <button onClick={toggleDisponible} disabled={guardando} className="press" aria-label="Disponible hoy" style={{
        width: 40, height: 24, borderRadius: 99, border: "none", cursor: "pointer", flexShrink: 0,
        background: p.disponible ? C.brand : C.line, position: "relative", transition: "background .2s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: p.disponible ? 18 : 2, width: 20, height: 20, borderRadius: "50%",
          background: C.card, transition: "left .2s",
        }} />
      </button>
    </div>
  );
}

function AdminNuevoProducto({ siguienteOrden, onCreado }) {
  const { C } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const limpiar = () => {
    setNombre(""); setCat(CATS[0]); setPrecio(""); setDescripcion(""); setDisponible(true);
  };

  const crear = async (e) => {
    e.preventDefault();
    const n = parseFloat(precio.replace(",", "."));
    if (!nombre.trim() || Number.isNaN(n)) { setError("Nombre y precio son obligatorios."); return; }
    setGuardando(true); setError("");

    const base = slugify(nombre) || "producto";
    let id = base;
    let fila = null;
    for (let intento = 0; intento < 5 && !fila; intento++) {
      const { data, error: err } = await supabase.from("productos").insert({
        id, cat, nombre: nombre.trim(), precio: n, descripcion: descripcion.trim(),
        disponible, finca: false, orden: siguienteOrden,
      }).select().single();
      if (!err) { fila = data; break; }
      if (err.code === "23505") { id = `${base}-${intento + 2}`; continue; } // id duplicado, prueba con sufijo
      setError("No se pudo crear el producto. Intenta de nuevo.");
      setGuardando(false);
      return;
    }
    setGuardando(false);
    if (fila) { onCreado(fila); limpiar(); setAbierto(false); }
    else setError("No se pudo generar un id único para este nombre. Cámbialo e intenta de nuevo.");
  };

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="press mono" style={{
        margin: "0 20px 14px", width: "calc(100% - 40px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "11px", borderRadius: 12, border: `1px dashed ${C.line}`, background: "none", cursor: "pointer",
        color: C.brand, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
      }}><Plus size={14} /> Agregar producto</button>
    );
  }

  return (
    <form onSubmit={crear} style={{ margin: "0 20px 14px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="disp" style={{ fontSize: 15 }}>Producto nuevo</div>
        <button type="button" onClick={() => { setAbierto(false); setError(""); }} className="press" aria-label="Cerrar" style={btnMiniStyle(C)}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, background: "transparent", color: C.text }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, background: C.card, color: C.text }}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px" }}>
          <span className="mono" style={{ fontSize: 12, color: C.textMuted }}>$</span>
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" inputMode="decimal" required
            style={{ border: "none", outline: "none", flex: 1, fontSize: 13, background: "transparent", color: C.text }} />
        </div>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" rows={2}
          style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, background: "transparent", color: C.text, resize: "none", fontFamily: "inherit" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.text }}>
          <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
          Disponible desde ya
        </label>
      </div>
      {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>{error}</p>}
      <button type="submit" disabled={guardando} className="press" style={{
        marginTop: 12, width: "100%", padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontSize: 13, fontWeight: 700, opacity: guardando ? .6 : 1,
      }}>{guardando ? "Creando…" : "Crear producto"}</button>
    </form>
  );
}

function Admin({ onBack }) {
  const { C } = useTheme();
  const [sesion, setSesion] = useState(undefined); // undefined = cargando, null = sin sesión
  const [recuperando, setRecuperando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) { setSesion(null); return; }
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s);
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const cargarProductos = async () => {
    setCargando(true); setError("");
    const { data, error: err } = await supabase.from("productos").select("*").order("orden");
    setCargando(false);
    if (err) setError("No se pudo cargar la carta. Revisa la conexión con Supabase.");
    else setProductos(data || []);
  };

  useEffect(() => { if (sesion) cargarProductos(); }, [sesion]);

  const cambiarProducto = async (id, cambios) => {
    setProductos((ps) => ps.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    const { error: err } = await supabase.from("productos").update(cambios).eq("id", id);
    if (err) setError("No se pudo guardar el cambio. Intenta de nuevo.");
  };

  const agregarProducto = (fila) => setProductos((ps) => [...ps, fila]);
  const siguienteOrden = productos.reduce((m, p) => Math.max(m, p.orden || 0), 0) + 1;

  if (!supabase) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
        <p style={{ margin: "0 20px", fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
          Supabase no está configurado en este entorno (faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
        </p>
      </div>
    );
  }

  if (sesion === undefined) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
      </div>
    );
  }

  if (sesion && recuperando) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
        <AdminNuevaClave onListo={() => setRecuperando(false)} />
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
        <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} />
        <AdminLogin onLogged={cargarProductos} />
      </div>
    );
  }

  return (
    <div className="qc-scroll" style={{ overflowY: "auto", height: "100%", paddingBottom: 110 }}>
      <Header sub="Panel del dueño" titulo="Admin" onBack={onBack} right={
        <button onClick={() => supabase.auth.signOut()} className="press" aria-label="Salir" style={{ ...btnMiniStyle(C), marginBottom: 3 }}>
          <LogOut size={15} />
        </button>
      } />
      <p style={{ margin: "0 20px 8px", fontSize: 12, color: C.textMuted }}>
        Toca el precio para editarlo, usa el switch para marcar si hay hoy.
      </p>
      {error && <p style={{ margin: "0 20px 8px", fontSize: 12, color: C.warn }}>{error}</p>}
      <AdminNuevoProducto siguienteOrden={siguienteOrden} onCreado={agregarProducto} />
      <div style={{ margin: "0 20px" }}>
        {cargando && !productos.length ? (
          <p style={{ fontSize: 12.5, color: C.textMuted, padding: "12px 0" }}>Cargando carta…</p>
        ) : (
          productos.map((p) => (
            <AdminFila key={p.id} p={p} onCambio={(cambios) => cambiarProducto(p.id, cambios)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================ CARRITO ============================ */

function Carrito({ carrito, cerrar, quitar, lote, taza, enviarABarra }) {
  const { C } = useTheme();
  const total = carrito.reduce((s, i) => s + i.precio, 0);
  const agrupado = carrito.reduce((acc, i) => {
    acc[i.id] = acc[i.id] ? { ...acc[i.id], n: acc[i.id].n + 1 } : { ...i, n: 1 };
    return acc;
  }, {});
  const filas = Object.values(agrupado);
  const [metodo, setMetodo] = useState(METODOS_PAGO[0].id);
  const [entrega, setEntrega] = useState(ENTREGA_OPCIONES[0].id);
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const elegido = METODOS_PAGO.find((m) => m.id === metodo);

  const onEnviar = async () => {
    if (!nombre.trim()) { setError("Escribe tu nombre para la orden."); return; }
    setError(""); setEnviando(true);
    const items = filas.map((f) => ({
      id: f.id, nombre: f.nombre, precio: f.precio, cantidad: f.n,
      ...(f.finca ? { finca: lote.finca, taza: taza.nombre } : {}),
    }));
    const res = await enviarABarra({ metodo, nombre: nombre.trim(), destino: entrega, items, total });
    setEnviando(false);
    if (!res.ok) setError(res.error);
  };

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
                  <span className="mono" style={{ fontSize: 13 }}><AnimatedNumber value={f.precio * f.n} format={money} /></span>
                  <button onClick={() => quitar(f.id)} className="press" aria-label="Quitar" style={btnMiniStyle(C)}><Minus size={13} /></button>
                </div>
              </div>
            ))}

            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase", margin: "18px 0 8px" }}>
              Tu nombre
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
              <User size={15} color={C.textMuted} />
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="¿Cómo te llamamos en barra?"
                style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, background: "transparent", color: C.text }} />
            </div>

            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase", margin: "18px 0 8px" }}>
              Para acá o para llevar
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ENTREGA_OPCIONES.map((op) => {
                const Icono = op.icono, on = op.id === entrega;
                return (
                  <button key={op.id} onClick={() => setEntrega(op.id)} className="press" style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12,
                    border: `1px solid ${on ? C.brand : C.line}`, background: on ? `${C.brand}14` : "transparent",
                    color: on ? C.brand : C.text, cursor: "pointer", textAlign: "left",
                  }}>
                    <Icono size={16} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{op.nombre}</span>
                  </button>
                );
              })}
            </div>

            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase", margin: "18px 0 8px" }}>
              Cómo vas a pagar
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {METODOS_PAGO.map((m) => {
                const Icono = m.icono, on = m.id === metodo;
                return (
                  <button key={m.id} onClick={() => setMetodo(m.id)} className="press" style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12,
                    border: `1px solid ${on ? C.brand : C.line}`, background: on ? `${C.brand}14` : "transparent",
                    color: on ? C.brand : C.text, cursor: "pointer", textAlign: "left",
                  }}>
                    <Icono size={16} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{m.nombre}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "18px 0 16px" }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: ".16em", color: C.textMuted, textTransform: "uppercase" }}>Total</span>
              <span className="disp" style={{ fontSize: 30 }}><AnimatedNumber value={total} format={money} /></span>
            </div>

            {error && <p style={{ fontSize: 12, color: C.warn, marginTop: 14, marginBottom: -6 }}>{error}</p>}
            <button onClick={onEnviar} disabled={enviando} className="press" style={{
              marginTop: 18, width: "100%", padding: 15, borderRadius: 14, border: "none",
              background: C.brand, color: C.onBrand, fontWeight: 700, fontSize: 15, cursor: "pointer",
              opacity: enviando ? .65 : 1,
            }}>
              {enviando ? "Enviando…" : "Enviar a barra"}
            </button>
            <p className="mono" style={{ fontSize: 10, color: C.textMuted, textAlign: "center", marginTop: 10 }}>
              {elegido.nota}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Ticket({ orden, cerrar }) {
  const { C } = useTheme();
  const [estado, setEstado] = useState(orden.estado);
  const elegido = METODOS_PAGO.find((m) => m.id === orden.metodo_pago);

  // Escucha el estado real de la orden por Supabase Realtime — nada de
  // temporizador simulado, la barra es quien mueve esto.
  useEffect(() => {
    if (!supabase) return;
    const canal = supabase
      .channel(`orden-${orden.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "ordenes", filter: `id=eq.${orden.id}`,
      }, (payload) => setEstado(payload.new.estado))
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [orden.id]);

  if (estado === "cancelada") {
    return (
      <div style={{ position: "absolute", inset: 0, background: C.surface, zIndex: 50, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="pop" style={{ textAlign: "center" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 20 }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center", border: `2px solid ${C.warn}` }}>
              <XCircle size={30} color={C.warn} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: C.warn, textTransform: "uppercase" }}>Orden</div>
          <div className="disp" style={{ fontSize: 52, lineHeight: 1, margin: "6px 0 12px" }}>#{String(orden.numero_orden).padStart(3, "0")}</div>
          <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 260, margin: "0 auto" }}>
            La barra canceló esta orden. Si no lo esperabas, pregunta en caja.
          </p>
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

  const lista = ESTADOS_ORDEN.length - 1;
  const idx = ESTADOS_ORDEN.findIndex((e) => e.id === estado);
  const paso = estado === "completada" ? lista : Math.max(0, idx);

  return (
    <div style={{ position: "absolute", inset: 0, background: C.surface, zIndex: 50, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="pop" style={{ textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 20 }}>
          <div className={paso < lista ? "pulse" : ""} style={{
            width: 76, height: 76, borderRadius: "50%", display: "grid", placeItems: "center",
            border: `2px solid ${paso === lista ? C.brand : C.brandAlt}`,
          }}>
            {paso === lista ? <Check size={30} color={C.brand} /> : <Coffee size={28} color={C.brandAlt} />}
          </div>
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".22em", color: C.brandAlt, textTransform: "uppercase" }}>Orden</div>
        <div className="disp" style={{ fontSize: 52, lineHeight: 1, margin: "6px 0 20px" }}>#{String(orden.numero_orden).padStart(3, "0")}</div>
        {elegido && (
          <div className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: C.textMuted, marginTop: -12, marginBottom: 20 }}>
            <elegido.icono size={13} /> {elegido.nombre}
          </div>
        )}

        <div style={{ textAlign: "left", maxWidth: 260, margin: "0 auto" }}>
          {ESTADOS_ORDEN.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, opacity: i <= paso ? 1 : .35, transition: "opacity .4s" }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center",
                background: i <= paso ? C.brand : "transparent", border: `1px solid ${i <= paso ? C.brand : C.line}`, color: C.onBrand,
              }}>{i <= paso && <Check size={12} />}</span>
              <span style={{ fontSize: 14, fontWeight: i === paso ? 700 : 400 }}>{p.label}</span>
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

  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "inicio";
    const { hash, search } = window.location;
    // #admin: acceso directo. ?admin=1 y type=recovery: vuelta desde el enlace
    // de "olvidé mi clave" de Supabase (que agrega su propio access_token al hash).
    const esAdmin = hash === "#admin" || search.includes("admin=1") || hash.includes("type=recovery");
    return esAdmin ? "admin" : "inicio";
  });
  const [carrito, setCarrito] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qc-carrito")) || []; } catch { return []; }
  });
  const [verCarrito, setVerCarrito] = useState(false);
  const carritoBtnRef = useRef(null); // blanco del "fly to cart" de Carta (Fase 3)
  const badgeRef = useRetriggerAnim(carrito.length); // bounce del badge al sumar/restar (Fase 3)
  const [orden, setOrden] = useState(null);
  const [lote, setLote] = useState(FINCAS[0]);
  const [taza, setTaza] = useState(TAZAS[1]);
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem("qc-email") || ""; } catch { return ""; }
  });
  const [splash, setSplash] = useState(true);

  // Fase 7 — transición direccional entre tabs del nav inferior: se lee
  // `prevTabRef` (todavía el valor VIEJO en este render, recién se actualiza
  // en el efecto de abajo después de que React confirme el render) contra
  // `tab` (el nuevo) para saber si el tab activo se movió a la derecha o a
  // la izquierda dentro de TABS, y con eso arma `--tabdir` (1 o -1) que
  // consume `qc-tabswitch` (ver buildCss). Club/Admin no viven en el nav
  // inferior — quedan fuera del orden y caen a dir=1 (mismo look que un
  // swap "hacia adelante").
  const ORDEN_TABS = ["inicio", "menu", "fincas", "maquinas", "academia"];
  const prevTabRef = useRef(tab);
  const i0 = ORDEN_TABS.indexOf(prevTabRef.current), i1 = ORDEN_TABS.indexOf(tab);
  const tabDir = (i0 === -1 || i1 === -1 || i1 === i0) ? 1 : (i1 > i0 ? 1 : -1);
  useEffect(() => { prevTabRef.current = tab; }, [tab]);

  // Indicador único que se desliza entre íconos del nav inferior, en vez de
  // que cada botón muestre/oculte el suyo por separado (eso no "desliza",
  // aparece/desaparece en el lugar nuevo). Mismo patrón offsetLeft/
  // useLayoutEffect que el underline de categorías de Carta (Fase 3).
  const tabBtnRefs = useRef({});
  const [navIndicador, setNavIndicador] = useState(null);
  useLayoutEffect(() => {
    const el = tabBtnRefs.current[tab];
    if (!el) { setNavIndicador(null); return; }
    // La pill envuelve ícono+label juntos (cambio 2026-08-31) — se
    // dimensiona en base al botón más ancho de los 5 (ORDEN_TABS), no al
    // botón activo puntual, para que el ancho quede fijo entre tabs y el
    // desplazamiento sea un translateX puro (sin animar width/left, que
    // dispararía layout en cada cambio de tab).
    const anchos = ORDEN_TABS.map((k) => tabBtnRefs.current[k]?.offsetWidth || 0);
    const ancho = Math.max(...anchos, el.offsetWidth) + 14;
    const alto = el.offsetHeight + 8;
    setNavIndicador({
      x: el.offsetLeft + el.offsetWidth / 2 - ancho / 2,
      top: el.offsetTop - 4,
      width: ancho,
      height: alto,
    });
  }, [tab]);
  // Squish de la pill del nav, retriggereado en cada cambio de tab — mismo
  // hook que ya usa el bounce del badge del carrito, sin tocarlo.
  const navPillSquishRef = useRetriggerAnim(tab, "mo-navpill-squish");

  useEffect(() => { const t = setTimeout(() => setSplash(false), 1700); return () => clearTimeout(t); }, []);

  // Fix nav inferior (2026-09-01, iteración 2): `.qc-frame-vh`/`.qc-vh`
  // (buildCss) ya usan 100dvh en vez de 100vh, pero probado en un Chrome
  // Android real el nav todavía "bajaba" un instante justo cuando la barra
  // de direcciones terminaba de expandirse del todo al llegar arriba de un
  // scroll — la recalculación interna de `dvh` del navegador le llega con
  // un frame (o más) de retraso respecto a su propia animación de barra.
  // `window.visualViewport` sí dispara su evento "resize" en sincronía con
  // esa animación (para eso existe la API — teclado virtual y barras de
  // navegador), así que se usa para escribir el alto real en px a una
  // custom property (`--vvh`) que gana en la cascada de `.qc-frame-vh`
  // (`height:100vh; height:100dvh; height:var(--vvh, 100dvh)`), sin
  // reemplazar el fallback dvh — sólo lo corrige en el instante en que hay
  // datos más frescos. rAF-throttled para no forzar layout en cada evento
  // (pueden llegar varios por frame durante la animación de la barra).
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    let raf = null;
    const aplicar = () => {
      raf = null;
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };
    const onResize = () => { if (raf === null) raf = requestAnimationFrame(aplicar); };
    onResize();
    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => { try { localStorage.setItem("qc-carrito", JSON.stringify(carrito)); } catch { /* noop */ } }, [carrito]);
  useEffect(() => { try { localStorage.setItem("qc-email", email); } catch { /* noop */ } }, [email]);

  // Botón/gesto de retroceso del dispositivo: navega entre tabs y cierra
  // el carrito o el ticket antes de salir de la app, como cualquier app nativa.
  useEffect(() => {
    window.history.replaceState({ tab: "inicio" }, "");
    const onPop = (e) => {
      if (orden) { setOrden(null); return; }
      if (verCarrito) { setVerCarrito(false); return; }
      setTab(e.state?.tab || "inicio");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [orden, verCarrito]);

  useEffect(() => {
    if (window.history.state?.tab !== tab) window.history.pushState({ tab }, "");
  }, [tab]);
  useEffect(() => { if (verCarrito) window.history.pushState({ tab, modal: "carrito" }, ""); }, [verCarrito]);
  useEffect(() => { if (orden) window.history.pushState({ tab, modal: "ticket" }, ""); }, [orden]);

  const irInicio = () => setTab("inicio");
  const add = (m) => setCarrito((c) => [...c, m]);
  const quitar = (id) => setCarrito((c) => { const i = c.findIndex((x) => x.id === id); if (i < 0) return c; const n = [...c]; n.splice(i, 1); return n; });

  // Inserta la orden real en Supabase — número secuencial y estado los pone
  // el trigger/la barra, no el cliente. Devuelve {ok:false, error} en vez de
  // lanzar, para que el carrito pueda mostrar el problema sin romperse.
  const enviarABarra = async ({ metodo, nombre, destino, items, total }) => {
    if (!supabase) {
      console.warn("No se pudo enviar la orden: Supabase no está configurado.");
      return { ok: false, error: "No se pudo conectar con la barra. Intenta de nuevo en un momento." };
    }
    const { data, error: err } = await supabase.from("ordenes").insert({
      nombre_cliente: nombre, destino, items, total, metodo_pago: metodo,
    }).select().single();
    if (err) {
      console.warn("No se pudo crear la orden:", err.message);
      return { ok: false, error: "No se pudo enviar el pedido. Intenta de nuevo." };
    }
    setOrden(data);
    setVerCarrito(false);
    setCarrito([]);
    return { ok: true };
  };

  const TABS = [
    { k: "inicio", t: "Inicio", i: Coffee },
    { k: "menu", t: "Carta", i: ShoppingBag },
    { k: "fincas", t: "Fincas", i: Mountain },
    { k: "maquinas", t: "Lab", i: Waves },
    { k: "academia", t: "Aula", i: GraduationCap },
  ];

  return (
    <ThemeCtx.Provider value={{ tema, setTema, C }}>
      <div className="qc qc-vh" onClick={manejarTapSonido} style={{ display: "grid", placeItems: "center", background: PALETAS.oscuro.shell, padding: 0 }}>
        <style>{css}</style>
        <div className="qc-frame-vh" style={{
          position: "relative", width: "100%", maxWidth: 430, maxHeight: 940,
          background: C.surface, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          {splash ? (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: C.brand, zIndex: 60 }}>
              <div style={{ textAlign: "center", color: C.onBrand }}>
                <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto" }}>
                  <SplashFrame size={96} />
                  <div style={{
                    position: "absolute", inset: 0, display: "grid", placeItems: "center",
                    opacity: 0, animation: "qc-frame-fade .35s ease .68s forwards",
                  }}><Marca size={62} /></div>
                </div>
                <div className="disp" style={{
                  fontSize: 28, marginTop: 16, letterSpacing: "-.01em",
                  opacity: 0, animation: "qc-frame-fade .35s ease .85s forwards",
                }}>Quadro Café</div>
                <div className="mono" style={{
                  fontSize: 10, marginTop: 8, opacity: 0,
                  animation: "qc-frame-fade .35s ease 1s forwards",
                }}>Geometría del sabor</div>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Marca size={26} />
              <span className="disp" style={{ fontSize: 15 }}>Quadro Café</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SonidoToggle />
              <ThemeToggle />
              <button ref={carritoBtnRef} onClick={() => setVerCarrito(true)} className="press" aria-label="Ver pedido" style={{
                position: "relative", ...btnMiniStyle(C), width: 36, height: 36, borderRadius: 11,
                borderColor: carrito.length ? C.brand : C.line,
              }}>
                <ShoppingBag size={16} />
                {carrito.length > 0 && (
                  <span ref={badgeRef} className="mono mo-bounce" style={{
                    position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 4px",
                    borderRadius: 99, background: C.brand, color: C.onBrand, fontSize: 10, fontWeight: 700,
                    display: "grid", placeItems: "center",
                  }}><AnimatedNumber value={carrito.length} /></span>
                )}
              </button>
            </div>
          </div>

          <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div key={tab} className="mo-tabswitch" style={{ height: "100%", "--tabdir": tabDir }}>
              {tab === "inicio" && <Inicio ir={setTab} lote={lote} />}
              {tab === "menu" && <Menu carrito={carrito} add={add} quitar={quitar} lote={lote} setLote={setLote} taza={taza} setTaza={setTaza} onBack={irInicio} carritoBtnRef={carritoBtnRef} />}
              {tab === "fincas" && <Fincas lote={lote} setLote={setLote} onBack={irInicio} />}
              {tab === "maquinas" && <Laboratorio onBack={irInicio} />}
              {tab === "academia" && <Academia taza={taza} setTaza={setTaza} onBack={irInicio} />}
              {tab === "club" && <Club email={email} setEmail={setEmail} onBack={irInicio} onAdmin={() => setTab("admin")} />}
              {tab === "admin" && <Admin onBack={irInicio} />}
            </div>
          </main>

          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10,
            display: "flex", justifyContent: "space-around",
            borderTop: `1px solid ${C.line}`, background: C.card, padding: "9px 4px 12px",
          }}>
            {/* Nav fijo (2026-08-31): pasó de flex-item (flexShrink:0, dentro
               del flujo de la columna junto a `main`) a position:"absolute"
               anclado al frame del teléfono (que ya es position:"relative" y
               no scrollea) — así queda SIEMPRE visible sin depender de que
               `main`/sus `.qc-scroll` internos midan bien su alto, inmune al
               bug clásico de mobile donde un contenedor a 100vh empuja el
               último elemento fuera de la pantalla visible cuando la barra
               de direcciones del navegador se expande/contrae. `main` ya no
               resta su alto en el flex (flex:1 ahora ocupa todo el espacio
               que antes cedía al nav), pero el padding-bottom de ~100-120px
               que cada `.qc-scroll` de la app ya reservaba de antes (para no
               terminar el contenido pegado al borde) alcanza de sobra como
               zona segura para que el nav overlay no tape contenido real.
               Nota (2026-09-01): este fix resolvía el push-out por flex,
               pero no el desfase de alto por `100vh` vs. la barra de
               direcciones del navegador — ver `.qc-vh`/`.qc-frame-vh` en
               buildCss() para ese bug distinto, reportado después. */}
            {/* Pill líquida detrás del ítem activo — ver comentario junto a
               @keyframes qc-navpill-squish en buildCss. Se dibuja ANTES que
               los botones (mismo orden de DOM) para quedar detrás. Ahora
               envuelve ícono+label juntos (2026-08-31, antes sólo el ícono):
               ancho/alto/top vienen de `navIndicador`, calculados sobre el
               botón más ancho de los 5 para que el desplazamiento entre tabs
               sea un translateX puro sin animar width/left. */}
            {navIndicador && (
              <span className="mo-navpill" style={{
                top: navIndicador.top, width: navIndicador.width, height: navIndicador.height,
                borderRadius: navIndicador.height, transform: `translateX(${navIndicador.x}px)`,
              }}>
                <span ref={navPillSquishRef} style={{
                  display: "block", width: "100%", height: "100%", borderRadius: navIndicador.height, background: C.brand,
                }} />
              </span>
            )}
            {TABS.map((x) => {
              const Icono = x.i, on = tab === x.k;
              return (
                <button key={x.k} ref={(el) => { tabBtnRefs.current[x.k] = el; }} onClick={() => setTab(x.k)} className="press" style={{
                  position: "relative", background: "none", border: "none", cursor: "pointer", padding: "5px 8px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  color: on ? C.onBrand : C.textMuted, transition: "color .2s",
                }}>
                  <Icono size={19} />
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", color: on ? C.onBrand : C.textMuted }}>{x.t}</span>
                </button>
              );
            })}
          </div>

          {verCarrito && (
            <Carrito carrito={carrito} lote={lote} taza={taza}
              cerrar={() => setVerCarrito(false)} quitar={quitar}
              enviarABarra={enviarABarra} />
          )}
          {orden && <Ticket orden={orden} cerrar={() => setOrden(null)} />}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

/* ============================ BARRA (BOH) ============================ */
/* Dashboard separado del Panel Admin: tablet/computadora del local, de pie,
   sin frame de teléfono, tipografía y botones grandes, cero menús anidados.
   Ruta propia (#barra), montada directo desde main.jsx — no comparte árbol
   de componentes con QuadroCafe. */

const DOS_HORAS_MS = 2 * 60 * 60 * 1000;

// Beep corto generado con Web Audio — sin asset de sonido que mantener.
function reproducirBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch { /* autoplay bloqueado u otro navegador sin Web Audio — no es crítico */ }
}

function OrdenCard({ orden, onAvanzar, onCancelar }) {
  const { C } = useTheme();
  const metodo = METODOS_PAGO.find((m) => m.id === orden.metodo_pago);
  const entrega = ENTREGA_OPCIONES.find((e) => e.id === orden.destino);
  const paso = Math.max(0, ESTADOS_ORDEN.findIndex((e) => e.id === orden.estado));
  const esUltimo = paso === ESTADOS_ORDEN.length - 1;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="disp" style={{ fontSize: 34, lineHeight: 1 }}>#{String(orden.numero_orden).padStart(3, "0")}</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{orden.nombre_cliente}</div>
        </div>
        <button onClick={onCancelar} className="press" aria-label="Cancelar orden" style={{
          display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12,
          border: `1px solid ${C.line}`, background: "transparent", color: C.warn, cursor: "pointer", flexShrink: 0,
        }}>
          <XCircle size={20} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {entrega && (
          <span className="mono" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 10px" }}>
            <entrega.icono size={12} /> {entrega.nombre}
          </span>
        )}
        {metodo && (
          <span className="mono" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 10px" }}>
            <metodo.icono size={12} /> {metodo.nombre}
          </span>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "12px 0", display: "flex", flexDirection: "column", gap: 6 }}>
        {orden.items.map((it, i) => (
          <div key={i} style={{ fontSize: 15.5 }}>
            {it.cantidad}× {it.nombre}{it.finca ? ` · ${it.finca} (${it.taza})` : ""}
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 12.5, color: C.brandAlt, letterSpacing: ".08em" }}>
        {ESTADOS_ORDEN[paso]?.label || orden.estado}
      </div>

      <button onClick={onAvanzar} className="press" style={{
        width: "100%", padding: "17px", borderRadius: 14, border: "none", cursor: "pointer",
        background: C.brand, color: C.onBrand, fontWeight: 700, fontSize: 17,
      }}>
        {esUltimo ? "Entregar" : `Avanzar a ${ESTADOS_ORDEN[paso + 1].label}`}
      </button>
    </div>
  );
}

export function BarraDashboard() {
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

  // undefined = verificando sesión, null = sin sesión. Login compartido con
  // el Panel Admin por ahora — cuando existan roles separados (staff vs
  // dueño), este es el punto donde filtrar por user.app_metadata.rol antes
  // de dar acceso al dashboard.
  const [sesion, setSesion] = useState(undefined);
  const [recuperando, setRecuperando] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [silenciado, setSilenciado] = useState(() => {
    try { return localStorage.getItem("qc-barra-silenciado") === "1"; } catch { return false; }
  });
  const [destello, setDestello] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const silenciadoRef = useRef(silenciado);

  useEffect(() => { silenciadoRef.current = silenciado; }, [silenciado]);
  useEffect(() => { try { localStorage.setItem("qc-barra-silenciado", silenciado ? "1" : "0"); } catch { /* noop */ } }, [silenciado]);
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 60000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!supabase) { setSesion(null); return; }
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s);
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const cargar = async () => {
    const { data, error: err } = await supabase.from("ordenes").select("*")
      .in("estado", ["recibido", "moliendo", "extrayendo", "listo"])
      .order("creado_en");
    if (!err && data) setOrdenes(data);
  };

  useEffect(() => {
    if (!sesion || !supabase) return;
    cargar();
    const canal = supabase.channel("barra-ordenes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ordenes" }, (payload) => {
        setOrdenes((os) => (os.some((o) => o.id === payload.new.id) ? os : [...os, payload.new]));
        if (!silenciadoRef.current) reproducirBeep();
        setDestello(true);
        setTimeout(() => setDestello(false), 1200);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ordenes" }, (payload) => {
        setOrdenes((os) => os.map((o) => (o.id === payload.new.id ? payload.new : o)));
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [sesion]);

  const avanzar = async (o) => {
    const idx = ESTADOS_ORDEN.findIndex((e) => e.id === o.estado);
    const siguiente = idx < ESTADOS_ORDEN.length - 1 ? ESTADOS_ORDEN[idx + 1].id : "completada";
    setOrdenes((os) => os.map((x) => (x.id === o.id ? { ...x, estado: siguiente } : x)));
    const { error: err } = await supabase.from("ordenes").update({ estado: siguiente }).eq("id", o.id);
    if (err) cargar();
  };

  const cancelar = async (o) => {
    if (!window.confirm(`¿Cancelar la orden #${String(o.numero_orden).padStart(3, "0")} de ${o.nombre_cliente}?`)) return;
    setOrdenes((os) => os.map((x) => (x.id === o.id ? { ...x, estado: "cancelada" } : x)));
    const { error: err } = await supabase.from("ordenes").update({ estado: "cancelada" }).eq("id", o.id);
    if (err) cargar();
  };

  let contenido;

  if (!supabase) {
    contenido = (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <p style={{ fontSize: 16, maxWidth: 420, textAlign: "center", color: C.textMuted }}>
          Supabase no está configurado en este entorno (faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
        </p>
      </div>
    );
  } else if (sesion === undefined) {
    contenido = <div style={{ minHeight: "100vh" }} />;
  } else if (sesion && recuperando) {
    contenido = (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 10 }}>
            <Marca size={34} />
            <span className="disp" style={{ fontSize: 22 }}>Dashboard de barra</span>
          </div>
          <AdminNuevaClave onListo={() => setRecuperando(false)} />
        </div>
      </div>
    );
  } else if (!sesion) {
    contenido = (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 10 }}>
            <Marca size={34} />
            <span className="disp" style={{ fontSize: 22 }}>Dashboard de barra</span>
          </div>
          <AdminLogin onLogged={() => {}} origen="barra" />
        </div>
      </div>
    );
  } else {
    const activas = ordenes
      .filter((o) => o.estado !== "completada" && o.estado !== "cancelada")
      .filter((o) => ahora - new Date(o.creado_en).getTime() <= DOS_HORAS_MS)
      .sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));

    contenido = (
      <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          padding: "20px 28px", borderBottom: `1px solid ${C.line}`, background: C.card,
          position: "sticky", top: 0, zIndex: 5,
          boxShadow: destello ? `0 0 0 3px ${C.brand} inset` : "none", transition: "box-shadow .3s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Marca size={38} />
            <div>
              <div className="disp" style={{ fontSize: 24 }}>Dashboard de barra</div>
              <div className="mono" style={{ fontSize: 11, color: C.textMuted }}>
                {activas.length} orden{activas.length === 1 ? "" : "es"} activa{activas.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <button onClick={() => setSilenciado((s) => !s)} className="press" aria-label={silenciado ? "Activar sonido" : "Silenciar avisos"} style={{
              display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14,
              border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer",
            }}>
              {silenciado ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="press" aria-label="Salir" style={{
              display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14,
              border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer",
            }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: 28, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {activas.length === 0 ? (
            <p className="disp" style={{ fontSize: 20, color: C.textMuted, gridColumn: "1 / -1", textAlign: "center", padding: "60px 0" }}>
              <Bell size={22} style={{ verticalAlign: "-4px", marginRight: 10 }} />
              Sin órdenes activas. Cuando llegue un pedido, aparece aquí.
            </p>
          ) : activas.map((o) => (
            <OrdenCard key={o.id} orden={o} onAvanzar={() => avanzar(o)} onCancelar={() => cancelar(o)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ThemeCtx.Provider value={{ tema, setTema, C }}>
      <div className="qc" style={{ minHeight: "100vh", background: C.surface, color: C.text }}>
        <style>{css}</style>
        {contenido}
      </div>
    </ThemeCtx.Provider>
  );
}
