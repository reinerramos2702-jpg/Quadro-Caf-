/* Auditoría visual contra main (audit:visual, 06/oct/2026).
 *
 * Mide en px (getBoundingClientRect + getComputedStyle) los elementos que la
 * Carta premium · PR-1 había agrandado sin querer — chips, "+", flecha atrás,
 * botones de cabecera, nombre del producto, miniatura, precio, barra inferior
 * y h1 — en Carta (lista y detalle de "V60 de origen"), Inicio, Fincas,
 * Tienda, Lab y Aula, a 360×800, 390×844 y 412×915 (DPR 1).
 *
 * Además, en la versión que se audita:
 *   - área táctil: el punto a 21 px del centro (arriba/abajo/izq./der.) de
 *     cada control cae en el mismo botón, y los objetivos de 44 px de botones
 *     vecinos no se pisan;
 *   - recorte de dígitos: ninguna caja con overflow hidden/clip que contenga
 *     texto VIOLA (.disp*) con dígitos le corta la tinta a la letra (los
 *     dígitos caen en la fuente de respaldo, ~1,6× más altos por
 *     font-size-adjust). Se mide en píxeles, no con Range: el Range de un
 *     carácter usa las métricas de la fuente principal y no ve el respaldo.
 *
 * Uso:
 *   npm run audit:visual                               levanta Vite en esta rama y compara
 *   node scripts/audit-visual.mjs --baseline --url http://localhost:5181
 *                                                      mide main y escribe scripts/baseline-medidas.json
 *   node scripts/audit-visual.mjs --url … --etiqueta main --capturas --salida DIR
 *   CHROME_PATH=/ruta/al/chrome                        si no hay Chrome instalado en su ruta normal
 *
 * Las capturas (--capturas) van a --salida o, por defecto, a la carpeta
 * temporal del sistema: nunca al repo. Sale con código 1 si hay diferencias
 * no intencionales, fallos de área táctil o dígitos recortados. */

/* Las funciones que se pasan a page.evaluate corren dentro del navegador. */
/* global document, window, getComputedStyle, NodeFilter */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { compararMedidas, formatearDiff, solapes } from "./lib/medidas.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opcion = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const modoBaseline = args.includes("--baseline");
const conCapturas = args.includes("--capturas");
const etiqueta = opcion("--etiqueta", modoBaseline ? "main" : "rama");
const salida = path.resolve(opcion("--salida", path.join(os.tmpdir(), "quadro-audit-visual")));
const archivoBaseline = path.join(raiz, "scripts", "baseline-medidas.json");
let url = opcion("--url", null);

const VIEWPORTS = [[360, 800], [390, 844], [412, 915]];
const PRODUCTO = "V60 de origen";

// Diferencias esperadas respecto de main ("pantalla:elemento:prop", con *).
const INTENCIONALES = [
  "carta-*:miniatura:*",          // miniatura grande de 96 px (PR-1, pedida)
  "*:nav:*",                      // barra inferior fija (100dvh + safe-area, PR-1 · T5)
  "carta-detalle:nombre:fontFamily", // (c) el nombre del detalle va en VIOLA, como en la lista
  "carta-detalle:nombre:fontWeight",
  "carta-detalle:nombre:lineHeight",
  "carta-detalle:nombre:letterSpacing",
  "carta-lista:nombre:lineHeight",   // line-clamp de 2 líneas exige un line-height numérico
];

if (conCapturas) fs.mkdirSync(salida, { recursive: true });

let servidor = null;
if (!url) {
  const { createServer } = await import("vite");
  servidor = await createServer({ root: raiz, logLevel: "error", server: { port: 0, strictPort: false } });
  await servidor.listen();
  url = servidor.resolvedUrls.local[0];
}

const navegador = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });

/* ---------- dentro de la página ---------- */

