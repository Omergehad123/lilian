import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],

  // ✅ FIXES 500kB+ chunk warning
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ✅ Vendor: All node_modules (React, Lodash, etc.)
          if (id.includes("node_modules")) {
            return "vendor";
          }

          // ✅ UI Components
          if (id.includes("/components/ui/") || id.includes("/components/")) {
            return "ui";
          }

          // ✅ Utils/Lib
          if (id.includes("/utils/") || id.includes("/lib/")) {
            return "utils";
          }
        },
      },
    },
  },
});
