import { createContext, useContext } from "react";
import { io } from "socket.io-client";
import API_URL from "../config";

// Socket created ONCE at module level – available immediately.
// Lokalnie łączy się z tym samym originem (proxy Vite → localhost:5000),
// produkcyjnie z adresem backendu (VITE_API_URL, HTTPS → WSS).
const socket = io(API_URL || undefined);
console.log("[SocketContext] Socket created, id:", socket.id || "(pending connection)");

const SocketContext = createContext(socket);

export function SocketProvider({ children }) {
  // Pass the same socket instance to all children – no useState/useEffect needed
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}