function medirPantalla([producto, pantalla]) {
  const main = document.querySelector("main");
  const esLista = pantalla === "carta-lista" || pantalla === "carta-bolleria";
  const caja = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    const cs = getComputedStyle(el);
    return {
      w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
      fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
      fontFamily: cs.fontFamily, fontWeight: cs.fontWeight,
    };
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  // Hoja más profunda cuyo texto completo es `t` (fuera del h1).
  const porTexto = (t, raizEl = main) => {
    const objetivo = t.trim().toLowerCase();
    const todos = [...raizEl.querySelectorAll("*")].filter((el) => el.textContent.trim().toLowerCase() === objetivo && !el.closest("h1") && visible(el));
    return todos.find((el) => ![...el.children].some((h) => h.textContent.trim().toLowerCase() === objetivo)) || null;
  };
  const nombre = porTexto(producto);
  // Tarjeta (o bloque) del producto: el ancestro más cercano que contiene un precio.
  let bloque = nombre;
  while (bloque && bloque !== main && !/\$\s?\d/.test(bloque.textContent)) bloque = bloque.parentElement;
  const precio = bloque ? [...bloque.querySelectorAll("*")].find((el) => /^\$\s?\d+([.,]\d+)?$/.test(el.textContent.trim()) && ![...el.children].length && visible(el)) : null;
  // Chips: pill de radio 999 (el botón, o el span visual dentro del botón en
  // los chips táctiles). Otros .mo-ink (tarjetas grandes) no cuentan.
  const chips = [...main.querySelectorAll("button.mo-ink, button > span.mo-ink")]
    .filter((el) => visible(el) && getComputedStyle(el).borderTopLeftRadius === "999px");
  const mas = [...main.querySelectorAll("button")].find((b) => b.querySelector("svg.lucide-plus") && visible(b)) || null;
  // Miniatura de producto: solo en la lista de la Carta (en Lab y Aula hay
  // otras imágenes chicas que no son productos).
  const miniatura = !esLista ? null : [...main.querySelectorAll("img, [role='img']")].find((el) => {
    const r = el.getBoundingClientRect();
    return visible(el) && r.width < 150 && r.width > 20 && (el.getAttribute("alt") || el.getAttribute("aria-label") || "").length > 0;
  }) || null;
  const nav = document.querySelector("nav[aria-label='Secciones']")
    || [...document.querySelectorAll(".qc > div > div")].find((d) => getComputedStyle(d).position === "absolute" && getComputedStyle(d).bottom === "0px");
  const cab = (sel) => document.querySelector(sel);
  const medidas = {
    chip: caja(chips[0]),
    mas: caja(mas),
    flecha: caja(main.querySelector("button[aria-label^='Volver']")),
    sonido: caja(cab("[aria-label='Activar sonidos'], [aria-label='Silenciar sonidos']")),
    tema: caja(cab("[aria-label='Cambiar tema']")),
    carrito: caja(cab("[aria-label='Ver pedido']")),
    nombre: caja(nombre),
    miniatura: caja(miniatura),
    precio: caja(precio),
    // Tag de V60 ("Firma"): se ve igual en main y en la rama. El de AeroPress
    // ("86.5") solo se captura: hoy está agotado y main no muestra su tag.
    etiqueta: caja(porTexto("Firma")),
    nav: caja(nav),
    h1: caja(main.querySelector("h1")),
  };

  /* Área táctil. El objetivo es el botón (si el nodo visual es un span dentro
     de un botón, como el pill de los chips táctiles, se usa el botón). */
  const controles = [
    // Chips: solo las categorías de la Carta (PR-1). Los de Fincas/Lab/Inicio
    // conservan su área de main (fuera del alcance de este PR).
    ["chip", pantalla.startsWith("carta") ? chips.filter((c) => !c.closest("[aria-hidden='true'], [inert]")).map((c) => c.closest("button")) : []],
    ["mas", mas ? [mas] : []],
    ["flecha", [main.querySelector("button[aria-label^='Volver']")].filter(Boolean)],
    ["cabecera", ["[aria-label='Activar sonidos'], [aria-label='Silenciar sonidos']", "[aria-label='Cambiar tema']", "[aria-label='Ver pedido']"].map(cab).filter(Boolean)],
  ];
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const tactil = [];
  const rectsTactiles = {};
  for (const [grupo, botones] of controles) {
    rectsTactiles[grupo] = [];
    botones.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      if (r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) return; // fuera de pantalla (fila de chips con scroll)
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      // Rectángulo táctil real: el del ::after de .qc-tactil si existe.
      let t = { x: r.left, y: r.top, w: r.width, h: r.height };
      if (b.classList.contains("qc-tactil") || b.classList.contains("qc-tactil-y")) {
        // El ::after se posiciona contra la caja de padding (dentro del borde).
        const a = getComputedStyle(b, "::after");
        const px = (v) => parseFloat(v) || 0;
        t = {
          x: r.left + b.clientLeft + px(a.left), y: r.top + b.clientTop + px(a.top),
          w: b.clientWidth - px(a.left) - px(a.right), h: b.clientHeight - px(a.top) - px(a.bottom),
        };
      }
      rectsTactiles[grupo].push({ id: `${grupo}[${i}]`, ...t });
      const puntos = [["arriba", cx, cy - 21], ["abajo", cx, cy + 21], ["izq.", cx - 21, cy], ["der.", cx + 21, cy]];
      const fallan = puntos.filter(([, x, y]) => {
        if (x < 1 || y < 1 || x > vw - 1 || y > vh - 1) return false; // borde del viewport
        const el = document.elementFromPoint(x, y);
        return !el || el.closest("button") !== b;
      }).map(([lado, x, y]) => {
        const el = document.elementFromPoint(x, y);
        return `${lado} → ${el ? (el.getAttribute("aria-label") || el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : "")) : "nada"}`;
      });
      tactil.push({ id: `${grupo}[${i}]`, visual: `${Math.round(r.width)}×${Math.round(r.height)}`, tactil: `${Math.round(t.w)}×${Math.round(t.h)}`, puntosFallidos: fallan.length, detalle: fallan.join(", ") });
    });
  }

  /* Recorte de dígitos: candidatos = cajas con overflow hidden/clip que
     contienen texto VIOLA (.disp*) con dígitos, visibles en pantalla. Se
     marcan con data-qc-rc y desde Node se comparan píxeles con y sin el
     overflow (ver revisarRecortes). Los marcos de la app (main, .qc-marco)
     no cuentan: lo que tapan es scroll, no un recorte de la letra. */
  const candidatos = [];
  document.querySelectorAll("[data-qc-rc]").forEach((el) => el.removeAttribute("data-qc-rc"));
  const recorre = document.createTreeWalker(document.querySelector(".qc"), NodeFilter.SHOW_TEXT);
  const vistos = new Set();
  for (let n = recorre.nextNode(); n; n = recorre.nextNode()) {
    if (!/\d/.test(n.textContent)) continue;
    const padre = n.parentElement;
    if (!padre.closest(".disp, .disp-xl, .disp-l, .disp-m") || getComputedStyle(padre).visibility === "hidden") continue;
    if (padre.closest("[aria-hidden='true'], [inert]")) continue;
    for (let p = padre; p && p !== main && !p.classList.contains("qc"); p = p.parentElement) {
      const cs = getComputedStyle(p);
      const corta = (v) => v === "hidden" || v === "clip";
      if (!corta(cs.overflowX) && !corta(cs.overflowY)) continue;
      const c = p.getBoundingClientRect();
      if (c.height > 240 || c.bottom < 0 || c.top > vh || vistos.has(p)) break;
      vistos.add(p);
      p.dataset.qcRc = String(candidatos.length);
      candidatos.push({ i: candidatos.length, texto: padre.textContent.trim().slice(0, 30), x: c.left, y: c.top, w: c.width, h: c.height });
      break;
    }
  }
  const rectNombre = nombre ? nombre.getBoundingClientRect() : null;
  const rectEtiqueta = porTexto("86.5")?.getBoundingClientRect() || null;
  const rectPrecio = precio ? precio.getBoundingClientRect() : null;
  const r2 = (r) => r && { x: r.left, y: r.top, w: r.width, h: r.height };
  return { medidas, tactil, rectsTactiles, candidatos, rects: { nombre: r2(rectNombre), etiqueta: r2(rectEtiqueta), precio: r2(rectPrecio) } };
}

