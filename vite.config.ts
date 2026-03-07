import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true,
    port: 5180,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        energy: resolve(__dirname, "lessons/energy/index.html"),
        glow: resolve(__dirname, "lessons/glow/index.html"),
        raccoonStyles: resolve(
          __dirname,
          "playground/raccoon-styles/index.html",
        ),
      },
    },
  },
});
