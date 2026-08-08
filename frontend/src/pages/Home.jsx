import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import QRCode from "qrcode";
import Scoreboard from "../components/Scoreboard";
import "../styles/theme.css";
import "../styles/host.css";

export default function Home() {
  const socket = useSocket();

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

  const roundRef = useRef(round);
  roundRef.current = round;

  const speakText = useCallback((text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pl-PL";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const createGame = () => {
    socket.emit("create-game");
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("game-created", async ({ code }) => {
      setGameCode(code);
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
      setEliminatedInfo(null);
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
    };
  }, [socket]); // Stable – only re-registers when socket changes

  const startGame = () => {
    socket.emit("start-game", { code: gameCode });
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

      {/* LOBBY */}
      {!gameCode && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button className="btn btn-start" onClick={createGame}>
            Stwórz grę
          </button>
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
              Gracze ({players.length})
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

      {/* GREETING */}
      {gameStatus === "greeting" && (
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
      {(gameStatus === "round" || gameStatus === "finale") && currentQuestion && (
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
              <button
                className="btn btn-next"
                style={{ marginTop: "10px", fontSize: "0.9rem", padding: "10px 30px" }}
                onClick={resetBuzzer}
              >
                Reset buzzera
              </button>
            </div>
          )}

          <Scoreboard scores={scores} />
        </>
      )}

      {/* ELIMINATION */}
      {gameStatus === "elimination" && (
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
                textShadow: "0 0 30px rgba(212, 175, 55, 0.6)",
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