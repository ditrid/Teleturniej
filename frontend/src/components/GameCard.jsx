import { useNavigate } from "react-router-dom";

// Wzory okładek „pudełka gry" — generowane CSS-em na bazie koloru akcentu.
const PATTERNS = {
  rays: (c) => ({
    backgroundImage: `repeating-conic-gradient(from 0deg at 50% 120%, ${c}1f 0deg 10deg, transparent 10deg 20deg)`,
  }),
  dots: (c) => ({
    backgroundImage: `radial-gradient(${c}38 1.5px, transparent 1.5px)`,
    backgroundSize: "16px 16px",
  }),
  grid: (c) => ({
    backgroundImage: `linear-gradient(${c}1f 1px, transparent 1px), linear-gradient(90deg, ${c}1f 1px, transparent 1px)`,
    backgroundSize: "24px 24px",
  }),
  waves: (c) => ({
    backgroundImage: `repeating-radial-gradient(circle at 20% 30%, ${c}2b 0 2px, transparent 2px 20px)`,
  }),
  confetti: (c) => ({
    backgroundImage: `radial-gradient(${c}40 2px, transparent 2px), radial-gradient(${c}33 3px, transparent 3px), radial-gradient(${c}2b 1.5px, transparent 1.5px)`,
    backgroundSize: "26px 34px, 34px 26px, 18px 18px",
    backgroundPosition: "0 0, 13px 17px, 0 0",
  }),
};

export default function GameCard({ game, index = 0, variant = "featured" }) {
  const navigate = useNavigate();

  const open = () => navigate(`/gra/${game.id}`);
  const accent = game.theme?.accent;

  // Karta-pudełko — biblioteka gier na /gry
  if (variant === "grid") {
    return <GameBox game={game} index={index} onOpen={open} />;
  }

  // Karty z obrazkiem (Polecane gry na stronie głównej)
  if (game.image) {
    return (
      <article
        onClick={open}
        className="group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-end overflow-hidden rounded-2xl border border-white/10 bg-night-850 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-8px_rgba(255,229,0,0.15)] animate-rise"
        style={{
          animationDelay: `${Math.min(index * 60, 420)}ms`,
          borderColor: accent ? `${accent}40` : undefined,
        }}
      >
        <img
          src={game.image}
          alt={game.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="relative mb-3 rounded-full bg-black/60 px-3 py-1 font-roboto text-xs font-normal leading-none text-white">
          {game.players}
        </span>
      </article>
    );
  }

  // Karty bez obrazka (polecane gry na stronie głównej)
  return (
    <article
      onClick={open}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-8px_rgba(255,229,0,0.15)] cursor-pointer animate-rise"
      style={{
        animationDelay: `${Math.min(index * 60, 420)}ms`,
        minHeight: "205px",
        borderColor: accent ? `${accent}40` : undefined,
      }}
    >
      <div
        className={`relative flex h-[110px] items-center justify-center overflow-hidden bg-gradient-to-br ${game.theme?.gradient || "from-slate-700 to-slate-900"}`}
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
        <span className="relative text-5xl drop-shadow-lg transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
          {game.emoji}
        </span>
        {game.badge && (
          <span className={`absolute right-3 top-3 rounded-lg ${game.badgeColor} px-2.5 py-1 text-[11px] font-bold text-white shadow-md`}>
            {game.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <h3 className="font-display text-base font-extrabold leading-tight text-white whitespace-pre-line">
          {game.title}
        </h3>
        <p className="mt-1 text-[11px] text-slate-500">
          {game.players}
        </p>
      </div>
    </article>
  );
}

function GameBox({ game, index, onOpen }) {
  const t = game.theme || {};
  const accent = t.accent || "#ffd400";
  const pattern = (PATTERNS[t.pattern] || PATTERNS.dots)(accent);

  return (
    <article
      onClick={onOpen}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-night-850 text-left transition-all duration-300 hover:-translate-y-1.5 animate-rise"
      style={{
        animationDelay: `${Math.min(index * 60, 420)}ms`,
        border: `1px solid ${accent}40`,
        boxShadow: "0 18px 40px -26px rgba(0,0,0,0.9)",
      }}
    >
      {/* Okładka */}
      <div
        className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-48 ${t.gradient || "from-slate-700 to-slate-900"}`}
      >
        <div aria-hidden className="absolute inset-0" style={pattern} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 72% 18%, ${accent}33, transparent 55%)` }}
        />
        {game.image ? (
          <img
            src={game.image}
            alt={game.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="relative text-6xl drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] transition duration-500 group-hover:-translate-y-1 group-hover:scale-110">
            {game.emoji}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-12">
          <h3 className="font-display text-lg font-extrabold leading-tight whitespace-pre-line text-white drop-shadow">
            {game.title}
          </h3>
          {t.tagline && (
            <p className="mt-0.5 text-[11px] font-medium text-white/70">{t.tagline}</p>
          )}
        </div>
        {game.badge && (
          <span className={`absolute right-3 top-3 rounded-md ${game.badgeColor} px-2 py-0.5 text-[10px] font-bold text-white shadow-md`}>
            {game.badge}
          </span>
        )}
        {/* CTA na hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          <span className="scale-75 rounded-full bg-gold-400 px-5 py-2 font-display text-sm font-bold text-night-950 shadow-lg transition duration-300 group-hover:scale-100">
            ▶ Graj
          </span>
        </div>
      </div>

      {/* Pasek informacyjny */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <span
          className="truncate text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: accent }}
        >
          {game.categoryIcon} {game.categoryName}
        </span>
        <span className="shrink-0 text-[11px] font-medium text-slate-400">
          {game.players} · {game.difficulty}
        </span>
      </div>
    </article>
  );
}