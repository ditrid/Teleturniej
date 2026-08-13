// Gra: Prawda czy Wyzwanie — karty + grupowe głosowanie.
const { truths, dares } = require("../../truthOrDare");

const VOTE_OPTIONS = {
  mistrzowskie: { key: "mistrzowskie", emoji: "🔥", label: "Mistrzowskie", points: 15 },
  wykonane: { key: "wykonane", emoji: "✅", label: "Wykonane", points: 10 },
  ledwo: { key: "ledwo", emoji: "😬", label: "Ledwo", points: 5 },
  nie: { key: "nie", emoji: "❌", label: "Nie wykonane", points: 0 },
};

function pickPrompt(game, type) {
  const pool = (type === "truth" ? truths : dares).filter(
    (p) => p.level === game.level
  );
  const usedKey = type === "truth" ? "usedTruths" : "usedDares";
  let unused = pool.filter((p) => !game[usedKey].includes(p.id));
  if (unused.length === 0) {
    game[usedKey] = [];
    unused = pool;
  }
  const prompt = unused[Math.floor(Math.random() * unused.length)];
  game[usedKey].push(prompt.id);
  return prompt;
}

function advanceTurn(game) {
  game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
  if (game.currentTurnIndex === 0) {
    game.roundsLeft -= 1;
  }
  if (game.roundsLeft <= 0) {
    game.status = "finished";
    const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
    return { gameOver: true, winner: winner ? winner.name : "Nikt", next: null };
  }
  const nextId = game.turnOrder[game.currentTurnIndex];
  const next = game.players.find((p) => p.id === nextId);
  return {
    gameOver: false,
    winner: null,
    next: {
      playerId: nextId,
      playerName: next ? next.name : "",
      roundsLeft: game.roundsLeft,
      totalRounds: game.roundsTotal,
    },
  };
}

module.exports = {
  id: "prawda",
  name: "Prawda czy Wyzwanie",
  emoji: "🔥",
  description: "Karty prawdy i wyzwania + grupowe głosowanie.",
  maxPlayers: 8,
  defaults: { level: "grzeczne", roundsTotal: 2 },

  initState() {
    return {
      level: "grzeczne",
      roundsTotal: 2,
      roundsLeft: 2,
      turnOrder: [],
      currentTurnIndex: 0,
      pendingChoice: null,
      currentPrompt: null,
      votingActive: false,
      currentVotes: {},
      usedTruths: [],
      usedDares: [],
      round: "prawda",
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    const level = settings.level || "grzeczne";
    const rounds = Number(settings.rounds) || 2;

    game.level = level;
    game.roundsTotal = rounds;
    game.roundsLeft = rounds;
    game.turnOrder = game.players.map((p) => p.id);
    game.currentTurnIndex = 0;
    game.pendingChoice = null;
    game.currentPrompt = null;
    game.votingActive = false;
    game.currentVotes = {};
    game.usedTruths = [];
    game.usedDares = [];
    game.round = "prawda";
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

  chooseAction(game, playerId, choice) {
    if (game.turnOrder.length === 0) return null;
    const currentId = game.turnOrder[game.currentTurnIndex];
    if (playerId !== currentId) return null;
    if (choice !== "truth" && choice !== "dare") return null;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    const prompt = pickPrompt(game, choice);
    game.pendingChoice = choice;
    game.currentPrompt = {
      type: choice,
      text: prompt.text,
      level: prompt.level,
      playerId,
      playerName: player.name,
    };
    game.votingActive = false;
    game.currentVotes = {};

    return {
      playerId,
      playerName: player.name,
      type: choice,
      text: prompt.text,
      level: prompt.level,
    };
  },

  skipTurn(game) {
    if (game.turnOrder.length === 0) return null;
    const currentId = game.turnOrder[game.currentTurnIndex];
    const player = game.players.find((p) => p.id === currentId);

    game.pendingChoice = null;
    game.currentPrompt = null;
    game.votingActive = false;
    game.currentVotes = {};

    const advanced = advanceTurn(game);
    return {
      playerId: currentId,
      playerName: player ? player.name : "",
      skipped: true,
      points: 0,
      gameOver: advanced.gameOver,
      winner: advanced.winner,
      next: advanced.next,
    };
  },

  startVote(game) {
    if (!game.currentPrompt) return null;
    const currentId = game.currentPrompt.playerId;
    const voters = game.turnOrder.filter((id) => id !== currentId);
    game.votingActive = true;
    game.currentVotes = {};
    return {
      playerId: currentId,
      playerName: game.currentPrompt.playerName,
      voterCount: voters.length,
      voters,
    };
  },

  submitVote(game, playerId, option) {
    if (!game.votingActive || !game.currentPrompt) return null;
    const voters = game.turnOrder.filter(
      (id) => id !== game.currentPrompt.playerId
    );
    if (!voters.includes(playerId)) return null;
    if (!VOTE_OPTIONS[option]) return null;
    game.currentVotes[playerId] = option;
    const allVoted = voters.every((id) => game.currentVotes[id]);
    return {
      votedCount: Object.keys(game.currentVotes).length,
      voterCount: voters.length,
      allVoted,
    };
  },

  finalizeVote(game) {
    if (!game.currentPrompt) return null;
    const prompt = game.currentPrompt;
    const voters = game.turnOrder.filter((id) => id !== prompt.playerId);
    const votes = voters.map((id) => game.currentVotes[id]).filter(Boolean);
    const pointsList = votes.map((o) => VOTE_OPTIONS[o].points);
    const avg = pointsList.length
      ? Math.round(pointsList.reduce((a, b) => a + b, 0) / pointsList.length)
      : 0;

    const player = game.players.find((p) => p.id === prompt.playerId);
    if (player) player.score += avg;

    const breakdown = { mistrzowskie: 0, wykonane: 0, ledwo: 0, nie: 0 };
    votes.forEach((o) => {
      breakdown[o] += 1;
    });

    game.pendingChoice = null;
    game.currentPrompt = null;
    game.votingActive = false;
    game.currentVotes = {};

    const advanced = advanceTurn(game);
    return {
      playerId: prompt.playerId,
      playerName: prompt.playerName,
      type: prompt.type,
      pointsAwarded: avg,
      averagePoints: avg,
      totalVotes: votes.length,
      voterCount: voters.length,
      breakdown,
      gameOver: advanced.gameOver,
      winner: advanced.winner,
      next: advanced.next,
    };
  },
};
