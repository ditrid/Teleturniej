// Gra: Szaleństwo Pytania — szalone pytania na turę + grupowe głosowanie.
const { szalonePytania } = require("../../szalonePytania");
const { makePromptGame } = require("../base");

module.exports = makePromptGame({
  id: "szalenstwo",
  name: "Szaleństwo Pytania",
  emoji: "🍻",
  description: "Szalone pytania, które rozkręcą każdą imprezę!",
  promptType: "szalenstwo",
  promptPool: szalonePytania,
  defaults: { roundsTotal: 2 },
});
