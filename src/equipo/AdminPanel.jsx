import React, { useState, useEffect, useMemo, useRef, useId } from "react";
import { ArrowLeft, LogOut, Plus, Search, X, Sun, Moon, Check, AlertCircle, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useTheme, CATS, slugify } from "../App.jsx";
import { filtrarProductos, contarProductos, textoContador, categoriasDe, parsearPrecio, filasParaAdmin } from "./adminLogica";

/* ============================ PANEL ADMIN (/equipo#admin) ============================
   Responsive de 360 a 1920 px (01/oct/2026). Antes era la misma columna de
   430 px del teléfono, centrada en cualquier pantalla.
     < 640 px     lista de tarjetas, una columna, áreas táctiles ≥ 44 px
     640–1023 px  la misma lista en 2 columnas
     ≥ 1024 px    contenedor de 1180 px, cabecera fija con buscador y chips,
                  tabla Producto · Categoría · Precio · Disponible
   "Agregar producto" abre un panel lateral en escritorio y pantalla completa
   en móvil.

   Datos: exactamente las mismas operaciones que el Admin anterior
   (select("*").order("orden"), update(cambios).eq("id"), insert con id por
   slug). La seguridad es la RLS (0009: solo es_admin() escribe productos).
   Colores solo vía --ad-* desde useTheme(); motion solo transform/opacity
   (la regla global de reduced-motion lo apaga). Sin blur. */

const variablesAdmin = (C) => ({
  "--ad-surface": C.surface, "--ad-card": C.card, "--ad-line": C.line,
  "--ad-text": C.text, "--ad-muted": C.textMuted, "--ad-brand": C.brand,
  "--ad-onbrand": C.onBrand, "--ad-warn": C.warn, "--ad-acento": C.brandAlt,
});

