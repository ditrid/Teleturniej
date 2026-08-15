import { useState } from "react";
import VideoOverlay from "./VideoOverlay";
import { INTRO_VIDEO } from "../videos";

// Klucz w sessionStorage — intro odtwarza się raz na sesję (kartę przeglądarki).
const INTRO_KEY = "kwakout-intro-played";

export default function IntroVideo() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_KEY);
    } catch {
      // sessionStorage może być niedostępny (tryb prywatny) — wtedy pokaż intro.
      return true;
    }
  });

  if (!visible) return null;

  const finish = () => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // ignoruj błąd zapisu
    }
    setVisible(false);
  };

  return (
    <VideoOverlay
      src={INTRO_VIDEO}
      onEnded={finish}
      muted={false}
      showSoundToggle
      skipLabel="Pomiń intro"
    />
  );
}
