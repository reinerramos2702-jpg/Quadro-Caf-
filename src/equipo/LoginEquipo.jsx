import React, { useState, useRef, useEffect } from "react";
import { Mail, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

/* ============================ LOGIN DEL EQUIPO ============================
   Pantalla de acceso del staff (barista/admin). El cliente nunca llega acá.
   Escena nocturna fija (siempre PALETAS.oscuro), pero la paleta que manda es
   la de MARCA: verde Quadro / verde profundo / crema / hueso (MARCA_FIJA en
   App.jsx). Terracota solo como acento mínimo de error. Nada de ámbar.

   Todos los colores entran como variables CSS (--eq-*) seteadas desde los
   tokens de useTheme(): este archivo no tiene ni un hex. Sin blur ni
   backdrop-filter (caros en Android gama media). Motion solo con
   transform/opacity; prefers-reduced-motion lo apaga entero. */

export const variablesEquipo = (C) => ({
  "--eq-marca": C.marca,
  "--eq-profunda": C.marcaProfunda,
  "--eq-mocoties": C.mocoties,
  "--eq-crema": C.crema,
  "--eq-hueso": C.hueso,
  "--eq-tinta": C.tinta,
  "--eq-panel": C.panel,
  "--eq-terracota": C.terracota,
});

// Constelación del cielo: posiciones fijas (no aleatorias: misma escena en
// cada carga y en las capturas de verificación). [x%, y%, tamaño px, retardo s]
const ESTRELLAS = [
  [8, 6, 2, 0], [17, 14, 1.5, 1.2], [26, 4, 2, 2.1], [34, 19, 1.5, .6], [43, 9, 2.5, 1.7],
  [52, 3, 1.5, 2.6], [58, 16, 2, .3], [66, 7, 1.5, 1.4], [73, 22, 2, 2.3], [81, 5, 2.5, .9],
  [88, 15, 1.5, 1.9], [94, 9, 2, .2], [12, 27, 1.5, 2.8], [38, 31, 1.5, 1.1], [62, 29, 2, 2.5],
  [86, 30, 1.5, .7],
];

export const CSS_EQUIPO = `
html,body{margin:0;background:var(--eq-tinta)}
.eq{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;color:var(--eq-hueso);
  background:linear-gradient(180deg,var(--eq-profunda),var(--eq-tinta))}
.eq-fondo,.eq-fondo img{position:absolute;inset:0;width:100%;height:100%}
.eq-fondo img{object-fit:cover;object-position:top center;display:block}
/* Velo de legibilidad: verde profundo arriba (~35%) → tinta abajo (~85%). */
.eq-velo{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,var(--eq-profunda) 0%,var(--eq-tinta) 100%);opacity:.6}
@supports (background:color-mix(in srgb,red 50%,transparent)){
  .eq-velo{opacity:1;background:linear-gradient(180deg,
    color-mix(in srgb,var(--eq-profunda) 35%,transparent) 0%,
    color-mix(in srgb,var(--eq-profunda) 55%,transparent) 45%,
    color-mix(in srgb,var(--eq-tinta) 85%,transparent) 100%)}
}
/* Tinte de marca: el cielo azul noche de la ilustración pasa a leerse verde
   Quadro sin perder luces (la luna y las ventanas conservan su luminancia). */
.eq-tinte{position:absolute;inset:0;pointer-events:none;background:var(--eq-marca);mix-blend-mode:color;opacity:.72}
.eq-cielo{position:absolute;inset:0 0 45% 0;pointer-events:none}
.eq-estrella{position:absolute;border-radius:50%;background:var(--eq-crema);opacity:.2;
  animation:eq-titilar 3.4s var(--ease-in-out) infinite both}
@keyframes eq-titilar{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:.95;transform:scale(1)}}

.eq-escena{position:relative;z-index:1;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-end;gap:0;
  padding:max(24px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(28px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
@media (min-width:769px){.eq-escena{justify-content:center}}

.eq-logo{width:84px;height:84px;border-radius:50%;overflow:hidden;position:relative;z-index:2;margin-bottom:-42px;
  box-shadow:0 0 0 1px color-mix(in srgb,var(--eq-crema) 35%,transparent),0 14px 40px -10px var(--eq-tinta);
  animation:eq-logo var(--motion-slow) var(--ease-spring) both}
/* El PNG trae un margen blanco: el círculo verde mide 160 de 192 px (medido). Escalar 1.21 lo deja fuera del recorte. */
.eq-logo img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.21)}
@keyframes eq-logo{from{opacity:0;transform:translateY(-26px) scale(.8)}to{opacity:1;transform:none}}

.eq-tarjeta{width:100%;max-width:400px;border-radius:28px;padding:58px 24px 24px;
  background:var(--eq-panel);border:1px solid var(--eq-crema);
  box-shadow:0 30px 80px -30px var(--eq-tinta);
  animation:eq-subir var(--motion-slow) var(--ease-out) both;animation-delay:80ms}
@supports (background:color-mix(in srgb,red 50%,transparent)){
  .eq-tarjeta{background:color-mix(in srgb,var(--eq-profunda) 84%,transparent);
    border-color:color-mix(in srgb,var(--eq-crema) 25%,transparent)}
}
@keyframes eq-subir{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}
.eq-tarjeta.eq-saliendo{animation:eq-salir var(--motion-base) var(--ease-in-out) both}
@keyframes eq-salir{to{opacity:0;transform:translateY(-8px) scale(.96)}}
.eq-tarjeta.eq-temblor{animation:eq-temblor 420ms var(--ease-in-out) both}
@keyframes eq-temblor{0%,100%{transform:none}20%{transform:translateX(-8px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}

.eq-paso{animation:eq-subir var(--motion-base) var(--ease-out) both}
.eq-titulo{font-family:'VIOLA','VIOLA Acentos','Fraunces',serif;font-size:28px;line-height:1.05;letter-spacing:.01em;
  text-transform:uppercase;text-align:center;margin:0;color:var(--eq-hueso);font-weight:400;font-size-adjust:from-font}
.eq-sub{text-align:center;margin:8px 0 22px;font-size:13.5px;line-height:1.5;color:var(--eq-crema);opacity:.82}

.eq-campo{display:block;margin-bottom:14px}
.eq-label{display:block;font-family:'Nexa',system-ui,sans-serif;font-weight:700;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--eq-crema);margin:0 0 7px 2px}
.eq-caja{position:relative;display:flex;align-items:center;border-radius:14px;
  background:var(--eq-tinta);border:1px solid var(--eq-mocoties);
  transition:border-color var(--motion-fast) var(--ease-out),box-shadow var(--motion-fast) var(--ease-out)}
@supports (background:color-mix(in srgb,red 50%,transparent)){
  .eq-caja{background:color-mix(in srgb,var(--eq-tinta) 60%,transparent);border-color:color-mix(in srgb,var(--eq-crema) 22%,transparent)}
}
.eq-caja:focus-within{border-color:var(--eq-crema);box-shadow:0 0 0 3px color-mix(in srgb,var(--eq-crema) 28%,transparent)}
.eq-caja.eq-mal{border-color:var(--eq-terracota)}
.eq-input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--eq-hueso);
  font:400 16px/1.3 'Nexa',system-ui,sans-serif;padding:14px 46px 14px 15px}
.eq-input::placeholder{color:var(--eq-crema);opacity:.55}
.eq-input:-webkit-autofill{-webkit-text-fill-color:var(--eq-hueso);transition:background-color 9999s}
.eq-icono{position:absolute;right:8px;width:34px;height:34px;display:grid;place-items:center;border-radius:10px;
  color:var(--eq-crema);opacity:.75;background:transparent;border:0;padding:0}
button.eq-icono{cursor:pointer;opacity:.85;transition:transform var(--motion-fast) var(--ease-spring),opacity var(--motion-fast)}
button.eq-icono:hover{opacity:1}
button.eq-icono:active{transform:scale(.88)}
button.eq-icono:focus-visible,.eq-link:focus-visible,.eq-boton:focus-visible,.eq-opcion:focus-visible{
  outline:2px solid var(--eq-crema);outline-offset:3px}

.eq-link{display:inline-block;background:none;border:0;padding:6px 2px;cursor:pointer;color:var(--eq-crema);
  font:700 12px/1.2 'Nexa',system-ui,sans-serif;letter-spacing:.04em;text-decoration:underline;
  text-decoration-color:color-mix(in srgb,var(--eq-crema) 40%,transparent);text-underline-offset:4px}
.eq-link:hover{text-decoration-color:var(--eq-crema)}

/* Botón "Entrar": degradado corto verde de marca → verde profundo. Mientras
   carga, una lámina más clara sube desde abajo como café llenando la taza
   (::before, solo transform). */
.eq-boton{position:relative;overflow:hidden;width:100%;margin-top:6px;border:0;border-radius:15px;cursor:pointer;
  padding:15px 18px;color:var(--eq-hueso);font:700 15px/1 'Nexa',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;
  background:linear-gradient(135deg,var(--eq-marca) 0%,var(--eq-mocoties) 55%,var(--eq-profunda) 100%);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--eq-crema) 22%,transparent) inset,0 12px 30px -14px var(--eq-tinta);
  transition:transform var(--motion-fast) var(--ease-spring),box-shadow var(--motion-fast) var(--ease-out)}
.eq-boton:hover{box-shadow:0 0 0 2px color-mix(in srgb,var(--eq-crema) 55%,transparent) inset,0 14px 34px -14px var(--eq-tinta)}
.eq-boton:active{transform:scale(.97)}
.eq-boton[disabled]{cursor:progress}
.eq-boton::before{content:"";position:absolute;inset:0;background:var(--eq-crema);opacity:.16;transform:translateY(101%);pointer-events:none}
.eq-boton[data-cargando="1"]::before{animation:eq-vertido 1.4s var(--ease-in-out) infinite}
@keyframes eq-vertido{0%{transform:translateY(101%)}70%,100%{transform:translateY(0)}}
.eq-boton span{position:relative}

.eq-error{display:flex;gap:10px;align-items:flex-start;margin:4px 0 12px;padding:10px 12px;border-radius:12px;
  font-size:13px;line-height:1.45;color:var(--eq-hueso);background:var(--eq-tinta);border-left:3px solid var(--eq-terracota)}
.eq-pie{display:flex;justify-content:center;margin-top:14px}
.eq-nota{margin:14px 0 0;text-align:center;font-size:11.5px;line-height:1.5;color:var(--eq-crema);opacity:.7}

.eq-opciones{display:grid;gap:12px;margin:4px 0 6px}
.eq-opcion{display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;border-radius:18px;padding:16px;font-family:inherit;
  color:var(--eq-hueso);background:var(--eq-tinta);border:1px solid var(--eq-mocoties);
  transition:transform var(--motion-fast) var(--ease-spring),border-color var(--motion-fast)}
@supports (background:color-mix(in srgb,red 50%,transparent)){
  .eq-opcion{background:color-mix(in srgb,var(--eq-tinta) 55%,transparent);border-color:color-mix(in srgb,var(--eq-crema) 22%,transparent)}
}
.eq-opcion:hover{border-color:var(--eq-crema)}
.eq-opcion:active{transform:scale(.97)}
.eq-opcion-icono{width:46px;height:46px;flex-shrink:0;border-radius:14px;display:grid;place-items:center;
  background:linear-gradient(135deg,var(--eq-marca),var(--eq-profunda));color:var(--eq-hueso)}
.eq-opcion b{display:block;font:700 15px/1.2 'Nexa',system-ui,sans-serif;letter-spacing:.02em}
.eq-opcion small{display:block;margin-top:4px;font-size:12.5px;color:var(--eq-crema);opacity:.8}

.eq-cargando{width:84px;height:84px;border-radius:50%;animation:eq-latir 1.6s var(--ease-in-out) infinite}
@keyframes eq-latir{0%,100%{transform:scale(.94);opacity:.75}50%{transform:scale(1);opacity:1}}

.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

@media (prefers-reduced-motion:reduce){
  .eq-estrella,.eq-boton[data-cargando="1"]::before,.eq-cargando{animation:none}
  .eq-logo,.eq-tarjeta,.eq-paso,.eq-tarjeta.eq-saliendo,.eq-tarjeta.eq-temblor{animation:none}
}
`;

/* Fondo + velo + tinte + constelación + contenido centrado. */
export function EscenaEquipo({ children }) {
  const [sinImagen, setSinImagen] = useState(false);
  return (
    <div className="eq">
      {!sinImagen && (
        <picture className="eq-fondo" aria-hidden="true">
          <source media="(min-width: 769px)" srcSet="/img/login-bg-desktop.webp" type="image/webp" />
          <img src="/img/login-bg-mobile.webp" alt="" decoding="async" fetchpriority="high" onError={() => setSinImagen(true)} />
        </picture>
      )}
      <div className="eq-velo" aria-hidden="true" />
      <div className="eq-tinte" aria-hidden="true" />
      <div className="eq-cielo" aria-hidden="true">
        {ESTRELLAS.map(([x, y, t, d], i) => (
          <span key={i} className="eq-estrella" style={{ left: `${x}%`, top: `${y}%`, width: t, height: t, animationDelay: `${d}s` }} />
        ))}
      </div>
      <main className="eq-escena">{children}</main>
    </div>
  );
}

export function LogoEquipo({ cargando = false }) {
  return (
    <div className={cargando ? "eq-logo eq-cargando" : "eq-logo"}>
      {/* 192px del repo; en pantallas densas/grandes, el ícono de 512px. */}
      <img src={logo} srcSet={`${logo} 192w, /icons/icon-512.png 512w`} sizes="84px" alt="Quadro Café" width="84" height="84" />
    </div>
  );
}

const MENSAJE_LOGIN = "No pudimos iniciar sesión. Revisa tus datos e intenta de nuevo.";

/* modo: "login" | "recuperar" | "enviado" | "nueva" (vuelta del enlace). */
export function LoginEquipo({ inicial = "login", onClaveNueva, onEntrando }) {
  const [modo, setModo] = useState(inicial);
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [temblor, setTemblor] = useState(0);
  const tarjetaRef = useRef(null);
  const primerCampoRef = useRef(null);

  // Al CAMBIAR de modo el foco va al primer campo (teclado / lector). En el
  // primer montaje no: en el teléfono abriría el teclado tapando la escena.
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) { montado.current = true; return; }
    primerCampoRef.current?.focus({ preventScroll: true });
  }, [modo]);

  // Reintenta la animación de temblor en cada error (sin remontar la tarjeta).
  useEffect(() => {
    const el = tarjetaRef.current;
    if (!el || !temblor) return;
    el.classList.remove("eq-temblor");
    void el.offsetWidth;
    el.classList.add("eq-temblor");
  }, [temblor]);

  const fallar = (msg) => { setError(msg); setTemblor((n) => n + 1); };
  const cambiar = (m) => { setModo(m); setError(""); setClave(""); setClave2(""); setVerClave(false); };

  const entrar = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setError(""); setCargando(true);
    let res;
    try { res = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave }); }
    catch { res = { error: true }; }
    setCargando(false);
    // Mismo mensaje para todo (credenciales, email inexistente, red, límite):
    // nunca revela si un correo pertenece al equipo.
    if (res.error) { fallar(MENSAJE_LOGIN); return; }
    onEntrando?.();
  };

  const recuperar = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setError(""); setCargando(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        // Query, no hash: Supabase pisa el hash con su token al volver.
        redirectTo: `${window.location.origin}/?equipo=1`,
      });
    } catch { /* mismo resultado visible pase lo que pase */ }
    setCargando(false);
    cambiar("enviado");
  };

  const guardarNueva = async (e) => {
    e.preventDefault();
    if (cargando) return;
    if (clave.length < 8) { fallar("La contraseña necesita al menos 8 caracteres."); return; }
    if (clave !== clave2) { fallar("Las contraseñas no coinciden."); return; }
    setError(""); setCargando(true);
    let res;
    try { res = await supabase.auth.updateUser({ password: clave }); } catch { res = { error: true }; }
    setCargando(false);
    if (res.error) { fallar("No pudimos guardar la contraseña. Pide un enlace nuevo e intenta otra vez."); return; }
    onClaveNueva?.();
  };

  const campoClave = (id, valor, setValor, etiqueta, auto, ref) => (
    <label className="eq-campo" htmlFor={id}>
      <span className="eq-label">{etiqueta}</span>
      <span className={error ? "eq-caja eq-mal" : "eq-caja"}>
        <input id={id} ref={ref} className="eq-input" type={verClave ? "text" : "password"} required value={valor}
          onChange={(e) => setValor(e.target.value)} autoComplete={auto} aria-invalid={!!error} aria-describedby={error ? "eq-error" : undefined} />
        <button type="button" className="eq-icono" onClick={() => setVerClave((v) => !v)}
          aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={verClave} aria-controls={id}>
          {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );

  const campoEmail = (
    <label className="eq-campo" htmlFor="eq-email">
      <span className="eq-label">Email</span>
      <span className={error && modo === "login" ? "eq-caja eq-mal" : "eq-caja"}>
        <input id="eq-email" ref={primerCampoRef} className="eq-input" type="email" inputMode="email" required
          autoComplete="username" autoCapitalize="none" spellCheck="false" value={email}
          onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "eq-error" : undefined} />
        <span className="eq-icono" aria-hidden="true"><Mail size={18} /></span>
      </span>
    </label>
  );

  const errorUI = error && (
    <div id="eq-error" className="eq-error" role="alert">{error}</div>
  );

  let cuerpo;
  if (modo === "enviado") {
    cuerpo = (
      <div key="enviado" className="eq-paso">
        <h1 id="eq-titulo" className="eq-titulo">Revisa tu correo</h1>
        <p className="eq-sub" role="status">
          Si ese correo pertenece al equipo, te enviamos un enlace para elegir una contraseña nueva.
        </p>
        <button type="button" className="eq-boton" onClick={() => cambiar("login")} ref={primerCampoRef}><span>Volver a entrar</span></button>
      </div>
    );
  } else if (modo === "recuperar") {
    cuerpo = (
      <form key="recuperar" className="eq-paso" onSubmit={recuperar} noValidate={false}>
        <h1 id="eq-titulo" className="eq-titulo">Recuperar contraseña</h1>
        <p className="eq-sub">Escribe tu email y te mandamos un enlace.</p>
        {campoEmail}
        {errorUI}
        <button type="submit" className="eq-boton" disabled={cargando} data-cargando={cargando ? "1" : "0"} aria-busy={cargando}>
          <span>{cargando ? "Enviando…" : "Enviar enlace"}</span>
        </button>
        <div className="eq-pie">
          <button type="button" className="eq-link" onClick={() => cambiar("login")}>
            <ArrowLeft size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />Volver
          </button>
        </div>
      </form>
    );
  } else if (modo === "nueva") {
    cuerpo = (
      <form key="nueva" className="eq-paso" onSubmit={guardarNueva}>
        <h1 id="eq-titulo" className="eq-titulo">Nueva contraseña</h1>
        <p className="eq-sub">Escríbela dos veces. Mínimo 8 caracteres.</p>
        {campoClave("eq-clave-nueva", clave, setClave, "Contraseña nueva", "new-password", primerCampoRef)}
        {campoClave("eq-clave-repite", clave2, setClave2, "Repite la contraseña", "new-password")}
        {errorUI}
        <button type="submit" className="eq-boton" disabled={cargando} data-cargando={cargando ? "1" : "0"} aria-busy={cargando}>
          <span>{cargando ? "Guardando…" : "Guardar contraseña"}</span>
        </button>
      </form>
    );
  } else {
    cuerpo = (
      <form key="login" className="eq-paso" onSubmit={entrar}>
        <h1 id="eq-titulo" className="eq-titulo">Acceso del equipo</h1>
        <p className="eq-sub">Barra y panel de Quadro Café.</p>
        {campoEmail}
        {campoClave("eq-clave", clave, setClave, "Contraseña", "current-password")}
        {errorUI}
        <button type="submit" className="eq-boton" disabled={cargando} data-cargando={cargando ? "1" : "0"} aria-busy={cargando}>
          <span>{cargando ? "Entrando…" : "Entrar"}</span>
        </button>
        <div className="eq-pie">
          <button type="button" className="eq-link" onClick={() => cambiar("recuperar")}>¿Olvidaste tu contraseña?</button>
        </div>
      </form>
    );
  }

  return (
    <>
      <LogoEquipo />
      <section ref={tarjetaRef} className="eq-tarjeta" aria-labelledby="eq-titulo">
        {cuerpo}
        {modo === "login" && <p className="eq-nota"><KeyRound size={12} style={{ verticalAlign: "-1px", marginRight: 6 }} />Solo personal de Quadro. Las cuentas las crea el administrador.</p>}
      </section>
    </>
  );
}