const CSS_ADMIN = `
.ad{min-height:100vh;min-height:100dvh;background:var(--ad-surface);color:var(--ad-text);font-family:'Nexa',system-ui,sans-serif}
.ad *{box-sizing:border-box}
.ad-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ad-cont{width:100%;max-width:1180px;margin:0 auto;padding:0 16px}
.ad :focus-visible{outline:2px solid var(--ad-brand);outline-offset:2px}

/* Cabecera: fija en escritorio (en móvil ocuparía media pantalla). */
.ad-cab{background:var(--ad-surface);border-bottom:1px solid var(--ad-line);padding:14px 0 12px}
.ad-cab-fila{display:flex;align-items:center;gap:10px}
.ad-titulo{flex:1;min-width:0}
.ad-titulo h1{font-family:'VIOLA','VIOLA Acentos','Fraunces',serif;font-weight:400;font-size:26px;line-height:1;margin:0;
  text-transform:uppercase;letter-spacing:.01em;font-size-adjust:from-font}
/* AA: textMuted sobre surface da 4.15:1 en claro; el contador va en text. */
.ad-contador{margin:4px 0 0;font-size:12px;letter-spacing:.06em;color:var(--ad-text)}
.ad-acciones{display:flex;gap:8px;align-items:center}
.ad-icono{width:44px;height:44px;flex-shrink:0;display:grid;place-items:center;border-radius:12px;cursor:pointer;
  border:1px solid var(--ad-line);background:var(--ad-card);color:var(--ad-text);transition:transform var(--motion-fast) var(--ease-spring)}
.ad-icono:active,.ad-btn:active,.ad-chip:active{transform:scale(.96)}
.ad-btn{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;border-radius:12px;
  border:0;cursor:pointer;font:700 14px/1 'Nexa',system-ui,sans-serif;background:var(--ad-brand);color:var(--ad-onbrand);
  transition:transform var(--motion-fast) var(--ease-spring)}
.ad-btn[disabled]{opacity:.6;cursor:default}
.ad-btn-sec{background:transparent;color:var(--ad-text);border:1px solid var(--ad-line)}
.ad-btn-texto{display:none}

.ad-herr{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.ad-buscar{position:relative;display:flex;align-items:center}
.ad-buscar svg{position:absolute;left:14px;color:var(--ad-muted);pointer-events:none}
.ad-buscar input{width:100%;min-height:44px;border-radius:12px;border:1px solid var(--ad-line);background:var(--ad-card);
  color:var(--ad-text);font:400 16px/1.2 'Nexa',system-ui,sans-serif;padding:10px 44px 10px 42px}
.ad-buscar input::-webkit-search-cancel-button{display:none}
.ad-buscar input::placeholder{color:var(--ad-muted);opacity:1}
.ad-buscar .ad-limpiar{position:absolute;right:0;width:44px;height:44px;display:grid;place-items:center;border:0;background:none;color:var(--ad-muted);cursor:pointer}
.ad-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:2px 16px}
.ad-chips::-webkit-scrollbar{display:none}
.ad-chip{flex-shrink:0;min-height:44px;padding:0 16px;border-radius:99px;border:1px solid var(--ad-line);background:var(--ad-card);
  color:var(--ad-text);font:700 13px/1 'Nexa',system-ui,sans-serif;cursor:pointer;transition:transform var(--motion-fast) var(--ease-spring)}
.ad-chip[aria-pressed="true"]{background:var(--ad-brand);border-color:var(--ad-brand);color:var(--ad-onbrand)}
.ad-chip small{font-weight:300;opacity:.85;margin-left:6px}

/* Avisos: guardando / guardado / error (visible, no solo consola). */
.ad-aviso{display:flex;align-items:center;gap:10px;margin:12px 0 0;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;
  background:var(--ad-card);border:1px solid var(--ad-line);animation:ad-entra var(--motion-base) var(--ease-out) both}
.ad-aviso.ad-error{border-color:var(--ad-warn);color:var(--ad-warn)}
.ad-aviso span{flex:1}
.ad-aviso button{min-height:36px}
@keyframes ad-entra{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}

.ad-main{padding-top:14px;padding-bottom:48px}

/* Lista (móvil/tablet) */
.ad-lista{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:10px}
.ad-item{background:var(--ad-card);border:1px solid var(--ad-line);border-radius:16px;padding:12px 12px 12px 14px;
  display:grid;grid-template-columns:1fr auto;gap:8px 12px;align-items:center}
.ad-item:focus-within{border-color:var(--ad-brand)}
.ad-nombre{font-size:15px;font-weight:700;line-height:1.25}
.ad-meta{margin-top:3px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ad-muted)}
.ad-tag{display:inline-block;margin-left:6px;padding:2px 7px;border-radius:99px;border:1px solid var(--ad-acento);color:var(--ad-text);
  font-size:10px;letter-spacing:.06em;text-transform:none}
.ad-controles{display:flex;align-items:center;gap:6px}
.ad-item .ad-estado{grid-column:1 / -1}

.ad-precio{display:inline-flex;align-items:center;border:1px solid var(--ad-line);border-radius:10px;background:var(--ad-surface);padding:0 10px;min-height:44px}
.ad-precio:focus-within{border-color:var(--ad-brand)}
.ad-precio[data-mal="true"]{border-color:var(--ad-warn)}
.ad-precio span{color:var(--ad-text);font-size:14px}
.ad-precio input{width:64px;border:0;outline:0;background:transparent;color:var(--ad-text);font:700 16px/1 'Nexa',system-ui,sans-serif;padding:10px 0 10px 4px}

.ad-switch{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;background:none;border:0;padding:0;cursor:pointer;border-radius:12px}
.ad-switch[disabled]{cursor:progress}
/* Borde textMuted: la pista apagada (line sobre card, 1.45:1) no llegaba a 3:1. */
.ad-pista{position:relative;width:44px;height:26px;border-radius:99px;background:var(--ad-line);box-shadow:inset 0 0 0 1px var(--ad-muted);transition:background-color var(--motion-base) var(--ease-in-out)}
.ad-switch[aria-checked="true"] .ad-pista{background:var(--ad-brand);box-shadow:none}
.ad-perilla{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--ad-card);
  box-shadow:0 1px 2px color-mix(in srgb,var(--ad-text) 25%,transparent);transition:transform var(--motion-base) var(--ease-spring)}
.ad-switch[aria-checked="true"] .ad-perilla{transform:translateX(18px)}
.ad-disp{font-size:12px;min-width:68px;color:var(--ad-muted)}
.ad-disp b{color:var(--ad-text)}

.ad-estado{font-size:12px;min-height:16px;display:flex;align-items:center;gap:5px;color:var(--ad-muted)}
.ad-estado[data-e="guardado"]{color:var(--ad-brand)}
.ad-estado[data-e="error"]{color:var(--ad-warn)}
.ad-estado > *{animation:ad-entra var(--motion-fast) var(--ease-out) both}

.ad-vacio{text-align:center;padding:48px 16px;color:var(--ad-muted);font-size:15px;line-height:1.5}
.ad-vacio b{display:block;color:var(--ad-text);font-size:17px;margin-bottom:6px}
.ad-vacio .ad-btn{margin-top:14px}
.ad-esqueleto{height:76px;border-radius:16px}

/* Panel de alta: pantalla completa en móvil, lateral en escritorio. */
.ad-velo{position:fixed;inset:0;z-index:40;background:color-mix(in srgb,var(--ad-text) 40%,transparent);animation:ad-velo var(--motion-base) var(--ease-out) both}
@keyframes ad-velo{from{opacity:0}to{opacity:1}}
.ad-panel{position:fixed;inset:0;z-index:41;background:var(--ad-surface);display:flex;flex-direction:column;
  animation:ad-sube var(--motion-base) var(--ease-out) both}
@keyframes ad-sube{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.ad-panel-cab{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--ad-line)}
.ad-panel-cab h2{margin:0;font-size:18px}
.ad-form{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px}
.ad-campo label,.ad-campo .ad-label{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ad-muted);margin-bottom:6px}
.ad-campo input,.ad-campo select,.ad-campo textarea{width:100%;min-height:44px;border:1px solid var(--ad-line);border-radius:12px;
  background:var(--ad-card);color:var(--ad-text);font:400 16px/1.3 'Nexa',system-ui,sans-serif;padding:10px 12px}
.ad-campo textarea{resize:vertical;min-height:80px}
.ad-check{display:flex;align-items:center;gap:10px;min-height:44px;font-size:15px;cursor:pointer}
.ad-check input{width:20px;height:20px;accent-color:var(--ad-brand)}
.ad-form-pie{padding:12px 16px 16px;border-top:1px solid var(--ad-line);display:flex;flex-direction:column;gap:8px}
.ad-form-pie .ad-btn{width:100%}
.ad-form-error{color:var(--ad-warn);font-size:14px;margin:0}

/* Móvil: "Agregar" flota abajo (la cabecera no da para 4 botones y el título) */
@media (max-width:639px){
  .ad-titulo h1{font-size:22px}
  .ad-alta{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:20;min-height:56px;border-radius:16px;
    padding:0 20px;box-shadow:0 10px 28px -10px color-mix(in srgb,var(--ad-text) 55%,transparent)}
  .ad-alta .ad-btn-texto{display:inline}
  .ad-main{padding-bottom:104px}
}

/* Tablet: 2 columnas */
@media (min-width:640px){
  .ad-cont{padding:0 24px}
  .ad-chips{margin:0;padding:2px 0;flex-wrap:wrap;overflow:visible}
  .ad-lista{grid-template-columns:1fr 1fr;gap:12px}
  .ad-btn-texto{display:inline}
}

/* Escritorio: cabecera fija, buscador + chips en una fila, tabla, panel lateral */
@media (min-width:1024px){
  .ad-cont{padding:0 32px}
  .ad-cab{position:sticky;top:0;z-index:10;padding:18px 0 14px}
  .ad-titulo h1{font-size:32px}
  .ad-herr{flex-direction:row;align-items:center;gap:16px;margin-top:16px}
  .ad-buscar{flex:0 0 320px}
  .ad-chip{min-height:38px}
  .ad-main{padding-top:20px}
  .ad-tabla{width:100%;border-collapse:separate;border-spacing:0;background:var(--ad-card);border:1px solid var(--ad-line);border-radius:16px;overflow:hidden}
  .ad-tabla th{text-align:left;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ad-muted);font-weight:700;
    padding:12px 16px;border-bottom:1px solid var(--ad-line)}
  .ad-tabla td{padding:10px 16px;border-bottom:1px solid var(--ad-line);vertical-align:middle}
  .ad-tabla tbody tr:last-child td{border-bottom:0}
  .ad-tabla tbody tr{transition:background-color var(--motion-fast) var(--ease-out)}
  .ad-tabla tbody tr:hover,.ad-tabla tbody tr:focus-within{background:color-mix(in srgb,var(--ad-brand) 7%,var(--ad-card))}
  .ad-tabla tbody tr:focus-within td:first-child{box-shadow:inset 3px 0 0 var(--ad-brand)}
  .ad-tabla .ad-desc{font-size:13px;color:var(--ad-muted);margin-top:3px;max-width:52ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ad-tabla .ad-col-precio{width:190px}
  .ad-tabla .ad-col-disp{width:260px}
  .ad-celda{display:flex;align-items:center;gap:10px}
  .ad-panel{inset:0 0 0 auto;width:440px;border-left:1px solid var(--ad-line);animation-name:ad-lateral}
  @keyframes ad-lateral{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:none}}
}
`;