/* ---------- recorrido ---------- */

const resultado = { etiqueta, fecha: new Date().toISOString(), url, viewports: VIEWPORTS, medidas: {}, tactil: {}, recortes: {} };
let commit = "";
// En --baseline se mide lo que sirve --url; --ref dice qué versión es (main por defecto).
try { commit = execSync(`git rev-parse --short ${modoBaseline ? opcion("--ref", "main") : "HEAD"}`, { cwd: raiz }).toString().trim(); } catch { /* sin git */ }

/* Para cada candidato, tres capturas de la caja con 16 px de margen arriba y
   abajo: A tal cual, B con overflow:visible y C con overflow:visible y el
   texto transparente. En las franjas de margen, un píxel donde B ≠ C es tinta
   de texto; si además A = C, esa tinta existe pero la caja la tapa: recorte.
   (Comparar solo A con B daría falsos positivos con fondos o imágenes que
   también se desbordan al quitar el overflow.) */
async function revisarRecortes(page, candidatos) {
  const sharp = (await import("sharp")).default;
  const out = [];
  const m = 16;
  for (const c of candidatos) {
    const clip = { x: Math.max(0, c.x), y: Math.max(0, c.y - m), width: c.w, height: c.h + 2 * m };
    const top = c.y - m < 0 ? c.y : m;
    const estado = (overflow, sinTexto) => page.evaluate(([i, overflow, sinTexto]) => {
      const el = document.querySelector(`[data-qc-rc="${i}"]`);
      if (!el) return;
      if (overflow) el.style.setProperty("overflow", overflow, "important"); else el.style.removeProperty("overflow");
      let st = document.getElementById("qc-rc-estilo");
      if (sinTexto) {
        st = st || document.head.appendChild(Object.assign(document.createElement("style"), { id: "qc-rc-estilo" }));
        st.textContent = `[data-qc-rc="${i}"], [data-qc-rc="${i}"] *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}`;
      } else if (st) st.remove();
    }, [c.i, overflow, sinTexto]);
    const crudo = async () => sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
    const A = await crudo();
    await estado("visible", false);
    const B = await crudo();
    await estado("visible", true);
    const Cc = await crudo();
    await estado("", false);
    const { width, height, channels } = A.info;
    const dif = (p, q, k) => Math.abs(p.data[k] - q.data[k]) + Math.abs(p.data[k + 1] - q.data[k + 1]) + Math.abs(p.data[k + 2] - q.data[k + 2]);
    let arriba = 0, abajo = 0;
    for (let y = 0; y < height; y++) {
      const fuera = y < top ? "arriba" : y >= top + c.h ? "abajo" : null;
      if (!fuera) continue;
      for (let x = 0; x < width; x++) {
        const k = (y * width + x) * channels;
        if (dif(B, Cc, k) > 60 && dif(A, Cc, k) <= 60) { if (fuera === "arriba") arriba++; else abajo++; }
      }
    }
    if (arriba + abajo > 2) out.push({ texto: c.texto, px: arriba + abajo, donde: [arriba && `${arriba} arriba`, abajo && `${abajo} abajo`].filter(Boolean).join(", ") });
  }
  return out;
}

