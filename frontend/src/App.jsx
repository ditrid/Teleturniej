import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import Home from "./pages/Home";
import Join from "./pages/Join";
import "./styles/theme.css";

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}