function useMedia(query) {
  const [ok, setOk] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setOk(mq.matches);
    fn(); mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return ok;
}

/* ---------- Piezas de fila ---------- */

function CampoPrecio({ p, onGuardar }) {
  const [valor, setValor] = useState(() => Number(p.precio).toFixed(2));
  const [mal, setMal] = useState(false);
  const saltarBlur = useRef(false);
  const errId = useId();
  useEffect(() => { setValor(Number(p.precio).toFixed(2)); }, [p.precio]);

  const confirmar = () => {
    const n = parsearPrecio(valor);
    if (n === null) { setMal(true); setValor(Number(p.precio).toFixed(2)); return; }
    setMal(false);
    setValor(n.toFixed(2));
    if (n !== Number(p.precio)) onGuardar({ precio: n });
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirmar(); saltarBlur.current = true; e.currentTarget.blur(); }
    if (e.key === "Escape") { e.preventDefault(); setMal(false); setValor(Number(p.precio).toFixed(2)); saltarBlur.current = true; e.currentTarget.blur(); }
  };
  const onBlur = () => { if (saltarBlur.current) { saltarBlur.current = false; return; } confirmar(); };

  return (
    <div>
      <div className="ad-precio" data-mal={mal}>
        <span aria-hidden>$</span>
        <input value={valor} inputMode="decimal" enterKeyHint="done" autoComplete="off"
          aria-label={`Precio de ${p.nombre}`} aria-invalid={mal} aria-describedby={mal ? errId : undefined}
          onChange={(e) => { setValor(e.target.value); setMal(false); }} onKeyDown={onKeyDown} onBlur={onBlur}
          onFocus={(e) => e.target.select()} />
      </div>
      {mal && <div id={errId} className="ad-estado" data-e="error" role="alert"><span>Precio no válido</span></div>}
    </div>
  );
}

