// KWAKOUT — konfiguracja UI gry "Prawda czy Wyzwanie"

export const LEVELS = [
  { id: "grzeczne", label: "Grzeczne", emoji: "🟢" },
  { id: "ostre", label: "Ostre", emoji: "🔥" },
  { id: "dla-par", label: "Dla par", emoji: "❤️" },
  { id: "alkoholowe", label: "+18", emoji: "🍾" },
];

export const ROUND_OPTIONS = [1, 2, 3, 4, 5];

export const VOTE_OPTIONS = [
  { key: "mistrzowskie", emoji: "🔥", label: "Mistrzowskie", points: 15 },
  { key: "wykonane", emoji: "✅", label: "Wykonane", points: 10 },
  { key: "ledwo", emoji: "😬", label: "Ledwo", points: 5 },
  { key: "nie", emoji: "❌", label: "Nie wykonane", points: 0 },
];

export function voteOptionByKey(key) {
  return VOTE_OPTIONS.find((o) => o.key === key) || null;
}


// Skala oceny odpowiedzi gry "Szaleństwo pytań" (1–5 pkt).
export const SZALENSTWO_VOTE_OPTIONS = [
  { key: "nuda", emoji: "😴", label: "Nuda", points: 1, desc: "Zbyt grzecznie, poprawnie i bez polotu.", reaction: "cisza" },
  { key: "suchar", emoji: "🙂", label: "Suchar", points: 2, desc: "Przeciętny żart, bezpieczna klasyka.", reaction: "uśmiech z grzeczności" },
  { key: "spryt", emoji: "🧠", label: "Spryt", points: 3, desc: "Inteligentna, błyskotliwa riposta.", reaction: "głośny śmiech" },
  { key: "bezczelnosc", emoji: "😈", label: "Bezczelność", points: 4, desc: "Ostry tekst po bandzie, brak wstydu.", reaction: "„Ooo, grubo!”" },
  { key: "wyrok", emoji: "💀", label: "Wyrok", points: 5, desc: "Totalny hit, przekroczenie wszelkich granic.", reaction: "płacz ze śmiechu" },
];

// Poziomy pytań gry "Szaleństwo pytań".
export const SZALENSTWO_LEVELS = [
  { id: "lagodne", label: "Łagodne", emoji: "🟢" },
  { id: "ostre", label: "Ostre 18+", emoji: "🔞" },
];

// Opcje oceny zależne od gry (szaleństwo ma własną skalę 1–5).
export function getVoteOptions(gameType) {
  return gameType === "szalenstwo" ? SZALENSTWO_VOTE_OPTIONS : VOTE_OPTIONS;
}
