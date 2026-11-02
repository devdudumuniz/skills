import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build estático do painel (HTML + 1 JS + 1 CSS). O resultado vai para engine/ui/ e o servidor Python o serve;
// Node só é necessário para RECONSTRUIR a interface (scripts/build_ui.py), nunca para usar o painel.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
});
