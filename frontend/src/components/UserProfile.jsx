export default function UserProfile({ user }) {
  const xpPct = Math.min(100, Math.round((user.xp / user.xpMax) * 100));

  return (
    <div className="rounded-[18px] border border-[#FFE500]/30 bg-gradient-to-b from-night-850 to-night-900 p-5">
      {/* Górna część — avatar + nazwa */}
      <div className="flex items-center gap-4">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE500] to-amber-500 text-2xl shadow-lg">
          {user.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold text-white">
            {user.name}
          </h3>
          <p className="text-sm text-[#FFE500] font-semibold">Poziom {user.level}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-bold text-white">{user.xp} / {user.xpMax}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-night-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFE500] to-amber-500 transition-all"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* Statystyki */}
      <div className="mt-5 flex items-center justify-between text-center">
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white">{user.gamesPlayed}</div>
          <div className="mt-0.5 text-[10px] text-slate-500">Rozgrane<br/>gry</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white">{user.challenges}</div>
          <div className="mt-0.5 text-[10px] text-slate-500">Wyzwania</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-white">{user.wins}</div>
          <div className="mt-0.5 text-[10px] text-slate-500">Wygrane</div>
        </div>
      </div>

      {/* Losowa gra CTA */}
      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 py-3.5 font-display text-sm font-bold text-white shadow-[0_6px_20px_-4px_rgba(139,92,246,0.5)] transition hover:from-purple-500 hover:to-violet-600 active:scale-[0.98]">
        🎲 LOSOWA GRA
      </button>
    </div>
  );
}
