import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { QuickCodeProvider } from "./context/QuickCodeContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import IntroVideo from "./components/IntroVideo";
import Home from "./pages/Home";
import Join from "./pages/Join";
import Host from "./pages/Host";
import Games from "./pages/Games";
import Challenges from "./pages/Challenges";
import Rankings from "./pages/Rankings";
import Shop from "./pages/Shop";
import HowItWorks from "./pages/HowItWorks";
import GameDetail from "./pages/GameDetail";

export default function App() {
  return (
    <>
      <IntroVideo />
      <SocketProvider>
      <QuickCodeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Strony marketingowe / biblioteka — wspólny layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/gry" element={<Games />} />
              <Route path="/gra/:id" element={<GameDetail />} />
              <Route path="/wyzwania" element={<Challenges />} />
              <Route path="/rankingi" element={<Rankings />} />
              <Route path="/sklep" element={<Shop />} />
              <Route path="/jak-to-dziala" element={<HowItWorks />} />
            </Route>

            {/* Strony funkcyjne — pełnoekranowe */}
            <Route path="/join" element={<Join />} />
            <Route path="/host" element={<Host />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QuickCodeProvider>
      </SocketProvider>
    </>
  );
}

