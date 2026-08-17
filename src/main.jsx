import React from "react";
import ReactDOM from "react-dom/client";
import QuadroCafe, { BarraDashboard } from "./App.jsx";

// /#barra es un "app" separada del cliente: dashboard de barra para
// tablet/computadora del local, sin el frame de teléfono. Se decide una
// sola vez al cargar, no es ruteo cliente dentro de QuadroCafe.
// "?barra=1" cubre la vuelta del enlace de "olvidé mi clave": Supabase pisa
// el hash con su propio #access_token=...&type=recovery, así que ese viaje
// de ida y vuelta no puede depender de "#barra" — ver AdminLogin/"origen".
const esBarra = typeof window !== "undefined"
  && (window.location.hash === "#barra" || window.location.search.includes("barra=1"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {esBarra ? <BarraDashboard /> : <QuadroCafe />}
  </React.StrictMode>
);
