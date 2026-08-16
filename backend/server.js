require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const cors = require("cors");
const engine = require("./engine");
const { getGameModule } = require("./games");
const { requireDb } = require("./db");
const {
  passport,
  COOKIE_NAME,
  signToken,
  verifyToken,
  toPublicUser,
  FRONTEND_URL,
  TOKEN_MAX_AGE_MS,
} = require("./auth");

const app = express();

// Dozwolone originy dla CORS (frontend). Pusta lista = tryb permissive
// (zezwól na wszystko — jak domyślny cors()). Gdy ustawisz CORS_ORIGINS,
// backend dopuszcza wyłącznie wymienione originy (oddzielone przecinkiem).
// Uwaga: nie używamy tu FRONTEND_URL, bo ten adres służy tylko do przekierowań
// OAuth — a frontend może być serwowany także przez sam backend (same-origin).
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ===== DIAGNOSTYKA CORS (tymczasowa) =====
console.log(
  "[CORS-DIAG] START process.env.CORS_ORIGINS =",
  JSON.stringify(process.env.CORS_ORIGINS || "(puste)")
);
console.log(
  "[CORS-DIAG] START process.env.FRONTEND_URL =",
  JSON.stringify(process.env.FRONTEND_URL || "(puste)")
);
console.log("[CORS-DIAG] START dozwolone originy =", JSON.stringify(CORS_ORIGINS));

const isOriginAllowed = (origin) => {
  // Brak nagłówka Origin (ten sam origin / proxy / curl) — zezwól.
  if (!origin) return true;
  // Brak jawnej listy dozwolonych lub "*" — tryb permissive.
  if (CORS_ORIGINS.length === 0) return true;
  return CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(origin);
};

