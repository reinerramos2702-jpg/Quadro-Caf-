import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "Quadro Café",
        short_name: "Quadro",
        description:
          "Quadro Café — 4ª Av. de Los Palos Grandes, Edif. Los Eucaliptos, Caracas.",
        theme_color: "#3b574c",
        background_color: "#3b574c",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "es",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the built app shell (JS/CSS/HTML/manifest/icons).
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        runtimeCaching: [
          {
            // Runtime-cache the larger reference/render JPEGs in src/assets —
            // they don't change often, so cache-first is appropriate.
            urlPattern: /\/assets\/.*\.(?:jpg|jpeg|png|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quadro-images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // El modelo 3D del dripper (public/models/) no está en el
            // precache forzado (es de un tab que no todos abren) — se cachea
            // recién en la primera vez que Lab o el hero de Inicio lo piden.
            urlPattern: /\/models\/.*\.glb$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quadro-modelos-3d",
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
