/* Auditoría automatizada de la Carta (Carta premium · PR-1).
 *
 * Recorre TODAS las categorías y TODOS los productos a 320/360/390/412/430 px
 * y con la fuente al 100 %, 130 % y 200 %, y por cada tarjeta comprueba:
 *   - sin scroll horizontal (documento y tarjeta), ningún elemento más allá
 *     del borde derecho del viewport, ningún texto recortado en horizontal;
 *   - nombre en 2 líneas como máximo;
 *   - como mucho UNA etiqueta "por confirmar" (exactamente una si el
 *     producto está "por confirmar"), y nada de la tarjeta fuera de ella;
 *   - por categoría: el nav inferior conserva su `top` tras un scroll largo y
 *     el último producto queda totalmente visible sobre el nav.
 *
 * Uso:
 *   npm run audit:carta                       levanta Vite y audita esta rama
 *   node scripts/audit-carta.mjs --url http://localhost:5173 --etiqueta antes
 *   node scripts/audit-carta.mjs --sin-capturas
 *
 * No descarga navegadores: usa el Chrome instalado (playwright-core con
 * channel "chrome"; o CHROME_PATH=/ruta/al/ejecutable). Resultados en
 * docs/capturas-pr1/: resultados-<etiqueta>.json, auditoria.md y capturas.
 * Sale con código 1 si hay algún fallo.
 *
 * La fuente grande se emula multiplicando el font-size computado de cada
 * nodo (lo mismo que hace el escalado de texto del sistema en Android, que
 * también agranda los px). Los selectores son genéricos a propósito, para
 * poder correrla también contra main y tener la columna "antes". */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opcion = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const etiqueta = opcion("--etiqueta", "despues");
const salida = path.resolve(raiz, opcion("--salida", "docs/capturas-pr1"));
const conCapturas = !args.includes("--sin-capturas") && etiqueta === "despues";
let url = opcion("--url", null);

const ANCHOS = [320, 360, 390, 412, 430];
const FUENTES = [1, 1.3, 2];
const CATS = ["Filtrado", "Espresso", "Frío", "Infusiones", "Bollería", "Postres"];
const ALTO = 780;

fs.mkdirSync(salida, { recursive: true });

let servidor = null;
if (!url) {
  const { createServer } = await import("vite");
  servidor = await createServer({ root: raiz, logLevel: "error", server: { port: 0, strictPort: false } });
  await servidor.listen();
  url = servidor.resolvedUrls.local[0];
}

const navegador = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });

/* ---------- utilidades dentro de la página ---------- */

// Agranda el texto k veces, una sola vez por nodo (data-qc-escala). Primero se
// leen TODOS los tamaños y después se escriben, y solo se escalan los nodos con
// tamaño propio: un nodo que hereda el de su padre ya recibe el del padre
// escalado (escalarlo otra vez lo multiplicaba k² y así hacia abajo).
const escalar = (k) => {
  if (k === 1) return;
  const nodos = [...document.querySelectorAll(".qc, .qc *")].filter((el) => !el.dataset.qcEscala);
  const tam = new Map(nodos.map((el) => [el, parseFloat(getComputedStyle(el).fontSize)]));
  const tamPadre = (el) => tam.get(el.parentElement) ?? parseFloat(getComputedStyle(el.parentElement).fontSize);
  for (const el of nodos) {
    el.dataset.qcEscala = "1";
    const raiz = el.classList.contains("qc") && !el.parentElement.closest(".qc");
    if (!raiz && tam.get(el) === tamPadre(el)) continue; // heredado
    el.style.setProperty("font-size", `${tam.get(el) * k}px`, "important");
  }
};

const contenedor = () => [...document.querySelectorAll("main .qc-scroll")].find((e) => getComputedStyle(e).overflowY === "auto");

