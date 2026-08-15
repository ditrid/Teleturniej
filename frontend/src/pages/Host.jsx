import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Scoreboard from "../components/Scoreboard";
import { LEVELS, ROUND_OPTIONS, VOTE_OPTIONS } from "../data/truthOrDare";
import VideoOverlay from "../components/VideoOverlay";
import { LOADING_VIDEOS, randomOf } from "../videos";
import "../styles/theme.css";
import "../styles/host.css";

const MAX_PLAYERS = 8;
const BUZZER_TIME = 20;

const GAME_META = {
  quiz: { name: "Kwak Kwiz", emoji: "🧠", desc: "Quiz z buzzerem" },
  prawda: { name: "Prawda czy Wyzwanie", emoji: "🔥", desc: "Karty + głosowanie" },
  "quiz-rapid": { name: "Szybki Quiz", emoji: "⚡", desc: "Wszyscy odpowiadają naraz" },
  nigdy: { name: "Nigdy Przenigdy", emoji: "💋", desc: "Kto ma coś na sumieniu" },
  "kto-bardziej": { name: "Kto Bardziej?", emoji: "🕺", desc: "Głosowanie na gracza" },
  memy: { name: "Memy Rządzą", emoji: "🤣", desc: "Podpisy pod memy" },
  milionerzy: { name: "Milionerzy Party", emoji: "💰", desc: "Drabinka ze stawkami" },
  szalenstwo: { name: "Szaleństwo Pytania", emoji: "🍻", desc: "Szalone pytania" },
  krol: { name: "Król Imprezy", emoji: "👑", desc: "Wyzwania na turę" },
  filmowy: { name: "Filmowy Kwak", emoji: "🎬", desc: "Filmowe scenki" },
  "flip-cup": { name: "Flip Cup Challenge", emoji: "🥤", desc: "Asystent gry fizycznej" },
  melodia: { name: "Melodia czy Fałsz", emoji: "🎧", desc: "Zgadnij utwór po tekście" },
  haslo: { name: "Zgadnij Hasło", emoji: "🔤", desc: "Opisz hasło, grupa zgaduje" },
  karaoke: { name: "Karaoke Challenge", emoji: "🎤", desc: "Zaśpiewaj, publiczność ocenia" },
};

// Formatowanie kwot (np. 1 000 000 zł)
const money = (n) => `${(n || 0).toLocaleString("pl-PL")} zł`;

