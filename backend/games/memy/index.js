// Gra: Memy Rządzą — host pokazuje mema, gracze wpisują podpis, grupa głosuje.
// Zwycięzca rundy (najlepszy podpis) dostaje +10 pkt.
const { memes } = require("../../memes");
const { pickPrompt } = require("../base");

module.exports = {
  id: "memy",
  name: "Memy Rządzą",
  emoji: "🤣",
  description: "Wymyśl najlepszy podpis pod mema. Grupa wybiera zwycięzcę.",
  maxPlayers: 8,
  defaults: { roundsTotal: 6 },

  initState() {
    return {
      roundsTotal: 6,
      roundsPlayed: 0,
      usedMemes: [],
      currentMeme: null, // { id, emoji, text }
      captions: {}, // playerId -> text
      votes: {}, // voterId -> playerId
      votingActive: false,
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    game.roundsTotal = Number(settings.rounds) || 6;
    game.roundsPlayed = 0;
    game.usedMemes = [];
    game.currentMeme = null;
    game.captions = {};
    game.votes = {};
    game.votingActive = false;
    game.status = "round";
    return { ok: true };
  },

  nextMeme(game) {
    game.captions = {};
    game.votes = {};
    game.votingActive = false;
    game.currentMeme = null;
    if (game.roundsPlayed >= game.roundsTotal) {
      game.status = "finished";
      const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
      return { gameOver: true, winner: winner ? winner.name : "Nikt" };
    }
    const m = pickPrompt(game, memes, "usedMemes");
    game.currentMeme = m;
    return {
      gameOver: false,
      meme: { emoji: m.emoji, text: m.text },
      round: game.roundsPlayed + 1,
      total: game.roundsTotal,
    };
  },

  submitCaption(game, playerId, text) {
    if (!game.currentMeme || game.votingActive) return null;
    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;
    const t = String(text || "").trim().slice(0, 120);
    if (!t) return null;
    game.captions[playerId] = t;
    return {
      playerId,
      captionCount: Object.keys(game.captions).length,
      total: game.players.length,
    };
  },

  startVote(game) {
    if (!game.currentMeme || game.votingActive) return null;
    const captions = game.players
      .filter((p) => game.captions[p.id])
      .map((p) => ({
        playerId: p.id,
        playerName: p.name,
        text: game.captions[p.id],
      }));
    if (captions.length < 2) return { needMore: true, count: captions.length };
    game.votingActive = true;
    game.votes = {};
    return { captions };
  },

  vote(game, voterId, targetId) {
    if (!game.votingActive) return null;
    if (!game.captions[targetId]) return null; // można głosować tylko na kogoś z podpisem
    game.votes[voterId] = targetId;
    return {
      voterId,
      votedCount: Object.keys(game.votes).length,
      total: game.players.length,
    };
  },

  finalizeVote(game) {
    if (!game.votingActive) return null;
    const tally = {};
    Object.values(game.votes).forEach((t) => {
      tally[t] = (tally[t] || 0) + 1;
    });

    let winnerId = null;
    let max = -1;
    Object.entries(tally).forEach(([id, c]) => {
      if (c > max) {
        max = c;
        winnerId = id;
      }
    });

    if (winnerId) {
      const w = game.players.find((p) => p.id === winnerId);
      if (w) w.score += 10;
    }

    const meme = game.currentMeme;
    const winnerName = winnerId
      ? game.players.find((p) => p.id === winnerId)?.name
      : null;
    const winnerCaption = winnerId ? game.captions[winnerId] : null;

    game.roundsPlayed += 1;
    game.currentMeme = null;
    game.votingActive = false;

    return {
      meme,
      winnerId,
      winnerName,
      winnerCaption,
      counts: tally,
      gameOver: game.roundsPlayed >= game.roundsTotal,
    };
  },
};
