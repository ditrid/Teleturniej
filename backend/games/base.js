// Wspólne, bezstanowe helpery dla gier imprezowych opartych o prompt i kolejność tur.
// Każda gra (prawda, nigdy, kto-bardziej, memy, szaleństwo, król imprezy) może z nich korzystać.
const { shuffleArray } = require("../engine/utils");

// Losuje kolejny nieużyty prompt z puli; gdy pula się wyczerpie — resetuje zużycie.
function pickPrompt(game, pool, usedKey) {
  let unused = pool.filter((p) => !game[usedKey].includes(p.id));
  if (unused.length === 0) {
    game[usedKey] = [];
    unused = pool;
  }
  const prompt = unused[Math.floor(Math.random() * unused.length)];
  game[usedKey].push(prompt.id);
  return prompt;
}

// Przechodzi do następnego gracza w kolejce tur. Zwraca informację o stanie gry.
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

// Opcje oceny wykonania (wspólne dla gier imprezowych z głosowaniem).
const VOTE_OPTIONS = {
  mistrzowskie: { key: "mistrzowskie", emoji: "🔥", label: "Mistrzowskie", points: 15 },
  wykonane: { key: "wykonane", emoji: "✅", label: "Wykonane", points: 10 },
  ledwo: { key: "ledwo", emoji: "😬", label: "Ledwo", points: 5 },
  nie: { key: "nie", emoji: "❌", label: "Nie wykonane", points: 0 },
};

