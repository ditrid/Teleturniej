import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Proxy działa TYLKO w trybie deweloperskim (npm run dev) — kieruje względne
// ścieżki (/api, /auth, /socket.io) na lokalny backend. W produkcji (build +
// deploy) frontend nie używa proxy; zamiast tego korzysta z VITE_API_URL
// (patrz: src/config.js), dlatego ustaw go w Renderze na adres backendu.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all interfaces (LAN access)
    proxy: {
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
      "/api": {
        target: "http://localhost:5000",
      },
      "/auth": {
        target: "http://localhost:5000",
      },
    },
  },
})
