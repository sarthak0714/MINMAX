import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "MINMAX Workout Tracker",
        short_name: "MINMAX",
        description: "Track your workouts and progress",
        theme_color: "#000000",
        background_color: "#000000",
        display: "fullscreen",
        icons: [
          {
            src: "/mm.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/mm.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
});
