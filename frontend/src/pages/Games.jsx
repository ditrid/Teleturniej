import { useMemo, useState } from "react";
import GameCard from "../components/GameCard";
import SectionHeader from "../components/SectionHeader";
import { categories, games } from "../data/games";

export default function Games() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((g) => {
      const matchCat = category === "all" || g.categoryId === category;
      const matchQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.categoryName.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-12 sm:px-6 lg:px-10">
      <SectionHeader
        eyebrow="Biblioteka gier"
        title="Wybierz grę i graj"
        subtitle="Zbierz znajomych, wpisz kod i rozpocznij zabawę."
      />

      {/* Wyszukiwarka + filtry */}
      <div className="mt-10">
        <div className="relative mx-auto max-w-xl">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj gry po nazwie, opisie lub kategorii…"
            className="w-full rounded-full border border-white/10 bg-night-800 py-4 pl-12 pr-5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-gold-400/50"
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            Wszystkie
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.icon} {c.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Wyniki */}
      {filtered.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g, i) => (
            <GameCard key={g.id} game={g} index={i} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-5xl">🦆</p>
          <h3 className="mt-4 font-display text-xl font-bold text-white">
            Nic nie znaleziono
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Spróbuj zmienić frazę lub kategorię.
          </p>
        </div>
      )}

      <p className="mt-10 text-center text-sm text-slate-500">
        Pokazano {filtered.length} z {games.length} gier
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-gold-400 bg-gold-400 text-night-950"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}
