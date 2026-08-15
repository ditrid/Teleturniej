// Gra: Nigdy Przenigdy — host czyta kartę, gracze przyznają się (TAK/NIE).
// Każde "TAK" = +1 punkt (masz barwną przeszłość!). Wygrywa najbardziej doświadczony.
const { nigdy } = require("../../nigdyPrompts");
const { pickPrompt } = require("../base");

module.exports = {
  id: "nigdy",
  name: "Nigdy Przenigdy",
  emoji: "💋",
  description: "Kto ma coś na sumieniu? Sekrety wychodzą na jaw.",
  maxPlayers: 8,
  defaults: { roundsTotal: 10 },

  initState() {
    return {
      roundsTotal: 10,
      roundsPlayed: 0,
      usedPrompts: [],
      currentPrompt: null, // { id, text, level }
      answers: {}, // playerId -> bool
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    game.roundsTotal = Number(settings.rounds) || 10;
    game.roundsPlayed = 0;
    game.usedPrompts = [];
    game.currentPrompt = null;
    game.answers = {};
    game.status = "round";
    return { ok: true };
  },

  nextPrompt(game) {
    game.answers = {};
    game.currentPrompt = null;
    if (game.roundsPlayed >= game.roundsTotal) {
      game.status = "finished";
      const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
      return { gameOver: true, winner: winner ? winner.name : "Nikt" };
    }
    const p = pickPrompt(game, nigdy, "usedPrompts");
    game.currentPrompt = p;
    return {
      gameOver: false,
      prompt: p.text,
      round: game.roundsPlayed + 1,
      total: game.roundsTotal,
    };
  },

  answer(game, playerId, did) {
    if (!game.currentPrompt) return null;
    game.answers[playerId] = !!did;
    if (did) {
      const player = game.players.find((p) => p.id === playerId);
      if (player) player.score += 1;
    }
    return {
      playerId,
      answeredCount: Object.keys(game.answers).length,
      total: game.players.length,
    };
  },

  reveal(game) {
    if (!game.currentPrompt) return null;
    const promptText = game.currentPrompt.text;
    const yesIds = Object.keys(game.answers).filter((id) => game.answers[id]);
    const yesNames = yesIds.map(
      (id) => game.players.find((p) => p.id === id)?.name || "?"
    );
    const noNames = game.players
      .filter((p) => !game.answers[p.id])
      .map((p) => p.name);

    game.roundsPlayed += 1;
    game.currentPrompt = null;
    game.answers = {};

    return {
      prompt: promptText,
      yesCount: yesNames.length,
      noCount: noNames.length,
      yesNames,
      noNames,
      gameOver: game.roundsPlayed >= game.roundsTotal,
    };
  },
};
