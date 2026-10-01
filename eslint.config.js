// Lint mínimo a propósito: atrapa lo que rompe en runtime (variables sin
// definir, hooks mal llamados, sintaxis) sin abrir ruido de estilo sobre las
// ~3.900 líneas de App.jsx. Endurecer de a poco, regla por regla.
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "node_modules/**", "supabase/functions/**", "_to_delete/**", "incoming/**", "quadrocafe-assets/**"] },
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "no-undef": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["test/**/*.js", "scripts/**/*.{js,mjs}", "*.config.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.node } },
    rules: { "no-undef": "error" },
  },
];
