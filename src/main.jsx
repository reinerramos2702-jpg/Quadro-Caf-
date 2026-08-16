import React from "react";
import ReactDOM from "react-dom/client";
import QuadroCafe, { BarraDashboard } from "./App.jsx";

// /#barra es un "app" separada del cliente: dashboard de barra para
// tablet/computadora del local, sin el frame de teléfono. Se decide una
// sola vez al cargar, no es ruteo cliente dentro de QuadroCafe.
const esBarra = typeof window !== "undefined" && window.location.hash === "#barra";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {esBarra ? <BarraDashboard /> : <QuadroCafe />}
  </React.StrictMode>
);
