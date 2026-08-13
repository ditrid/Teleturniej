// Centralna konfiguracja adresu backendu.
//
// Produkcyjnie (Render) ustaw zmienną środowiskową:
//   VITE_API_URL=https://teleturniej-vbd5.onrender.com
//
// Lokalnie (npm run dev) NIE ustawiaj VITE_API_URL — aplikacja będzie używać
// ścieżek względnych, które Vite (vite.config.js) proxy przekierowuje na
// lokalny backend (http://localhost:5000). Dzięki temu logowanie Google,
// ciasteczka i Socket.IO działają bez problemów z CORS w trybie deweloperskim.
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default API_URL;