function Interruptor({ p, onCambiar, ocupado }) {
  return (
    <button type="button" className="ad-switch" role="switch" aria-checked={!!p.disponible}
      aria-label={`Disponible hoy: ${p.nombre}`} disabled={ocupado} onClick={() => onCambiar({ disponible: !p.disponible })}>
      <span className="ad-pista" aria-hidden><span className="ad-perilla" /></span>
    </button>
  );
}

function EstadoFila({ e }) {
  return (
    <div className="ad-estado" data-e={e || ""}>
      {e === "guardando" && <span key="g">Guardando…</span>}
      {e === "guardado" && <span key="ok"><Check size={13} style={{ verticalAlign: "-2px" }} /> Guardado</span>}
      {e === "error" && <span key="x"><AlertCircle size={13} style={{ verticalAlign: "-2px" }} /> No se guardó</span>}
    </div>
  );
}

const Disp = ({ p }) => <span className="ad-disp">{p.disponible ? <b>Disponible</b> : "Agotado"}</span>;
const Meta = ({ p }) => <>{p.cat}{p.tag && <span className="ad-tag">{p.tag}</span>}</>;

/* ---------- Alta de producto (panel) ---------- */

function PanelNuevo({ siguienteOrden, onCreado, cerrar }) {
  const [nombre, setNombre] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tag, setTag] = useState(""); // etiqueta opcional ("Nuevo", "Casa"…), punto 11 de la reunión 05/sept
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const primero = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    primero.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") cerrar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cerrar]);

  const crear = async (e) => {
    e.preventDefault();
    const n = parsearPrecio(precio);
    if (!nombre.trim() || n === null) { setError("Nombre y un precio válido son obligatorios."); return; }
    setGuardando(true); setError("");
    // Misma inserción que el Admin anterior: id por slug, con sufijo si choca.
    const base = slugify(nombre) || "producto";
    let id = base;
    let fila = null;
    for (let intento = 0; intento < 5 && !fila; intento++) {
      const { data, error: err } = await supabase.from("productos").insert({
        id, cat, nombre: nombre.trim(), precio: n, descripcion: descripcion.trim(),
        tag: tag.trim() || null, disponible, finca: false, orden: siguienteOrden,
      }).select().single();
      if (!err) { fila = data; break; }
      if (err.code === "23505") { id = `${base}-${intento + 2}`; continue; }
      setError("No se pudo crear el producto. Intenta de nuevo.");
      setGuardando(false);
      return;
    }
    setGuardando(false);
    if (fila) onCreado(fila);
    else setError("No se pudo generar un id único para este nombre. Cámbialo e intenta de nuevo.");
  };

  return (
    <>
      <div className="ad-velo" onClick={cerrar} aria-hidden />
      <aside className="ad-panel" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className="ad-panel-cab">
          <h2 id={tituloId} className="disp">Producto nuevo</h2>
          <button type="button" className="ad-icono" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <form onSubmit={crear} style={{ display: "contents" }} noValidate>
          <div className="ad-form">
            <div className="ad-campo"><label htmlFor="ad-n-nombre">Nombre</label>
              <input id="ad-n-nombre" ref={primero} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" required /></div>
            <div className="ad-campo"><label htmlFor="ad-n-cat">Categoría</label>
              <select id="ad-n-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="ad-campo"><label htmlFor="ad-n-precio">Precio (USD)</label>
              <input id="ad-n-precio" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" inputMode="decimal" required /></div>
            <div className="ad-campo"><label htmlFor="ad-n-desc">Descripción</label>
              <textarea id="ad-n-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} /></div>
            <div className="ad-campo"><label htmlFor="ad-n-tag">Etiqueta (opcional)</label>
              <input id="ad-n-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="p. ej. Nuevo" maxLength={14} autoComplete="off" /></div>
            <label className="ad-check">
              <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
              Disponible desde ya
            </label>
          </div>
          <div className="ad-form-pie">
            {error && <p className="ad-form-error" role="alert">{error}</p>}
            <button type="submit" className="ad-btn" disabled={guardando}>{guardando ? "Creando…" : "Crear producto"}</button>
            <button type="button" className="ad-btn ad-btn-sec" onClick={cerrar}>Cancelar</button>
          </div>
        </form>
      </aside>
    </>
  );
}

