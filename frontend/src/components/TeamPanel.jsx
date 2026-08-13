import { teamMembers } from "../data/leaderboard";

export default function TeamPanel() {
  return (
    <div className="rounded-[18px] border border-white/10 bg-night-850 p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-white">Twoja drużyna</h3>
        <button className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg text-slate-400 transition hover:text-white hover:border-white/20">
          +
        </button>
      </div>

      {/* Team members */}
      <div className="space-y-1">
        {teamMembers.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl bg-night-900/80 px-3 py-2.5 border border-white/5 transition hover:border-white/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night-700 text-sm">
              {m.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{m.name}</p>
            </div>
            <span className="text-xs text-slate-500">Poziom {m.level}</span>
            <span className={`h-2 w-2 rounded-full ${m.online ? "bg-green-400" : "bg-slate-600"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
