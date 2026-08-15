// Gra: Kwak Kwiz — quiz z buzzerem.
const { questions, finalQuestions, filterByDifficulty } = require("../../questions");
const { shuffleArray } = require("../../engine/utils");

module.exports = {
  id: "quiz",
  name: "Kwak Kwiz",
  emoji: "🧠",
  description: "Quiz z buzzerem — kto pierwszy, ten lepszy.",
  maxPlayers: 8,
  defaults: { mainRoundQuestions: 10 },

  // Stan specyficzny dla tej gry (merge'owany do instancji).
  initState() {
    return {
      currentQuestionIndex: 0,
      usedQuestions: [],
      roundQuestions: [],
      finalQuestionsUsed: [],
      buzzedPlayerId: null,
      answeringPlayerId: null,
      round: "main", // main | finale
      mainRoundQuestions: 10,
      buzzerLocked: false,
      greetingText: "",
      difficulty: "mieszany",
    };
  },

  // Rozpoczęcie rozgrywki przez hosta.
  start(game, settings = {}) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    game.difficulty = settings.difficulty || "mieszany";
    game.roundQuestions = shuffleArray(
      filterByDifficulty(questions, game.difficulty)
    ).slice(0, game.mainRoundQuestions);
    game.currentQuestionIndex = 0;
    game.round = "main";
    game.status = "greeting";

    const playerNames = game.players.map((p) => p.name).join(", ");
    game.greetingText = `Witamy wszystkich graczy: ${playerNames}! Zaczynamy teleturniej!`;
    return { ok: true };
  },

  getNextQuestion(game) {
    game.buzzedPlayerId = null;
    game.answeringPlayerId = null;
    game.buzzerLocked = false;

    let question;
    if (game.round === "main") {
      if (game.currentQuestionIndex >= game.roundQuestions.length) return null;
      question = game.roundQuestions[game.currentQuestionIndex];
      game.currentQuestionIndex++;
      game.status = "round";
    } else if (game.round === "finale") {
      const finalPool = filterByDifficulty(finalQuestions, game.difficulty);
      const unused = finalPool.filter(
        (q) => !game.finalQuestionsUsed.includes(q.id)
      );
      if (unused.length === 0) {
        game.finalQuestionsUsed = [];
        question = shuffleArray([...finalPool])[0];
      } else {
        question = shuffleArray(unused)[0];
      }
      game.finalQuestionsUsed.push(question.id);
      game.status = "finale";
    }

    game.usedQuestions.push(question);
    return {
      question: question.question,
      answers: question.answers,
      id: question.id,
    };
  },

  getCurrentQuestion(game) {
    if (game.usedQuestions.length === 0) return null;
    const q = game.usedQuestions[game.usedQuestions.length - 1];
    return { question: q.question, answers: q.answers, id: q.id };
  },

  playerBuzz(game, playerId) {
    if (game.buzzerLocked || game.buzzedPlayerId) return false;
    const player = game.players.find((p) => p.id === playerId);
    if (!player || player.lives <= 0) return false;
    game.buzzedPlayerId = playerId;
    game.buzzerLocked = true;
    return true;
  },

  playerAnswer(game, playerId, answerIndex) {
    if (game.buzzedPlayerId !== playerId) return null;
    game.answeringPlayerId = playerId;

    const currentQ = game.usedQuestions[game.usedQuestions.length - 1];
    if (!currentQ) return null;

    const correct = currentQ.correct === answerIndex;
    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    if (correct) {
      player.score += 10;
    } else {
      player.lives -= 1;
    }

    return {
      correct,
      playerId,
      playerName: player.name,
      score: player.score,
      lives: player.lives,
      correctAnswer: currentQ.correct,
      eliminated: player.lives <= 0,
    };
  },

  resetBuzzer(game) {
    game.buzzedPlayerId = null;
    game.answeringPlayerId = null;
    game.buzzerLocked = false;
  },

  eliminateLowestPlayer(game) {
    if (game.players.length <= 2) return null;
    const sorted = [...game.players].sort((a, b) => a.score - b.score);
    const lowest = sorted[0];
    const sameScore = sorted.filter((p) => p.score === lowest.score);
    if (sameScore.length > 1 && sameScore.length < game.players.length) {
      return { tiebreaker: true, players: sameScore };
    }
    game.players = game.players.filter((p) => p.id !== lowest.id);
    return { eliminated: lowest };
  },

  startFinale(game) {
    game.round = "finale";
    game.status = "finale";
    game.finalQuestionsUsed = [];
    game.currentQuestionIndex = 0;
    game.players.forEach((p) => {
      p.lives = 3;
    });
    return true;
  },
};
