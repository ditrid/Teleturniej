// Rejestr gier — każda gra to osobny moduł (plugin) silnika.
const quiz = require("./quiz");
const prawda = require("./prawda");

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

module.exports = { registerGame, getGameModule, listGames };
