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

const isOriginAllowed = (origin) => {
  // Brak nagłówka Origin (ten sam origin / proxy / curl) — zezwól.
  if (!origin) return true;
  // Brak jawnej listy dozwolonych lub "*" — tryb permissive.
  if (CORS_ORIGINS.length === 0) return true;
  return CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(origin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
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

io.on("connection", (socket) => {
  console.log("[SERVER] Nowe połączenie:", socket.id);

  // Store active answer timeouts per socket
  const answerTimeouts = {};

  const getModule = (game) => (game ? getGameModule(game.gameType) : null);

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
    socket.join(code);
    socket.emit("join-success", { code });
  });

  // Player sets their name and avatar
  socket.on("set-player", ({ code, name, avatar }) => {
    const game = engine.getGame(code);
    if (!game) {
      socket.emit("join-error", { message: "Gra nie istnieje" });
      return;
    }
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
    socket.emit("player-set", { player });

    const playersInGame = engine.getGame(code).players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
    }));
    io.to(code).emit("player-joined", { players: playersInGame });
  });

  // Host starts the game (delegacja do modułu gry)
  socket.on("start-game", ({ code, level, rounds } = {}) => {
    const game = engine.getGame(code);
    if (!game || game.hostId !== socket.id) return;
    const mod = getModule(game);
    if (!mod || !mod.start) return;

    const result = mod.start(game, { level, rounds });
    if (!result || !result.ok) {
      socket.emit("start-error", { message: (result && result.error) || "Nie można rozpocząć gry" });
      return;
    }

    io.to(code).emit("game-started", { gameType: game.gameType });
    if (game.gameType === "prawda") {
      const turn = mod.getTurnPlayer(game);
      io.to(code).emit("turn-update", turn);
    } else {
      io.to(code).emit("greeting", { text: game.greetingText });
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

  // Rejoin – player reconnects after page refresh during game
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
    socket.emit("rejoin-success", { player, gameType: game.gameType });

    const mod = getModule(game);

    // Prawda czy Wyzwanie — odtwórz aktualny stan gry
    if (game.gameType === "prawda" && game.status === "round") {
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

    // If game is in finale, notify
    if (game.round === "finale") {
      socket.emit("finale-started", { players: engine.getScores(code) });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Rozłączono:", socket.id);
    Object.values(answerTimeouts).forEach((t) => clearTimeout(t));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer Teleturniej na porcie ${PORT} (dostępny z zewnątrz)`);
});