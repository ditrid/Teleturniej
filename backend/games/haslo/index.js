// Gra: Zgadnij Hasło (Password / Taboo) — opisuj hasło bez słów tabu, grupa zgaduje.
const { hasla } = require("../../hasla");
const { advanceTurn } = require("../base");

module.exports = {
  id: "haslo",
  name: "Zgadnij Hasło",
  emoji: "🔤",
  description: "Opisz hasło bez użycia słów tabu. Grupa zgaduje!",
  maxPlayers: 8,
  defaults: { roundsTotal: 2 },

  initState() {
    return {
      roundsTotal: 2,
      roundsLeft: 2,
      turnOrder: [],
      currentTurnIndex: 0,
      usedWords: [],
      currentWord: null, // { id, word, taboo }
      currentPlayerId: null,
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    game.roundsTotal = Number(settings.rounds) || 2;
    game.roundsLeft = game.roundsTotal;
    game.turnOrder = game.players.map((p) => p.id);
    game.currentTurnIndex = 0;
    game.usedWords = [];
    game.currentWord = null;
    game.currentPlayerId = null;
    game.status = "round";
    return { ok: true };
  },

  getTurnPlayer(game) {
    if (game.turnOrder.length === 0) return null;
    const playerId = game.turnOrder[game.currentTurnIndex];
    const player = game.players.find((p) => p.id === playerId);
    return {
      playerId,
      playerName: player ? player.name : "",
      roundsLeft: game.roundsLeft,
      totalRounds: game.roundsTotal,
    };
  },

  // Host pokazuje hasło dla aktualnego gracza.
  nextWord(game) {
    if (game.turnOrder.length === 0) return null;
    const currentId = game.turnOrder[game.currentTurnIndex];
    const player = game.players.find((p) => p.id === currentId);
    if (!player) return null;

    let unused = hasla.filter((w) => !game.usedWords.includes(w.id));
    if (unused.length === 0) {
      game.usedWords = [];
      unused = hasla;
    }
    const word = unused[Math.floor(Math.random() * unused.length)];
    game.usedWords.push(word.id);
    game.currentWord = word;
    game.currentPlayerId = currentId;

    return {
      playerId: currentId,
      playerName: player.name,
      word: word.word,
      taboo: word.taboo || [],
    };
  },

  // Rozstrzygnięcie: zgadnięto (+1 pkt) lub pominięto (0 pkt).
  resolve(game, guessed) {
    const id = game.currentPlayerId || game.turnOrder[game.currentTurnIndex];
    const player = game.players.find((p) => p.id === id);
    if (guessed && player) player.score += 1;

    game.currentWord = null;
    game.currentPlayerId = null;

    const advanced = advanceTurn(game);
    return {
      guessed,
      playerId: id,
      playerName: player ? player.name : "",
      points: guessed ? 1 : 0,
      gameOver: advanced.gameOver,
      winner: advanced.winner,
      next: advanced.next,
    };
  },
};
