// Gra: Kto Bardziej? — host czyta kartę, gracze głosują na osobę z grupy.
// Najczęściej wskazany dostaje +10 pkt, a każdy, kto go trafnie zgadł, +5 pkt.
const { ktoBardziej } = require("../../ktoBardziejPrompts");
const { pickPrompt } = require("../base");

module.exports = {
  id: "kto-bardziej",
  name: "Kto Bardziej?",
  emoji: "🕺",
  description: "Głosujcie, kto z Was zrobi to najlepiej. Zgadnij większość!",
  maxPlayers: 8,
  defaults: { roundsTotal: 8 },

  initState() {
    return {
      roundsTotal: 8,
      roundsPlayed: 0,
      usedPrompts: [],
      currentPrompt: null, // { id, text }
      votes: {}, // voterId -> targetId
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    game.roundsTotal = Number(settings.rounds) || 8;
    game.roundsPlayed = 0;
    game.usedPrompts = [];
    game.currentPrompt = null;
    game.votes = {};
    game.status = "round";
    return { ok: true };
  },

  nextPrompt(game) {
    game.votes = {};
    game.currentPrompt = null;
    if (game.roundsPlayed >= game.roundsTotal) {
      game.status = "finished";
      const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
      return { gameOver: true, winner: winner ? winner.name : "Nikt" };
    }
    const p = pickPrompt(game, ktoBardziej, "usedPrompts");
    game.currentPrompt = p;
    return {
      gameOver: false,
      prompt: p.text,
      round: game.roundsPlayed + 1,
      total: game.roundsTotal,
    };
  },

  vote(game, voterId, targetId) {
    if (!game.currentPrompt) return null;
    if (voterId === targetId) return null; // nie głosuj na siebie
    if (!game.players.find((p) => p.id === targetId)) return null;
    game.votes[voterId] = targetId;
    return {
      voterId,
      votedCount: Object.keys(game.votes).length,
      total: game.players.length,
    };
  },

  reveal(game) {
    if (!game.currentPrompt) return null;
    const promptText = game.currentPrompt.text;

    const tally = {};
    game.players.forEach((p) => {
      tally[p.id] = 0;
    });
    Object.values(game.votes).forEach((t) => {
      if (tally[t] !== undefined) tally[t] += 1;
    });

    const maxVotes = Math.max(0, ...Object.values(tally));
    const topIds = game.players
      .filter((p) => tally[p.id] === maxVotes && maxVotes > 0)
      .map((p) => p.id);
    const roundWinnerId =
      topIds.length > 0
        ? topIds[Math.floor(Math.random() * topIds.length)]
        : null;

    if (roundWinnerId) {
      const target = game.players.find((p) => p.id === roundWinnerId);
      if (target) target.score += 10;
    }
    Object.entries(game.votes).forEach(([voterId, targetId]) => {
      if (targetId === roundWinnerId) {
        const voter = game.players.find((p) => p.id === voterId);
        if (voter) voter.score += 5;
      }
    });

    game.roundsPlayed += 1;
    const winnerName = roundWinnerId
      ? game.players.find((p) => p.id === roundWinnerId)?.name
      : null;
    game.currentPrompt = null;

    return {
      prompt: promptText,
      winnerId: roundWinnerId,
      winnerName,
      counts: tally,
      gameOver: game.roundsPlayed >= game.roundsTotal,
    };
  },
};
