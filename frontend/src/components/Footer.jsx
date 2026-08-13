import { Link } from "react-router-dom";
import { categories } from "../data/games";
import logoUrl from "/images/kwakout_logo_nobackground.png";

const SOCIALS = [
  { label: "Facebook", icon: "📘", href: "#" },
  { label: "Instagram", icon: "📸", href: "#" },
  { label: "TikTok", icon: "🎵", href: "#" },
  { label: "Discord", icon: "💬", href: "#" },
];

const NAV_LINKS = [
  { to: "/", label: "Strona główna" },
  { to: "/gry", label: "Biblioteka gier" },
  { to: "/wyzwania", label: "Wyzwania" },
  { to: "/rankingi", label: "Rankingi" },
  { to: "/sklep", label: "Sklep" },
  { to: "/jak-to-dziala", label: "Jak to działa?" },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-night-900/60">
      <div className="mx-auto max-w-[1400px] px-10 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marka */}
          <div>
            <img src={logoUrl} alt="KwakOut" className="h-8" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Mobilne gry na imprezy — quizy, muzyka, memy i wyzwania. Jeden kod
              PIN i cała ekipa gra razem.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:border-gold-400/40 hover:bg-gold-400/10"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nawigacja */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Nawigacja
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-slate-400 transition hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kategorie */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Kategorie gier
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to="/gry" className="text-slate-400 transition hover:text-gold-300">
                    {c.icon} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Host */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Prowadzisz imprezę?
            </h3>
            <p className="mt-4 text-sm text-slate-400">
              Uruchom grę z poziomu komputera i wyświetl pytania na dużym
              ekranie.
            </p>
            <Link
              to="/host"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-5 py-2.5 text-sm font-bold text-gold-300 transition hover:bg-gold-400/20"
            >
              🎮 Panel prowadzącego
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            KwakOut &copy; {new Date().getFullYear()} — Teleturniej online i gry
            mobilne
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="transition hover:text-gold-300">
              Regulamin
            </a>
            <a href="#" className="transition hover:text-gold-300">
              Polityka prywatności
            </a>
            <a href="#" className="transition hover:text-gold-300">
              Kontakt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
