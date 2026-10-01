import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import QuadroCafe, { PALETAS } from "./App.jsx";
import { rutaEquipo } from "./equipo/ruta.js";

// /equipo (y los accesos de siempre #barra / #admin, más la vuelta del enlace
// de recuperación de clave) es la app del STAFF: login con rol de Supabase
// Auth, Barra y Panel Admin. Se decide una sola vez al cargar; el cliente
// nunca ve un login. El módulo del equipo va en un chunk aparte: un cliente
// pidiendo un café no lo descarga.
const EquipoApp = lazy(() => import("./equipo/EquipoApp.jsx"));
const ruta = typeof window !== "undefined" ? rutaEquipo(window.location) : { esEquipo: false };

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {ruta.esEquipo ? (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: PALETAS.oscuro.tinta }} />}>
        <EquipoApp pedido={ruta.pedido} recuperacion={ruta.recuperacion} />
      </Suspense>
    ) : <QuadroCafe />}
  </React.StrictMode>
);
