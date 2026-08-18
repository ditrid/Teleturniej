// Gra: Szaleństwo pytań — szalone pytania na turę + grupowe głosowanie.
const { szalonePytania } = require("../../szalonePytania");
const { makePromptGame } = require("../base");

// Skala oceny odpowiedzi — od nudy po totalny hit (1–5 pkt).
const VOTE_OPTIONS = {
  nuda: { key: "nuda", emoji: "😴", label: "Nuda", points: 1, desc: "Zbyt grzecznie, poprawnie i bez polotu.", reaction: "cisza" },
  suchar: { key: "suchar", emoji: "🙂", label: "Suchar", points: 2, desc: "Przeciętny żart, bezpieczna klasyka.", reaction: "uśmiech z grzeczności" },
  spryt: { key: "spryt", emoji: "🧠", label: "Spryt", points: 3, desc: "Inteligentna, błyskotliwa riposta.", reaction: "głośny śmiech" },
  bezczelnosc: { key: "bezczelnosc", emoji: "😈", label: "Bezczelność", points: 4, desc: "Ostry tekst po bandzie, brak wstydu.", reaction: "„Ooo, grubo!”" },
  wyrok: { key: "wyrok", emoji: "💀", label: "Wyrok", points: 5, desc: "Totalny hit, przekroczenie wszelkich granic.", reaction: "płacz ze śmiechu" },
};

module.exports = makePromptGame({
  id: "szalenstwo",
  name: "Szaleństwo pytań",
  emoji: "🍻",
  description: "Szalone pytania, które rozkręcą każdą imprezę!",
  promptType: "szalenstwo",
  promptPool: szalonePytania,
  levels: ["lagodne", "ostre"],
  defaultLevel: "lagodne",
  voteOptions: VOTE_OPTIONS,
  defaults: { roundsTotal: 2 },
});
