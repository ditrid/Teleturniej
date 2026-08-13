import { useNavigate, useParams, Link } from "react-router-dom";
import { games } from "../data/games";

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = games.find((g) => String(g.id) === String(id));

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/gry");
    }
  };

  if (!game) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 pb-16 pt-24 text-center">
        <p className="text-6xl">🦆</p>
        <h1 className="mt-6 font-display text-2xl font-bold text-white">
          Nie znaleziono gry
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Ta gra mogła zostać usunięta lub link jest nieprawidłowy.
        </p>
        <Link
          to="/gry"
          className="mt-8 rounded-full bg-gold-400 px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-night-950 transition hover:brightness-110"
        >
          Wróć do biblioteki gier
        </Link>
      </div>
    );
  }

  const gameType = game.gameType || "quiz";

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      {/* Powrót */}
      <button
        onClick={goBack}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <span className="transition group-hover:-translate-x-0.5">←</span> Powrót
      </button>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        {/* Wizual gry */}
        <div
          className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-night-850 animate-rise sm:aspect-[16/10]"
          style={{
            borderColor: game.borderColor ? `${game.borderColor}40` : undefined,
          }}
        >
          {game.image ? (
            <img
              src={game.image}
              alt={game.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.2),transparent_55%)]"
              />
              <span className="relative text-[7rem] drop-shadow-lg animate-float sm:text-[9rem]">
                {game.emoji}
              </span>
            </>
          )}
          {game.badge && (
            <span
              className={`absolute right-4 top-4 rounded-lg ${game.badgeColor} px-3 py-1 text-xs font-bold text-white shadow-md`}
            >
              {game.badge}
            </span>
          )}
        </div>

        {/* Informacje o grze */}
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300">
            {game.categoryIcon} {game.categoryName}
          </span>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight whitespace-pre-line text-white sm:text-4xl">
            {game.title}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            {game.description}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile icon="👥" label="Gracze" value={game.players} />
            <InfoTile icon="🎯" label="Trudność" value={game.difficulty} />
            <InfoTile icon="⭐" label="Ocena" value={game.rating} />
            <InfoTile icon="▶️" label="Rozgrywki" value={game.plays} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/host?game=${gameType}`)}
              className="rounded-full bg-gold-400 px-8 py-3.5 font-display text-base font-bold text-night-950 shadow-[0_8px_30px_-8px_rgba(255,212,0,0.5)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              ▶ Zacznij grę
            </button>
            <button
              onClick={goBack}
              className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 font-display text-base font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/10"
            >
              Powrót
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-night-850 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 font-display text-base font-bold text-white">
        {value}
      </p>
    </div>
  );
}
