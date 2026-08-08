const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const gameManager = require("./gameManager");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => res.send("Teleturniej Backend działa!"));

io.on("connection", (socket) => {
  console.log("[SERVER] Nowe połączenie:", socket.id);

  // Host creates a game
  socket.on("create-game", () => {
    const code = gameManager.createGame();
    const game = gameManager.getGame(code);
    game.hostId = socket.id;
    socket.join(code);
    socket.emit("game-created", { code });
    console.log("[SERVER] Gra utworzona:", code, "| host:", socket.id);
    console.log("[SERVER] Host dołączył do pokoju:", code);
  });

  // Player joins a game
  socket.on("join-game", ({ code }) => {
    console.log("[SERVER] join-game received | socket:", socket.id, "| code:", code);
    const game = gameManager.getGame(code);
    if (!game) {
      console.log("[SERVER] join-game FAILED: game not found for code", code);
      socket.emit("join-error", { message: "Nie znaleziono gry o tym kodzie" });
      return;
    }
    if (game.status !== "lobby") {
      console.log("[SERVER] join-game FAILED: game already started");
      socket.emit("join-error", { message: "Gra już się rozpoczęła" });
      return;
    }
    socket.join(code);
    console.log("[SERVER] Gracz", socket.id, "dołączył do pokoju:", code);
    socket.emit("join-success", { code });
  });

  // Player sets their name and avatar
  socket.on("set-player", ({ code, name, avatar }) => {
    console.log("[SERVER] set-player received | socket:", socket.id, "| name:", name, "| code:", code);
    
    // Ensure socket is in the room (in case join-game was skipped)
    const game = gameManager.getGame(code);
    if (!game) {
      console.log("[SERVER] set-player FAILED: game not found");
      socket.emit("join-error", { message: "Gra nie istnieje" });
      return;
    }
    
    // Auto-join the socket to the room if not already joined
    socket.join(code);
    console.log("[SERVER] Socket", socket.id, "joined room:", code);
    
    const player = gameManager.addPlayer(code, name, avatar);
    if (!player) {
      console.log("[SERVER] set-player FAILED: could not add player");
      socket.emit("join-error", { message: "Nie można dołączyć do gry" });
      return;
    }
    player.socketId = socket.id;
    console.log("[SERVER] Player created:", player.id, player.name);
    console.log("[SERVER] Sending player-set to socket:", socket.id);
    socket.emit("player-set", { player });
    
    const playersInGame = gameManager.getGame(code).players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
    }));
    console.log("[SERVER] Broadcasting player-joined to room:", code, "| players:", playersInGame.length);
    io.to(code).emit("player-joined", { players: playersInGame });
  });

  // Host starts the game
  socket.on("start-game", ({ code }) => {
    console.log("[SERVER] start-game received | socket:", socket.id, "| code:", code);
    const game = gameManager.getGame(code);
    if (!game || game.hostId !== socket.id) {
      console.log("[SERVER] start-game FAILED: game not found or wrong host");
      return;
    }

    const started = gameManager.startGame(code);
    if (!started) {
      console.log("[SERVER] start-game FAILED: not enough players");
      socket.emit("start-error", { message: "Za mało graczy (min. 2)" });
      return;
    }

    console.log("[SERVER] Emitting game-started to room:", code);
    console.log("[SERVER] Room has", game.players.length, "players with socketIds:", game.players.map(p => p.socketId));
    io.to(code).emit("game-started");
    io.to(code).emit("greeting", { text: game.greetingText });
    console.log("[SERVER] game-started and greeting emitted to room:", code);
  });

  // Host triggers next question
  socket.on("next-question", ({ code }) => {
    const game = gameManager.getGame(code);
    if (!game || game.hostId !== socket.id) return;

    const question = gameManager.getNextQuestion(code);
    if (question) {
      // Send question without answers to players (only host sees full info initially)
      io.to(code).emit("question", {
        question: question.question,
        answers: question.answers,
      });
    } else {
      // No more questions in main round - time for elimination
      socket.emit("round-finished", { round: game.round });
    }
  });

  // Player buzzes in
  socket.on("buzz", ({ code, playerId }) => {
    const success = gameManager.playerBuzz(code, playerId);
    if (success) {
      const player = gameManager.getPlayerById(code, playerId);
      io.to(code).emit("player-buzzed", {
        playerId,
        playerName: player.name,
      });
      // Send the current question answers to the buzzed player
      const question = gameManager.getCurrentQuestion(code);
      if (question) {
        socket.emit("show-answers", { answers: question.answers });
      }
    }
  });

  // Player answers
  socket.on("answer", ({ code, playerId, answerIndex }) => {
    const result = gameManager.playerAnswer(code, playerId, answerIndex);
    if (!result) return;

    io.to(code).emit("answer-result", result);

    if (result.eliminated) {
      const game = gameManager.getGame(code);
      // Check if game should end (finale)
      if (game.round === "finale" && game.players.filter(p => p.lives > 0).length <= 1) {
        const winner = game.players.find(p => p.lives > 0);
        io.to(code).emit("game-over", {
          winner: winner ? winner.name : "Nikt",
          scores: gameManager.getScores(code),
        });
        return;
      }
      // In main round, check if only 2 players left
      if (game.round === "main" && game.players.filter(p => p.lives > 0).length <= 2) {
        // Eliminated due to lives - handle gracefully
        io.to(code).emit("player-eliminated-by-lives", {
          playerId: result.playerId,
          playerName: result.playerName,
        });
      }
    }

    io.to(code).emit("scores-update", {
      scores: gameManager.getScores(code),
    });

    // Reset buzzer after a delay for host to see result
    setTimeout(() => {
      gameManager.resetBuzzer(code);
    }, 3000);
  });

  // Host triggers elimination after finishing 10 questions
  socket.on("trigger-elimination", ({ code }) => {
    const result = gameManager.eliminateLowestPlayer(code);
    if (!result) {
      socket.emit("elimination-error", { message: "Nie można wyeliminować gracza" });
      return;
    }

    if (result.tiebreaker) {
      io.to(code).emit("tiebreaker-needed", {
        players: result.players.map(p => ({ id: p.id, name: p.name })),
      });
    } else {
      io.to(code).emit("player-eliminated", {
        playerId: result.eliminated.id,
        playerName: result.eliminated.name,
      });
      io.to(code).emit("scores-update", {
        scores: gameManager.getScores(code),
      });
    }
  });

  // Host triggers tiebreaker question
  socket.on("tiebreaker-question", ({ code, playerIds }) => {
    // Simple approach: randomly eliminate one tied player
    const eliminatedId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const player = gameManager.getPlayerById(code, eliminatedId);
    gameManager.removePlayer(code, eliminatedId);
    
    io.to(code).emit("player-eliminated", {
      playerId: eliminatedId,
      playerName: player ? player.name : "Gracz",
    });
    io.to(code).emit("scores-update", {
      scores: gameManager.getScores(code),
    });
  });

  // Host starts the finale
  socket.on("start-finale", ({ code }) => {
    const game = gameManager.getGame(code);
    if (!game || game.hostId !== socket.id) return;

    gameManager.startFinale(code);
    io.to(code).emit("finale-started", {
      players: gameManager.getScores(code),
    });
    io.to(code).emit("scores-update", {
      scores: gameManager.getScores(code),
    });
  });

  // Host resets buzzer manually
  socket.on("reset-buzzer", ({ code }) => {
    gameManager.resetBuzzer(code);
    io.to(code).emit("buzzer-reset");
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Rozłączono:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serwer Teleturniej na porcie ${PORT}`);
});