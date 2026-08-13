import { Link } from "react-router-dom";
import duckUrl from "/images/sam_kaczor.png";
import wallBackgroundUrl from "/images/wall_background.png";

const PARTY_ELEMENTS = [
  { emoji: "🔴", className: "left-[8%] top-[15%] text-sm animate-drift", delay: "0s" },
  { emoji: "🟡", className: "left-[25%] top-[8%] text-xs animate-confetti", delay: "0.5s" },
  { emoji: "🔵", className: "left-[45%] top-[20%] text-sm animate-drift", delay: "1.2s" },
  { emoji: "🟢", className: "right-[35%] top-[10%] text-xs animate-confetti", delay: "0.3s" },
  { emoji: "🟣", className: "right-[20%] top-[25%] text-sm animate-drift", delay: "0.8s" },
  { emoji: "🔴", className: "left-[15%] bottom-[30%] text-xs animate-confetti", delay: "1.5s" },
  { emoji: "🎊", className: "right-[10%] top-[12%] text-xl animate-float", delay: "0s" },
  { emoji: "🎉", className: "right-[28%] bottom-[25%] text-xl animate-float-slow", delay: "0.6s" },
  { emoji: "🎈", className: "left-[5%] top-[50%] text-lg animate-drift", delay: "1s" },
  { emoji: "✨", className: "left-[35%] bottom-[20%] text-lg animate-float", delay: "0.4s" },
  { emoji: "❓", className: "right-[42%] top-[35%] text-2xl animate-bounce-gentle", delay: "0.7s" },
  { emoji: "🎲", className: "left-[50%] bottom-[15%] text-xl animate-float-slow", delay: "1.1s" },
  { emoji: "🍺", className: "right-[15%] bottom-[35%] text-2xl animate-drift", delay: "0.2s" },
  { emoji: "🔺", className: "left-[30%] top-[55%] text-sm animate-bounce-gentle", delay: "1.3s" },
  { emoji: "🔻", className: "right-[45%] bottom-[40%] text-sm animate-bounce-gentle", delay: "0.9s" },
  { emoji: "🧃", className: "left-[55%] top-[30%] text-lg animate-drift", delay: "0.5s" },
];

export default function Hero({ sidebar }) {
  return (
    <section
      className="relative"
      style={{
        backgroundImage: `url(${wallBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Tło: party glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute right-0 top-20 h-[350px] w-[350px] rounded-full bg-[#FFE500]/10 blur-[100px]" />
        <div className="absolute left-1/3 bottom-0 h-[300px] w-[300px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] [background-size:24px_24px]" />
        {/* Czerwone kropki */}
        <div className="absolute left-[20%] top-[30%] h-2 w-2 rounded-full bg-red-500/60 blur-[1px]" />
        <div className="absolute left-[60%] top-[15%] h-1.5 w-1.5 rounded-full bg-red-400/50 blur-[1px]" />
        <div className="absolute right-[40%] bottom-[25%] h-2 w-2 rounded-full bg-red-500/50 blur-[1px]" />
        <div className="absolute right-[25%] top-[40%] h-1.5 w-1.5 rounded-full bg-red-400/40 blur-[1px]" />
        <div className="absolute left-[45%] bottom-[10%] h-2 w-2 rounded-full bg-red-500/55 blur-[1px]" />
      </div>

      {/* Party elements floating */}
      {PARTY_ELEMENTS.map((el, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute ${el.className}`}
          style={{ animationDelay: el.delay }}
        >
          {el.emoji}
        </span>
      ))}

      <div className="relative mx-auto max-w-[1400px] px-10 pt-6 lg:pt-0">
        {/* Treść hero: tekst + kaczka (miejsce na sidebar po prawej) */}
        <div
          className="flex min-w-0 flex-col lg:flex-row lg:items-stretch lg:pr-[332px]"
          style={{ minHeight: "370px" }}
        >
          {/* Tekst Hero — lewy panel */}
          <div className="z-10 flex flex-col justify-center pb-10 pt-10 lg:w-[50%] lg:pb-14 lg:pt-14">
            <h1 className="font-display text-[52px] leading-[1.05] font-extrabold tracking-tight sm:text-[58px] lg:text-[60px]">
              <span className="text-white">KAŻDA IMPREZA</span>
              <br />
              <span className="text-[#FFE500]">TO PRZYGODA!</span>
            </h1>

            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/80">
              Gry, wyzwania i mnóstwo śmiechu!
              <br />
              Rozkręć każdą imprezę z KWAKOUT!
            </p>

            <div className="mt-7 flex flex-wrap gap-[15px]">
              <Link
                to="/gry"
                className="inline-flex h-[52px] w-[210px] items-center justify-center gap-2 rounded-[12px] bg-[#FFE500] font-display text-sm font-bold uppercase tracking-wide text-black shadow-[0_8px_32px_-8px_rgba(255,229,0,0.5)] transition hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_40px_-8px_rgba(255,229,0,0.7)] active:scale-[0.98]"
              >
                ▶ ROZKRĘĆ IMPREZĘ
              </Link>
              <Link
                to="/gry"
                className="inline-flex h-[52px] w-[145px] items-center justify-center rounded-[12px] border-2 border-white/30 bg-transparent font-display text-sm font-bold uppercase tracking-wide text-white transition hover:border-white/50 hover:bg-white/5 active:scale-[0.98]"
              >
                ZOBACZ GRY
              </Link>
            </div>
          </div>

          {/* KACZKA — prawy panel */}
          <div className="relative z-10 flex w-full items-end justify-center lg:w-[50%]">
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFE500]/20 blur-[80px] animate-glow-pulse sm:h-80 sm:w-80"
            />
            <img
              src={duckUrl}
              alt="Kaczka Kwakout"
              className="relative w-full max-w-[600px] object-contain object-bottom animate-float drop-shadow-[0_30px_50px_rgba(255,229,0,0.35)] sm:max-w-[760px] lg:h-full lg:max-w-none lg:w-full"
            />
          </div>
        </div>

        {/* SIDEBAR — nachodzi na tło po prawej */}
        <aside className="flex w-full flex-col gap-3 lg:absolute lg:right-10 lg:top-8 lg:w-[300px]">
          {sidebar}
        </aside>
      </div>
    </section>
  );
}