// Gra: Karaoke Challenge (wersja "zaśpiewaj") — gracz śpiewa, grupa ocenia.
const { karaokeSongs } = require("../../karaokeSongs");
const { makePromptGame } = require("../base");

module.exports = makePromptGame({
  id: "karaoke",
  name: "Karaoke Challenge",
  emoji: "🎤",
  description: "Zaśpiewaj hit z pamięci. Publiczność głosuje!",
  promptType: "karaoke",
  promptPool: karaokeSongs,
  defaults: { roundsTotal: 2 },
});
