import { useState } from "react";
import SectionHeader from "../components/SectionHeader";
import { coinPacks, cosmetics, typeLabels } from "../data/shop";
import { currentUser } from "../data/leaderboard";

const TYPES = ["awatar", "tło", "naklejka", "tytuł"];

export default function Shop() {
  const [balance] = useState(currentUser.coins);
  const [cart, setCart] = useState([]);

  const addToCart = (id) =>
    setCart((prev) => (prev.includes(id) ? prev : [...prev, id]));

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-12 sm:px-6 lg:px-10">
      <SectionHeader
        eyebrow="Sklep"
        title="Zdobądź styl, królu imprezy"
        subtitle="Wymieniaj monety na awatary, tła, naklejki i tytuły."
      />

      {/* Saldo */}
      <div className="mt-10 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-6 py-3 font-display text-lg font-bold text-gold-300">
          🪙 {balance.toLocaleString("pl-PL")} monet
        </span>
      </div>

      {/* Paczki monet */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {coinPacks.map((p) => (
          <article
            key={p.id}
            className={`relative flex flex-col rounded-3xl border p-6 ${
              p.popular
                ? "border-gold-400/50 bg-linear-to-b from-night-800 to-gold-400/10"
                : "border-white/10 bg-night-800"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-night-950">
                Bestseller
              </span>
            )}
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${p.gradient} text-2xl shadow-lg`}
            >
              {p.icon}
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-white">
              {p.name}
            </h3>
            <p className="mt-1 font-display text-3xl font-bold text-gold-400">
              {p.coins.toLocaleString("pl-PL")}{" "}
              <span className="text-sm font-sans font-normal text-slate-400">
                monet
              </span>
            </p>
            {p.bonus > 0 && (
              <p className="mt-1 text-xs font-semibold text-success-400">
                +{p.bonus} bonus!
              </p>
            )}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-lg font-bold text-white">{p.price}</span>
              <button
                onClick={() => addToCart(p.id)}
                className="rounded-full bg-gold-400 px-5 py-2.5 text-sm font-bold text-night-950 transition hover:bg-gold-300 active:scale-95"
              >
                Kup
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Kosmetyki */}
      {TYPES.map((type) => (
        <section key={type} className="mt-14">
          <h3 className="font-display text-2xl font-bold text-white">
            {typeLabels[type]}
          </h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cosmetics
              .filter((c) => c.type === type)
              .map((c) => {
                const inCart = cart.includes(c.id);
                const affordable = c.price <= balance;
                return (
                  <article
                    key={c.id}
                    className="flex flex-col items-center rounded-3xl border border-white/10 bg-night-800 p-5 text-center transition hover:border-gold-400/30"
                  >
                    <span
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${c.gradient} text-3xl shadow-lg`}
                    >
                      {c.icon}
                    </span>
                    <h4 className="mt-4 font-display text-sm font-bold text-white">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {typeLabels[type].slice(0, -1)}
                    </p>
                    <button
                      onClick={() => addToCart(c.id)}
                      disabled={!affordable || inCart}
                      className={`mt-4 w-full rounded-full py-2.5 text-sm font-bold transition active:scale-95 ${btnClass(inCart, affordable)}`}
                    >
                      {inCart
                        ? "✓ W koszyku"
                        : `🪙 ${c.price.toLocaleString("pl-PL")}`}
                    </button>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function btnClass(inCart, affordable) {
  if (inCart) return "cursor-default bg-success-400/20 text-success-400";
  if (affordable) return "bg-gold-400/15 text-gold-300 hover:bg-gold-400/25";
  return "cursor-not-allowed bg-white/5 text-slate-500";
}
