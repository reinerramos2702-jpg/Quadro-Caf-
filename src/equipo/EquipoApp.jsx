import React, { useState, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { Coffee, LayoutDashboard, LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "../lib/supabase";
import { PALETAS, ThemeCtx, buildCss, Admin, BarraDashboard } from "../App.jsx";
import { resolverRol, vistaInicial } from "./rol";
import { CSS_EQUIPO, EscenaEquipo, LogoEquipo, LoginEquipo, variablesEquipo } from "./LoginEquipo.jsx";

/* ============================ APP DEL EQUIPO (/equipo) ============================
   Ruta del staff, separada del cliente (main.jsx decide con rutaEquipo()).
   Flujo: sesión de Supabase Auth → rol en `staff` → vista:
     barista → Barra ·  admin → selector (Barra / Panel Admin) o la que pidió la URL.
   Sin sesión → login. Con sesión pero sin rol → acceso denegado.

   IMPORTANTE: este gate es UX, no seguridad. La seguridad real es la RLS del
   servidor (0008/0009): sin fila en `staff`, Postgres niega editar productos,
   mover órdenes y ver comprobantes aunque alguien se salte esta pantalla.
   Solo usa la publishable key (src/lib/supabase.js); no crea usuarios ni
   guarda claves ni tokens (la sesión la maneja supabase-js). */

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Cambios de vista con View Transitions donde existan; si no, cambio directo
// (cada vista trae su propia entrada CSS).
function transicion(fn) {
  if (typeof document !== "undefined" && document.startViewTransition && !reduceMotion()) {
    document.startViewTransition(() => flushSync(fn));
  } else fn();
}

function leerTema() {
  try {
    const t = localStorage.getItem("qc-tema");
    if (t === "claro" || t === "oscuro") return t;
  } catch { /* sin localStorage */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export default function EquipoApp({ pedido = null, recuperacion = false }) {
  // La escena del login es nocturna: siempre PALETAS.oscuro, sin el toggle.
  const N = PALETAS.oscuro;
  // html/body son ancestros del .qc donde viven las variables --eq-*, así que
  // no las heredan: el fondo de rebote (overscroll iOS/Android) va con el
  // valor del token inyectado directo (hallazgo del code review).
  const cssEscena = useMemo(() => buildCss(N) + `html,body{margin:0;background:${N.tinta}}` + CSS_EQUIPO, [N]);

  const [sesion, setSesion] = useState(undefined); // undefined = verificando
  const [recuperando, setRecuperando] = useState(recuperacion);
  const [rolInfo, setRolInfo] = useState(undefined); // undefined = leyendo rol
  const [vista, setVista] = useState(null);
  const [intento, setIntento] = useState(0); // "Reintentar" tras un error al leer el rol

  useEffect(() => {
    if (!supabase) { setSesion(null); return; }
    supabase.auth.getSession().then(({ data }) => setSesion(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s ?? null);
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true);
      if (evento === "SIGNED_OUT") { setRolInfo(undefined); setVista(null); setRecuperando(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = sesion?.user?.id;
  useEffect(() => {
    if (!uid) { setRolInfo(undefined); return; }
    let cancelado = false;
    setRolInfo(undefined);
    supabase.from("staff").select("rol").eq("user_id", uid).maybeSingle()
      .then((res) => res, (error) => ({ data: null, error }))
      .then((res) => {
        if (cancelado) return;
        const info = resolverRol(res);
        if (info.legacy) console.warn("[Equipo] Tabla staff ausente: 0008 sin aplicar. Acceso de admin provisional (TODO retirar).");
        setRolInfo(info);
      });
    return () => { cancelado = true; };
  }, [uid, intento]);

  const rol = rolInfo?.rol ?? null;
  const vistaActual = vista ?? vistaInicial(rol, pedido);

  // La URL refleja la vista (recargar deja al staff donde estaba) y limpia
  // tokens/flags de la vuelta del enlace de recuperación.
  useEffect(() => {
    if (sesion === undefined || recuperando) return;
    const destino = "/equipo" + (sesion && (vistaActual === "barra" || vistaActual === "admin") ? `#${vistaActual}` : "");
    if (window.location.pathname + window.location.search + window.location.hash !== destino) {
      window.history.replaceState(null, "", destino);
    }
  }, [sesion, recuperando, vistaActual]);

  const salir = () => supabase.auth.signOut();
  const ir = (v) => transicion(() => setVista(v));

  // ── Vistas ya adentro (cada una con su propio tema) ──
  if (sesion && !recuperando && rol === "admin" && vistaActual === "admin") {
    return <AdminEquipo onVolver={() => ir("selector")} />;
  }
  if (sesion && !recuperando && rol && vistaActual === "barra") {
    return <BarraDashboard onVolver={rol === "admin" ? () => ir("selector") : undefined} />;
  }

  // ── Escena nocturna: login, recuperación, selector, denegado, cargando ──
  let contenido;
  if (!supabase) {
    contenido = (
      <>
        <LogoEquipo />
        <section className="eq-tarjeta" aria-labelledby="eq-titulo">
          <h1 id="eq-titulo" className="eq-titulo">Acceso del equipo</h1>
          <p className="eq-sub">El acceso no está disponible en este entorno. Avisa al administrador.</p>
        </section>
      </>
    );
  } else if (sesion === undefined || (sesion && !recuperando && rolInfo === undefined)) {
    contenido = <div role="status" aria-label="Verificando acceso"><LogoEquipo cargando /></div>;
  } else if (sesion && recuperando) {
    contenido = <LoginEquipo inicial="nueva" onClaveNueva={() => transicion(() => setRecuperando(false))} />;
  } else if (!sesion) {
    contenido = <LoginEquipo key="login" inicial="login" />;
  } else if (!rol && rolInfo.error) {
    contenido = (
      <>
        <LogoEquipo />
        <section className="eq-tarjeta" aria-labelledby="eq-titulo">
          <div className="eq-paso">
            <h1 id="eq-titulo" className="eq-titulo">Sin conexión</h1>
            <p className="eq-sub" role="alert">
              No pudimos verificar tu acceso. Revisa la conexión e intenta de nuevo.
            </p>
            <button type="button" className="eq-boton" onClick={() => setIntento((n) => n + 1)}><span>Reintentar</span></button>
            <div className="eq-pie">
              <button type="button" className="eq-link" onClick={salir}>
                <LogOut size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />Cerrar sesión
              </button>
            </div>
          </div>
        </section>
      </>
    );
  } else if (!rol) {
    contenido = (
      <>
        <LogoEquipo />
        <section className="eq-tarjeta" aria-labelledby="eq-titulo">
          <div className="eq-paso">
            <h1 id="eq-titulo" className="eq-titulo">Sin acceso</h1>
            <p className="eq-sub" role="alert">
              <ShieldAlert size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Tu cuenta no tiene acceso al equipo. Si crees que es un error, avisa al administrador.
            </p>
            <button type="button" className="eq-boton" onClick={salir}><span>Cerrar sesión</span></button>
          </div>
        </section>
      </>
    );
  } else {
    contenido = (
      <>
        <LogoEquipo />
        <section className="eq-tarjeta" aria-labelledby="eq-titulo">
          <div className="eq-paso">
            <h1 id="eq-titulo" className="eq-titulo">Hola, equipo</h1>
            <p className="eq-sub">¿Dónde trabajas ahora?</p>
            <div className="eq-opciones">
              <button type="button" className="eq-opcion" onClick={() => ir("barra")}>
                <span className="eq-opcion-icono"><Coffee size={22} /></span>
                <span><b>Barra</b><small>Pedidos en vivo y comprobantes</small></span>
              </button>
              <button type="button" className="eq-opcion" onClick={() => ir("admin")}>
                <span className="eq-opcion-icono"><LayoutDashboard size={22} /></span>
                <span><b>Panel Admin</b><small>Carta, precios y disponibilidad</small></span>
              </button>
            </div>
            <div className="eq-pie">
              <button type="button" className="eq-link" onClick={salir}>
                <LogOut size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />Cerrar sesión
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <ThemeCtx.Provider value={{ tema: "oscuro", setTema: () => {}, C: N }}>
      <div className="qc" style={variablesEquipo(N)}>
        <style>{cssEscena}</style>
        <EscenaEquipo>{contenido}</EscenaEquipo>
      </div>
    </ThemeCtx.Provider>
  );
}

/* Panel Admin dentro del equipo: mismo marco de teléfono que en la app del
   cliente (el componente se diseñó para 430px), con el tema que eligió el
   usuario. */
function AdminEquipo({ onVolver }) {
  const [tema, setTema] = useState(leerTema);
  useEffect(() => { try { localStorage.setItem("qc-tema", tema); } catch { /* noop */ } }, [tema]);
  const C = PALETAS[tema];
  const css = useMemo(() => buildCss(C), [C]);
  return (
    <ThemeCtx.Provider value={{ tema, setTema, C }}>
      <div className="qc" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.shell }}>
        <style>{css}</style>
        <div className="mo-enter" style={{
          position: "relative", width: "100%", maxWidth: 430, height: "100vh", maxHeight: 940,
          background: C.surface, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <Admin onBack={onVolver} />
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
