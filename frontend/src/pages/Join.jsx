import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useSearchParams } from "react-router-dom";
import { VOTE_OPTIONS } from "../data/truthOrDare";
import "../styles/theme.css";
import "../styles/player.css";

const AVATARS = ["🦊", "🐸", "🐱", "🐶", "🦄", "🐼", "🐨", "🦁"];
const BUZZER_TIME = 20;

export default function Join() {
  const socket = useSocket();
  const [searchParams] = useSearchParams();

  const codeFromUrl = searchParams.get("code") || "";
  const savedPlayerId = localStorage.getItem("playerId");
  const savedGameCode = localStorage.getItem("gameCode");

  const [gameCode, setGameCode] = useState(codeFromUrl || savedGameCode || "");
  const [step, setStep] = useState("code");
  const [playerName, setPlayerName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [playerId, setPlayerId] = useState(savedPlayerId || null);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [buzzerLocked, setBuzzerLocked] = useState(false);
  const [iBuzzed, setIBuzzed] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [answerResult, setAnswerResult] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [scores, setScores] = useState([]);
  const [myLives, setMyLives] = useState(3);
  const [gameOverData, setGameOverData] = useState(null);
  const [eliminated, setEliminated] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [buzzerTimeLeft, setBuzzerTimeLeft] = useState(0);

  // --- Prawda czy Wyzwanie ---
  const [gameType, setGameType] = useState("quiz");
  const [turnInfo, setTurnInfo] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [skipNotice, setSkipNotice] = useState(null);
  const [voteRequest, setVoteRequest] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [voteResult, setVoteResult] = useState(null);

  // Refs to avoid dependency issues in useEffect
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  const gameCodeRef = useRef(gameCode);
  gameCodeRef.current = gameCode;

  const buzzerTimerRef = useRef(null);

  // 20-second countdown timer when player has buzzed
  useEffect(() => {
    if (iBuzzed && !answered && !answerResult) {
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
  }, [iBuzzed, answered, answerResult]);

  // Track socket connection status
  useEffect(() => {
    if (!socket) return;
    
    setSocketConnected(socket.connected);
    
    const onConnect = () => {
      console.log("[Join] Socket connected:", socket.id);
      setSocketConnected(true);
    };
    const onDisconnect = () => {
      console.log("[Join] Socket disconnected");
      setSocketConnected(false);
    };
    
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  // Socket listeners + auto-rejoin or auto-join
  useEffect(() => {
    if (!socket) return;

    console.log("[Join] Registering socket listeners");

    socket.on("join-error", ({ message }) => {
      setError(message);
    });

    socket.on("join-success", ({ code }) => {
      setGameCode(code);
      setStep("setup");
      setError("");
    });

    socket.on("player-set", ({ player }) => {
      setPlayerId(player.id);
      setMyLives(player.lives);
      localStorage.setItem("playerId", player.id);
      saveGameCode();
      setStep("waiting");
    });

    socket.on("rejoin-success", ({ player, gameType: gt }) => {
      setPlayerId(player.id);
      setMyLives(player.lives);
      setPlayerName(player.name);
      setAvatar(player.avatar || AVATARS[0]);
      if (gt) setGameType(gt);
      localStorage.setItem("playerId", player.id);
      saveGameCode();
      setStep("playing");
      setError("");
      console.log("[Join] Rejoin successful, step set to playing for", player.name);
    });

    socket.on("player-joined", ({ players: playerList }) => {
      setPlayers(playerList);
    });

    socket.on("game-started", ({ gameType: gt } = {}) => {
      console.log("[Join] game-started received, setting step to playing");
      if (gt) setGameType(gt);
      setStep("playing");
    });

    socket.on("greeting", ({ text }) => {
      console.log("[Join] greeting received:", text);
      setStep("playing");
    });

    socket.on("question", (question) => {
      console.log("[Join] question received:", question.question);
      setCurrentQuestion(question);
      setShowAnswers(false);
      setAnswers([]);
      setAnswerResult(null);
      setAnswered(false);
      setIBuzzed(false);
      setBuzzerLocked(false);
    });

    socket.on("player-buzzed", ({ playerId: buzzedId }) => {
      if (buzzedId === playerIdRef.current) {
        setIBuzzed(true);
      } else {
        setBuzzerLocked(true);
      }
    });

    socket.on("show-answers", ({ answers: ans }) => {
      setShowAnswers(true);
      setAnswers(ans);
    });

    socket.on("answer-result", (result) => {
      setAnswerResult(result);
      setAnswered(true);
      if (result.playerId === playerIdRef.current) {
        setMyLives(result.lives);
      }
    });

    socket.on("buzzer-reset", () => {
      setBuzzerLocked(false);
      setIBuzzed(false);
      setShowAnswers(false);
      setAnswerResult(null);
      setAnswered(false);
    });

    socket.on("player-eliminated", ({ playerId: elimId }) => {
      if (elimId === playerIdRef.current) {
        setEliminated(true);
      }
    });

    socket.on("player-eliminated-by-lives", ({ playerId: elimId }) => {
      if (elimId === playerIdRef.current) {
        setEliminated(true);
      }
    });

    socket.on("game-over", (data) => {
      setGameOverData(data);
      setStep("finished");
    });

    socket.on("finale-started", () => {
      setMyLives(3);
      setStep("playing");
    });

    socket.on("scores-update", ({ scores: newScores }) => {
      setScores(newScores);
      const me = newScores.find((s) => s.id === playerIdRef.current);
      if (me) {
        setMyLives(me.lives);
      }
    });

    // --- Prawda czy Wyzwanie ---
    socket.on("turn-update", (info) => {
      setTurnInfo(info);
      setPrompt(null);
      setSkipNotice(null);
      setVoteRequest(null);
      setMyVote(null);
      setVoteResult(null);
    });

    socket.on("prompt", (p) => {
      setPrompt(p);
    });

    socket.on("skip-result", ({ playerName }) => {
      setSkipNotice({ playerName });
    });

    socket.on("vote-request", (req) => {
      setVoteRequest(req);
      setMyVote(null);
      setVoteResult(null);
    });

    socket.on("vote-result", (result) => {
      setVoteResult(result);
      setVoteRequest(null);
    });

    // Auto-rejoin if we have saved playerId + gameCode
    if (savedPlayerId && savedGameCode && savedGameCode.length === 6) {
      console.log("[Join] Auto-rejoining with playerId:", savedPlayerId, "| code:", savedGameCode);
      setGameCode(savedGameCode);
      socket.emit("rejoin-game", { code: savedGameCode, playerId: savedPlayerId });
    } else if (codeFromUrl && codeFromUrl.length === 6) {
      console.log("[Join] Auto-joining with code from URL:", codeFromUrl);
      socket.emit("join-game", { code: codeFromUrl });
    }

    return () => {
      console.log("[Join] Unregistering socket listeners");
      socket.off("join-error");
      socket.off("join-success");
      socket.off("player-set");
      socket.off("rejoin-success");
      socket.off("player-joined");
      socket.off("game-started");
      socket.off("greeting");
      socket.off("question");
      socket.off("player-buzzed");
      socket.off("show-answers");
      socket.off("answer-result");
      socket.off("buzzer-reset");
      socket.off("player-eliminated");
      socket.off("player-eliminated-by-lives");
      socket.off("game-over");
      socket.off("finale-started");
      socket.off("scores-update");
      socket.off("turn-update");
      socket.off("prompt");
      socket.off("skip-result");
      socket.off("vote-request");
      socket.off("vote-result");
    };
  }, [socket]); // Stable – only re-registers when socket changes

  const saveGameCode = () => {
    localStorage.setItem("gameCode", gameCodeRef.current);
  };

  const joinGame = useCallback(() => {
    if (gameCode.length !== 6) {
      setError("Kod musi mieć 6 cyfr");
      return;
    }
    socket.emit("join-game", { code: gameCode });
  }, [gameCode, socket]);

  const submitPlayer = useCallback(() => {
    if (!playerName.trim()) {
      setError("Wpisz swoją nazwę");
      return;
    }
    socket.emit("set-player", {
      code: gameCode,
      name: playerName.trim(),
      avatar,
    });
  }, [playerName, avatar, gameCode, socket]);

  const buzz = useCallback(() => {
    if (buzzerLocked || iBuzzed || eliminated) return;
    socket.emit("buzz", { code: gameCodeRef.current, playerId: playerIdRef.current });
  }, [buzzerLocked, iBuzzed, eliminated, socket]);

  const submitAnswer = useCallback(
    (index) => {
      if (answered) return;
      socket.emit("answer", {
        code: gameCodeRef.current,
        playerId: playerIdRef.current,
        answerIndex: index,
      });
    },
    [answered, socket]
  );

  const chooseAction = useCallback(
    (choice) => {
      socket.emit("choose-action", {
        code: gameCodeRef.current,
        playerId: playerIdRef.current,
        choice,
      });
    },
    [socket]
  );

  const skipTurn = useCallback(() => {
    socket.emit("skip-turn", { code: gameCodeRef.current });
  }, [socket]);

  const submitVote = useCallback(
    (option) => {
      socket.emit("vote", {
        code: gameCodeRef.current,
        playerId: playerIdRef.current,
        option,
      });
      setMyVote(option);
    },
    [socket]
  );

  const myScore = scores.find((s) => s.id === playerId);
  const myScorePoints = myScore ? myScore.score : 0;

  return (
    <div className="player-container">
      {/* CODE INPUT */}
      {step === "code" && (
        <div className="join-section fade-in">
          <h1 className="join-title">Dołącz do gry</h1>
          <input
            className="code-input"
            type="text"
            maxLength={6}
            placeholder="000000"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && joinGame()}
          />
          <button className="btn btn-start" onClick={joinGame}>
            Dołącz
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {/* NAME & AVATAR SETUP */}
      {step === "setup" && (
        <div className="setup-section fade-in">
          <h2 className="setup-title">Wybierz nazwę i obrazek</h2>
          <input
            className="name-input"
            type="text"
            placeholder="Twoja nazwa"
            maxLength={20}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPlayer()}
          />
          <div className="avatar-selection">
            <h3>Wybierz awatar:</h3>
            <div className="avatar-grid">
              {AVATARS.map((a) => (
                <div
                  key={a}
                  className={`avatar-option ${
                    avatar === a ? "selected" : ""
                  }`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-start" onClick={submitPlayer}>
            Gotowe!
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {/* WAITING FOR HOST */}
      {step === "waiting" && (
        <div className="waiting-section">
          <h2 className="waiting-title">
            {avatar} {playerName}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>
            Oczekiwanie na rozpoczęcie gry...
          </p>
          <p className="waiting-dots">. . .</p>
          {players.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "10px" }}>
                Dołączono: {players.length} graczy
              </p>
            </div>
          )}
        </div>
      )}

      {/* PLAYING (quiz) */}
      {step === "playing" && !eliminated && gameType !== "prawda" && (
        <div className="game-section">
          <div className="lives-display">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`heart ${i >= myLives ? "lost" : ""}`}
              >
                ❤️
              </span>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              color: "var(--accent-gold)",
              fontSize: "1.1rem",
              marginBottom: "15px",
            }}
          >
            Punkty: {myScorePoints}
          </p>

          {currentQuestion && (
            <div className="question-section-player">
              <p className="question-text-player">
                {currentQuestion.question}
              </p>
            </div>
          )}

          {!currentQuestion && (
            <div className="question-section-player">
              <p className="question-text-player" style={{ color: "var(--text-secondary)" }}>
                Oczekiwanie na pytanie...
              </p>
            </div>
          )}

          {!showAnswers && !answerResult && (
            <div className="buzzer-section">
              <button
                className={`buzzer-button ${
                  iBuzzed ? "buzzed" : ""
                }`}
                onClick={buzz}
                disabled={buzzerLocked || iBuzzed}
              >
                {iBuzzed
                  ? "Zgłoszono!"
                  : buzzerLocked
                  ? "Zablokowane"
                  : "Zgłaszam się!"}
              </button>
              {buzzerLocked && !iBuzzed && (
                <p className="locked-message">
                  Inny gracz się zgłosił...
                </p>
              )}
              {iBuzzed && !showAnswers && (
                <div style={{ marginTop: "10px" }}>
                  <p style={{ color: "var(--accent-gold)" }}>
                    Oczekiwanie na odpowiedzi...
                  </p>
                  {buzzerTimeLeft > 0 && (
                    <p style={{ 
                      color: buzzerTimeLeft <= 5 ? "var(--red-wrong)" : "var(--text-secondary)", 
                      fontSize: "1.1rem", 
                      marginTop: "5px" 
                    }}>
                      ⏱️ Czas: {buzzerTimeLeft}s
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {showAnswers && iBuzzed && !answered && (
            <div className="answers-section fade-in">
              <h3 className="answers-title">Wybierz odpowiedź:</h3>
              {buzzerTimeLeft > 0 && (
                <p style={{ 
                  color: buzzerTimeLeft <= 5 ? "var(--red-wrong)" : "var(--accent-gold)", 
                  textAlign: "center", 
                  marginBottom: "10px",
                  fontSize: "1.1rem"
                }}>
                  ⏱️ Czas do końca: {buzzerTimeLeft}s
                </p>
              )}
              {answers.map((answer, i) => (
                <button
                  key={i}
                  className="answer-button"
                  onClick={() => submitAnswer(i)}
                >
                  <strong>{String.fromCharCode(65 + i)}:</strong> {answer}
                </button>
              ))}
            </div>
          )}

          {answerResult && (
            <div
              className={`result-section ${
                answerResult.correct ? "correct" : "wrong"
              }`}
            >
              {answerResult.playerId === playerId ? (
                answerResult.correct ? (
                  <p>✅ Poprawna odpowiedź! +10 punktów!</p>
                ) : (
                  <p>❌ Błędna odpowiedź! {answerResult.timedOut ? "Czas minął! " : ""}-1 życie!</p>
                )
              ) : (
                <p>
                  {answerResult.playerName} odpowiedział{" "}
                  {answerResult.correct ? "poprawnie" : "błędnie"}!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* PLAYING (prawda) */}
      {step === "playing" && gameType === "prawda" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {turnInfo && (
            <div className="turn-banner">
              <span className="turn-label">Kolej:</span>
              <span className="turn-name">
                {turnInfo.playerId === playerId ? "Ty" : turnInfo.playerName}
              </span>
            </div>
          )}

          {turnInfo &&
            turnInfo.playerId === playerId &&
            !prompt &&
            !skipNotice && (
              <div className="choice-section fade-in">
                <h3>Wybierz kartę:</h3>
                <button
                  className="choice-card truth"
                  onClick={() => chooseAction("truth")}
                >
                  🟣 PRAWDA
                </button>
                <button
                  className="choice-card dare"
                  onClick={() => chooseAction("dare")}
                >
                  🔥 WYZWANIE
                </button>
                <button className="skip-button" onClick={skipTurn}>
                  😬 Spasuj
                </button>
              </div>
            )}

          {turnInfo &&
            turnInfo.playerId !== playerId &&
            !prompt &&
            !voteRequest &&
            !voteResult &&
            !skipNotice && (
              <div className="waiting-section">
                <p className="waiting-title">Kolej {turnInfo.playerName}…</p>
                <p className="waiting-dots">•••</p>
              </div>
            )}

          {skipNotice && (
            <div className="waiting-section">
              <p className="waiting-title">
                😬 {skipNotice.playerName} spasował!
              </p>
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
              <p className="prompt-player">
                {prompt.playerId === playerId
                  ? "To Ty!"
                  : `Dla: ${prompt.playerName}`}
              </p>
            </div>
          )}

          {voteRequest &&
            voteRequest.voters.includes(playerId) &&
            !myVote &&
            !voteResult && (
              <div className="vote-section fade-in">
                <h3>Oceń {voteRequest.playerName}:</h3>
                {VOTE_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    className="vote-button"
                    onClick={() => submitVote(o.key)}
                  >
                    {o.emoji} {o.label}{" "}
                    <span className="vote-points">+{o.points}</span>
                  </button>
                ))}
              </div>
            )}

          {voteRequest &&
            !voteRequest.voters.includes(playerId) &&
            !voteResult && (
              <div className="waiting-section">
                <p className="waiting-title">
                  Grupa ocenia Twoje wykonanie…
                </p>
                <p className="waiting-dots">•••</p>
              </div>
            )}

          {myVote && !voteResult && (
            <div className="waiting-section">
              <p className="waiting-title">Zagłosowano! Czekam na wynik…</p>
            </div>
          )}

          {voteResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {voteResult.playerId === playerId
                  ? `Zdobywasz ${voteResult.pointsAwarded} pkt!`
                  : `${voteResult.playerName}: +${voteResult.pointsAwarded} pkt`}
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

      {/* ELIMINATED */}
      {eliminated && step === "playing" && !gameOverData && (
        <div className="waiting-section">
          <h2 style={{ color: "var(--red-wrong)", fontSize: "2rem" }}>
            Odpadasz z gry!
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "15px" }}>
            Poczekaj na zakończenie gry...
          </p>
        </div>
      )}

      {/* GAME OVER */}
      {step === "finished" && gameOverData && (
        <div className="game-over-section">
          <h2 className="game-over-title">Koniec gry!</h2>
          <p className="game-over-winner">{gameOverData.winner}</p>
          <p className="game-over-subtitle">Zwycięzca!</p>
          <div className="final-scores">
            {gameOverData.scores.map((s, i) => (
              <div key={s.id} className="final-score-row">
                <span className="final-score-name">
                  {i + 1}. {s.name}
                </span>
                <span className="final-score-points">{s.score} pkt</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}