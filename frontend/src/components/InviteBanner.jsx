import { Link } from "react-router-dom";

export default function InviteBanner() {
  return (
    <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 p-5" style={{ minHeight: "125px" }}>
      <div aria-hidden className="absolute -right-6 -top-6 text-6xl opacity-30">
        🎁
      </div>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-extrabold leading-tight text-white">
            ZAPROŚ ZNAJOMYCH
          </p>
          <p className="mt-1 font-display text-sm font-extrabold leading-tight text-[#FFE500]">
            I ZGARNIJ BONUSY!
          </p>
          <Link
            to="/host"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FFE500] px-5 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-300 active:scale-[0.98]"
          >
            ZAPROŚ
          </Link>
        </div>
        <span className="text-5xl drop-shadow-lg">🎁</span>
      </div>
    </div>
  );
}