// Fabryka gier imprezowych opartych o turę: host pokazuje kartę → gracz wykonuje → grupa głosuje.
// Używana przez "Szaleństwo pytań", "Król Imprezy" i "Filmowy Kwak".
function makePromptGame(config) {
  const {
    id,
    name,
    emoji,
    description,
    promptPool, // [{ id, text, level? }]
    promptType, // string zapisywany jako prompt.type
    maxPlayers = 8,
    defaults = {},
    voteOptions = VOTE_OPTIONS,
    levels = null, // opcjonalne poziomy kart (np. ["lagodne", "ostre"])
    defaultLevel = null,
  } = config;

  return {
    id,
    name,
    emoji,
    description,
    maxPlayers,
    defaults,

    initState() {
      return {
        roundsTotal: defaults.roundsTotal || 2,
        roundsLeft: defaults.roundsTotal || 2,
        turnOrder: [],
        currentTurnIndex: 0,
        level: defaultLevel,
        currentPrompt: null,
        votingActive: false,
        currentVotes: {},
        usedPrompts: [],
      };
    },

    start(game, settings = {}) {
      if (game.players.length < 2) {
        return { ok: false, error: "Za mało graczy (min. 2)" };
      }
      const rounds = Number(settings.rounds) || defaults.roundsTotal || 2;
      game.roundsTotal = rounds;
      game.roundsLeft = rounds;
      game.turnOrder = game.players.map((p) => p.id);
      game.currentTurnIndex = 0;
      if (levels) {
        game.level = levels.includes(settings.level)
          ? settings.level
          : defaultLevel || levels[0];
      }
      game.currentPrompt = null;
      game.votingActive = false;
      game.currentVotes = {};
      game.usedPrompts = [];
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

    // Host pokazuje kartę dla aktualnego gracza.
    nextPrompt(game) {
      if (game.turnOrder.length === 0) return null;
      const currentId = game.turnOrder[game.currentTurnIndex];
      const player = game.players.find((p) => p.id === currentId);
      if (!player) return null;
      const pool = levels
        ? promptPool.filter((p) => (p.level || defaultLevel) === game.level)
        : promptPool;
      const p = pickPrompt(game, pool, "usedPrompts");
      const level = p.level || game.level || "grzeczne";
      game.currentPrompt = {
        type: promptType,
        text: p.text,
        level,
        playerId: currentId,
        playerName: player.name,
      };
      game.votingActive = false;
      game.currentVotes = {};
      return {
        playerId: currentId,
        playerName: player.name,
        type: promptType,
        text: p.text,
        level,
      };
    },

    skipTurn(game) {
      if (game.turnOrder.length === 0) return null;
      const currentId = game.turnOrder[game.currentTurnIndex];
      const player = game.players.find((p) => p.id === currentId);
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
      if (!voteOptions[option]) return null;
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
      const pointsList = votes.map((o) => voteOptions[o].points);
      const avg = pointsList.length
        ? Math.round(pointsList.reduce((a, b) => a + b, 0) / pointsList.length)
        : 0;

      const player = game.players.find((p) => p.id === prompt.playerId);
      if (player) player.score += avg;

      const breakdown = {};
      Object.keys(voteOptions).forEach((k) => {
        breakdown[k] = 0;
      });
      votes.forEach((o) => {
        breakdown[o] += 1;
      });

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
}

module.exports = { pickPrompt, advanceTurn, makePromptGame, makeQuizGame };

// Fabryka quizu "wszyscy naraz" (odpowiedzi jednoczesne) — używana przez Szybki Quiz i Melodię.
function makeQuizGame(config) {
  const {
    id,
    name,
    emoji,
    description,
    questionPool, // [{ id, question, answers, correct }]
    maxPlayers = 8,
    defaults = {},
  } = config;

  return {
    id,
    name,
    emoji,
    description,
    maxPlayers,
    defaults,

    initState() {
      return {
        currentQuestionIndex: 0,
        roundQuestions: [],
        usedQuestions: [],
        mainRoundQuestions: defaults.mainRoundQuestions || 8,
        answers: {}, // playerId -> answerIndex
        revealed: false,
      };
    },

    start(game, settings = {}) {
      if (game.players.length < 2) {
        return { ok: false, error: "Za mało graczy (min. 2)" };
      }
      const n = Number(settings.rounds) || game.mainRoundQuestions || 8;
      game.mainRoundQuestions = n;
      game.roundQuestions = shuffleArray([...questionPool]).slice(0, n);
      game.currentQuestionIndex = 0;
      game.usedQuestions = [];
      game.answers = {};
      game.revealed = false;
      game.status = "round";
      return { ok: true };
    },

    getNextQuestion(game) {
      game.answers = {};
      game.revealed = false;
      if (game.currentQuestionIndex >= game.roundQuestions.length) return null;
      const q = game.roundQuestions[game.currentQuestionIndex];
      game.currentQuestionIndex++;
      game.usedQuestions.push(q);
      return {
        question: q.question,
        answers: q.answers,
        id: q.id,
        index: game.currentQuestionIndex,
        total: game.roundQuestions.length,
      };
    },

    getCurrentQuestion(game) {
      if (game.usedQuestions.length === 0) return null;
      const q = game.usedQuestions[game.usedQuestions.length - 1];
      return { question: q.question, answers: q.answers, id: q.id };
    },

    submitAnswer(game, playerId, answerIndex) {
      if (game.revealed) return null;
      const player = game.players.find((p) => p.id === playerId);
      if (!player) return null;
      game.answers[playerId] = answerIndex;
      return {
        playerId,
        answeredCount: Object.keys(game.answers).length,
        total: game.players.length,
      };
    },

    finalizeRound(game) {
      if (game.revealed) return null;
      const q = game.usedQuestions[game.usedQuestions.length - 1];
      if (!q) return null;
      game.revealed = true;

      const results = game.players.map((p) => {
        const idx = game.answers[p.id];
        const correct = idx !== undefined && idx === q.correct;
        if (correct) p.score += 10;
        return {
          playerId: p.id,
          playerName: p.name,
          correct,
          answered: idx !== undefined,
          score: p.score,
        };
      });

      const gameOver = game.currentQuestionIndex >= game.roundQuestions.length;
      let winner = null;
      if (gameOver) {
        game.status = "finished";
        const w = [...game.players].sort((a, b) => b.score - a.score)[0];
        winner = w ? w.name : "Nikt";
      }
      return {
        correctIndex: q.correct,
        correctAnswer: q.answers[q.correct],
        results,
        gameOver,
        winner,
      };
    },
  };
}