// Formatowanie czasu (ms) → np. "12.4 s" lub "1:05"
const formatTime = (ms) => {
  if (!ms || ms < 0) return "0.0 s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const dec = Math.floor((ms % 1000) / 100);
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}.${dec} s`;
};

// Gry oparte o turę (kolejność graczy + głosowanie)
const isTurnGame = (t) =>
  ["prawda", "szalenstwo", "krol", "filmowy", "karaoke"].includes(t);

// Quizy "wszyscy naraz" (odpowiedzi jednoczesne)
const isRapidQuiz = (t) => ["quiz-rapid", "melodia"].includes(t);

// Etykiety kart (prompt.type -> wygląd)
const PROMPT_BADGES = {
  truth: { emoji: "🟣", label: "PRAWDA", className: "truth" },
  dare: { emoji: "🔥", label: "WYZWANIE", className: "dare" },
  szalenstwo: { emoji: "🍻", label: "SZALEŃSTWO PYTANIA", className: "truth" },
  krol: { emoji: "👑", label: "KRÓL IMPREZY", className: "dare" },
  filmowy: { emoji: "🎬", label: "FILMOWY KWAK", className: "truth" },
  karaoke: { emoji: "🎤", label: "KARAOKE", className: "dare" },
};

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
  const [loadingVideo] = useState(() => randomOf(LOADING_VIDEOS));


  const [startError, setStartError] = useState("");

  // --- Prawda czy Wyzwanie ---
  const [gameType, setGameType] = useState(searchParams.get("game") || "quiz");
  const [prawdaLevel, setPrawdaLevel] = useState("grzeczne");
  const [prawdaRounds, setPrawdaRounds] = useState(2);
  const [turnInfo, setTurnInfo] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [skipInfo, setSkipInfo] = useState(null);
  const [voteProgress, setVoteProgress] = useState(null);
  const [voteResult, setVoteResult] = useState(null);

  // --- Szybki Quiz ---
  const [rapidProgress, setRapidProgress] = useState(null);
  const [rapidResult, setRapidResult] = useState(null);

  // --- Nigdy Przenigdy ---
  const [nigdyPrompt, setNigdyPrompt] = useState(null);
  const [nigdyProgress, setNigdyProgress] = useState(null);
  const [nigdyReveal, setNigdyReveal] = useState(null);

  // --- Kto Bardziej? ---
  const [ktoPrompt, setKtoPrompt] = useState(null);
  const [ktoProgress, setKtoProgress] = useState(null);
  const [ktoReveal, setKtoReveal] = useState(null);

  // --- Memy Rządzą ---
  const [memyPrompt, setMemyPrompt] = useState(null);
  const [memyProgress, setMemyProgress] = useState(null);
  const [memyVoteRequest, setMemyVoteRequest] = useState(null);
  const [memyResult, setMemyResult] = useState(null);
  const [memyNeedMore, setMemyNeedMore] = useState(null);

  // --- Milionerzy Party ---
  const [milionerzyQuestion, setMilionerzyQuestion] = useState(null);
  const [milionerzyProgress, setMilionerzyProgress] = useState(null);
  const [milionerzyResult, setMilionerzyResult] = useState(null);

  // --- Flip Cup Challenge ---
  const [flipState, setFlipState] = useState(null);
  const [flipResult, setFlipResult] = useState(null);
  const [flipNow, setFlipNow] = useState(0);

  // --- Zgadnij Hasło ---
  const [hasloWord, setHasloWord] = useState(null);
  const [hasloResult, setHasloResult] = useState(null);

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

  // Licznik czasu rundy Flip Cup
  useEffect(() => {
    const startedAt = flipState && flipState.timerStartedAt;
    if (!startedAt) {
      setFlipNow(0);
      return;
    }
    const tick = () => setFlipNow(Date.now());
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [flipState && flipState.timerStartedAt]);

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

    socket.on("game-started", ({ gameType: gt }) => {
      if (gt === "quiz" || gt === "prawda") return; // greeting / turn-update ustawią status
      setGameStatus("round");
      setCurrentQuestion(null);
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

    // --- Szybki Quiz ---
    socket.on("rapid-answered", ({ answeredCount, total }) => {
      setRapidProgress({ answeredCount, total });
    });
    socket.on("rapid-result", (result) => {
      setRapidResult(result);
      setRapidProgress(null);
    });

    // --- Nigdy Przenigdy ---
    socket.on("nigdy-prompt", (p) => {
      setNigdyPrompt(p);
      setNigdyProgress(null);
      setNigdyReveal(null);
      speakText(p.prompt);
    });
    socket.on("nigdy-answered", ({ answeredCount, total }) => {
      setNigdyProgress({ answeredCount, total });
    });
    socket.on("nigdy-reveal", (r) => {
      setNigdyReveal(r);
      setNigdyProgress(null);
    });

    // --- Kto Bardziej? ---
    socket.on("kto-prompt", (p) => {
      setKtoPrompt(p);
      setKtoProgress(null);
      setKtoReveal(null);
      speakText(p.prompt);
    });
    socket.on("kto-voted", ({ votedCount, total }) => {
      setKtoProgress({ votedCount, total });
    });
    socket.on("kto-reveal", (r) => {
      setKtoReveal(r);
      setKtoProgress(null);
    });

    // --- Memy Rządzą ---
    socket.on("memy-prompt", (p) => {
      setMemyPrompt(p);
      setMemyProgress(null);
      setMemyVoteRequest(null);
      setMemyResult(null);
      setMemyNeedMore(null);
    });
    socket.on("memy-caption-update", ({ captionCount, total }) => {
      setMemyProgress({ captionCount, total });
    });
    socket.on("memy-vote-request", (req) => {
      setMemyVoteRequest(req);
    });
    socket.on("memy-result", (r) => {
      setMemyResult(r);
      setMemyVoteRequest(null);
      setMemyProgress(null);
    });
    socket.on("memy-need-more", ({ count }) => {
      setMemyNeedMore(count);
    });

    // --- Milionerzy Party ---
    socket.on("milionerzy-question", (q) => {
      setMilionerzyQuestion(q);
      setMilionerzyProgress(null);
      setMilionerzyResult(null);
      speakText(q.question);
    });
    socket.on("milionerzy-answered", ({ answeredCount, total }) => {
      setMilionerzyProgress({ answeredCount, total });
    });
    socket.on("milionerzy-result", (r) => {
      setMilionerzyResult(r);
      setMilionerzyProgress(null);
    });

    // --- Flip Cup Challenge ---
    socket.on("flip-state", (s) => {
      setFlipState(s);
    });
    socket.on("flip-timer-started", ({ startedAt }) => {
      setFlipState((prev) =>
        prev ? { ...prev, timerStartedAt: startedAt } : prev
      );
      setFlipResult(null);
    });
    socket.on("flip-round-won", (r) => {
      setFlipResult(r);
      setFlipState((prev) =>
        prev ? { ...prev, timerStartedAt: null } : prev
      );
    });

    // --- Zgadnij Hasło ---
    socket.on("haslo-word", (w) => {
      setHasloWord(w);
      setHasloResult(null);
    });
    socket.on("haslo-result", (r) => {
      setHasloResult(r);
      setHasloWord(null);
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
      socket.off("rapid-answered");
      socket.off("rapid-result");
      socket.off("nigdy-prompt");
      socket.off("nigdy-answered");
      socket.off("nigdy-reveal");
      socket.off("kto-prompt");
      socket.off("kto-voted");
      socket.off("kto-reveal");
      socket.off("memy-prompt");
      socket.off("memy-caption-update");
      socket.off("memy-vote-request");
      socket.off("memy-result");
      socket.off("memy-need-more");
      socket.off("milionerzy-question");
      socket.off("milionerzy-answered");
      socket.off("milionerzy-result");
      socket.off("flip-state");
      socket.off("flip-timer-started");
      socket.off("flip-round-won");
      socket.off("haslo-word");
      socket.off("haslo-result");
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

  // Kolejna karta w grach tur-bazowanych (szalenstwo / krol / filmowy)
  const nextCard = () => {
    socket.emit("next-card", { code: gameCode });
  };

  // --- Szybki Quiz ---
  const rapidReveal = () => {
    socket.emit("rapid-reveal", { code: gameCode });
  };
  const rapidNextQuestion = () => {
    setRapidResult(null);
    setRapidProgress(null);
    socket.emit("next-question", { code: gameCode });
  };

  // --- Nigdy Przenigdy ---
  const nigdyNext = () => {
    setNigdyReveal(null);
    socket.emit("nigdy-next", { code: gameCode });
  };
  const nigdyRevealRound = () => {
    socket.emit("nigdy-reveal", { code: gameCode });
  };

  // --- Kto Bardziej? ---
  const ktoNext = () => {
    setKtoReveal(null);
    socket.emit("kto-next", { code: gameCode });
  };
  const ktoRevealRound = () => {
    socket.emit("kto-reveal", { code: gameCode });
  };

  // --- Memy Rządzą ---
  const memyNext = () => {
    setMemyResult(null);
    setMemyNeedMore(null);
    socket.emit("memy-next", { code: gameCode });
  };
  const memyStartVote = () => {
    setMemyNeedMore(null);
    socket.emit("memy-start-vote", { code: gameCode });
  };
  const memyRevealRound = () => {
    socket.emit("memy-reveal", { code: gameCode });
  };

  // --- Milionerzy Party ---
  const milionerzyNext = () => {
    setMilionerzyResult(null);
    setMilionerzyProgress(null);
    socket.emit("milionerzy-next", { code: gameCode });
  };
  const milionerzyReveal = () => {
    socket.emit("milionerzy-reveal", { code: gameCode });
  };

  // --- Flip Cup Challenge ---
  const flipStartTimer = () =>
    socket.emit("flip-start-timer", { code: gameCode });
  const flipWinRound = (teamId) =>
    socket.emit("flip-win-round", { code: gameCode, teamId });
  const flipNext = () => {
    setFlipResult(null);
    socket.emit("flip-next", { code: gameCode });
  };

  // --- Zgadnij Hasło ---
  const hasloNext = () => {
    setHasloResult(null);
    setHasloWord(null);
    socket.emit("haslo-next", { code: gameCode });
  };
  const hasloGuessed = () => socket.emit("haslo-guessed", { code: gameCode });
  const hasloSkip = () => socket.emit("haslo-skip", { code: gameCode });

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
                {Object.entries(GAME_META).map(([key, meta]) => (
                  <button
                    key={key}
                    className={`game-type-card ${
                      gameType === key ? "selected" : ""
                    }`}
                    onClick={() => setGameType(key)}
                  >
                    <span className="game-type-emoji">{meta.emoji}</span>
                    <span className="game-type-name">{meta.name}</span>
                    <span className="game-type-desc">{meta.desc}</span>
                  </button>
                ))}
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
              {GAME_META[gameType]
                ? `${GAME_META[gameType].emoji} ${GAME_META[gameType].name}`
                : "🧠 Kwak Kwiz"}
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
          <VideoOverlay variant="background" src={loadingVideo} loop dim />
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

      {/* GRY TUR-BAZOWANE (prawda / szalenstwo / krol / filmowy) */}
      {isTurnGame(gameType) && gameStatus === "round" && (
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
              {gameType === "prawda" ? (
                <p>
                  Czekam, aż <strong>{turnInfo.playerName}</strong> wybierze…
                </p>
              ) : (
                <>
                  <p>
                    Kolej <strong>{turnInfo.playerName}</strong>. Pokaż kartę, aby
                    zacząć.
                  </p>
                  <button className="btn btn-next" onClick={nextCard}>
                    Pokaż kartę
                  </button>
                </>
              )}
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
                PROMPT_BADGES[prompt.type]?.className || "truth"
              }`}
            >
              <div className="prompt-badge">
                {PROMPT_BADGES[prompt.type]?.emoji}{" "}
                {PROMPT_BADGES[prompt.type]?.label}
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

      {/* SZYBKI QUIZ / MELODIA — ROZGRYWKA */}
      {isRapidQuiz(gameType) && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {!currentQuestion && !rapidResult && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                Wszyscy gracze odpowiadają jednocześnie na telefonach.
              </p>
              <button className="btn btn-start" onClick={rapidNextQuestion}>
                Pokaż pierwsze pytanie
              </button>
            </div>
          )}

          {currentQuestion && (
            <div className="question-section-host fade-in">
              <p className="question-text-host">{currentQuestion.question}</p>
              <div className="answers-grid-host">
                {currentQuestion.answers.map((answer, i) => {
                  let className = "answer-cell";
                  if (rapidResult && i === rapidResult.correctIndex) {
                    className += " correct-highlight";
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

          {currentQuestion && !rapidResult && (
            <div className="controls-section">
              {rapidProgress ? (
                <p style={{ color: "var(--text-secondary)" }}>
                  Odpowiedziało: {rapidProgress.answeredCount} / {rapidProgress.total}
                </p>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>
                  Czekam na odpowiedzi graczy…
                </p>
              )}
              <button className="btn btn-next" onClick={rapidReveal}>
                Odkryj odpowiedzi
              </button>
            </div>
          )}

          {rapidResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                ✅ Poprawna: {rapidResult.correctAnswer}
              </p>
              <div className="vote-breakdown">
                {rapidResult.results.map((r) => (
                  <span key={r.playerId} className="vote-chip">
                    {r.correct ? "✅" : "❌"} {r.playerName}
                  </span>
                ))}
              </div>
              {!rapidResult.gameOver ? (
                <button
                  className="btn btn-next"
                  style={{ marginTop: "15px" }}
                  onClick={rapidNextQuestion}
                >
                  Następne pytanie
                </button>
              ) : (
                <p style={{ marginTop: "15px", color: "var(--accent-gold)" }}>
                  To było ostatnie pytanie!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* NIGDY PRZENIGDY — ROZGRYWKA */}
      {gameType === "nigdy" && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {!nigdyPrompt && !nigdyReveal && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                Czytaj karty na głos. Gracze przyznają się (TAK/NIE) na telefonach.
              </p>
              <button className="btn btn-start" onClick={nigdyNext}>
                Pokaż pierwszą kartę
              </button>
            </div>
          )}

          {nigdyPrompt && (
            <div className="prompt-card truth">
              <div className="prompt-badge">💋 NIGDY PRZENIGDY</div>
              <p className="prompt-text">{nigdyPrompt.prompt}</p>
              <p className="prompt-player">
                Runda {nigdyPrompt.round} / {nigdyPrompt.total}
              </p>
            </div>
          )}

          {nigdyProgress && nigdyPrompt && !nigdyReveal && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
              Przyznało się: {nigdyProgress.answeredCount} / {nigdyProgress.total}
            </p>
          )}

          {nigdyPrompt && !nigdyReveal && (
            <div className="controls-section">
              <button className="btn btn-next" onClick={nigdyRevealRound}>
                Odkryj, kto to robił
              </button>
            </div>
          )}

          {nigdyReveal && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">„{nigdyReveal.prompt}"</p>
              <p style={{ marginTop: "10px", color: "var(--red-wrong)" }}>
                ✅ TAK ({nigdyReveal.yesCount}):{" "}
                {nigdyReveal.yesNames.join(", ") || "—"}
              </p>
              <p style={{ marginTop: "5px", color: "var(--text-secondary)" }}>
                ❌ NIE ({nigdyReveal.noCount}):{" "}
                {nigdyReveal.noNames.join(", ") || "—"}
              </p>
              <button
                className="btn btn-next"
                style={{ marginTop: "15px" }}
                onClick={nigdyNext}
              >
                Następna karta
              </button>
            </div>
          )}
        </div>
      )}

      {/* KTO BARDZIEJ? — ROZGRYWKA */}
      {gameType === "kto-bardziej" && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {!ktoPrompt && !ktoReveal && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                Gracze głosują, kto z nich najbardziej pasuje do opisu.
              </p>
              <button className="btn btn-start" onClick={ktoNext}>
                Pokaż pierwszą kartę
              </button>
            </div>
          )}

          {ktoPrompt && (
            <div className="prompt-card dare">
              <div className="prompt-badge">🕺 KTO BARDZIEJ?</div>
              <p className="prompt-text">{ktoPrompt.prompt}</p>
              <p className="prompt-player">
                Runda {ktoPrompt.round} / {ktoPrompt.total}
              </p>
            </div>
          )}

          {ktoProgress && ktoPrompt && !ktoReveal && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
              Głosów: {ktoProgress.votedCount} / {ktoProgress.total}
            </p>
          )}

          {ktoPrompt && !ktoReveal && (
            <div className="controls-section">
              <button className="btn btn-next" onClick={ktoRevealRound}>
                Podlicz głosy
              </button>
            </div>
          )}

          {ktoReveal && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {ktoReveal.winnerName
                  ? `🏆 ${ktoReveal.winnerName} wygrywa rundę!`
                  : "Brak głosów"}
              </p>
              <p style={{ color: "var(--text-secondary)", marginTop: "5px" }}>
                „{ktoReveal.prompt}"
              </p>
              <div className="vote-breakdown">
                {Object.entries(ktoReveal.counts)
                  .filter(([, c]) => c > 0)
                  .map(([pid, c]) => {
                    const p = players.find((x) => x.id === pid);
                    return (
                      <span key={pid} className="vote-chip">
                        {p?.name || "?"}: {c}
                      </span>
                    );
                  })}
              </div>
              <button
                className="btn btn-next"
                style={{ marginTop: "15px" }}
                onClick={ktoNext}
              >
                Następna karta
              </button>
            </div>
          )}
        </div>
      )}

      {/* MEMY RZĄDZĄ — ROZGRYWKA */}
      {gameType === "memy" && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {!memyPrompt && !memyResult && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                Pokaż mema. Gracze wpisują najlepszy podpis, a potem głosujemy.
              </p>
              <button className="btn btn-start" onClick={memyNext}>
                Pokaż pierwszego mema
              </button>
            </div>
          )}

          {memyPrompt && (
            <div className="prompt-card">
              <div className="prompt-badge">🤣 MEMY RZĄDZĄ</div>
              <p className="prompt-text" style={{ fontSize: "4rem", lineHeight: 1 }}>
                {memyPrompt.meme.emoji}
              </p>
              <p className="prompt-text">{memyPrompt.meme.text}</p>
              <p className="prompt-player">
                Runda {memyPrompt.round} / {memyPrompt.total}
              </p>
            </div>
          )}

          {memyProgress && memyPrompt && !memyVoteRequest && !memyResult && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>
              Podpisów: {memyProgress.captionCount} / {memyProgress.total}
            </p>
          )}

          {memyNeedMore !== null && (
            <p style={{ color: "var(--red-wrong)", textAlign: "center" }}>
              Za mało podpisów (masz {memyNeedMore}) — poczekaj na więcej.
            </p>
          )}

          {memyPrompt && !memyVoteRequest && !memyResult && (
            <div className="controls-section">
              <button className="btn btn-next" onClick={memyStartVote}>
                Rozpocznij głosowanie
              </button>
            </div>
          )}

          {memyVoteRequest && (
            <div className="vote-panel">
              <p className="vote-title">Głosowanie na najlepszy podpis…</p>
              {memyVoteRequest.captions.map((c) => (
                <div key={c.playerId} className="prompt-card">
                  <p className="prompt-text">„{c.text}"</p>
                  <p className="prompt-player">— {c.playerName}</p>
                </div>
              ))}
              <button className="btn btn-elimination" onClick={memyRevealRound}>
                Podlicz głosy
              </button>
            </div>
          )}

          {memyResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {memyResult.winnerName
                  ? `🏆 ${memyResult.winnerName} +10 pkt!`
                  : "Brak zwycięzcy"}
              </p>
              {memyResult.winnerCaption && (
                <p style={{ color: "var(--accent-gold)", marginTop: "5px" }}>
                  „{memyResult.winnerCaption}"
                </p>
              )}
              <button
                className="btn btn-next"
                style={{ marginTop: "15px" }}
                onClick={memyNext}
              >
                Następny mem
              </button>
            </div>
          )}
        </div>
      )}

      {/* MILIONERZY PARTY — ROZGRYWKA */}
      {gameType === "milionerzy" && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {!milionerzyQuestion && !milionerzyResult && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                Drabinka pytań z rosnącymi stawkami. Gracze grają równolegle.
              </p>
              <button className="btn btn-start" onClick={milionerzyNext}>
                Pokaż pierwsze pytanie
              </button>
            </div>
          )}

          {milionerzyQuestion && (
            <div className="question-section-host fade-in">
              <p className="question-text-host">{milionerzyQuestion.question}</p>
              <p
                style={{
                  color: "var(--accent-gold)",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginTop: "10px",
                }}
              >
                💰 {money(milionerzyQuestion.prize)}
                {milionerzyQuestion.guaranteed ? " — PRÓG GWARANTOWANY" : ""}
              </p>
              <div className="answers-grid-host">
                {milionerzyQuestion.answers.map((answer, i) => {
                  let className = "answer-cell";
                  if (milionerzyResult && i === milionerzyResult.correctIndex) {
                    className += " correct-highlight";
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

          {milionerzyQuestion && !milionerzyResult && (
            <div className="controls-section">
              {milionerzyProgress ? (
                <p style={{ color: "var(--text-secondary)" }}>
                  Odpowiedziało: {milionerzyProgress.answeredCount} /{" "}
                  {milionerzyProgress.total}
                </p>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>
                  Czekam na odpowiedzi graczy…
                </p>
              )}
              <button className="btn btn-next" onClick={milionerzyReveal}>
                Odkryj odpowiedzi
              </button>
            </div>
          )}

          {milionerzyResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                ✅ Poprawna: {milionerzyResult.correctAnswer}
              </p>
              <div className="vote-breakdown">
                {milionerzyResult.results.map((r) => (
                  <span key={r.playerId} className="vote-chip">
                    {r.eliminated ? "❌" : "✅"} {r.playerName}: {money(r.prize)}
                  </span>
                ))}
              </div>
              {!milionerzyResult.gameOver ? (
                <button
                  className="btn btn-next"
                  style={{ marginTop: "15px" }}
                  onClick={milionerzyNext}
                >
                  Następne pytanie
                </button>
              ) : (
                <p style={{ marginTop: "15px", color: "var(--accent-gold)" }}>
                  Koniec drabinki!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* FLIP CUP CHALLENGE — ROZGRYWKA */}
      {gameType === "flip-cup" && gameStatus === "round" && flipState && (
        <div className="prawda-host fade-in">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p className="vote-result-title" style={{ fontSize: "1.7rem" }}>
              {flipState.teams[0]?.emoji} {flipState.scores.A} :{" "}
              {flipState.scores.B} {flipState.teams[1]?.emoji}
            </p>
            <p style={{ color: "var(--text-secondary)", marginTop: "5px" }}>
              Gramy do {flipState.targetRounds} rund
            </p>
            {flipState.timerStartedAt && (
              <p
                style={{
                  fontSize: "2.2rem",
                  color: "var(--accent-gold)",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                ⏱ {formatTime(flipNow - flipState.timerStartedAt)}
              </p>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            {flipState.teams.map((t) => (
              <div key={t.id} className="prompt-card" style={{ textAlign: "center" }}>
                <div className="prompt-badge">
                  {t.emoji} {t.name}
                </div>
                <p className="prompt-player" style={{ marginTop: "8px" }}>
                  {t.players.join(", ")}
                </p>
                <p className="prompt-text" style={{ fontSize: "2rem" }}>
                  {flipState.scores[t.id]}
                </p>
              </div>
            ))}
          </div>

          <div
            className="controls-section"
            style={{ marginTop: "20px", textAlign: "center" }}
          >
            {!flipState.timerStartedAt && !flipResult && (
              <button className="btn btn-start" onClick={flipStartTimer}>
                ▶ Start rundy
              </button>
            )}

            {flipState.timerStartedAt && (
              <>
                <p style={{ color: "var(--text-secondary)", marginBottom: "10px" }}>
                  Która drużyna skończyła pierwsza?
                </p>
                <button
                  className="btn btn-next"
                  onClick={() => flipWinRound("A")}
                >
                  {flipState.teams[0]?.emoji} {flipState.teams[0]?.name} wygrywa
                </button>{" "}
                <button
                  className="btn btn-next"
                  onClick={() => flipWinRound("B")}
                >
                  {flipState.teams[1]?.emoji} {flipState.teams[1]?.name} wygrywa
                </button>
              </>
            )}

            {flipResult && (
              <div className="vote-result-panel fade-in">
                <p className="vote-result-title">
                  {flipResult.winnerEmoji} {flipResult.winnerName} wygrywa rundę!
                </p>
                <p style={{ color: "var(--text-secondary)", marginTop: "5px" }}>
                  Czas: {formatTime(flipResult.elapsedMs)}
                </p>
                <button
                  className="btn btn-next"
                  style={{ marginTop: "10px" }}
                  onClick={flipNext}
                >
                  Następna runda
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ZGADNIJ HASŁO — ROZGRYWKA */}
      {gameType === "haslo" && gameStatus === "round" && (
        <div className="prawda-host fade-in">
          <Scoreboard scores={scores} showLives={false} />

          {!hasloWord && !hasloResult && (
            <div className="prawda-info">
              <p>
                Kolej <strong>{turnInfo?.playerName || "?"}</strong>. Pokaż hasło,
                aby zacząć.
              </p>
              <button className="btn btn-start" onClick={hasloNext}>
                Pokaż hasło
              </button>
            </div>
          )}

          {hasloWord && !hasloResult && (
            <>
              <div className="prompt-card">
                <div className="prompt-badge">🔤 HASŁO</div>
                <p className="prompt-text" style={{ fontSize: "2rem" }}>
                  {hasloWord.word}
                </p>
                <p className="prompt-player">Opisuje: {hasloWord.playerName}</p>
                <p style={{ color: "var(--red-wrong)", marginTop: "8px" }}>
                  🚫 Nie używaj: {hasloWord.taboo.join(", ")}
                </p>
              </div>
              <div className="controls-section">
                <button className="btn btn-next" onClick={hasloGuessed}>
                  ✅ Zgadnięto!
                </button>{" "}
                <button className="btn btn-elimination" onClick={hasloSkip}>
                  ⏭ Pomiń
                </button>
              </div>
            </>
          )}

          {hasloResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {hasloResult.guessed
                  ? `✅ ${hasloResult.playerName} +1 pkt!`
                  : `⏭ Pominięto (${hasloResult.playerName})`}
              </p>
              <button
                className="btn btn-next"
                style={{ marginTop: "10px" }}
                onClick={hasloNext}
              >
                Następne hasło
              </button>
            </div>
          )}
        </div>
      )}

      {/* GREETING */}
      {gameType === "quiz" && gameStatus === "greeting" && (
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
      {gameType === "quiz" &&
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
      {gameType === "quiz" && gameStatus === "finale" && !currentQuestion && (
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
      {gameType === "quiz" && gameStatus === "elimination" && (
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