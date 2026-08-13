import { useState } from "react";
import SectionHeader from "../components/SectionHeader";
import TeamPanel from "../components/TeamPanel";

const STEPS = [
  {
    icon: "🖥️",
    title: "1. Prowadzący uruchamia grę",
    text: "Na komputerze otwiera panel prowadzącego i dostaje 6-cyfrowy kod PIN oraz QR kod do szybkiego dołączenia.",
  },
  {
    icon: "📱",
    title: "2. Gracze dołączają telefonami",
    text: "Wystarczy otworzyć KwakOut na smartfonie i wpisać kod albo zeskanować QR. Nie trzeba zakładać konta.",
  },
  {
    icon: "🏆",
    title: "3. Gra i wyniki na żywo",
    text: "Pytania wyświetlają się na dużym ekranie, a gracze odpowiadają na swoich telefonach. Ranking zmienia się na żywo.",
  },
];

const FAQ = [
  {
    q: "Ile osób może grać jednocześnie?",
    a: "W jednej grze może uczestniczyć do 8 graczy. To idealna liczba na domówki i spotkania ze znajomymi.",
  },
  {
    q: "Czy potrzebuję konta lub instalacji?",
    a: "Nie. Wszystko działa w przeglądarce — prowadzący na komputerze, gracze na telefonach. Zero rejestracji.",
  },
  {
    q: "Jak wygląda rozgrywka?",
    a: "Prowadzący wyświetla pytania na dużym ekranie, a gracze odpowiadają na swoich telefonach. Za poprawne odpowiedzi zdobywa się punkty, a gracze z najmniejszą liczbą punktów odpadają.",
  },
  {
    q: "Czy mogę grać w wyzwania solo?",
    a: "Tak! Wyzwania i quizy treningowe można przechodzić samodzielnie, aby zdobywać monety i wspinać się w rankingu.",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-12 sm:px-6 lg:px-10">
      <SectionHeader
        eyebrow="Jak to działa?"
        title="Proste zasady, maksimum zabawy"
        subtitle="KwakOut łączy prowadzącego na komputerze z graczami na smartfonach. Oto cała magia w trzech krokach."
      />

      {/* Kroki */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.title}
            className="rounded-3xl border border-white/10 bg-night-800 p-7 transition hover:border-white/20"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-gold-400/20 to-amber-600/10 text-3xl">
              {s.icon}
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-white">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {s.text}
            </p>
          </div>
        ))}
      </div>

      {/* Zaproś ekipę */}
      <div className="mt-16">
        <TeamPanel />
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h3 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">
          Częste pytania
        </h3>
        <div className="mt-8 space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-white/10 bg-night-800"
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-white sm:text-base">
                    {item.q}
                  </span>
                  <span
                    className={`text-gold-400 transition-transform ${isOpen ? "rotate-45" : ""}`}
                  >
                    ＋
                  </span>
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
