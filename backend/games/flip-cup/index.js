// Gra: Flip Cup Challenge — asystent gry fizycznej.
// Telefon działa jak sędzia: dzieli na drużyny, mierzy czas rundy i prowadzi tablicę wyników.
const { shuffleArray } = require("../../engine/utils");

module.exports = {
  id: "flip-cup",
  name: "Flip Cup Challenge",
  emoji: "🥤",
  description: "Asystent gry fizycznej: drużyny, stoper i tablica wyników.",
  maxPlayers: 12,
  defaults: { targetRounds: 3 },

  initState() {
    return {
      teams: [],
      targetRounds: 3,
      round: 0,
      scores: {}, // teamId -> punkty
      timerStartedAt: null, // timestamp rozpoczęcia rundy
      roundWinner: null, // { teamId, name, emoji }
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    const target = Number(settings.rounds) || 3;
    game.targetRounds = target;
    game.round = 0;
    game.timerStartedAt = null;
    game.roundWinner = null;

    const order = shuffleArray([...game.players]);
    const teams = [
      { id: "A", name: "Drużyna A", emoji: "🟥", playerIds: [] },
      { id: "B", name: "Drużyna B", emoji: "🟦", playerIds: [] },
    ];
    order.forEach((p, i) => {
      teams[i % 2].playerIds.push(p.id);
    });
    game.teams = teams;
    game.scores = { A: 0, B: 0 };
    game.players.forEach((p) => {
      p.score = 0;
    });
    game.status = "round";
    return { ok: true };
  },

  getState(game) {
    return {
      teams: game.teams.map((t) => ({
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        players: t.playerIds.map(
          (id) => game.players.find((p) => p.id === id)?.name || "?"
        ),
      })),
      scores: game.scores,
      round: game.round,
      targetRounds: game.targetRounds,
      timerStartedAt: game.timerStartedAt,
      roundWinner: game.roundWinner,
    };
  },

  startTimer(game) {
    game.timerStartedAt = Date.now();
    return { startedAt: game.timerStartedAt };
  },

  winRound(game, teamId) {
    if (!Object.prototype.hasOwnProperty.call(game.scores, teamId)) return null;
    const elapsedMs = game.timerStartedAt
      ? Date.now() - game.timerStartedAt
      : 0;
    game.scores[teamId] += 1;
    game.round += 1;

    const team = game.teams.find((t) => t.id === teamId);
    if (team) {
      team.playerIds.forEach((pid) => {
        const p = game.players.find((x) => x.id === pid);
        if (p) p.score = game.scores[teamId];
      });
    }

    game.timerStartedAt = null;
    const gameOver = game.scores[teamId] >= game.targetRounds;
    game.roundWinner = {
      teamId,
      name: team ? team.name : "",
      emoji: team ? team.emoji : "",
    };
    if (gameOver) {
      game.status = "finished";
    }

    return {
      teamId,
      winnerName: team ? team.name : "",
      winnerEmoji: team ? team.emoji : "",
      elapsedMs,
      scores: game.scores,
      gameOver,
      winner: gameOver ? (team ? team.name : "Nikt") : null,
    };
  },

  nextRound(game) {
    game.roundWinner = null;
    return { round: game.round + 1 };
  },
};
