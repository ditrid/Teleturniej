// Silnik gier — wspólna warstwa niezależna od konkretnej gry:
// sklep instancji gier (w pamięci), lobby, gracze, PIN, wyniki.
const { v4: uuidv4 } = require("uuid");
const { generateCode } = require("./utils");
const { getGameModule } = require("../games");

const games = {}; // code -> instancja gry

const DEFAULT_MAX_PLAYERS = 8;

function createGame(gameType = "quiz") {
  const mod = getGameModule(gameType) || getGameModule("quiz");
  let code = generateCode();
  while (games[code]) {
    code = generateCode();
  }
  games[code] = {
    code,
    gameType: mod.id,
    hostId: null,
    players: [],
    status: "lobby", // lobby | greeting | round | elimination | finale | finished
    ...mod.initState(),
  };
  return code;
}

function getGame(code) {
  return games[code];
}

function getMaxPlayers(gameType) {
  const mod = getGameModule(gameType);
  return mod ? mod.maxPlayers : DEFAULT_MAX_PLAYERS;
}

function addPlayer(code, playerName, avatar) {
  const game = games[code];
  if (!game) return null;
  const max = getMaxPlayers(game.gameType);
  if (game.players.length >= max) return { full: true, max };
  const player = {
    id: uuidv4(),
    name: playerName,
    avatar: avatar || "default",
    score: 0,
    lives: 3,
    socketId: null,
  };
  game.players.push(player);
  return player;
}

function removePlayer(code, playerId) {
  const game = games[code];
  if (!game) return;
  game.players = game.players.filter((p) => p.id !== playerId);
}

function getPlayerBySocketId(code, socketId) {
  const game = games[code];
  if (!game) return null;
  return game.players.find((p) => p.socketId === socketId);
}

function getPlayerById(code, playerId) {
  const game = games[code];
  if (!game) return null;
  return game.players.find((p) => p.id === playerId);
}

function getScores(code) {
  const game = games[code];
  if (!game) return [];
  return game.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      lives: p.lives,
    }))
    .sort((a, b) => b.score - a.score);
}

function deleteGame(code) {
  delete games[code];
}

module.exports = {
  createGame,
  getGame,
  getMaxPlayers,
  addPlayer,
  removePlayer,
  getPlayerBySocketId,
  getPlayerById,
  getScores,
  deleteGame,
};
