import { useRef, useState } from "react";

/**
 * Reużywalny odtwarzacz wideo.
 *
 * variant="fullscreen" — pełnoekranowa nakładka (intro / koniec), z opcjonalnym
 *   przyciskiem „Pomiń” i przełącznikiem dźwięku.
 * variant="background" — zapętlone, wyciszone wideo w tle (loading), bez kontroli.
 */
export default function VideoOverlay({
  src,
  onEnded,
  variant = "fullscreen",
  muted = true,
  loop = false,
  allowSkip = true,
  showSoundToggle = false,
  skipLabel = "Pomiń",
  dim = false,
}) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(muted);

  const finish = () => {
    if (onEnded) onEnded();
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    const v = videoRef.current;
    if (v) {
      v.muted = next;
      // Po włączeniu dźwięku upewniamy się, że odtwarzanie dalej trwa
      // (przeglądarki wymagają gestu użytkownika dla audio).
      if (!next) v.play().catch(() => {});
    }
  };

  if (variant === "background") {
    return (
      <div className="video-background" aria-hidden="true">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          muted
          loop
          preload="auto"
        />
        {dim && <div className="video-background__dim" />}
      </div>
    );
  }

  return (
    <div className="video-overlay">
      <video
        ref={videoRef}
        className="video-overlay__video"
        src={src}
        autoPlay
        playsInline
        muted={isMuted}
        loop={loop}
        onEnded={finish}
        onError={finish}
      />
      <div className="video-overlay__controls">
        {showSoundToggle && (
          <button type="button" className="video-overlay__btn" onClick={toggleSound}>
            {isMuted ? "🔇 Włącz dźwięk" : "🔊 Wycisz"}
          </button>
        )}
        {allowSkip && (
          <button type="button" className="video-overlay__btn" onClick={finish}>
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  );
}
