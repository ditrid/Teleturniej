import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import QuickCodeModal from "./QuickCodeModal";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-night-950">
      <Navbar />
      <main className="flex-1 w-full pt-[74px]">
        <Outlet />
      </main>
      <Footer />
      <QuickCodeModal />
    </div>
  );
}
