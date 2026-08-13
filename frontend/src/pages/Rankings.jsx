import { useState } from "react";
import SectionHeader from "../components/SectionHeader";
import Leaderboard from "../components/Leaderboard";
import UserProfile from "../components/UserProfile";
import { leaderboard, currentUser } from "../data/leaderboard";

const TABS = [
  { id: "today", label: "Dzisiaj" },
  { id: "week", label: "Tydzień" },
  { id: "all", label: "Wszech czasów" },
];

export default function Rankings() {
  const [tab, setTab] = useState("week");

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-12 sm:px-6 lg:px-10">
      <SectionHeader
        eyebrow="Rankingi"
        title="Kto rządzi imprezą?"
        subtitle="Śledź swoją pozycję i wskakuj wyżej, zanim skończy się tydzień."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UserProfile user={currentUser} />
          <div className="mt-6 rounded-3xl border border-white/10 bg-night-800 p-6">
            <h3 className="font-display text-lg font-bold text-white">
              🪙 Twój portfel
            </h3>
            <p className="mt-2 font-display text-3xl font-bold text-gold-400">
              {currentUser.coins.toLocaleString("pl-PL")}{" "}
              <span className="text-lg font-sans">monet</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Zdobądź więcej w sklepie i wyzwaniach.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  tab === t.id
                    ? "border-gold-400 bg-gold-400 text-night-950"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <Leaderboard
              players={leaderboard}
              currentUser={currentUser}
            />
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Ranking aktualizuje się na żywo podczas gry.
          </p>
        </div>
      </div>
    </div>
  );
}
