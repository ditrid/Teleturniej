// Gra: Melodia czy Fałsz (wersja tekstowa) — zgadnij utwór/wykonawcę po fragmencie tekstu.
// Wszyscy gracze odpowiadają jednocześnie (jak Szybki Quiz).
const { melodiaPytania } = require("../../melodiaPytania");
const { makeQuizGame } = require("../base");

module.exports = makeQuizGame({
  id: "melodia",
  name: "Melodia czy Fałsz",
  emoji: "🎧",
  description: "Sekunda intro i zgadujesz utwór — teraz po fragmencie tekstu.",
  questionPool: melodiaPytania,
  defaults: { mainRoundQuestions: 8 },
});
