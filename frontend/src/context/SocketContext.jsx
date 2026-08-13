import { createContext, useContext } from "react";
import { io } from "socket.io-client";

// Socket created ONCE at module level – available immediately
const socket = io(); // Auto-connects to the current origin (works with ngrok/localhost/any host)
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