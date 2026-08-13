import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoUrl from "/images/kwakout_logo_napis.png";

const NAV_LINKS = [
  { to: "/", label: "Strona główna" },
  { to: "/gry", label: "Gry" },
  { to: "/wyzwania", label: "Wyzwania" },
  { to: "/rankingi", label: "Rankingi" },
  { to: "/sklep", label: "Sklep" },
  { to: "/jak-to-dziala", label: "Jak to działa?" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-night-950/85 backdrop-blur-xl">
      {/* Żółta, półprzezroczysta linia na dole — zanika na lewym i prawym końcu */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#FFE500]/50 to-transparent"
      />
      <nav className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between gap-4 px-10">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center" aria-label="KwakOut — strona główna">
          <img src={logoUrl} alt="KwakOut" className="h-[55px] w-auto" />
        </Link>

        {/* Menu desktop */}
        <div className="hidden items-center gap-4 lg:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `relative px-5 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-[#FFE500]" : "text-slate-400 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <span className="inline-flex flex-col items-center">
                  {l.label}
                  {isActive && (
                    <span className="mt-1 h-[3px] w-full rounded-full bg-[#FFE500]" />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Prawa strona */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden items-center gap-1.5 rounded-full border border-[#FFE500]/30 bg-[#FFE500]/10 px-3.5 py-2 text-sm font-bold text-[#FFE500] md:inline-flex">
              🪙 {(user.coins ?? 0).toLocaleString("pl-PL")}
            </span>
          )}

          {/* Profil pill / logowanie */}
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-night-800/80 py-1.5 pl-1.5 pr-3 transition hover:border-white/20 hover:bg-night-700"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE500] to-amber-500 text-lg">
                    {user.avatar}
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block text-xs font-bold leading-tight text-white">
                      {user.name}
                    </span>
                  </span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-slate-400">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-night-850 p-1 shadow-2xl animate-pop">
                    <div className="px-3 py-2">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-[#FFE500]">Poziom {user.level ?? 1}</p>
                    </div>
                    <div className="my-1 h-px bg-white/5" />
                    {[
                      { label: "👤 Mój profil", to: "/rankingi" },
                      { label: "🏆 Rankingi", to: "/rankingi" },
                      { label: "🪙 Sklep", to: "/sklep" },
                      { label: "🎮 Utwórz grę", to: "/host" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => navigate(item.to)}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-white/5" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-red-400"
                    >
                      ↪ Wyloguj się
                    </button>
                  </div>
                )}
              </>
            ) : (
              <a
                href="/auth/google"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-night-800/80 px-4 py-2 text-sm font-bold text-white transition hover:border-white/25 hover:bg-night-700"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
                </svg>
                Zaloguj się
              </a>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="border-t border-white/5 bg-night-950/95 px-4 pb-6 pt-3 backdrop-blur-xl animate-pop lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-semibold transition ${
                    isActive ? "bg-[#FFE500]/10 text-[#FFE500]" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}