async function recortar(page, rect, nombre) {
  if (!conCapturas || !rect) return;
  const m = 14;
  await page.screenshot({
    path: path.join(salida, `${etiqueta}-${nombre}.png`),
    clip: { x: Math.max(0, rect.x - m), y: Math.max(0, rect.y - m), width: rect.w + 2 * m, height: rect.h + 2 * m },
  });
}

const fallosTactil = [], fallosRecorte = [];
for (const [ancho, alto] of VIEWPORTS) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await ctx.addInitScript(() => { try { localStorage.clear(); localStorage.setItem("qc-tema", "claro"); } catch { /* */ } });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1900); // splash
  const tab = async (nombre) => {
    await page.getByRole("button", { name: nombre, exact: true }).last().click();
    await page.waitForTimeout(700);
  };
  const medir = async (pantalla) => {
    await page.evaluate(() => { for (const s of document.querySelectorAll(".qc-scroll")) s.scrollTop = 0; });
    await page.waitForTimeout(120);
    const r = await page.evaluate(medirPantalla, [PRODUCTO, pantalla]);
    (resultado.medidas[ancho] ||= {})[pantalla] = r.medidas;
    (resultado.tactil[ancho] ||= {})[pantalla] = r.tactil;
    const recortes = await revisarRecortes(page, r.candidatos);
    (resultado.recortes[ancho] ||= {})[pantalla] = recortes;
    for (const t of r.tactil) if (t.puntosFallidos) fallosTactil.push(`${pantalla} · ${ancho} px · ${t.id}: visual ${t.visual}, táctil ${t.tactil}, ${t.puntosFallidos} punto(s) a 21 px fuera del botón (${t.detalle})`);
    for (const [grupo, rects] of Object.entries(r.rectsTactiles)) {
      for (const [a, b, px] of solapes(rects)) fallosTactil.push(`${pantalla} · ${ancho} px · ${grupo}: ${a} y ${b} se pisan ${px} px`);
    }
    for (const c of recortes) fallosRecorte.push(`${pantalla} · ${ancho} px · "${c.texto}": ${c.px} px de letra recortados (${c.donde})`);
    return r;
  };

  await medir("inicio");
  await tab("Carta");
  await page.waitForFunction(() => !document.body.innerText.includes("Modo dev"), null, { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(300);
  const lista = await medir("carta-lista");
  await recortar(page, lista.rects.nombre, `lista-v60-${ancho}`);
  await recortar(page, lista.rects.etiqueta, `lista-86.5-${ancho}`);
  await recortar(page, lista.rects.precio, `lista-precio-${ancho}`);
  // Bollería tiene fotos: ahí se mide la miniatura real.
  await page.getByRole("button", { name: "Bollería", exact: true }).first().click();
  await page.waitForTimeout(600);
  await medir("carta-bolleria");
  await page.getByRole("button", { name: "Filtrado", exact: true }).first().click();
  await page.waitForTimeout(600);
  await page.getByText(PRODUCTO, { exact: true }).first().click();
  await page.waitForTimeout(700);
  const detalle = await medir("carta-detalle");
  await recortar(page, detalle.rects.nombre, `detalle-v60-${ancho}`);
  await recortar(page, detalle.rects.precio, `detalle-precio-${ancho}`);
  await page.locator("main button[aria-label^='Volver']").first().click();
  await page.waitForTimeout(600);
  await tab("Fincas"); await medir("fincas");
  await tab("Tienda"); await medir("tienda");
  await tab("Lab"); await medir("lab");
  await tab("Aula"); await medir("aula");
  if (errores.length) fallosRecorte.push(`${ancho} px · errores JS: ${errores.join(" | ")}`);
  await ctx.close();
  process.stdout.write(`· ${ancho}×${alto}\n`);
}

await navegador.close();
if (servidor) await servidor.close();

if (modoBaseline) {
  const base = { generado: resultado.fecha, origen: `main@${commit}`, url, viewports: VIEWPORTS, producto: PRODUCTO, medidas: resultado.medidas };
  fs.writeFileSync(archivoBaseline, JSON.stringify(base, null, 1) + "\n");
  console.log(`\nBaseline escrito en ${path.relative(raiz, archivoBaseline)} (${base.origen}).`);
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(archivoBaseline, "utf8"));
const diffs = compararMedidas(base.medidas, resultado.medidas, { intencionales: INTENCIONALES });
const reales = diffs.filter((d) => !d.intencional);
if (conCapturas) fs.writeFileSync(path.join(salida, `resultados-${etiqueta}.json`), JSON.stringify(resultado, null, 1));

console.log(`\n== ${etiqueta} (${commit}) contra ${base.origen} ==\n`);
console.log(formatearDiff(diffs));
console.log(`\n== Área táctil (${fallosTactil.length} fallos) ==`);
for (const f of fallosTactil) console.log(`✗ ${f}`);
console.log(`\n== Dígitos recortados en VIOLA (${fallosRecorte.length}) ==`);
for (const f of fallosRecorte) console.log(`✗ ${f}`);
if (conCapturas) console.log(`\nCapturas en ${salida}`);
const total = reales.length + fallosTactil.length + fallosRecorte.length;
console.log(`\nResultado: ${total === 0 ? "0 fallos ✓" : `${reales.length} diferencias no intencionales · ${fallosTactil.length} táctiles · ${fallosRecorte.length} recortes ✗`}`);
process.exit(total ? 1 : 0);
