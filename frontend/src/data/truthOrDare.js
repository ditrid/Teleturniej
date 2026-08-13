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
