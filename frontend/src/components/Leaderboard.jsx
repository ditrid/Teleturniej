import { Link } from "react-router-dom";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ players, currentUser, limit, className = "" }) {
  const list = limit ? players.slice(0, limit) : players;

  return (
    <div className={`rounded-[18px] border border-white/10 bg-night-850 p-5 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-white">Top imprezowicze</h3>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 cursor-pointer hover:text-white transition">
          Tygodniowy
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {/* Lista */}
      <ol className="space-y-1">
        {list.map((p, i) => {
          const isMe = currentUser && p.id === currentUser.id;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-white/5 ${
                isMe ? "bg-[#FFE500]/5 border border-[#FFE500]/20" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center font-display text-sm font-bold text-slate-500">
                {MEDALS[i] || i + 1}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night-700 text-sm">
                {p.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <span className="truncate">{p.name}</span>
                  {i === 0 && <span className="text-sm">🏆</span>}
                </p>
              </div>
              <span className="font-display text-sm font-bold text-[#FFE500] shrink-0">
                {p.score.toLocaleString("pl-PL")}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Przycisk rankingu */}
      <Link
        to="/rankingi"
        className="mt-4 flex h-[48px] w-full items-center justify-center rounded-xl bg-[#FFE500] font-display text-sm font-bold text-black transition hover:bg-yellow-300 active:scale-[0.98]"
      >
        ZOBACZ RANKING
      </Link>
    </div>
  );
}