// Tymczasowy middleware logujący origin każdego requestu HTTP.
app.use((req, res, next) => {
  console.log(
    `[CORS-DIAG] HTTP ${req.method} ${req.path} origin=${req.headers.origin || "(brak)"}`
  );
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      const allowed = isOriginAllowed(origin);
      console.log(
        `[CORS-DIAG] CORS decyzja origin=${origin || "(brak)"} dozwolony=${allowed}`
      );
      if (allowed) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Serve static frontend build
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// ===================== AUTENTYKACJA (Google OAuth + JWT) =====================

app.get("/auth/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res
      .status(503)
      .send(
        "Google OAuth nie jest skonfigurowany. Uzupełnij GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET w backend/.env"
      );
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/?auth=failed`,
  }),
  (req, res) => {
    const token = signToken(req.user);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_MAX_AGE_MS,
      path: "/",
    });
    res.redirect(`${FRONTEND_URL}/?auth=success`);
  }
);

app.get("/api/auth/me", async (req, res) => {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ user: null });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ user: null });

  try {
    const db = requireDb();
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    return res.json({ user: toPublicUser(user) });
  } catch {
    return res.status(503).json({ user: null, dbDisabled: true });
  }
});

app.patch("/api/auth/me", async (req, res) => {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ user: null });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ user: null });

  const { name, avatar } = req.body || {};
  const data = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 30);
  if (typeof avatar === "string" && avatar.trim()) data.avatar = avatar.trim().slice(0, 8);

  try {
    const db = requireDb();
    const user = await db.user.update({ where: { id: payload.sub }, data });
    return res.json({ user: toPublicUser(user) });
  } catch {
    return res.status(503).json({ user: null, dbDisabled: true });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

// Testowy endpoint do weryfikacji CORS (można usunąć po diagnozie).
app.get("/api/cors-test", (req, res) => {
  res.json({ ok: true });
});

// SPA fallback – for any non-static GET request, return index.html
app.use((req, res, next) => {
  // Skip socket.io and non-GET requests
  if (
    req.path.startsWith("/socket.io") ||
    req.path.startsWith("/api") ||
    req.method !== "GET"
  )
    return next();
  // If it looks like a page route (no file extension), serve index.html
  if (!req.path.includes(".")) {
    res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  } else {
    next();
  }
});

// Mapy timerów gry "Szpieg" (klucz = kod gry) — bicie serca i koniec czasu.
const szpiegTimers = new Map();

io.on("connection", (socket) => {
  console.log("[SERVER] Nowe połączenie:", socket.id);
  console.log(
    "[CORS-DIAG] SOCKET connection origin =",
    (socket.handshake.headers.origin || "(brak)")
  );

  // Store active answer timeouts per socket
  const answerTimeouts = {};

  const getModule = (game) => (game ? getGameModule(game.gameType) : null);

  // Emituje tajne role gry "Szpieg" indywidualnie do każdego gracza (rola + lokalizacja,
  // a Szpieg dodatkowo dostaje listę lokalizacji do wyszukiwarki przy Strzale Życia).
  const emitSzpiegRoles = (code) => {
    const game = engine.getGame(code);
    const mod = getModule(game);
    if (!game || !mod) return;
    game.players.forEach((p) => {
      if (p.socketId) {
        io.to(p.socketId).emit("szpieg-role", mod.getPlayerRole(game, p.id));
      }
    });
  };

  // Planuje bicie serca (ostatnie 10 s) i koniec czasu rundy Szpiega.
  const scheduleSzpiegTimers = (code, durationSec) => {
    clearSzpiegTimers(code);
    const heartbeatMs = Math.max(0, (durationSec - 10) * 1000);
    const timeupMs = durationSec * 1000;
    const timers = {};
    timers.heartbeat = setTimeout(() => {
      io.to(code).emit("szpieg-heartbeat");
    }, heartbeatMs);
    timers.timeup = setTimeout(() => {
      io.to(code).emit("szpieg-time-up");
    }, timeupMs);
    szpiegTimers.set(code, timers);
  };

  const clearSzpiegTimers = (code) => {
    const t = szpiegTimers.get(code);
    if (t) {
      clearTimeout(t.heartbeat);
      clearTimeout(t.timeup);
      szpiegTimers.delete(code);
    }
  };

  // Rozstrzyga aktywne oskarżenie w grze Szpieg (wszyscy zagłosowali).
  const resolveSzpiegPanic = (code) => {
    const game = engine.getGame(code);
    const mod = getModule(game);
    const r = mod && mod.resolvePanic ? mod.resolvePanic(game) : null;
    if (!r) return;
    clearSzpiegTimers(code);
    io.to(code).emit("szpieg-result", r);
    io.to(code).emit("szpieg-reveal", mod.reveal(game));
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
  };

  // Wspólne zakończenie rundy/gry dla gier imprezowych: aktualizacja punktów + koniec gry.
  const sendScoresAndGameOver = (code, result) => {
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
    if (result && result.gameOver) {
      const game = engine.getGame(code);
      if (game) game.status = "finished";
      let winner = result.winner;
      if (!winner && game) {
        const w = [...game.players].sort((a, b) => b.score - a.score)[0];
        winner = w ? w.name : "Nikt";
      }
      io.to(code).emit("game-over", { winner, scores: engine.getScores(code) });
    }
  };

  // Opuszcza bieżącą grę gracza: wychodzi z pokoju, usuwa gracza z listy
  // (gdy gra jest w lobby lub zakończona) i powiadamia pozostałych o zmianie.
  const leaveCurrentGame = (socket) => {
    const code = socket.data.gameCode;
    if (!code) return;
    socket.leave(code);

    const game = engine.getGame(code);
    const playerId = socket.data.playerId;
    if (game && playerId && (game.status === "lobby" || game.status === "finished")) {
      engine.removePlayer(code, playerId);
      const playersInGame = game.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
      }));
      io.to(code).emit("player-joined", { players: playersInGame });
    }

    socket.data.gameCode = null;
    socket.data.playerId = null;
  };

  // Host creates a game
  socket.on("create-game", ({ gameType } = {}) => {
    const code = engine.createGame(gameType || "quiz");
    const game = engine.getGame(code);
    game.hostId = socket.id;
    socket.join(code);
    socket.emit("game-created", { code, gameType: game.gameType });
    console.log("[SERVER] Gra utworzona:", code, "| typ:", game.gameType, "| host:", socket.id);
  });

  // Player joins a game
  socket.on("join-game", ({ code }) => {
    const game = engine.getGame(code);
    if (!game) {
      socket.emit("join-error", { message: "Nie znaleziono gry o tym kodzie" });
      return;
    }
    if (game.status !== "lobby") {
      socket.emit("join-error", { message: "Gra już się rozpoczęła" });
      return;
    }
    leaveCurrentGame(socket);
    socket.join(code);
    socket.data.gameCode = code;
    socket.emit("join-success", { code });
  });

  // Player sets their name and avatar
  socket.on("set-player", ({ code, name, avatar }) => {
    const game = engine.getGame(code);
    if (!game) {
      socket.emit("join-error", { message: "Gra nie istnieje" });
      return;
    }
    leaveCurrentGame(socket);
    socket.join(code);

    const player = engine.addPlayer(code, name, avatar);
    if (!player) {
      socket.emit("join-error", { message: "Nie można dołączyć do gry" });
      return;
    }
    if (player.full) {
      socket.emit("join-error", { message: `Gra jest pełna (max. ${player.max} graczy)` });
      return;
    }
    player.socketId = socket.id;
    socket.data.gameCode = code;
    socket.data.playerId = player.id;
    socket.emit("player-set", { player });

    const playersInGame = engine.getGame(code).players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
    }));
    io.to(code).emit("player-joined", { players: playersInGame });
  });

  // Player leaves a game (np. z lobby / po zakończeniu) — usuwa gracza z listy.
  socket.on("leave-game", ({ code, playerId }) => {
    leaveCurrentGame(socket);
  });

  // Host starts the game (delegacja do modułu gry)
  socket.on("start-game", ({ code, level, rounds, difficulty, duration } = {}) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    if (!mod || !mod.start) return;

    const result = mod.start(game, { level, rounds, difficulty, duration });
    if (!result || !result.ok) {
      socket.emit("start-error", { message: (result && result.error) || "Nie można rozpocząć gry" });
      return;
    }

    io.to(code).emit("game-started", { gameType: game.gameType });
    const TURN_BASED = ["prawda", "szalenstwo", "krol", "filmowy", "haslo", "karaoke"];
    if (TURN_BASED.includes(game.gameType)) {
      const turn = mod.getTurnPlayer(game);
      io.to(code).emit("turn-update", turn);
    } else if (game.gameType === "quiz") {
      io.to(code).emit("greeting", { text: game.greetingText });
    }
    // quiz-rapid / nigdy / kto-bardziej / memy / milionerzy / flip-cup — host sam uruchamia pierwszą rundę.
    if (game.gameType === "flip-cup") {
      io.to(code).emit("flip-state", mod.getState(game));
    }
    if (game.gameType === "szpieg") {
      emitSzpiegRoles(code);
      io.to(code).emit("szpieg-started", mod.getHostState(game));
    }
  });

  // Host triggers next question (quiz)
  socket.on("next-question", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const question = mod && mod.getNextQuestion ? mod.getNextQuestion(game) : null;
    if (question) {
      io.to(code).emit("question", {
        question: question.question,
        answers: question.answers,
      });
    } else {
      socket.emit("round-finished", { round: game.round });
    }
  });

  // Player buzzes in (quiz)
  socket.on("buzz", ({ code, playerId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const success = mod && mod.playerBuzz ? mod.playerBuzz(game, playerId) : false;
    if (success) {
      const player = engine.getPlayerById(code, playerId);
      io.to(code).emit("player-buzzed", { playerId, playerName: player.name });
      const question = mod.getCurrentQuestion(game);
      if (question) {
        socket.emit("show-answers", { answers: question.answers });
      }

      // 20-second timeout: if player doesn't answer, auto-fail
      answerTimeouts[playerId] = setTimeout(() => {
        const g = engine.getGame(code);
        if (!g || g.buzzedPlayerId !== playerId) return;
        const p = engine.getPlayerById(code, playerId);
        if (!p) return;

        p.lives -= 1;
        const eliminated = p.lives <= 0;
        const result = {
          correct: false,
          playerId,
          playerName: p.name,
          score: p.score,
          lives: p.lives,
          eliminated,
          timedOut: true,
        };

        mod.resetBuzzer(g);
        io.to(code).emit("answer-result", result);
        io.to(code).emit("buzzer-reset");
        io.to(code).emit("scores-update", { scores: engine.getScores(code) });

        if (eliminated && g.round === "finale" && g.players.filter((x) => x.lives > 0).length <= 1) {
          const winner = g.players.find((x) => x.lives > 0);
          io.to(code).emit("game-over", {
            winner: winner ? winner.name : "Nikt",
            scores: engine.getScores(code),
          });
        }

        delete answerTimeouts[playerId];
      }, 20000);
    }
  });

  // Player answers (quiz)
  socket.on("answer", ({ code, playerId, answerIndex }) => {
    if (answerTimeouts[playerId]) {
      clearTimeout(answerTimeouts[playerId]);
      delete answerTimeouts[playerId];
    }

    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.playerAnswer ? mod.playerAnswer(game, playerId, answerIndex) : null;
    if (!result) return;

    io.to(code).emit("answer-result", result);

    if (result.eliminated) {
      if (game.round === "finale" && game.players.filter((x) => x.lives > 0).length <= 1) {
        const winner = game.players.find((x) => x.lives > 0);
        io.to(code).emit("game-over", {
          winner: winner ? winner.name : "Nikt",
          scores: engine.getScores(code),
        });
        return;
      }
      if (game.round === "main" && game.players.filter((x) => x.lives > 0).length <= 2) {
        io.to(code).emit("player-eliminated-by-lives", {
          playerId: result.playerId,
          playerName: result.playerName,
        });
      }
    }

    io.to(code).emit("scores-update", { scores: engine.getScores(code) });

    setTimeout(() => {
      const g = engine.getGame(code);
      if (g && mod.resetBuzzer) mod.resetBuzzer(g);
      io.to(code).emit("buzzer-reset");
    }, 3000);
  });

  // Host triggers elimination (quiz)
  socket.on("trigger-elimination", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.eliminateLowestPlayer ? mod.eliminateLowestPlayer(game) : null;
    if (!result) {
      socket.emit("elimination-error", { message: "Nie można wyeliminować gracza" });
      return;
    }
    if (result.tiebreaker) {
      io.to(code).emit("tiebreaker-needed", {
        players: result.players.map((p) => ({ id: p.id, name: p.name })),
      });
    } else {
      io.to(code).emit("player-eliminated", {
        playerId: result.eliminated.id,
        playerName: result.eliminated.name,
      });
      io.to(code).emit("scores-update", { scores: engine.getScores(code) });
    }
  });

  // Host triggers tiebreaker question (quiz)
  socket.on("tiebreaker-question", ({ code, playerIds }) => {
    const eliminatedId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const player = engine.getPlayerById(code, eliminatedId);
    engine.removePlayer(code, eliminatedId);

    io.to(code).emit("player-eliminated", {
      playerId: eliminatedId,
      playerName: player ? player.name : "Gracz",
    });
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
  });

  // Host starts the finale (quiz)
  socket.on("start-finale", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    if (mod && mod.startFinale) mod.startFinale(game);
    io.to(code).emit("finale-started", { players: engine.getScores(code) });
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
  });

  // Host resets buzzer manually (quiz)
  socket.on("reset-buzzer", ({ code }) => {
    const game = engine.getGame(code);
    if (game && game.buzzedPlayerId) {
      const tid = answerTimeouts[game.buzzedPlayerId];
      if (tid) {
        clearTimeout(tid);
        delete answerTimeouts[game.buzzedPlayerId];
      }
    }
    const mod = getModule(game);
    if (mod && mod.resetBuzzer) mod.resetBuzzer(game);
    io.to(code).emit("buzzer-reset");
  });

  // ===================== PRAWDA CZY WYZWANIE =====================

  socket.on("choose-action", ({ code, playerId, choice }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.chooseAction ? mod.chooseAction(game, playerId, choice) : null;
    if (!result) return;
    io.to(code).emit("prompt", result);
  });

  // Host pokazuje kartę w grach tur-bazowanych (szalenstwo / krol / filmowy)
  socket.on("next-card", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.nextPrompt ? mod.nextPrompt(game) : null;
    if (!result) return;
    io.to(code).emit("prompt", result);
  });

  socket.on("skip-turn", ({ code }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.skipTurn ? mod.skipTurn(game) : null;
    if (!result) return;
    io.to(code).emit("skip-result", {
      playerId: result.playerId,
      playerName: result.playerName,
    });
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
    if (result.gameOver) {
      io.to(code).emit("game-over", {
        winner: result.winner,
        scores: engine.getScores(code),
      });
    } else {
      io.to(code).emit("turn-update", result.next);
    }
  });

  socket.on("start-vote", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.startVote ? mod.startVote(game) : null;
    if (!result) return;
    io.to(code).emit("vote-request", result);
  });

  socket.on("vote", ({ code, playerId, option }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.submitVote ? mod.submitVote(game, playerId, option) : null;
    if (!result) return;
    io.to(code).emit("vote-update", {
      votedCount: result.votedCount,
      voterCount: result.voterCount,
    });
    if (result.allVoted) {
      const final = mod.finalizeVote(game);
      io.to(code).emit("vote-result", final);
      io.to(code).emit("scores-update", { scores: engine.getScores(code) });
      if (final.gameOver) {
        io.to(code).emit("game-over", {
          winner: final.winner,
          scores: engine.getScores(code),
        });
      } else {
        io.to(code).emit("turn-update", final.next);
      }
    }
  });

  socket.on("finalize-vote", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const final = mod && mod.finalizeVote ? mod.finalizeVote(game) : null;
    if (!final) return;
    io.to(code).emit("vote-result", final);
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
    if (final.gameOver) {
      io.to(code).emit("game-over", {
        winner: final.winner,
        scores: engine.getScores(code),
      });
    } else {
      io.to(code).emit("turn-update", final.next);
    }
  });

  // ===================== SZYBKI QUIZ (quiz-rapid) =====================

  socket.on("rapid-answer", ({ code, playerId, answerIndex }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.submitAnswer ? mod.submitAnswer(game, playerId, answerIndex) : null;
    if (!result) return;
    io.to(code).emit("rapid-answered", {
      answeredCount: result.answeredCount,
      total: result.total,
    });
  });

  socket.on("rapid-reveal", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.finalizeRound ? mod.finalizeRound(game) : null;
    if (!result) return;
    io.to(code).emit("rapid-result", result);
    sendScoresAndGameOver(code, result);
  });

  // ===================== NIGDY PRZENIGDY =====================

  socket.on("nigdy-next", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.nextPrompt ? mod.nextPrompt(game) : null;
    if (!result) return;
    if (result.gameOver) {
      sendScoresAndGameOver(code, result);
    } else {
      io.to(code).emit("nigdy-prompt", result);
    }
  });

  socket.on("nigdy-answer", ({ code, playerId, did }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.answer ? mod.answer(game, playerId, did) : null;
    if (!result) return;
    io.to(code).emit("nigdy-answered", {
      answeredCount: result.answeredCount,
      total: result.total,
    });
  });

  socket.on("nigdy-reveal", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.reveal ? mod.reveal(game) : null;
    if (!result) return;
    io.to(code).emit("nigdy-reveal", result);
    sendScoresAndGameOver(code, result);
  });

  // ===================== KTO BARDZIEJ? =====================

  socket.on("kto-next", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.nextPrompt ? mod.nextPrompt(game) : null;
    if (!result) return;
    if (result.gameOver) {
      sendScoresAndGameOver(code, result);
    } else {
      io.to(code).emit("kto-prompt", result);
    }
  });

  socket.on("kto-vote", ({ code, playerId, targetId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.vote ? mod.vote(game, playerId, targetId) : null;
    if (!result) return;
    io.to(code).emit("kto-voted", {
      votedCount: result.votedCount,
      total: result.total,
    });
  });

  socket.on("kto-reveal", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.reveal ? mod.reveal(game) : null;
    if (!result) return;
    io.to(code).emit("kto-reveal", result);
    sendScoresAndGameOver(code, result);
  });

  // ===================== MEMY RZĄDZĄ =====================

  socket.on("memy-next", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.nextMeme ? mod.nextMeme(game) : null;
    if (!result) return;
    if (result.gameOver) {
      sendScoresAndGameOver(code, result);
    } else {
      io.to(code).emit("memy-prompt", result);
    }
  });

  socket.on("memy-caption", ({ code, playerId, text }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.submitCaption ? mod.submitCaption(game, playerId, text) : null;
    if (!result) return;
    io.to(code).emit("memy-caption-update", {
      captionCount: result.captionCount,
      total: result.total,
    });
  });

  socket.on("memy-start-vote", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.startVote ? mod.startVote(game) : null;
    if (!result) return;
    if (result.needMore) {
      socket.emit("memy-need-more", { count: result.count });
      return;
    }
    io.to(code).emit("memy-vote-request", result);
  });

  socket.on("memy-vote", ({ code, playerId, targetId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.vote ? mod.vote(game, playerId, targetId) : null;
    if (!result) return;
    io.to(code).emit("memy-vote-update", {
      votedCount: result.votedCount,
      total: result.total,
    });
    if (result.votedCount >= result.total) {
      const final = mod.finalizeVote(game);
      io.to(code).emit("memy-result", final);
      sendScoresAndGameOver(code, final);
    }
  });

  socket.on("memy-reveal", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const final = mod && mod.finalizeVote ? mod.finalizeVote(game) : null;
    if (!final) return;
    io.to(code).emit("memy-result", final);
    sendScoresAndGameOver(code, final);
  });

  // ===================== MILIONERZY PARTY =====================

  socket.on("milionerzy-next", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const q = mod && mod.getNextQuestion ? mod.getNextQuestion(game) : null;
    if (!q) return;
    io.to(code).emit("milionerzy-question", q);
  });

  socket.on("milionerzy-fifty", ({ code, playerId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.useFifty ? mod.useFifty(game, playerId) : null;
    if (result) socket.emit("milionerzy-fifty-result", result);
  });

  socket.on("milionerzy-friend", ({ code, playerId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.useFriend ? mod.useFriend(game, playerId) : null;
    if (result) socket.emit("milionerzy-friend-result", result);
  });

  socket.on("milionerzy-answer", ({ code, playerId, answerIndex }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const result = mod && mod.lockAnswer ? mod.lockAnswer(game, playerId, answerIndex) : null;
    if (!result) return;
    io.to(code).emit("milionerzy-answered", {
      answeredCount: result.answeredCount,
      total: result.total,
    });
  });

  socket.on("milionerzy-reveal", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.finalizeRound ? mod.finalizeRound(game) : null;
    if (!result) return;
    io.to(code).emit("milionerzy-result", result);
    sendScoresAndGameOver(code, result);
  });

  // ===================== FLIP CUP CHALLENGE (asystent) =====================

  socket.on("flip-start-timer", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.startTimer ? mod.startTimer(game) : null;
    if (!result) return;
    io.to(code).emit("flip-timer-started", result);
  });

  socket.on("flip-win-round", ({ code, teamId }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const result = mod && mod.winRound ? mod.winRound(game, teamId) : null;
    if (!result) return;
    io.to(code).emit("flip-round-won", result);
    io.to(code).emit("flip-state", mod.getState(game));
    sendScoresAndGameOver(code, result);
  });

  socket.on("flip-next", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    if (mod && mod.nextRound) mod.nextRound(game);
    io.to(code).emit("flip-state", mod.getState(game));
  });

  // ===================== ZGADNIJ HASŁO =====================

  socket.on("haslo-next", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const r = mod && mod.nextWord ? mod.nextWord(game) : null;
    if (!r) return;
    io.to(code).emit("haslo-word", r);
  });

  socket.on("haslo-guessed", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const r = mod && mod.resolve ? mod.resolve(game, true) : null;
    if (!r) return;
    io.to(code).emit("haslo-result", r);
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
    if (r.gameOver) {
      io.to(code).emit("game-over", {
        winner: r.winner,
        scores: engine.getScores(code),
      });
    } else {
      io.to(code).emit("turn-update", r.next);
    }
  });

  socket.on("haslo-skip", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const r = mod && mod.resolve ? mod.resolve(game, false) : null;
    if (!r) return;
    io.to(code).emit("haslo-result", r);
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
    if (r.gameOver) {
      io.to(code).emit("game-over", {
        winner: r.winner,
        scores: engine.getScores(code),
      });
    } else {
      io.to(code).emit("turn-update", r.next);
    }
  });

  // Rejoin – player reconnects after page refresh during game
  // ===================== SZPIEG (SPYFALL) =====================

  // Host uruchamia stoper rundy.
  socket.on("szpieg-start-timer", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const r = mod && mod.startTimer ? mod.startTimer(game) : null;
    if (!r) return;
    io.to(code).emit("szpieg-timer-started", r);
    scheduleSzpiegTimers(code, game.durationSec);
  });

  // Gracz oskarża (Panic Button): wybiera cel, gra się zamraża.
  socket.on("szpieg-accuse", ({ code, playerId, targetId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const r = mod && mod.accuse ? mod.accuse(game, playerId, targetId) : null;
    if (!r) return;
    clearSzpiegTimers(code);
    io.to(code).emit("szpieg-panic-started", r);
  });

  // Głos w oskarżeniu (TAK/NIE).
  socket.on("szpieg-panic-vote", ({ code, playerId, agree }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const r = mod && mod.votePanic ? mod.votePanic(game, playerId, agree) : null;
    if (!r) return;
    io.to(code).emit("szpieg-panic-progress", r);
    // Rozstrzygamy, gdy wszyscy uprawnieni zagłosowali.
    if (r.votedCount >= r.total) {
      resolveSzpiegPanic(code);
    }
  });

  // Strzał Życia — Szpieg zgaduje lokalizację (pudło = natychmiastowa porażka).
  socket.on("szpieg-shot", ({ code, playerId, locationId }) => {
    const game = engine.getGame(code);
    if (!game) return;
    const mod = getModule(game);
    const r = mod && mod.shot ? mod.shot(game, playerId, locationId) : null;
    if (!r) return;
    clearSzpiegTimers(code);
    io.to(code).emit("szpieg-result", r);
    io.to(code).emit("szpieg-reveal", mod.reveal(game));
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
  });

  // Host ujawnia rozwiązanie (bez punktów).
  socket.on("szpieg-reveal", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    io.to(code).emit("szpieg-reveal", mod.reveal(game));
  });

  // Werdykt hosta po końcu timera (spyWon = true/false).
  socket.on("szpieg-resolve", ({ code, spyWon }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const r = mod && mod.resolveHost ? mod.resolveHost(game, !!spyWon) : null;
    if (!r) return;
    clearSzpiegTimers(code);
    io.to(code).emit("szpieg-result", r);
    io.to(code).emit("szpieg-reveal", mod.reveal(game));
    io.to(code).emit("scores-update", { scores: engine.getScores(code) });
  });

  // Nowa runda (ponowne rozdanie, punkty zostają).
  socket.on("szpieg-next-round", ({ code }) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    const r = mod && mod.nextRound ? mod.nextRound(game) : null;
    if (!r) return;
    io.to(code).emit("szpieg-next-round");
    emitSzpiegRoles(code);
    io.to(code).emit("szpieg-started", mod.getHostState(game));
  });

  socket.on("rejoin-game", ({ code, playerId }) => {
    const game = engine.getGame(code);
    if (!game) {
      socket.emit("join-error", { message: "Nie znaleziono gry o tym kodzie" });
      return;
    }
    const player = engine.getPlayerById(code, playerId);
    if (!player) {
      socket.emit("join-error", { message: "Gracz nie istnieje w tej grze" });
      return;
    }
    player.socketId = socket.id;
    socket.join(code);
    socket.data.gameCode = code;
    socket.data.playerId = playerId;
    socket.emit("rejoin-success", { player, gameType: game.gameType });
    // Odtwórz listę graczy (potrzebna m.in. do wyboru celu oskarżenia w grze Szpieg).
    socket.emit("player-joined", {
      players: game.players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
    });

    const mod = getModule(game);

    // Gry tur-bazowane (Prawda/Wyzwanie + klony + hasło + karaoke) — odtwórz aktualny stan gry
    if (
      ["prawda", "szalenstwo", "krol", "filmowy", "haslo", "karaoke"].includes(
        game.gameType
      ) &&
      game.status === "round"
    ) {
      const turn = mod.getTurnPlayer(game);
      if (turn) socket.emit("turn-update", turn);
      if (game.currentPrompt) {
        socket.emit("prompt", {
          playerId: game.currentPrompt.playerId,
          playerName: game.currentPrompt.playerName,
          type: game.currentPrompt.type,
          text: game.currentPrompt.text,
          level: game.currentPrompt.level,
        });
      }
      if (game.votingActive && game.currentPrompt) {
        const voters = game.turnOrder.filter(
          (id) => id !== game.currentPrompt.playerId
        );
        socket.emit("vote-request", {
          playerId: game.currentPrompt.playerId,
          playerName: game.currentPrompt.playerName,
          voterCount: voters.length,
          voters,
        });
      }
    }

    // Send current question if one is active
    const question = mod && mod.getCurrentQuestion ? mod.getCurrentQuestion(game) : null;
    if (question && game.status !== "lobby" && game.status !== "greeting") {
      socket.emit("question", {
        question: question.question,
        answers: question.answers,
      });
    }

    // Send current scores
    socket.emit("scores-update", { scores: engine.getScores(code) });

    // Flip Cup — odtwórz stan drużyn i tablicy
    if (game.gameType === "flip-cup" && mod && mod.getState) {
      socket.emit("flip-state", mod.getState(game));
    }

    // Zgadnij Hasło — odtwórz aktualne hasło (klient pokazuje je tylko graczowi w turze)
    if (game.gameType === "haslo" && game.currentWord) {
      const turnPlayer = game.players.find(
        (p) => p.id === game.currentPlayerId
      );
      socket.emit("haslo-word", {
        playerId: game.currentPlayerId,
        playerName: turnPlayer ? turnPlayer.name : "",
        word: game.currentWord.word,
        taboo: game.currentWord.taboo || [],
      });
    }

    // Szpieg — odtwórz tajną rolę gracza oraz stan timera / oskarżenia / rozwiązania.
    if (game.gameType === "szpieg" && mod) {
      const role = mod.getPlayerRole ? mod.getPlayerRole(game, playerId) : null;
      if (role) socket.emit("szpieg-role", role);
      if (game.revealed) {
        socket.emit("szpieg-reveal", mod.reveal(game));
      } else if (game.paused && game.remainingMs != null) {
        socket.emit("szpieg-timer-started", {
          startedAt: Date.now() - (game.durationSec * 1000 - game.remainingMs),
          durationSec: game.durationSec,
        });
      } else if (game.timerStartedAt) {
        socket.emit("szpieg-timer-started", {
          startedAt: game.timerStartedAt,
          durationSec: game.durationSec,
        });
      }
      if (game.panic) {
        socket.emit("szpieg-panic-started", {
          accusedId: game.panic.accusedId,
          accusedName: game.panic.accusedName,
          initiatorId: game.panic.initiatorId,
          remainingMs: game.remainingMs,
        });
      }
    }

    // If game is in finale, notify
    if (game.round === "finale") {
      socket.emit("finale-started", { players: engine.getScores(code) });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Rozłączono:", socket.id);
    leaveCurrentGame(socket);
    Object.values(answerTimeouts).forEach((t) => clearTimeout(t));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer Teleturniej na porcie ${PORT} (dostępny z zewnątrz)`);
});