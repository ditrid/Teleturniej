import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import CategoryCard from "../components/CategoryCard";
import GameCard from "../components/GameCard";
import Leaderboard from "../components/Leaderboard";
import InviteBanner from "../components/InviteBanner";
import UserProfile from "../components/UserProfile";
import TeamPanel from "../components/TeamPanel";
import { categories, games } from "../data/games";
import { leaderboard, currentUser } from "../data/leaderboard";

export default function Home() {
  const featured = games.filter((g) => g.popular).slice(0, 5);

  return (
    <>
      {/* HERO pełna szerokość + SIDEBAR nachodzący na tło */}
      <Hero
        sidebar={
          <>
            {/* Profil użytkownika */}
            <UserProfile user={currentUser} />

            {/* Twoja drużyna */}
            <TeamPanel />

            {/* Zaproś znajomych */}
            <InviteBanner />

            {/* Top imprezowicze */}
            <Leaderboard
              players={leaderboard}
              currentUser={currentUser}
              limit={5}
            />
          </>
        }
      />

      {/* TREŚĆ PONIŻEJ (z miejscem na sidebar po prawej) */}
      <div className="mx-auto max-w-[1400px] pl-10 pr-10 pt-6 lg:pr-[372px]">
        {/* ===== POPULARNE KATEGORIE ===== */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">
              Popularne kategorie
            </h2>
            <Link
              to="/gry"
              className="text-sm font-semibold text-[#FFE500] transition hover:text-yellow-300"
            >
              Zobacz wszystkie &gt;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </section>

        {/* ===== POLECANE GRY ===== */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">
              Polecane gry
            </h2>
            <Link
              to="/gry"
              className="text-sm font-semibold text-[#FFE500] transition hover:text-yellow-300"
            >
              Zobacz wszystkie &gt;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {featured.map((g, i) => (
              <GameCard key={g.id} game={g} index={i} />
            ))}
          </div>
        </section>
      </div>

      {/* Dolny padding */}
      <div className="pb-10" />
    </>
  );
}