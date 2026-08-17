import { Link } from "react-router-dom";
import { getGamesByCategory } from "../data/games";

export default function CategoryCard({ category }) {
  const count = getGamesByCategory(category.id).length;

  return (
    <Link
      to="/gry"
      className="group relative flex aspect-square flex-col items-center justify-end overflow-hidden rounded-2xl bg-black transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[3px]"
      style={{
        border: `1px solid ${category.borderColor}80`,
      }}
    >
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <span className="relative mb-3 rounded-full bg-black/60 px-3 py-1 font-roboto text-xs font-normal leading-none text-white">
        {count} {count === 1 ? "gra" : "gier"}
      </span>
    </Link>
  );
}