/* ---------- Panel ---------- */

export default function AdminPanel({ onBack }) {
  const { C, tema, setTema } = useTheme();
  const escritorio = useMedia("(min-width:1024px)");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [texto, setTexto] = useState("");
  const [cat, setCat] = useState(null);
  const [estados, setEstados] = useState({}); // id → guardando | guardado | error
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }
  const [altaAbierta, setAltaAbierta] = useState(false);
  const botonAlta = useRef(null);
  const timers = useRef({});

  const cargarProductos = async () => {
    setCargando(true); setErrorCarga("");
    const { data, error } = await supabase.from("productos").select("*").order("orden");
    setCargando(false);
    if (error) setErrorCarga("No se pudo cargar la carta. Revisa la conexión e intenta de nuevo.");
    else setProductos(filasParaAdmin(data || []));
  };
  useEffect(() => {
    if (supabase) cargarProductos(); else setCargando(false);
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const marcar = (id, e) => {
    clearTimeout(timers.current[id]);
    setEstados((s) => ({ ...s, [id]: e }));
    if (e === "guardado") timers.current[id] = setTimeout(() => setEstados((s) => ({ ...s, [id]: undefined })), 2400);
  };

  // Optimista como antes, pero si Supabase rechaza se vuelve al valor previo
  // (antes la pantalla quedaba mostrando un cambio que no se guardó).
  const cambiarProducto = async (p, cambios) => {
    const previo = Object.fromEntries(Object.keys(cambios).map((k) => [k, p[k]]));
    setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...cambios } : x)));
    marcar(p.id, "guardando");
    const { error } = await supabase.from("productos").update(cambios).eq("id", p.id);
    if (error) {
      setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...previo } : x)));
      marcar(p.id, "error");
      setAviso({ tipo: "error", texto: `No se pudo guardar «${p.nombre}». Revisa la conexión e intenta de nuevo.` });
    } else {
      marcar(p.id, "guardado");
      setAviso((a) => (a?.tipo === "error" ? a : null));
    }
  };

  const abrirAlta = () => setAltaAbierta(true);
  const cerrarAlta = useMemo(() => () => { setAltaAbierta(false); requestAnimationFrame(() => botonAlta.current?.focus()); }, []);
  const agregarProducto = (fila) => {
    setProductos((ps) => [...ps, ...filasParaAdmin([fila])]);
    cerrarAlta();
    setAviso({ tipo: "ok", texto: `«${fila.nombre}» se agregó a la carta.` });
  };
  const siguienteOrden = productos.reduce((m, p) => Math.max(m, p.orden || 0), 0) + 1;

  const cats = useMemo(() => categoriasDe(productos, CATS), [productos]);
  const visibles = useMemo(() => filtrarProductos(productos, { texto, cat }), [productos, texto, cat]);
  const conteo = contarProductos(productos);
  const porCat = useMemo(() => Object.fromEntries(cats.map((c) => [c, productos.filter((p) => p.cat === c).length])), [cats, productos]);
  const hayFiltro = !!(texto.trim() || cat);
  const limpiarFiltros = () => { setTexto(""); setCat(null); };
  const oscuro = tema === "oscuro";

  const fila = (p) => ({ p, e: estados[p.id], ocupado: estados[p.id] === "guardando", guardar: (c) => cambiarProducto(p, c) });

  let cuerpo;
  if (!supabase) {
    cuerpo = <div className="ad-vacio"><b>Supabase no está configurado</b>Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.</div>;
  } else if (cargando && !productos.length) {
    cuerpo = <ul className="ad-lista" aria-label="Cargando carta">{[0, 1, 2, 3, 4, 5].map((i) => <li key={i} className="ad-esqueleto mo-skeleton" />)}</ul>;
  } else if (errorCarga && !productos.length) {
    cuerpo = (
      <div className="ad-vacio" role="alert"><b>No se pudo cargar la carta</b>{errorCarga}<br />
        <button type="button" className="ad-btn" onClick={cargarProductos}><RotateCcw size={16} /> Reintentar</button></div>
    );
  } else if (!productos.length) {
    cuerpo = <div className="ad-vacio"><b>Todavía no hay productos</b>Agrega el primero con «Agregar producto».</div>;
  } else if (!visibles.length) {
    cuerpo = (
      <div className="ad-vacio" role="status"><b>Sin resultados</b>
        {texto.trim() ? <>No hay productos que coincidan con «{texto.trim()}»{cat ? ` en ${cat}` : ""}.</> : <>No hay productos en {cat}.</>}<br />
        <button type="button" className="ad-btn ad-btn-sec" onClick={limpiarFiltros}>Limpiar filtros</button></div>
    );
  } else if (escritorio) {
    cuerpo = (
      <table className="ad-tabla">
        <caption className="ad-sr">Productos de la carta: precio y disponibilidad</caption>
        <thead><tr><th scope="col">Producto</th><th scope="col">Categoría</th><th scope="col" className="ad-col-precio">Precio</th><th scope="col" className="ad-col-disp">Disponible</th></tr></thead>
        <tbody>
          {visibles.map((p) => { const f = fila(p); return (
            <tr key={p.id}>
              <td><div className="ad-nombre">{p.nombre}</div>{p.descripcion && <div className="ad-desc" title={p.descripcion}>{p.descripcion}</div>}</td>
              <td className="ad-meta"><Meta p={p} /></td>
              <td><CampoPrecio p={p} onGuardar={f.guardar} /></td>
              <td><div className="ad-celda"><Interruptor p={p} onCambiar={f.guardar} ocupado={f.ocupado} /><Disp p={p} /><EstadoFila e={f.e} /></div></td>
            </tr>
          ); })}
        </tbody>
      </table>
    );
  } else {
    cuerpo = (
      <ul className="ad-lista">
        {visibles.map((p) => { const f = fila(p); return (
          <li key={p.id} className="ad-item">
            <div style={{ minWidth: 0 }}><div className="ad-nombre">{p.nombre}</div><div className="ad-meta"><Meta p={p} /></div></div>
            <div className="ad-controles"><CampoPrecio p={p} onGuardar={f.guardar} /><Interruptor p={p} onCambiar={f.guardar} ocupado={f.ocupado} /></div>
            <div className="ad-estado" style={{ justifyContent: "space-between" }}><Disp p={p} /><EstadoFila e={f.e} /></div>
          </li>
        ); })}
      </ul>
    );
  }

  return (
    <div className="ad" style={variablesAdmin(C)}>
      <style>{CSS_ADMIN}</style>
      <header className="ad-cab">
        <div className="ad-cont">
          <div className="ad-cab-fila">
            {onBack && <button type="button" className="ad-icono" onClick={onBack} aria-label="Volver al selector"><ArrowLeft size={18} /></button>}
            <div className="ad-titulo">
              <h1>Panel Admin</h1>
              <p className="ad-contador" aria-live="polite">{textoContador(conteo)}</p>
            </div>
            <div className="ad-acciones">
              <button type="button" ref={botonAlta} className="ad-btn ad-alta" onClick={abrirAlta} disabled={!supabase}>
                <Plus size={18} aria-hidden /><span className="ad-btn-texto">Agregar producto</span>
              </button>
              <button type="button" className="ad-icono" onClick={() => setTema(oscuro ? "claro" : "oscuro")} aria-label={oscuro ? "Tema claro" : "Tema oscuro"} aria-pressed={oscuro}>
                {oscuro ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button type="button" className="ad-icono" onClick={() => supabase?.auth.signOut()} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>
            </div>
          </div>
          {productos.length > 0 && (
            <div className="ad-herr">
              <div className="ad-buscar" role="search">
                <Search size={18} aria-hidden />
                <label htmlFor="ad-buscar" className="ad-sr">Buscar producto por nombre</label>
                <input id="ad-buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") setTexto(""); }} placeholder="Buscar producto" autoComplete="off" />
                {texto && <button type="button" className="ad-limpiar" onClick={() => setTexto("")} aria-label="Borrar búsqueda"><X size={16} /></button>}
              </div>
              <div className="ad-chips" role="group" aria-label="Filtrar por categoría">
                <button type="button" className="ad-chip" aria-pressed={!cat} onClick={() => setCat(null)}>Todas<small>{productos.length}</small></button>
                {cats.map((c) => (
                  <button key={c} type="button" className="ad-chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
                    {c}<small>{porCat[c]}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {aviso && (
            <div className={`ad-aviso${aviso.tipo === "error" ? " ad-error" : ""}`} role={aviso.tipo === "error" ? "alert" : "status"}>
              {aviso.tipo === "error" ? <AlertCircle size={18} aria-hidden /> : <Check size={18} aria-hidden />}
              <span>{aviso.texto}</span>
              <button type="button" className="ad-icono" style={{ width: 36, height: 36 }} onClick={() => setAviso(null)} aria-label="Cerrar aviso"><X size={16} /></button>
            </div>
          )}
        </div>
      </header>
      <main className="ad-main">
        <div className="ad-cont">
          {hayFiltro && visibles.length > 0 && <p className="ad-sr" role="status">{visibles.length} resultados</p>}
          {cuerpo}
        </div>
      </main>
      {altaAbierta && <PanelNuevo siguienteOrden={siguienteOrden} onCreado={agregarProducto} cerrar={cerrarAlta} />}
    </div>
  );
}
