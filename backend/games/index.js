// Rejestr gier — każda gra to osobny moduł (plugin) silnika.
const quiz = require("./quiz");
const prawda = require("./prawda");
const quizRapid = require("./quiz-rapid");
const nigdy = require("./nigdy");
const ktoBardziej = require("./kto-bardziej");
const memy = require("./memy");
const milionerzy = require("./milionerzy");
const szalenstwo = require("./szalenstwo");
const krol = require("./krol");
const filmowy = require("./filmowy");

const registry = {};

function registerGame(mod) {
  registry[mod.id] = mod;
}

function getGameModule(gameType) {
  return registry[gameType] || null;
}

// Metadane gier — przydatne dla frontendu (katalog gier, REST).
function listGames() {
  return Object.values(registry).map((mod) => ({
    id: mod.id,
    name: mod.name,
    emoji: mod.emoji,
    description: mod.description,
    maxPlayers: mod.maxPlayers,
    defaults: mod.defaults,
  }));
}

registerGame(quiz);
registerGame(prawda);
registerGame(quizRapid);
registerGame(nigdy);
registerGame(ktoBardziej);
registerGame(memy);
registerGame(milionerzy);
registerGame(szalenstwo);
registerGame(krol);
registerGame(filmowy);

module.exports = { registerGame, getGameModule, listGames };
