import { useRef, useCallback, useEffect } from "react";

// Syntezuje "lub-dub" bicia serca przez Web Audio API (bez plików dźwiękowych).
// Używany przez grę "Szpieg" w ostatnich sekundach rundy — synchronicznie na
// wszystkich telefonach (każdy klient odtwarza ten sam, lokalny dźwięk).
export default function useHeartbeat() {
  const ctxRef = useRef(null);
  const timerRef = useRef(null);
  const runningRef = useRef(false);

  const ensureCtx = useCallback(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  // Przeglądarki blokują audio bez gestu użytkownika — wznawiamy przy interakcji.
  useEffect(() => {
    const unlock = () => {
      if (ctxRef.current && ctxRef.current.state === "suspended") {
        ctxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchstart", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const beat = useCallback((ctx, time, freq, gainVal) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, time + 0.12);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainVal, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.17);
  }, []);

  const start = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx || runningRef.current) return;
    runningRef.current = true;

    let next = ctx.currentTime + 0.05;
    const loop = () => {
      if (!runningRef.current) return;
      // "lub" (mocniejsze) + "dub" (słabsze)
      beat(ctx, next, 58, 0.85);
      beat(ctx, next + 0.18, 46, 0.65);
      next += 0.9; // ~67 uderzeń na minutę
      timerRef.current = setTimeout(loop, 860);
    };
    loop();
  }, [ensureCtx, beat]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (ctxRef.current) ctxRef.current.close().catch(() => {});
    };
  }, []);

  return { start, stop };
}
