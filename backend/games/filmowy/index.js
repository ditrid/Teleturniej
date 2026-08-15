// Gra: Filmowy Kwak — filmowe prompty na turę + grupowe głosowanie (dla par i grupy).
const { filmPrompts } = require("../../filmPrompts");
const { makePromptGame } = require("../base");

module.exports = makePromptGame({
  id: "filmowy",
  name: "Filmowy Kwak",
  emoji: "🎬",
  description: "Kadry, cytaty i scenariusze filmowe. Zagraj to!",
  promptType: "filmowy",
  promptPool: filmPrompts,
  defaults: { roundsTotal: 2 },
});
