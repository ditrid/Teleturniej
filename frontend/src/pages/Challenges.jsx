import SectionHeader from "../components/SectionHeader";
import { challenges, weeklyBonus } from "../data/challenges";

export default function Challenges() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-12 sm:px-6 lg:px-10">
      <SectionHeader
        eyebrow="Wyzwania"
        title="Zadania na dziś"
        subtitle="Wykonuj wyzwania, zdobywaj monety i pokazuj znajomym, kto ma nosa do gry."
      />

      {/* Paczka tygodnia */}
      <div className="relative mt-12 overflow-hidden rounded-3xl border border-gold-400/30 bg-linear-to-br from-night-800 via-night-850 to-night-900 p-7 sm:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold-400/15 blur-[80px]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300">
              🎁 {weeklyBonus.title}
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
              {weeklyBonus.description}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Nagroda:{" "}
              <span className="font-bold text-gold-300">
                🪙 {weeklyBonus.reward}
              </span>
            </p>
          </div>
          <div className="sm:w-64">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>
                {weeklyBonus.progress} / {weeklyBonus.target} pkt
              </span>
              <span className="font-bold text-gold-300">
                {Math.round((weeklyBonus.progress / weeklyBonus.target) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-night-700">
              <div
                className="h-full rounded-full bg-linear-to-r from-gold-400 to-amber-500"
                style={{
                  width: `${(weeklyBonus.progress / weeklyBonus.target) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista wyzwań */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c) => {
          const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
          const done = c.progress >= c.target;
          return (
            <article
              key={c.id}
              className="flex flex-col rounded-3xl border border-white/10 bg-night-800 p-6"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${c.gradient} text-2xl shadow-lg`}
                >
                  {c.icon}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                  ⏳ {c.expiresIn}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                {c.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                {c.description}
              </p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {c.progress} / {c.target} {c.unit}
                  </span>
                  <span className="font-bold text-gold-300">🪙 {c.reward}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-night-700">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${
                      done
                        ? "from-success-400 to-success-500"
                        : "from-gold-400 to-amber-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  disabled={!done}
                  className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold transition active:scale-[0.98] ${
                    done
                      ? "bg-success-400 text-night-950 hover:bg-success-500"
                      : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
                  }`}
                >
                  {done ? "🎁 Odbierz nagrodę" : "W trakcie…"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
