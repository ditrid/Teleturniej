// Gra: Szybki Quiz — wszyscy odpowiadają jednocześnie, liczy się wiedza i refleks.
const { questions } = require("../../questions");
const { shuffleArray } = require("../../engine/utils");

module.exports = {
  id: "quiz-rapid",
  name: "Szybki Quiz",
  emoji: "⚡",
  description: "Błyskawiczne pytania na czas — wszyscy odpowiadają naraz.",
  maxPlayers: 8,
  defaults: { mainRoundQuestions: 8 },

  initState() {
    return {
      currentQuestionIndex: 0,
      roundQuestions: [],
      usedQuestions: [],
      mainRoundQuestions: 8,
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
    game.roundQuestions = shuffleArray([...questions]).slice(0, n);
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
