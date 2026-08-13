import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useQuickCode } from "../context/QuickCodeContext";

export default function QuickCodeModal() {
  const { isOpen, close } = useQuickCode();
  const socket = useSocket();
  const navigate = useNavigate();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(value);
    if (error) setError("");
  };

  const handleClose = () => {
    setPin("");
    setError("");
    setJoining(false);
    close();
  };

  const handleJoin = () => {
    if (pin.length !== 6) {
      setError("Kod PIN musi mieć 6 cyfr");
      return;
    }
    if (!socket) {
      setError("Brak połączenia z serwerem. Spróbuj za chwilę.");
      return;
    }
    setJoining(true);
    setError("");

    socket.once("join-success", ({ code }) => {
      handleClose();
      navigate(`/join?code=${code}`);
    });

    socket.once("join-error", ({ message }) => {
      setError(message);
      setJoining(false);
    });

    socket.emit("join-game", { code: pin });

    // Bezpiecznik czasowy
    setTimeout(() => setJoining(false), 5000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Dołącz do gry"
    >
      <button
        aria-label="Zamknij okno"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-night-800 p-7 shadow-2xl animate-pop sm:p-9">
        <div aria-hidden className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold-400/15 blur-[60px]" />

        <button
          onClick={handleClose}
          aria-label="Zamknij"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <span className="text-4xl">🦆</span>
        <h2 className="mt-3 font-display text-2xl font-bold text-white">
          Dołącz do gry
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Poproś prowadzącego o 6-cyfrowy kod PIN i wpisz go poniżej.
        </p>

        <input
          autoFocus
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={pin}
          onChange={handlePinChange}
          onKeyDown={handleKeyDown}
          disabled={joining}
          className={`mt-6 w-full rounded-2xl border bg-night-950 px-4 py-4 text-center font-display text-3xl font-bold tracking-[0.35em] text-gold-400 outline-none transition placeholder:text-slate-700 ${
            error
              ? "border-danger-500/60 focus:border-danger-500"
              : "border-white/10 focus:border-gold-400/60"
          }`}
        />

        {error && (
          <p className="mt-3 text-sm font-semibold text-danger-400">
            ⚠️ {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={joining || pin.length !== 6}
          className="mt-6 w-full rounded-2xl bg-gold-400 py-4 font-display text-sm font-bold uppercase tracking-wide text-night-950 transition hover:bg-gold-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {joining ? "Łączenie…" : "🎮 Dołącz do gry"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Nie masz kodu? Poproś znajomych o zaproszenie.
        </p>
      </div>
    </div>
  );
}

