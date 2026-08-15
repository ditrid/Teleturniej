import { useNavigate } from "react-router-dom";

export default function GameCard({ game, index = 0, variant = "featured" }) {
  const navigate = useNavigate();

  const open = () => navigate(`/gra/${game.id}`);

  // Karty z obrazkiem — kompaktowe (katalog gier na /gry)
  if (game.image && variant === "grid") {
    return (
      <article
        onClick={open}
        className="group flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-night-850 p-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-8px_rgba(255,229,0,0.15)] animate-rise"
        style={{
          animationDelay: `${Math.min(index * 60, 420)}ms`,
          borderColor: game.borderColor ? `${game.borderColor}40` : undefined,
        }}
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-night-800">
          <img
            src={game.image}
            alt={game.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {game.badge && (
            <span
              className={`absolute right-1 top-1 rounded-md ${game.badgeColor} px-1.5 py-0.5 text-[10px] font-bold text-white shadow`}
            >
              {game.badge}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gold-300">
            {game.categoryIcon} {game.categoryName}
          </span>
          <h3 className="mt-1 font-display text-base font-extrabold leading-tight text-white whitespace-pre-line">
            {game.title}
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">{game.players}</p>
        </div>
      </article>
    );
  }

  // Karty z obrazkiem (Polecane gry na stronie głównej)
  if (game.image) {
    return (
      <article
        onClick={open}
        className="group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-end overflow-hidden rounded-2xl border border-white/10 bg-night-850 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-8px_rgba(255,229,0,0.15)] animate-rise"
        style={{
          animationDelay: `${Math.min(index * 60, 420)}ms`,
          borderColor: game.borderColor ? `${game.borderColor}40` : undefined,
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

  // Karty bez obrazka (katalog gier na /gry)
  return (
    <article
      onClick={open}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-8px_rgba(255,229,0,0.15)] cursor-pointer animate-rise"
      style={{
        animationDelay: `${Math.min(index * 60, 420)}ms`,
        minHeight: "205px",
        borderColor: game.borderColor ? `${game.borderColor}40` : undefined,
      }}
    >
      <div
        className={`relative flex h-[110px] items-center justify-center overflow-hidden bg-gradient-to-br ${game.gradient}`}
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