const { v4: uuidv4 } = require("uuid");
const { questions, finalQuestions } = require("./questions");

const games = {};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createGame() {
  let code = generateCode();
  while (games[code]) {
    code = generateCode();
  }
  games[code] = {
    code,
    hostId: null,
    players: [],
    status: "lobby", // lobby | greeting | round | elimination | finale | finished
    currentQuestionIndex: 0,
    usedQuestions: [],
    roundQuestions: [],
    finalQuestionsUsed: [],
    buzzedPlayerId: null,
    answeringPlayerId: null,
    round: "main", // main | finale
    mainRoundQuestions: 10,
    buzzerLocked: false,
  };
  return code;
}

function getGame(code) {
  return games[code];
}

function addPlayer(code, playerName, avatar) {
  const game = games[code];
  if (!game) return null;
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

function startGame(code) {
  const game = games[code];
  if (!game || game.players.length < 2) return false;

  game.roundQuestions = shuffleArray([...questions]).slice(
    0,
    game.mainRoundQuestions
  );
  game.currentQuestionIndex = 0;
  game.round = "main";
  game.status = "greeting";

  const playerNames = game.players.map((p) => p.name).join(", ");
  game.greetingText = `Witamy wszystkich graczy: ${playerNames}! Zaczynamy teleturniej!`;

  return true;
}

function getNextQuestion(code) {
  const game = games[code];
  if (!game) return null;

  game.buzzedPlayerId = null;
  game.answeringPlayerId = null;
  game.buzzerLocked = false;

  let question;
  if (game.round === "main") {
    if (game.currentQuestionIndex >= game.roundQuestions.length) {
      return null;
    }
    question = game.roundQuestions[game.currentQuestionIndex];
    game.currentQuestionIndex++;
    game.status = "round";
  } else if (game.round === "finale") {
    const unused = finalQuestions.filter(
      (q) => !game.finalQuestionsUsed.includes(q.id)
    );
    if (unused.length === 0) {
      game.finalQuestionsUsed = [];
      question = shuffleArray([...finalQuestions])[0];
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
}

function getCurrentQuestion(code) {
  const game = games[code];
  if (!game || game.usedQuestions.length === 0) return null;
  const q = game.usedQuestions[game.usedQuestions.length - 1];
  return {
    question: q.question,
    answers: q.answers,
    id: q.id,
  };
}

function playerBuzz(code, playerId) {
  const game = games[code];
  if (!game || game.buzzerLocked || game.buzzedPlayerId) return false;
  const player = game.players.find((p) => p.id === playerId);
  if (!player || player.lives <= 0) return false;
  game.buzzedPlayerId = playerId;
  game.buzzerLocked = true;
  return true;
}

function playerAnswer(code, playerId, answerIndex) {
  const game = games[code];
  if (!game) return null;
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
}

function resetBuzzer(code) {
  const game = games[code];
  if (!game) return;
  game.buzzedPlayerId = null;
  game.answeringPlayerId = null;
  game.buzzerLocked = false;
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

function eliminateLowestPlayer(code) {
  const game = games[code];
  if (!game || game.players.length <= 2) return null;

  const sorted = [...game.players].sort((a, b) => a.score - b.score);
  const lowest = sorted[0];
  const sameScore = sorted.filter((p) => p.score === lowest.score);

  if (sameScore.length > 1 && sameScore.length < game.players.length) {
    // Tiebreaker needed - return the tied players
    return { tiebreaker: true, players: sameScore };
  }

  // Remove the lowest
  const eliminated = lowest;
  game.players = game.players.filter((p) => p.id !== eliminated.id);
  return { eliminated };
}

function startFinale(code) {
  const game = games[code];
  if (!game) return false;

  game.round = "finale";
  game.status = "finale";
  game.finalQuestionsUsed = [];
  game.currentQuestionIndex = 0;

  // Reset lives
  game.players.forEach((p) => {
    p.lives = 3;
  });

  return true;
}

function deleteGame(code) {
  delete games[code];
}

module.exports = {
  createGame,
  getGame,
  addPlayer,
  removePlayer,
  getPlayerBySocketId,
  getPlayerById,
  startGame,
  getNextQuestion,
  getCurrentQuestion,
  playerBuzz,
  playerAnswer,
  resetBuzzer,
  getScores,
  eliminateLowestPlayer,
  startFinale,
  deleteGame,
};