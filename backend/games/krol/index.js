// Gra: Król Imprezy — wyzwania na turę + grupowe głosowanie.
const { wyzwaniaKrola } = require("../../wyzwaniaKrola");
const { makePromptGame } = require("../base");

module.exports = makePromptGame({
  id: "krol",
  name: "Król Imprezy",
  emoji: "👑",
  description: "Wyzwania, które udowodnią, że to Ty rządzisz na imprezie.",
  promptType: "krol",
  promptPool: wyzwaniaKrola,
  defaults: { roundsTotal: 2 },
});
