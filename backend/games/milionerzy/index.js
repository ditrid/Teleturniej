// Gra: Milionerzy Party — drabinka pytań z rosnącymi stawkami, koła ratunkowe 50:50 i przyjaciel.
// Wszyscy gracze grają równolegle; błędna odpowiedź = odpadnięcie z gwarantowaną sumą.
const { questions } = require("../../questions");
const { shuffleArray } = require("../../engine/utils");

// Klasyczna drabinka "Milionerów" (12 szczebli) z progami gwarantowanymi.
const LADDER = [
  { prize: 500, guaranteed: false },
  { prize: 1000, guaranteed: false },
  { prize: 2000, guaranteed: false },
  { prize: 5000, guaranteed: false },
  { prize: 10000, guaranteed: true },
  { prize: 20000, guaranteed: false },
  { prize: 40000, guaranteed: false },
  { prize: 75000, guaranteed: false },
  { prize: 125000, guaranteed: false },
  { prize: 250000, guaranteed: true },
  { prize: 500000, guaranteed: false },
  { prize: 1000000, guaranteed: false },
];

// Gwarantowana suma poniżej danego indeksu (ostatni próg, który gracz "zaliczył").
function guaranteedPrizeBefore(index) {
  let last = 0;
  for (let i = 0; i < index; i++) {
    if (LADDER[i].guaranteed) last = LADDER[i].prize;
  }
  return last;
}

module.exports = {
  id: "milionerzy",
  name: "Milionerzy Party",
  emoji: "💰",
  description: "Drabinka pytań z rosnącymi stawkami. Zgarniesz milion?",
  maxPlayers: 8,
  defaults: {},

  initState() {
    return {
      questions: [],
      currentIndex: 0, // który szczebel pokazujemy jako następny
      currentQuestion: null, // aktualnie pokazywane pytanie
      answers: {}, // playerId -> answerIndex
      fiftyUsed: {}, // playerId -> true
      revealed: false,
      eliminated: {}, // playerId -> { name, prize }
    };
  },

  start(game) {
    if (game.players.length < 2) {
      return { ok: false, error: "Za mało graczy (min. 2)" };
    }
    game.questions = shuffleArray([...questions]).slice(0, LADDER.length);
    game.currentIndex = 0;
    game.currentQuestion = null;
    game.answers = {};
    game.fiftyUsed = {};
    game.revealed = false;
    game.eliminated = {};
    game.players.forEach((p) => {
      p.score = 0;
    });
    game.status = "round";
    return { ok: true };
  },

  getNextQuestion(game) {
    game.answers = {};
    game.revealed = false;
    game.currentQuestion = null;
    if (game.currentIndex >= game.questions.length) return null;

    const q = game.questions[game.currentIndex];
    game.currentQuestion = q;
    const index = game.currentIndex;
    game.currentIndex++;

    const alive = game.players.filter((p) => !game.eliminated[p.id]);
    return {
      question: q.question,
      answers: q.answers,
      id: q.id,
      index, // 0-based szczebel
      total: game.questions.length,
      prize: LADDER[index].prize,
      guaranteed: LADDER[index].guaranteed,
      aliveCount: alive.length,
    };
  },

  getCurrentQuestion(game) {
    if (!game.currentQuestion) return null;
    return {
      question: game.currentQuestion.question,
      answers: game.currentQuestion.answers,
      id: game.currentQuestion.id,
    };
  },

  // Koło 50:50 — zwraca dwa indeksy odpowiedzi (poprawna + jedna błędna).
  useFifty(game, playerId) {
    if (game.fiftyUsed[playerId]) return null;
    if (game.answers[playerId] !== undefined) return null;
    const q = game.currentQuestion;
    if (!q) return null;
    game.fiftyUsed[playerId] = true;
    const wrongs = q.answers.map((_, i) => i).filter((i) => i !== q.correct);
    const keepWrong = wrongs[Math.floor(Math.random() * wrongs.length)];
    return { keep: [q.correct, keepWrong].sort((a, b) => a - b) };
  },

  // Telefon do przyjaciela — podpowiedź od losowego żyjącego gracza.
  useFriend(game, playerId) {
    if (game.answers[playerId] !== undefined) return null;
    const q = game.currentQuestion;
    if (!q) return null;
    const others = game.players.filter(
      (p) => p.id !== playerId && !game.eliminated[p.id]
    );
    const answered = others.filter((p) => game.answers[p.id] !== undefined);
    if (answered.length > 0) {
      const friend = answered[Math.floor(Math.random() * answered.length)];
      return { friendName: friend.name, answerIndex: game.answers[friend.id] };
    }
    const randomAnswer = Math.floor(Math.random() * q.answers.length);
    return { friendName: "przyjaciel", answerIndex: randomAnswer, unsure: true };
  },

  lockAnswer(game, playerId, answerIndex) {
    if (game.revealed) return null;
    if (game.eliminated[playerId]) return null;
    game.answers[playerId] = answerIndex;
    const alive = game.players.filter((p) => !game.eliminated[p.id]);
    return {
      answeredCount: Object.keys(game.answers).length,
      total: alive.length,
    };
  },

  finalizeRound(game) {
    if (game.revealed) return null;
    const q = game.currentQuestion;
    if (!q) return null;
    game.revealed = true;

    const index = game.currentIndex - 1; // szczebel, który właśnie oceniamy
    const aliveBefore = game.players.filter((p) => !game.eliminated[p.id]);

    const results = aliveBefore.map((p) => {
      const idx = game.answers[p.id];
      const correct = idx !== undefined && idx === q.correct;
      if (correct) {
        p.score = LADDER[index].prize;
      } else {
        p.score = guaranteedPrizeBefore(index);
        game.eliminated[p.id] = { name: p.name, prize: p.score };
      }
      return {
        playerId: p.id,
        playerName: p.name,
        correct,
        answered: idx !== undefined,
        prize: p.score,
        eliminated: !correct,
      };
    });

    const alive = game.players.filter((p) => !game.eliminated[p.id]);
    const isLastQuestion = game.currentIndex >= game.questions.length;
    const gameOver = isLastQuestion || alive.length === 0;

    let winner = null;
    if (gameOver) {
      game.status = "finished";
      const w = [...game.players].sort((a, b) => b.score - a.score)[0];
      winner = w ? w.name : "Nikt";
    }

    return {
      correctIndex: q.correct,
      correctAnswer: q.answers[q.correct],
      prize: LADDER[index].prize,
      results,
      gameOver,
      winner,
    };
  },
};
