import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Scoreboard from "../components/Scoreboard";
import { LEVELS, ROUND_OPTIONS, VOTE_OPTIONS } from "../data/truthOrDare";
import "../styles/theme.css";
import "../styles/host.css";

const MAX_PLAYERS = 8;
const BUZZER_TIME = 20;

export default function Host() {
  const socket = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.has("game");

  const [gameCode, setGameCode] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState("lobby");
  const [greetingText, setGreetingText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [round, setRound] = useState("");
  const [eliminatedInfo, setEliminatedInfo] = useState(null);
  const [tiebreakerPlayers, setTiebreakerPlayers] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [showQuestion, setShowQuestion] = useState(true);
  const [buzzerTimeLeft, setBuzzerTimeLeft] = useState(0);
  const [connected, setConnected] = useState(socket.connected);
  const [startError, setStartError] = useState("");

  // --- Prawda czy Wyzwanie ---
  const [gameType, setGameType] = useState(
    searchParams.get("game") === "prawda" ? "prawda" : "quiz"
  );
  const [prawdaLevel, setPrawdaLevel] = useState("grzeczne");
  const [prawdaRounds, setPrawdaRounds] = useState(2);
  const [turnInfo, setTurnInfo] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [skipInfo, setSkipInfo] = useState(null);
  const [voteProgress, setVoteProgress] = useState(null);
  const [voteResult, setVoteResult] = useState(null);

  const roundRef = useRef(round);
  roundRef.current = round;
  const googleVoiceRef = useRef(null);
  const buzzerTimerRef = useRef(null);

  // Śledzenie stanu połączenia z serwerem
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    setConnected(socket.connected);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  // 20-second countdown timer when a player buzzes
  useEffect(() => {
    if (buzzedPlayer && !answerResult) {
      setBuzzerTimeLeft(BUZZER_TIME);
      const start = Date.now();
      buzzerTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const left = BUZZER_TIME - elapsed;
        setBuzzerTimeLeft(left > 0 ? left : 0);
        if (left <= 0) {
          clearInterval(buzzerTimerRef.current);
        }
      }, 200);
    } else {
      setBuzzerTimeLeft(0);
      if (buzzerTimerRef.current) {
        clearInterval(buzzerTimerRef.current);
        buzzerTimerRef.current = null;
      }
    }
    return () => {
      if (buzzerTimerRef.current) {
        clearInterval(buzzerTimerRef.current);
      }
    };
  }, [buzzedPlayer, answerResult]);

  // Load Google Polish voice (best quality on Chrome)
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const google = voices.find(
        (v) => v.name.includes("Google") && v.lang.startsWith("pl")
      );
      if (google) {
        googleVoiceRef.current = google;
        console.log("[Speak] Google Polish voice loaded:", google.name);
      }
    };
    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakText = useCallback((text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pl-PL";
      utterance.rate = 0.9;
      if (googleVoiceRef.current) {
        utterance.voice = googleVoiceRef.current;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const createGame = () => {
    if (!socket.connected) {
      setStartError(
        "Brak połączenia z serwerem. Uruchom backend (npm run dev) i spróbuj ponownie."
      );
      return;
    }
    setStartError("");
    socket.emit("create-game", { gameType });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("game-created", async ({ code, gameType: gt }) => {
      setGameCode(code);
      if (gt) setGameType(gt);
      const joinUrl = `${window.location.origin}/join?code=${code}`;
      try {
        const dataUrl = await QRCode.toDataURL(joinUrl, { width: 200 });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("QR error:", err);
      }
    });

    socket.on("player-joined", ({ players: playerList }) => {
      setPlayers(playerList);
    });

    socket.on("game-started", () => {
      // Game status will change when greeting comes
    });

    socket.on("greeting", ({ text }) => {
      setGameStatus("greeting");
      setGreetingText(text);
      speakText(text);
    });

    socket.on("question", (question) => {
      setGameStatus(roundRef.current === "finale" ? "finale" : "round");
      setCurrentQuestion(question);
      setBuzzedPlayer(null);
      setAnswerResult(null);
      setShowQuestion(true);
      speakText(question.question);
    });

    socket.on("player-buzzed", ({ playerId, playerName }) => {
      setBuzzedPlayer({ id: playerId, name: playerName });
      setAnswerResult(null);
    });

    socket.on("answer-result", (result) => {
      setAnswerResult(result);
      setShowQuestion(true);
    });

    socket.on("scores-update", ({ scores: newScores }) => {
      setScores(newScores);
    });

    socket.on("round-finished", ({ round: r }) => {
      setRound(r);
      setGameStatus("elimination");
      setCurrentQuestion(null);
      setBuzzedPlayer(null);
      setAnswerResult(null);
    });

    socket.on("player-eliminated", ({ playerId, playerName }) => {
      setEliminatedInfo({ playerId, playerName });
      setTiebreakerPlayers(null);
    });

    socket.on("player-eliminated-by-lives", ({ playerId, playerName }) => {
      setEliminatedInfo({ playerId, playerName, byLives: true });
    });

    socket.on("tiebreaker-needed", ({ players: tied }) => {
      setTiebreakerPlayers(tied);
    });

    socket.on("finale-started", ({ players: finalePlayers }) => {
      setRound("finale");
      setGameStatus("finale");
      setCurrentQuestion(null);
      setEliminatedInfo(null);
      setTiebreakerPlayers(null);
      speakText("Rozpoczynamy finał! Życia zostały zresetowane!");
    });

    socket.on("game-over", (data) => {
      setGameOverData(data);
      setGameStatus("finished");
      speakText(`Zwycięzcą zostaje ${data.winner}! Gratulacje!`);
    });

    socket.on("buzzer-reset", () => {
      setBuzzedPlayer(null);
      setAnswerResult(null);
    });

    // --- Prawda czy Wyzwanie ---
    socket.on("turn-update", (info) => {
      setTurnInfo(info);
      setPrompt(null);
      setSkipInfo(null);
      setVoteProgress(null);
      setVoteResult(null);
      setGameStatus("round");
    });

    socket.on("prompt", (p) => {
      setPrompt(p);
      speakText(p.text);
    });

    socket.on("skip-result", ({ playerName }) => {
      setSkipInfo({ playerName });
      setPrompt(null);
    });

    socket.on("vote-request", ({ voterCount }) => {
      setVoteProgress({ votedCount: 0, voterCount });
      setVoteResult(null);
    });

    socket.on("vote-update", ({ votedCount, voterCount }) => {
      setVoteProgress({ votedCount, voterCount });
    });

    socket.on("vote-result", (result) => {
      setVoteResult(result);
      setVoteProgress(null);
    });

    return () => {
      socket.off("game-created");
      socket.off("player-joined");
      socket.off("game-started");
      socket.off("greeting");
      socket.off("question");
      socket.off("player-buzzed");
      socket.off("answer-result");
      socket.off("scores-update");
      socket.off("round-finished");
      socket.off("player-eliminated");
      socket.off("player-eliminated-by-lives");
      socket.off("tiebreaker-needed");
      socket.off("finale-started");
      socket.off("game-over");
      socket.off("buzzer-reset");
      socket.off("turn-update");
      socket.off("prompt");
      socket.off("skip-result");
      socket.off("vote-request");
      socket.off("vote-update");
      socket.off("vote-result");
    };
  }, [socket]);

  const startGame = () => {
    if (gameType === "prawda") {
      socket.emit("start-game", {
        code: gameCode,
        level: prawdaLevel,
        rounds: prawdaRounds,
      });
    } else {
      socket.emit("start-game", { code: gameCode });
    }
  };

  const startVote = () => {
    socket.emit("start-vote", { code: gameCode });
  };

  const finalizeVote = () => {
    socket.emit("finalize-vote", { code: gameCode });
  };

  const nextQuestion = () => {
    socket.emit("next-question", { code: gameCode });
  };

  const triggerElimination = () => {
    socket.emit("trigger-elimination", { code: gameCode });
  };

  const resolveTiebreaker = () => {
    const playerIds = tiebreakerPlayers.map((p) => p.id);
    socket.emit("tiebreaker-question", { code: gameCode, playerIds });
  };

  const startFinale = () => {
    socket.emit("start-finale", { code: gameCode });
  };

  const resetBuzzer = () => {
    socket.emit("reset-buzzer", { code: gameCode });
  };

  const joinUrl = gameCode
    ? `${window.location.origin}/join?code=${gameCode}`
    : "";

  return (
    <div className="host-container">
      <div className="host-header">
        <h1 className="host-title">TELETURNIEJ</h1>
        <p className="host-subtitle">Panel Prowadzącego</p>
      </div>

      {!connected && (
        <div
          style={{
            textAlign: "center",
            margin: "12px auto 0",
            maxWidth: "640px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(255, 170, 0, 0.12)",
            border: "1px solid rgba(255, 170, 0, 0.4)",
            color: "#ffd400",
            fontWeight: "bold",
            fontSize: "0.95rem",
          }}
        >
          ⚠️ Brak połączenia z serwerem — uruchom backend (<code>npm run dev</code>)
        </div>
      )}

      {/* LOBBY — wybór gry + stworzenie */}
      {!gameCode && (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          {!preselected && (
            <>
              <h2
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                  fontSize: "1.2rem",
                }}
              >
                Wybierz grę, którą chcesz prowadzić:
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: "30px",
                }}
              >
                <button
                  className={`game-type-card ${
                    gameType === "quiz" ? "selected" : ""
                  }`}
                  onClick={() => setGameType("quiz")}
                >
                  <span className="game-type-emoji">🧠</span>
                  <span className="game-type-name">Kwak Kwiz</span>
                  <span className="game-type-desc">Quiz z buzzerem</span>
                </button>
                <button
                  className={`game-type-card ${
                    gameType === "prawda" ? "selected" : ""
                  }`}
                  onClick={() => setGameType("prawda")}
                >
                  <span className="game-type-emoji">🔥</span>
                  <span className="game-type-name">Prawda czy Wyzwanie</span>
                  <span className="game-type-desc">Karty + głosowanie</span>
                </button>
              </div>
            </>
          )}

          {preselected && (
            <h2
              style={{
                color: "var(--accent-gold-light)",
                marginBottom: "20px",
                fontSize: "1.6rem",
              }}
            >
              {gameType === "prawda" ? "🔥 Prawda czy Wyzwanie" : "🧠 Kwak Kwiz"}
            </h2>
          )}

          {gameType === "prawda" && (
            <div className="settings-panel fade-in">
              <h3>Ustawienia gry</h3>
              <div className="settings-group">
                <label>Poziom kart:</label>
                <div className="level-grid">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      className={`level-chip ${
                        prawdaLevel === l.id ? "selected" : ""
                      }`}
                      onClick={() => setPrawdaLevel(l.id)}
                    >
                      {l.emoji} {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-group">
                <label>Liczba rund (każdy gracz ma kolejkę w rundzie):</label>
                <div className="level-grid">
                  {ROUND_OPTIONS.map((r) => (
                    <button
                      key={r}
                      className={`level-chip ${
                        prawdaRounds === r ? "selected" : ""
                      }`}
                      onClick={() => setPrawdaRounds(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameType === "quiz" && preselected && (
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "24px",
                fontSize: "1rem",
              }}
            >
              Quiz z buzzerem — kto pierwszy, ten lepszy. 2–8 graczy.
            </p>
          )}

          {startError && (
            <p
              style={{
                color: "var(--red-wrong)",
                marginBottom: "16px",
                fontWeight: "bold",
              }}
            >
              {startError}
            </p>
          )}

          <button className="btn btn-start" onClick={createGame}>
            Start
          </button>

          {preselected && (
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => navigate("/gry")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  textDecoration: "underline",
                }}
              >
                ← Zmień grę
              </button>
            </div>
          )}
        </div>
      )}

      {gameCode && gameStatus === "lobby" && (
        <>
          <div className="game-code-section">
            <div className="game-code-label">Kod gry</div>
            <div className="game-code">{gameCode}</div>
            {qrDataUrl && (
              <div className="qr-container">
                <img src={qrDataUrl} alt="QR Code" />
              </div>
            )}
            <div className="join-url">{joinUrl}</div>
          </div>

          <div className="players-list">
            <h2>
              Gracze ({players.length} / {MAX_PLAYERS})
            </h2>
            {players.length === 0 && (
              <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
                Oczekiwanie na graczy...
              </p>
            )}
            {players.map((p) => {
              const avatars = ["🦊", "🐸", "🐱", "🐶", "🦄", "🐼", "🐨", "🦁"];
              const idx = players.indexOf(p) % avatars.length;
              return (
                <div key={p.id} className="player-item">
                  <div className="player-avatar">{avatars[idx]}</div>
                  <div className="player-name">{p.name}</div>
                </div>
              );
            })}
          </div>

          {gameType === "prawda" && (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "10px",
              }}
            >
              🎴 Poziom: {LEVELS.find((l) => l.id === prawdaLevel)?.label} ·
              Rund: {prawdaRounds}
            </p>
          )}

          <button
            className="btn btn-start"
            onClick={startGame}
            disabled={players.length < 2}
          >
            Rozpocznij grę
          </button>
          {players.length < 2 && (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-secondary)",
                marginTop: "10px",
              }}
            >
              Potrzeba minimum 2 graczy
            </p>
          )}
        </>
      )}

      {/* PRAWDA CZY WYZWANIE — ROZGRYWKA */}
      {gameType === "prawda" && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {turnInfo && (
            <div className="turn-banner">
              <span className="turn-label">Kolej:</span>
              <span className="turn-name">{turnInfo.playerName}</span>
              <span className="turn-rounds">
                Runda {turnInfo.totalRounds - turnInfo.roundsLeft + 1} /{" "}
                {turnInfo.totalRounds}
              </span>
            </div>
          )}

          {!prompt && !skipInfo && !voteProgress && !voteResult && turnInfo && (
            <div className="prawda-info">
              <p>
                Czekam, aż <strong>{turnInfo.playerName}</strong> wybierze…
              </p>
            </div>
          )}

          {skipInfo && (
            <div className="prawda-info">
              <p>😬 {skipInfo.playerName} spasował i dostaje 0 pkt!</p>
            </div>
          )}

          {prompt && (
            <div
              className={`prompt-card ${
                prompt.type === "truth" ? "truth" : "dare"
              }`}
            >
              <div className="prompt-badge">
                {prompt.type === "truth" ? "🟣 PRAWDA" : "🔥 WYZWANIE"}
              </div>
              <p className="prompt-text">{prompt.text}</p>
              <p className="prompt-player">Dla: {prompt.playerName}</p>
            </div>
          )}

          {prompt && !voteProgress && !voteResult && (
            <div className="controls-section">
              <button className="btn btn-next" onClick={startVote}>
                🗳️ Rozpocznij głosowanie
              </button>
            </div>
          )}

          {voteProgress && (
            <div className="vote-panel">
              <p className="vote-title">Trwa głosowanie…</p>
              <p className="vote-count">
                {voteProgress.votedCount} / {voteProgress.voterCount} głosów
              </p>
              <button className="btn btn-elimination" onClick={finalizeVote}>
                Podlicz głosy teraz
              </button>
            </div>
          )}

          {voteResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {voteResult.playerName} zdobywa {voteResult.pointsAwarded} pkt
              </p>
              <div className="vote-breakdown">
                {VOTE_OPTIONS.map((o) => {
                  const count = voteResult.breakdown[o.key] || 0;
                  if (count === 0) return null;
                  return (
                    <span key={o.key} className="vote-chip">
                      {o.emoji} {o.label}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GREETING */}
      {gameType !== "prawda" && gameStatus === "greeting" && (
        <>
          <div className="greeting-section">
            <p className="greeting-text">{greetingText}</p>
          </div>
          <Scoreboard scores={scores.length > 0 ? scores : players.map(p => ({ ...p, lives: 3 }))} />
          <div className="controls-section">
            <button className="btn btn-next" onClick={nextQuestion}>
              Pierwsze pytanie
            </button>
          </div>
        </>
      )}

      {/* ROUND / FINALE QUESTION */}
      {gameType !== "prawda" &&
        (gameStatus === "round" || gameStatus === "finale") &&
        currentQuestion && (
        <>
          {showQuestion && (
            <div className="question-section-host fade-in">
              <p className="question-text-host">{currentQuestion.question}</p>
              <div className="answers-grid-host">
                {currentQuestion.answers.map((answer, i) => {
                  let className = "answer-cell";
                  if (answerResult) {
                    if (i === answerResult.correctAnswer) {
                      className += " correct-highlight";
                    }
                  }
                  const labels = ["A", "B", "C", "D"];
                  return (
                    <div key={i} className={className}>
                      <strong>{labels[i]}:</strong> {answer}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {buzzedPlayer && !answerResult && (
            <div className="buzzer-info">
              <p>
                Zgłosił się:{" "}
                <span className="buzzed-player">{buzzedPlayer.name}</span>
              </p>
              {buzzerTimeLeft > 0 && (
                <p style={{ color: buzzerTimeLeft <= 5 ? "var(--red-wrong)" : "var(--accent-gold)", fontSize: "1.2rem", marginTop: "5px" }}>
                  ⏱️ Czas na odpowiedź: {buzzerTimeLeft}s
                </p>
              )}
            </div>
          )}

          {answerResult && (
            <div
              className={`result-message ${
                answerResult.correct ? "correct" : "wrong"
              }`}
            >
              <p>
                {answerResult.playerName}:{" "}
                {answerResult.correct
                  ? "✅ POPRAWNA ODPOWIEDŹ! +10 punktów"
                  : "❌ BŁĘDNA ODPOWIEDŹ! -1 życie"}
              </p>
              {answerResult.eliminated && (
                <p style={{ marginTop: "10px", fontSize: "1rem" }}>
                  ⚠️ {answerResult.playerName} stracił wszystkie życia!
                </p>
              )}
              {answerResult.timedOut && (
                <p style={{ marginTop: "5px", color: "var(--accent-gold)" }}>
                  ⏰ Czas minął!
                </p>
              )}
              {!answerResult.eliminated && (
                <button
                  className="btn btn-next"
                  style={{ marginTop: "15px" }}
                  onClick={nextQuestion}
                >
                  Następne pytanie
                </button>
              )}
              {answerResult.eliminated && gameStatus === "round" && (
                <button
                  className="btn btn-next"
                  style={{ marginTop: "15px" }}
                  onClick={nextQuestion}
                >
                  Następne pytanie
                </button>
              )}
              {answerResult.eliminated && gameStatus === "finale" && (
                <p style={{ marginTop: "10px" }}>
                  Sprawdź czy gra się zakończyła...
                </p>
              )}
            </div>
          )}

          {!buzzedPlayer && !answerResult && (
            <div className="buzzer-info">
              <p style={{ color: "var(--text-secondary)" }}>
                Oczekiwanie na zgłoszenie gracza...
              </p>
            </div>
          )}

          {/* Reset buzzer button always available */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button
              className="btn btn-next"
              style={{ fontSize: "0.9rem", padding: "10px 30px" }}
              onClick={resetBuzzer}
            >
              Reset buzzera
            </button>
          </div>

          <Scoreboard scores={scores} />
        </>
      )}

      {/* FINALE READY – waiting for first question */}
      {gameType !== "prawda" && gameStatus === "finale" && !currentQuestion && (
        <>
          <Scoreboard scores={scores} />
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <h2 style={{ color: "var(--accent-gold)", marginBottom: "15px" }}>
              🏆 FINAŁ! 🏆
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px" }}>
              Życia zresetowane. Czas na decydującą rozgrywkę!
            </p>
            <button className="btn btn-start" onClick={nextQuestion}>
              Pokaż pierwsze pytanie finałowe
            </button>
          </div>
        </>
      )}

      {/* ELIMINATION */}
      {gameType !== "prawda" && gameStatus === "elimination" && (
        <>
          <Scoreboard scores={scores} />
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2
              style={{
                color: "var(--accent-gold)",
                marginBottom: "15px",
              }}
            >
              Koniec rundy {round === "main" ? "głównej" : ""}!
            </h2>
            {!eliminatedInfo && !tiebreakerPlayers && (
              <>
                <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Czas na eliminację gracza z najmniejszą liczbą punktów.
                </p>
                <button className="btn btn-elimination" onClick={triggerElimination}>
                  Eliminuj najsłabszego gracza
                </button>
              </>
            )}

            {tiebreakerPlayers && (
              <div className="elimination-modal">
                <div className="elimination-content">
                  <h2>Remis!</h2>
                  <p>
                    Gracze z tą samą liczbą punktów:{" "}
                    {tiebreakerPlayers.map((p) => p.name).join(", ")}
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Losowo wyeliminowany zostanie jeden z nich.
                  </p>
                  <button className="btn btn-elimination" onClick={resolveTiebreaker}>
                    Eliminuj losowo
                  </button>
                </div>
              </div>
            )}

            {eliminatedInfo && !eliminatedInfo.byLives && (
              <div className="elimination-modal">
                <div className="elimination-content">
                  <h2>Gracz wyeliminowany!</h2>
                  <p style={{ fontSize: "1.5rem", color: "var(--red-wrong)" }}>
                    {eliminatedInfo.playerName}
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    odpada z gry z najmniejszą liczbą punktów
                  </p>
                  <button className="btn btn-finale" onClick={startFinale}>
                    Rozpocznij finał!
                  </button>
                </div>
              </div>
            )}

            {eliminatedInfo && eliminatedInfo.byLives && (
              <div className="elimination-modal">
                <div className="elimination-content">
                  <h2>Gracz wyeliminowany!</h2>
                  <p style={{ fontSize: "1.5rem", color: "var(--red-wrong)" }}>
                    {eliminatedInfo.playerName}
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    stracił wszystkie życia
                  </p>
                  <button className="btn btn-finale" onClick={startFinale}>
                    Rozpocznij finał!
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* GAME OVER */}
      {gameStatus === "finished" && gameOverData && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              background: "var(--bg-panel)",
              borderRadius: "var(--radius-lg)",
              padding: "40px",
              border: "2px solid var(--accent-gold)",
              marginBottom: "20px",
            }}
          >
            <h1
              style={{
                fontSize: "3rem",
                color: "var(--accent-gold-light)",
                marginBottom: "15px",
                textShadow: "0 0 30px rgba(255, 212, 0, 0.6)",
              }}
            >
              🏆 KONIEC GRY! 🏆
            </h1>
            <p
              style={{
                fontSize: "2.5rem",
                color: "var(--accent-gold)",
                fontWeight: "bold",
              }}
            >
              {gameOverData.winner}
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
              Zwycięzca!
            </p>
          </div>
          <Scoreboard scores={gameOverData.scores} />
        </div>
      )}
    </div>
  );
}