// Revisa todas las tarjetas visibles de la categoría actual.
function revisarCategoria() {
  const vw = document.documentElement.clientWidth;
  const sc = [...document.querySelectorAll("main .qc-scroll")].find((e) => getComputedStyle(e).overflowY === "auto");
  const docOk = document.documentElement.scrollWidth <= vw;
  const tarjetas = [...sc.querySelectorAll(".mo-reveal > *")];
  return tarjetas.map((card) => {
    const fallos = [];
    const r = card.getBoundingClientRect();
    if (!docOk) fallos.push(`documento con scroll horizontal (${document.documentElement.scrollWidth} > ${vw})`);
    if (card.scrollWidth > card.clientWidth + 1) fallos.push(`tarjeta con scroll horizontal (${card.scrollWidth} > ${card.clientWidth})`);
    if (r.right > vw + 0.5 || r.left < -0.5) fallos.push("tarjeta fuera del viewport");

    // Contenido oculto (acordeón cerrado, aria-hidden) o dentro de una fila con
    // scroll horizontal propio (chips de finca): la fila sí se revisa, lo que
    // se desliza adentro no.
    const enFilaDesplazable = (el) => {
      for (let p = el.parentElement; p && p !== card; p = p.parentElement) {
        if (["auto", "scroll"].includes(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    };
    for (const el of card.querySelectorAll("*")) {
      const e = el.getBoundingClientRect();
      if (!e.width || !e.height) continue;
      if (el.closest("[aria-hidden='true']") || enFilaDesplazable(el)) continue;
      if (e.right > vw + 0.5) { fallos.push(`elemento más allá del viewport (${Math.round(e.right)} > ${vw})`); break; }
      if (e.left < r.left - 1 || e.right > r.right + 1 || e.top < r.top - 1 || e.bottom > r.bottom + 1) {
        if (getComputedStyle(el).visibility !== "hidden" && !el.closest("[aria-hidden='true']")) {
          fallos.push(`"${(el.textContent || el.tagName).trim().slice(0, 24)}" fuera de la tarjeta`); break;
        }
      }
    }
    // Texto recortado: se mide cada nodo de texto (Range) contra la tarjeta y
    // contra cada ancestro que recorta (overflow ≠ visible) dentro de ella.
    // Solo en horizontal para los textos con line-clamp (.pc-clamp): ahí el
    // corte vertical con "…" es intencional; el resto, en las dos direcciones.
    const recorre = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    for (let n = recorre.nextNode(); n; n = recorre.nextNode()) {
      if (!n.textContent.trim()) continue;
      const padre = n.parentElement;
      if (padre.closest("[aria-hidden='true']") || enFilaDesplazable(padre)) continue;
      const rango = document.createRange();
      rango.selectNodeContents(n);
      const t = rango.getBoundingClientRect();
      if (!t.width) continue;
      const clamp = !!padre.closest(".pc-clamp");
      let recortado = false;
      for (let p = padre; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (p !== card && cs.overflowX === "visible" && cs.overflowY === "visible") { if (p === card) break; continue; }
        const c = p.getBoundingClientRect();
        if (t.left < c.left - 1 || t.right > c.right + 1) recortado = true;
        if (!clamp && (t.top < c.top - 1 || t.bottom > c.bottom + 1)) recortado = true;
        if (recortado || p === card) break;
      }
      if (recortado) { fallos.push(`texto recortado: "${n.textContent.trim().slice(0, 24)}"`); break; }
    }

    const nombreEl = card.querySelector(".pc-nombre") || card.querySelector(".disp");
    const nombre = (nombreEl?.textContent || "").trim();
    let lineas = 0;
    if (nombreEl) {
      const cs = getComputedStyle(nombreEl);
      if (cs.display === "inline") lineas = nombreEl.getClientRects().length;
      else {
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        lineas = Math.round(nombreEl.getBoundingClientRect().height / lh);
      }
    }
    if (lineas > 2) fallos.push(`nombre en ${lineas} líneas`);

    const texto = card.textContent;
    const estado = card.dataset.estado
      || (/Próximamente/.test(texto) ? "proximamente" : /Agotado hoy/.test(texto) ? "agotado" : /Elegir finca/.test(texto) ? "personalizable" : "disponible");
    // Etiquetas "por confirmar" (no cuenta la descripción del producto: las
    // variantes de Brookie/Cookie traen "…por confirmar." como dato real).
    const porConfirmar = [...card.querySelectorAll("*")].filter((el) => el.tagName !== "P"
      && [...el.childNodes].some((n) => n.nodeType === 3 && /por confirmar/i.test(n.textContent))).length;
    if (porConfirmar > 1) fallos.push(`${porConfirmar} etiquetas "por confirmar"`);
    if (estado === "proximamente" && porConfirmar !== 1 && card.dataset.estado) fallos.push(`"por confirmar" aparece ${porConfirmar} veces (se espera 1)`);

    return { nombre, estado, fallos };
  });
}

// Scroll largo: el nav no se mueve y el último producto queda visible.
async function revisarScroll() {
  const sc = [...document.querySelectorAll("main .qc-scroll")].find((e) => getComputedStyle(e).overflowY === "auto");
  const nav = document.querySelector("nav[aria-label='Secciones']") || [...document.querySelectorAll(".qc-marco > div, .qc > div > div")].find((d) => getComputedStyle(d).position === "absolute" && getComputedStyle(d).bottom === "0px");
  const top0 = nav.getBoundingClientRect().top;
  window.scrollTo(0, 1e6);
  sc.scrollTop = 1e6;
  await new Promise((r) => setTimeout(r, 350));
  const top1 = nav.getBoundingClientRect().top;
  const tarjetas = sc.querySelectorAll(".mo-reveal > *");
  const ult = tarjetas[tarjetas.length - 1]?.getBoundingClientRect();
  const fallos = [];
  if (Math.abs(top1 - top0) > 0.5) fallos.push(`nav se movió (${Math.round(top0)} → ${Math.round(top1)})`);
  if (Math.abs(top1 - window.innerHeight + nav.getBoundingClientRect().height) > 1) fallos.push(`nav fuera de la parte baja de la pantalla (top ${Math.round(top1)})`);
  if (!ult || ult.top < 0 || ult.bottom > top1 + 0.5) fallos.push("el último producto no queda totalmente visible sobre el nav");
  // El nav tampoco puede desbordar (con 6 pestañas y fuente grande, sí lo hacía).
  const vw = document.documentElement.clientWidth;
  if (nav.scrollWidth > nav.clientWidth + 1) fallos.push(`nav con desborde horizontal (${nav.scrollWidth} > ${nav.clientWidth})`);
  for (const el of nav.querySelectorAll("*")) {
    const e = el.getBoundingClientRect();
    if (e.width > 1 && e.right > vw + 0.5) { fallos.push(`"${el.textContent.trim().slice(0, 12)}" del nav sale de la pantalla (${Math.round(e.right)} > ${vw})`); break; }
  }
  sc.scrollTop = 0;
  window.scrollTo(0, 0);
  return fallos;
}

/* ---------- recorrido ---------- */

async function abrirCarta(ancho, tema = "claro") {
  const ctx = await navegador.newContext({
    viewport: { width: ancho, height: ALTO }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce",
  });
  await ctx.addInitScript((t) => { try { localStorage.setItem("qc-tema", t); localStorage.removeItem("qc-carrito"); } catch { /* */ } }, tema);
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1900); // splash
  await page.getByRole("button", { name: /Carta/ }).last().click();
  await page.waitForTimeout(600);
  // En dev, mientras Supabase no respondió la Carta muestra el MENU local y
  // un aviso "Modo dev": se espera a la carta real (con sus agotados de hoy).
  const fuente = await page.waitForFunction(() => !document.body.innerText.includes("Modo dev"), null, { timeout: 12000 })
    .then(() => "supabase").catch(() => "local");
  return { ctx, page, errores, fuente };
}

async function irACategoria(page, cat) {
  await page.getByRole("button", { name: cat, exact: true }).click();
  await page.waitForTimeout(450); // skeleton de 260 ms + render
}

const filas = [];
const fallosScroll = [];
const fuentesDatos = new Set();
const t0 = Date.now();

for (const ancho of ANCHOS) {
  for (const k of FUENTES) {
    const { ctx, page, errores, fuente } = await abrirCarta(ancho);
    fuentesDatos.add(fuente);
    let total = 0;
    for (const cat of CATS) {
      await irACategoria(page, cat);
      await page.evaluate(escalar, k);
      await page.waitForTimeout(80);
      const res = await page.evaluate(revisarCategoria);
      total += res.length;
      for (const r of res) filas.push({ producto: r.nombre, categoria: cat, estado: r.estado, ancho, fuente: `${Math.round(k * 100)} %`, fallos: r.fallos });
      const fs2 = await page.evaluate(revisarScroll);
      if (fs2.length) fallosScroll.push({ categoria: cat, ancho, fuente: `${Math.round(k * 100)} %`, fallos: fs2 });
    }
    if (errores.length) fallosScroll.push({ categoria: "—", ancho, fuente: `${Math.round(k * 100)} %`, fallos: errores.map((e) => `error JS: ${e}`) });
    if (total !== 57) fallosScroll.push({ categoria: "—", ancho, fuente: `${Math.round(k * 100)} %`, fallos: [`${total} productos (se esperan 57)`] });
    await ctx.close();
    process.stdout.write(`· ${ancho} px · ${Math.round(k * 100)} %  (${total} productos)\n`);
  }
}

/* ---------- capturas (375 px, solo la rama) ---------- */

const capturas = [];
if (conCapturas) {
  const dir = salida;
  const guardar = async (page, nombre) => {
    const f = path.join(dir, `${nombre}.jpg`);
    await page.screenshot({ path: f, type: "jpeg", quality: 72 });
    capturas.push(path.basename(f));
  };
  for (const tema of ["claro", "oscuro"]) {
    const { ctx, page } = await abrirCarta(375, tema);
    for (const cat of tema === "claro" ? CATS : ["Espresso", "Infusiones"]) {
      await irACategoria(page, cat);
      await guardar(page, `${tema}-${cat.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`);
    }
    await ctx.close();
  }
  // Detalles y flujo abrir → atrás (penúltimo de Postres estando al final).
  const { ctx, page } = await abrirCarta(375);
  await irACategoria(page, "Espresso");
  await page.locator(".pc-card").nth(1).locator(".pc-abrir").click();
  await page.waitForTimeout(600);
  await guardar(page, "detalle-normal");
  await page.goBack(); await page.waitForTimeout(500);
  await irACategoria(page, "Postres");
  await page.locator(".pc-card").last().locator(".pc-abrir").click();
  await page.waitForTimeout(600);
  await guardar(page, "detalle-por-confirmar");
  await page.goBack(); await page.waitForTimeout(500);
  await page.evaluate(() => { const s = [...document.querySelectorAll("main .qc-scroll")].find((e) => getComputedStyle(e).overflowY === "auto"); s.scrollTop = 1e6; });
  await page.waitForTimeout(300);
  await guardar(page, "flujo-1-final-de-postres");
  const antes = await page.evaluate(() => [...document.querySelectorAll("main .qc-scroll")].find((e) => getComputedStyle(e).overflowY === "auto").scrollTop);
  const n = await page.locator(".pc-card").count();
  await page.locator(".pc-card").nth(n - 2).locator(".pc-abrir").click();
  await page.waitForTimeout(600);
  await guardar(page, "flujo-2-detalle-penultimo");
  await page.goBack(); await page.waitForTimeout(600);
  await guardar(page, "flujo-3-atras");
  const despues = await page.evaluate(() => [...document.querySelectorAll("main .qc-scroll")].find((e) => getComputedStyle(e).overflowY === "auto").scrollTop);
  if (Math.abs(antes - despues) > 1) fallosScroll.push({ categoria: "Postres", ancho: 375, fuente: "100 %", fallos: [`abrir → atrás no restauró la posición (${antes} → ${despues})`] });
  await ctx.close();
}

await navegador.close();
if (servidor) await servidor.close();

/* ---------- informe ---------- */

const datos = [...fuentesDatos].join(" + ");
const resultado = { etiqueta, fecha: new Date().toISOString(), url, datos, filas, fallosScroll, capturas };
fs.writeFileSync(path.join(salida, `resultados-${etiqueta}.json`), JSON.stringify(resultado, null, 1));

const fallidas = filas.filter((f) => f.fallos.length);
const totalFallos = fallidas.length + fallosScroll.length;

if (etiqueta === "despues") {
  const antesF = path.join(salida, "resultados-antes.json");
  const antes = fs.existsSync(antesF) ? JSON.parse(fs.readFileSync(antesF, "utf8")) : null;
  const clave = (f) => `${f.categoria}|${f.producto}|${f.ancho}|${f.fuente}`;
  const mapaAntes = new Map((antes?.filas || []).map((f) => [clave(f), f]));
  const celda = (f) => (f ? (f.fallos.length ? `✗ ${f.fallos[0]}${f.fallos.length > 1 ? ` (+${f.fallos.length - 1})` : ""}` : "✓") : "—");

  const resumen = [];
  for (const ancho of ANCHOS) for (const k of FUENTES) {
    const fuente = `${Math.round(k * 100)} %`;
    const d = filas.filter((f) => f.ancho === ancho && f.fuente === fuente);
    const a = (antes?.filas || []).filter((f) => f.ancho === ancho && f.fuente === fuente);
    resumen.push(`| ${ancho} px | ${fuente} | ${a.length ? `${a.filter((f) => f.fallos.length).length} / ${a.length}` : "—"} | ${d.filter((f) => f.fallos.length).length} / ${d.length} |`);
  }

  const md = [
    "# Auditoría de la Carta · PR-1",
    "",
    `Generada por \`npm run audit:carta\` el ${new Date().toLocaleString("es-VE")}. ${filas.length} revisiones (${new Set(filas.map((f) => f.categoria + f.producto)).size} productos × ${ANCHOS.length} anchos × ${FUENTES.length} tamaños de fuente).`,
    `Datos de la carta: **${datos}** (Supabase = los 12 productos reales con su disponibilidad de hoy + los 45 "Próximamente" locales).`,
    antes ? `La columna **antes** sale de correr el mismo script contra \`main\` (\`--etiqueta antes\`; datos: ${antes.datos || "—"}).` : "",
    "",
    `**Resultado: ${totalFallos === 0 ? "0 fallos ✓" : `${totalFallos} fallos ✗`}** · ${((Date.now() - t0) / 1000).toFixed(0)} s`,
    "",
    "## Resumen (tarjetas con fallo / tarjetas revisadas)",
    "",
    "| Ancho | Fuente | Antes (main) | Después (rama) |",
    "|---|---|---|---|",
    ...resumen,
    "",
    "## Nav inferior y último producto (por categoría)",
    "",
    fallosScroll.length ? fallosScroll.map((f) => `- ✗ ${f.categoria} · ${f.ancho} px · ${f.fuente}: ${f.fallos.join("; ")}`).join("\n")
      : `- ✓ En las ${ANCHOS.length * FUENTES.length * CATS.length} combinaciones de ancho × fuente × categoría, el nav conserva su \`top\` tras un scroll largo y el último producto queda completo sobre el nav.`,
    ...(antes?.fallosScroll?.length ? ["", "Antes (main):", "", ...antes.fallosScroll.slice(0, 12).map((f) => `- ✗ ${f.categoria} · ${f.ancho} px · ${f.fuente}: ${f.fallos.join("; ")}`), antes.fallosScroll.length > 12 ? `- … y ${antes.fallosScroll.length - 12} más` : ""] : []),
    "",
    "## Detalle por tarjeta",
    "",
    "| Producto | Categoría | Estado | Ancho | Fuente | Antes | Después |",
    "|---|---|---|---|---|---|---|",
    ...filas.map((f) => `| ${f.producto} | ${f.categoria} | ${f.estado} | ${f.ancho} | ${f.fuente} | ${celda(mapaAntes.get(clave(f)))} | ${celda(f)} |`),
    "",
    capturas.length ? "## Capturas (375 px)\n\n" + capturas.map((c) => `- \`${c}\``).join("\n") : "",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(salida, "auditoria.md"), md);
}

console.log(`\n${etiqueta} (datos: ${datos}): ${filas.length} revisiones · ${fallidas.length} tarjetas con fallo · ${fallosScroll.length} fallos de nav/scroll`);
for (const f of fallidas.slice(0, 15)) console.log(`  ✗ ${f.categoria} · ${f.producto} · ${f.ancho} px · ${f.fuente}: ${f.fallos.join("; ")}`);
for (const f of fallosScroll.slice(0, 15)) console.log(`  ✗ ${f.categoria} · ${f.ancho} px · ${f.fuente}: ${f.fallos.join("; ")}`);
process.exit(totalFallos && etiqueta === "despues" ? 1 : 0);
