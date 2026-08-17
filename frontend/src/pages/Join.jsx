import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useSearchParams } from "react-router-dom";
import { VOTE_OPTIONS } from "../data/truthOrDare";
import VideoOverlay from "../components/VideoOverlay";
import SpyRules from "../components/SpyRules";
import useHeartbeat from "../hooks/useHeartbeat";
import { ELIMINATION_VIDEOS, LOADING_VIDEOS, WIN_VIDEO, randomOf } from "../videos";
import "../styles/theme.css";
import "../styles/player.css";
import "../styles/spy.css";

const AVATARS = ["🦊", "🐸", "🐱", "🐶", "🦄", "🐼", "🐨", "🦁"];
const BUZZER_TIME = 20;

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
  // --- Filmy (loading / koniec) ---
  const [loadingVideo] = useState(() => randomOf(LOADING_VIDEOS));
  const [eliminationVideo] = useState(() => randomOf(ELIMINATION_VIDEOS));
  const [eliminationDone, setEliminationDone] = useState(false);
  const [winDone, setWinDone] = useState(false);


  const [buzzerTimeLeft, setBuzzerTimeLeft] = useState(0);

  // --- Prawda czy Wyzwanie ---
  const [gameType, setGameType] = useState("quiz");
  const [turnInfo, setTurnInfo] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [skipNotice, setSkipNotice] = useState(null);
  const [voteRequest, setVoteRequest] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [voteResult, setVoteResult] = useState(null);

  // --- Szybki Quiz ---
  const [rapidAnswered, setRapidAnswered] = useState(false);
  const [rapidResult, setRapidResult] = useState(null);

  // --- Nigdy Przenigdy ---
  const [nigdyPrompt, setNigdyPrompt] = useState(null);
  const [nigdyAnswered, setNigdyAnswered] = useState(false);
  const [nigdyReveal, setNigdyReveal] = useState(null);

  // --- Kto Bardziej? ---
  const [ktoPrompt, setKtoPrompt] = useState(null);
  const [ktoVoted, setKtoVoted] = useState(false);
  const [ktoReveal, setKtoReveal] = useState(null);

  // --- Memy Rządzą ---
  const [memyPrompt, setMemyPrompt] = useState(null);
  const [memyCaption, setMemyCaption] = useState("");
  const [memySubmitted, setMemySubmitted] = useState(false);
  const [memyVoteRequest, setMemyVoteRequest] = useState(null);
  const [memyVoted, setMemyVoted] = useState(false);
  const [memyResult, setMemyResult] = useState(null);

  // --- Milionerzy Party ---
  const [milionerzyQuestion, setMilionerzyQuestion] = useState(null);
  const [milionerzyAnswered, setMilionerzyAnswered] = useState(false);
  const [milionerzyResult, setMilionerzyResult] = useState(null);
  const [milionerzyEliminated, setMilionerzyEliminated] = useState(false);
  const [fiftyKeep, setFiftyKeep] = useState(null);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [friendUsed, setFriendUsed] = useState(false);
  const [friendHint, setFriendHint] = useState(null);

  // --- Flip Cup Challenge ---
  const [flipState, setFlipState] = useState(null);
  const [flipNow, setFlipNow] = useState(0);

  // --- Zgadnij Hasło ---
  const [hasloWord, setHasloWord] = useState(null);

  // --- Szpieg ---
  const [szpiegRole, setSzpiegRole] = useState(null);
  const [szpiegTimer, setSzpiegTimer] = useState(null); // { startedAt, durationSec }
  const [szpiegNow, setSzpiegNow] = useState(0);
  const [szpiegTimeUp, setSzpiegTimeUp] = useState(false);
  const [szpiegHeartbeat, setSzpiegHeartbeat] = useState(false);
  const [szpiegPanic, setSzpiegPanic] = useState(null);
  const [szpiegVoted, setSzpiegVoted] = useState(null);
  const [szpiegPanicProgress, setSzpiegPanicProgress] = useState(null);
  const [szpiegResult, setSzpiegResult] = useState(null);
  const [szpiegReveal, setSzpiegReveal] = useState(null);
  const [szpiegTurn, setSzpiegTurn] = useState(null); // { askerId, askerName, answererId, answererName }
  const [showAccuse, setShowAccuse] = useState(false);
  const [showShotPicker, setShowShotPicker] = useState(false);
  const [shotLocationId, setShotLocationId] = useState(null);
  const [shotSearch, setShotSearch] = useState("");
  const [showSpyRules, setShowSpyRules] = useState(false);

  const heartbeat = useHeartbeat();

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

  // Odliczanie rundy Szpieg (tick do odświeżania pozostałego czasu).
  useEffect(() => {
    const startedAt = szpiegTimer && szpiegTimer.startedAt;
    if (!startedAt) {
      setSzpiegNow(0);
      return;
    }
    const tick = () => setSzpiegNow(Date.now());
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [szpiegTimer && szpiegTimer.startedAt]);

  // Bicie serca — uruchamiane synchronicznie zdarzeniem z serwera.
  useEffect(() => {
    if (szpiegHeartbeat && !szpiegTimeUp && !szpiegResult && !szpiegReveal) {
      heartbeat.start();
    } else {
      heartbeat.stop();
    }
    // heartbeat.start / heartbeat.stop to stabilne referencje (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [szpiegHeartbeat, szpiegTimeUp, szpiegResult, szpiegReveal, heartbeat.start, heartbeat.stop]);

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
      setRapidAnswered(false);
      setRapidResult(null);
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

    // --- Szybki Quiz ---
    socket.on("rapid-result", (result) => {
      setRapidResult(result);
    });

    // --- Nigdy Przenigdy ---
    socket.on("nigdy-prompt", (p) => {
      setNigdyPrompt(p);
      setNigdyAnswered(false);
      setNigdyReveal(null);
    });
    socket.on("nigdy-reveal", (r) => {
      setNigdyReveal(r);
    });

    // --- Kto Bardziej? ---
    socket.on("kto-prompt", (p) => {
      setKtoPrompt(p);
      setKtoVoted(false);
      setKtoReveal(null);
    });
    socket.on("kto-reveal", (r) => {
      setKtoReveal(r);
    });

    // --- Memy Rządzą ---
    socket.on("memy-prompt", (p) => {
      setMemyPrompt(p);
      setMemyCaption("");
      setMemySubmitted(false);
      setMemyVoteRequest(null);
      setMemyVoted(false);
      setMemyResult(null);
    });
    socket.on("memy-vote-request", (req) => {
      setMemyVoteRequest(req);
      setMemyVoted(false);
    });
    socket.on("memy-result", (r) => {
      setMemyResult(r);
      setMemyVoteRequest(null);
    });

    // --- Milionerzy Party ---
    socket.on("milionerzy-question", (q) => {
      setMilionerzyQuestion(q);
      setMilionerzyAnswered(false);
      setMilionerzyResult(null);
      setMilionerzyEliminated(false);
      setFiftyKeep(null);
      setFiftyUsed(false);
      setFriendUsed(false);
      setFriendHint(null);
    });
    socket.on("milionerzy-fifty-result", (r) => {
      setFiftyKeep(r.keep);
    });
    socket.on("milionerzy-friend-result", (r) => {
      setFriendHint(
        `${r.friendName} obstawia: ${String.fromCharCode(65 + r.answerIndex)}${
          r.unsure ? " (niepewnie)" : ""
        }`
      );
    });
    socket.on("milionerzy-result", (r) => {
      setMilionerzyResult(r);
      const me = r.results.find((x) => x.playerId === playerIdRef.current);
      if (me && me.eliminated) setMilionerzyEliminated(true);
    });

    // --- Flip Cup Challenge ---
    socket.on("flip-state", (s) => {
      setFlipState(s);
    });
    socket.on("flip-timer-started", ({ startedAt }) => {
      setFlipState((prev) =>
        prev ? { ...prev, timerStartedAt: startedAt } : prev
      );
    });
    socket.on("flip-round-won", () => {
      setFlipState((prev) => (prev ? { ...prev, timerStartedAt: null } : prev));
    });

    // --- Zgadnij Hasło ---
    socket.on("haslo-word", (w) => setHasloWord(w));
    socket.on("haslo-result", () => setHasloWord(null));

    // --- Szpieg ---
    socket.on("szpieg-role", (r) => {
      setSzpiegRole(r);
      setSzpiegReveal(null);
      setSzpiegResult(null);
      setSzpiegTimeUp(false);
      setSzpiegHeartbeat(false);
      setSzpiegPanic(null);
      setSzpiegVoted(null);
      setSzpiegTurn(null);
      setShowAccuse(false);
      setShowShotPicker(false);
      setShotLocationId(null);
      setShotSearch("");
    });
    socket.on("szpieg-timer-started", ({ startedAt, durationSec }) => {
      setSzpiegTimer({ startedAt, durationSec });
      setSzpiegTimeUp(false);
    });
    socket.on("szpieg-heartbeat", () => setSzpiegHeartbeat(true));
    socket.on("szpieg-time-up", () => {
      setSzpiegTimeUp(true);
      setSzpiegHeartbeat(false);
    });
    socket.on("szpieg-panic-started", (p) => {
      setSzpiegPanic(p);
      setSzpiegVoted(null);
    });
    socket.on("szpieg-panic-progress", (p) => setSzpiegPanicProgress(p));
    socket.on("szpieg-result", (r) => {
      setSzpiegResult(r);
      setSzpiegTimer(null);
      setSzpiegHeartbeat(false);
    });
    socket.on("szpieg-reveal", (r) => {
      setSzpiegReveal(r);
      setSzpiegHeartbeat(false);
    });
    socket.on("szpieg-turn", (t) => setSzpiegTurn(t));
    socket.on("szpieg-next-round", () => {
      setSzpiegReveal(null);
      setSzpiegResult(null);
      setSzpiegTimeUp(false);
      setSzpiegHeartbeat(false);
      setSzpiegPanic(null);
      setSzpiegVoted(null);
      setSzpiegTurn(null);
      setSzpiegTimer(null);
      setShowAccuse(false);
      setShowShotPicker(false);
      setShotLocationId(null);
      setShotSearch("");
    });

    // Nowy kod z URL ma priorytet nad auto-rejoinem — gracz świadomie chce
    // dołączyć do innej gry (np. zeskanował nowy QR). Czyścimy stare dane,
    // żeby nie blokowały dołączenia do nowej gry.
    const wantsNewGame =
      codeFromUrl && codeFromUrl.length === 6 && codeFromUrl !== savedGameCode;

    if (wantsNewGame) {
      console.log("[Join] Auto-joining with code from URL:", codeFromUrl);
      localStorage.removeItem("playerId");
      localStorage.removeItem("gameCode");
      socket.emit("join-game", { code: codeFromUrl });
    } else if (savedPlayerId && savedGameCode && savedGameCode.length === 6) {
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
      socket.off("rapid-result");
      socket.off("nigdy-prompt");
      socket.off("nigdy-reveal");
      socket.off("kto-prompt");
      socket.off("kto-reveal");
      socket.off("memy-prompt");
      socket.off("memy-vote-request");
      socket.off("memy-result");
      socket.off("milionerzy-question");
      socket.off("milionerzy-fifty-result");
      socket.off("milionerzy-friend-result");
      socket.off("milionerzy-result");
      socket.off("flip-state");
      socket.off("flip-timer-started");
      socket.off("flip-round-won");
      socket.off("haslo-word");
      socket.off("haslo-result");
      socket.off("szpieg-role");
      socket.off("szpieg-timer-started");
      socket.off("szpieg-heartbeat");
      socket.off("szpieg-time-up");
      socket.off("szpieg-panic-started");
      socket.off("szpieg-panic-progress");
      socket.off("szpieg-result");
      socket.off("szpieg-reveal");
      socket.off("szpieg-next-round");
      socket.off("szpieg-turn");
    };
  }, [socket]); // Stable – only re-registers when socket changes

  const saveGameCode = () => {
    localStorage.setItem("gameCode", gameCodeRef.current);
  };

  // Gracz wychodzi z gry i wraca do ekranu wpisywania kodu.
  const leaveGame = useCallback(() => {
    const code = gameCodeRef.current;
    const pid = playerIdRef.current;
    if (code) {
      socket.emit("leave-game", { code, playerId: pid });
    }

    localStorage.removeItem("playerId");
    localStorage.removeItem("gameCode");

    setStep("code");
    setGameCode("");
    setPlayerId(null);
    setPlayerName("");
    setError("");
    setPlayers([]);
    setGameType("quiz");
    setGameOverData(null);
    setEliminated(false);
    setMilionerzyEliminated(false);
    setCurrentQuestion(null);
    setBuzzerLocked(false);
    setIBuzzed(false);
    setShowAnswers(false);
    setAnswers([]);
    setAnswerResult(null);
    setAnswered(false);
    setScores([]);
    setMyLives(3);
    setTurnInfo(null);
    setPrompt(null);
    setSkipNotice(null);
    setVoteRequest(null);
    setMyVote(null);
    setVoteResult(null);
    setRapidAnswered(false);
    setRapidResult(null);
    setNigdyPrompt(null);
    setNigdyAnswered(false);
    setNigdyReveal(null);
    setKtoPrompt(null);
    setKtoVoted(false);
    setKtoReveal(null);
    setMemyPrompt(null);
    setMemyCaption("");
    setMemySubmitted(false);
    setMemyVoteRequest(null);
    setMemyVoted(false);
    setMemyResult(null);
    setMilionerzyQuestion(null);
    setMilionerzyAnswered(false);
    setMilionerzyResult(null);
    setFiftyKeep(null);
    setFiftyUsed(false);
    setFriendUsed(false);
    setFriendHint(null);
    setEliminationDone(false);
    setWinDone(false);
  }, [socket]);

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

  // --- Szybki Quiz ---
  const rapidAnswer = (index) => {
    if (rapidAnswered) return;
    setRapidAnswered(true);
    socket.emit("rapid-answer", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      answerIndex: index,
    });
  };

  // --- Nigdy Przenigdy ---
  const nigdyAnswer = (did) => {
    if (nigdyAnswered) return;
    setNigdyAnswered(true);
    socket.emit("nigdy-answer", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      did,
    });
  };

  // --- Kto Bardziej? ---
  const ktoVote = (targetId) => {
    if (ktoVoted) return;
    setKtoVoted(true);
    socket.emit("kto-vote", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      targetId,
    });
  };

  // --- Memy Rządzą ---
  const memySubmitCaption = () => {
    if (memySubmitted || !memyCaption.trim()) return;
    setMemySubmitted(true);
    socket.emit("memy-caption", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      text: memyCaption.trim(),
    });
  };

  const memyVote = (targetId) => {
    if (memyVoted) return;
    setMemyVoted(true);
    socket.emit("memy-vote", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      targetId,
    });
  };

  // --- Milionerzy Party ---
  const milionerzyAnswer = (index) => {
    if (milionerzyAnswered) return;
    setMilionerzyAnswered(true);
    socket.emit("milionerzy-answer", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      answerIndex: index,
    });
  };

  const useFifty = () => {
    if (fiftyUsed || milionerzyAnswered) return;
    setFiftyUsed(true);
    socket.emit("milionerzy-fifty", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
    });
  };

  const useFriend = () => {
    if (friendUsed || milionerzyAnswered) return;
    setFriendUsed(true);
    socket.emit("milionerzy-friend", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
    });
  };

  // --- Szpieg ---
  const szpiegAccuse = (targetId) => {
    socket.emit("szpieg-accuse", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      targetId,
    });
  };

  const szpiegVote = (agree) => {
    if (szpiegVoted !== null) return;
    setSzpiegVoted(agree);
    socket.emit("szpieg-panic-vote", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      agree,
    });
  };

  const szpiegShot = (locationId) => {
    socket.emit("szpieg-shot", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      locationId,
    });
  };

  const szpiegPickTarget = (targetId) => {
    socket.emit("szpieg-turn-pick", {
      code: gameCodeRef.current,
      playerId: playerIdRef.current,
      targetId,
    });
  };

  const myScore = scores.find((s) => s.id === playerId);
  const myScorePoints = myScore ? myScore.score : 0;

  // Gracz przegrał (nie jest zwycięzcą) przy końcu gry
  const lostAtGameOver =
    step === "finished" &&
    gameOverData &&
    (() => {
      const top = Math.max(...(gameOverData.scores || []).map((s) => s.score));
      const me = (gameOverData.scores || []).find((s) => s.id === playerId);
      return me ? me.score < top : false;
    })();

  const showEliminationVideo =
    !eliminationDone && (eliminated || milionerzyEliminated || lostAtGameOver);

  // Gracz wygrał (jest na szczycie tabeli po zakończeniu gry)
  const wonGame =
    step === "finished" &&
    gameOverData &&
    gameOverData.scores?.[0]?.id === playerId;

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
        <>
          <VideoOverlay variant="background" src={loadingVideo} loop dim />
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
          <button
            type="button"
            onClick={leaveGame}
            style={{
              marginTop: "24px",
              padding: "12px 28px",
              fontSize: "1rem",
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
            }}
          >
            Wyjdź z gry
          </button>
        </div>
        </>
      )}

      {/* PLAYING (quiz) */}
      {step === "playing" && !eliminated && gameType === "quiz" && (
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

      {/* PLAYING (szybki quiz / melodia) */}
      {step === "playing" && !eliminated && isRapidQuiz(gameType) && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {!currentQuestion && !rapidResult && (
            <div className="waiting-section">
              <p className="waiting-title">Przygotuj się na pytanie…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {currentQuestion && !rapidResult && (
            <div className="answers-section fade-in">
              <p className="question-text-player">{currentQuestion.question}</p>
              {!rapidAnswered ? (
                currentQuestion.answers.map((answer, i) => (
                  <button
                    key={i}
                    className="answer-button"
                    onClick={() => rapidAnswer(i)}
                  >
                    <strong>{String.fromCharCode(65 + i)}:</strong> {answer}
                  </button>
                ))
              ) : (
                <div className="waiting-section">
                  <p className="waiting-title">Czekam na pozostałych…</p>
                </div>
              )}
            </div>
          )}

          {rapidResult && (
            <div
              className={`result-section ${
                rapidResult.results.find((r) => r.playerId === playerId)?.correct
                  ? "correct"
                  : "wrong"
              }`}
            >
              {rapidResult.results.find((r) => r.playerId === playerId)?.correct ? (
                <p>✅ Poprawnie! +10 pkt</p>
              ) : (
                <p>❌ Błędnie lub brak odpowiedzi</p>
              )}
              <p style={{ color: "var(--text-secondary)", marginTop: "5px" }}>
                Poprawna: {rapidResult.correctAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PLAYING (nigdy) */}
      {step === "playing" && !eliminated && gameType === "nigdy" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {!nigdyPrompt && !nigdyReveal && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na kartę…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {nigdyPrompt && (
            <div className="prompt-card truth">
              <div className="prompt-badge">💋 NIGDY PRZENIGDY</div>
              <p className="prompt-text">{nigdyPrompt.prompt}</p>
            </div>
          )}

          {nigdyPrompt && !nigdyReveal && !nigdyAnswered && (
            <div className="choice-section fade-in">
              <h3>Zrobiłeś to kiedyś?</h3>
              <button
                className="choice-card truth"
                onClick={() => nigdyAnswer(true)}
              >
                ✅ TAK, zrobiłem to
              </button>
              <button
                className="choice-card dare"
                onClick={() => nigdyAnswer(false)}
              >
                ❌ NIE
              </button>
            </div>
          )}

          {nigdyPrompt && nigdyAnswered && !nigdyReveal && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na odkrycie…</p>
            </div>
          )}

          {nigdyReveal && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">„{nigdyReveal.prompt}"</p>
              <p style={{ color: "var(--red-wrong)", marginTop: "8px" }}>
                ✅ TAK: {nigdyReveal.yesNames.join(", ") || "—"}
              </p>
              <p style={{ color: "var(--text-secondary)", marginTop: "5px" }}>
                ❌ NIE: {nigdyReveal.noNames.join(", ") || "—"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PLAYING (kto-bardziej) */}
      {step === "playing" && !eliminated && gameType === "kto-bardziej" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {!ktoPrompt && !ktoReveal && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na kartę…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {ktoPrompt && (
            <div className="prompt-card dare">
              <div className="prompt-badge">🕺 KTO BARDZIEJ?</div>
              <p className="prompt-text">{ktoPrompt.prompt}</p>
            </div>
          )}

          {ktoPrompt && !ktoReveal && !ktoVoted && (
            <div className="choice-section fade-in">
              <h3>Zagłosuj na kogoś:</h3>
              {players
                .filter((p) => p.id !== playerId)
                .map((p) => (
                  <button
                    key={p.id}
                    className="choice-card"
                    onClick={() => ktoVote(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          )}

          {ktoPrompt && ktoVoted && !ktoReveal && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na wyniki…</p>
            </div>
          )}

          {ktoReveal && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {ktoReveal.winnerName
                  ? `🏆 ${ktoReveal.winnerName}!`
                  : "Brak głosów"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PLAYING (memy) */}
      {step === "playing" && !eliminated && gameType === "memy" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {!memyPrompt && !memyResult && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na mema…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {memyPrompt && (
            <div className="prompt-card">
              <div className="prompt-badge">🤣 MEMY RZĄDZĄ</div>
              <p className="prompt-text" style={{ fontSize: "3rem", lineHeight: 1 }}>
                {memyPrompt.meme.emoji}
              </p>
              <p className="prompt-text">{memyPrompt.meme.text}</p>
            </div>
          )}

          {memyPrompt && !memyVoteRequest && !memyResult && !memySubmitted && (
            <div className="setup-section fade-in">
              <input
                className="name-input"
                type="text"
                placeholder="Twój podpis…"
                maxLength={120}
                value={memyCaption}
                onChange={(e) => setMemyCaption(e.target.value)}
              />
              <button className="btn btn-start" onClick={memySubmitCaption}>
                Wyślij podpis
              </button>
            </div>
          )}

          {memySubmitted && !memyVoteRequest && !memyResult && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na głosowanie…</p>
            </div>
          )}

          {memyVoteRequest && !memyResult && !memyVoted && (
            <div className="choice-section fade-in">
              <h3>Zagłosuj na najlepszy podpis:</h3>
              {memyVoteRequest.captions
                .filter((c) => c.playerId !== playerId)
                .map((c) => (
                  <button
                    key={c.playerId}
                    className="choice-card"
                    onClick={() => memyVote(c.playerId)}
                  >
                    „{c.text}" <small>— {c.playerName}</small>
                  </button>
                ))}
            </div>
          )}

          {memyVoteRequest && memyVoted && !memyResult && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na wyniki…</p>
            </div>
          )}

          {memyResult && (
            <div className="vote-result-panel fade-in">
              <p className="vote-result-title">
                {memyResult.winnerName
                  ? `🏆 ${memyResult.winnerName}!`
                  : "Brak zwycięzcy"}
              </p>
              {memyResult.winnerCaption && (
                <p style={{ color: "var(--accent-gold)", marginTop: "5px" }}>
                  „{memyResult.winnerCaption}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* PLAYING (milionerzy) */}
      {step === "playing" && !eliminated && gameType === "milionerzy" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moja wygrana: <strong>{money(myScorePoints)}</strong>
          </div>

          {milionerzyEliminated && !gameOverData && (
            <div className="waiting-section">
              <h2 style={{ color: "var(--red-wrong)", fontSize: "1.6rem" }}>
                Odpadasz z drabinki!
              </h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>
                Twoja wygrana: {money(myScorePoints)}
              </p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {!milionerzyEliminated && !milionerzyQuestion && !milionerzyResult && (
            <div className="waiting-section">
              <p className="waiting-title">Przygotuj się na pytanie…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {!milionerzyEliminated && milionerzyQuestion && !milionerzyResult && (
            <div className="answers-section fade-in">
              <p className="question-text-player">{milionerzyQuestion.question}</p>
              <p style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>
                💰 {money(milionerzyQuestion.prize)}
                {milionerzyQuestion.guaranteed ? " — próg gwarantowany" : ""}
              </p>

              {friendHint && (
                <p style={{ color: "var(--accent-gold)", marginTop: "5px" }}>
                  📞 {friendHint}
                </p>
              )}

              {!milionerzyAnswered ? (
                <>
                  {milionerzyQuestion.answers.map((answer, i) => {
                    if (fiftyKeep && !fiftyKeep.includes(i)) return null;
                    return (
                      <button
                        key={i}
                        className="answer-button"
                        onClick={() => milionerzyAnswer(i)}
                      >
                        <strong>{String.fromCharCode(65 + i)}:</strong> {answer}
                      </button>
                    );
                  })}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="btn btn-next"
                      disabled={fiftyUsed || milionerzyAnswered}
                      onClick={useFifty}
                    >
                      50:50
                    </button>
                    <button
                      className="btn btn-next"
                      disabled={friendUsed || milionerzyAnswered}
                      onClick={useFriend}
                    >
                      📞 Przyjaciel
                    </button>
                  </div>
                </>
              ) : (
                <div className="waiting-section">
                  <p className="waiting-title">Czekam na pozostałych…</p>
                </div>
              )}
            </div>
          )}

          {!milionerzyEliminated && milionerzyResult && (
            <div
              className={`result-section ${
                milionerzyResult.results.find((r) => r.playerId === playerId)
                  ?.correct
                  ? "correct"
                  : "wrong"
              }`}
            >
              {(() => {
                const me = milionerzyResult.results.find(
                  (r) => r.playerId === playerId
                );
                if (me && me.eliminated) {
                  return <p>❌ Błędnie! Odpadasz z {money(me.prize)}</p>;
                }
                return <p>✅ Poprawnie! Wygrana: {money(me.prize)}</p>;
              })()}
            </div>
          )}
        </div>
      )}

      {/* PLAYING (flip-cup) */}
      {step === "playing" && gameType === "flip-cup" && !gameOverData && flipState && (
        <div className="game-section">
          {(() => {
            const myTeam = flipState.teams.find((t) =>
              t.players.includes(playerName)
            );
            return (
              <>
                <div className="my-score-bar">
                  {myTeam
                    ? `${myTeam.emoji} ${myTeam.name}`
                    : "Twoja drużyna"}
                </div>

                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <p className="vote-result-title" style={{ fontSize: "1.6rem" }}>
                    {flipState.teams[0]?.emoji} {flipState.scores.A} :{" "}
                    {flipState.scores.B} {flipState.teams[1]?.emoji}
                  </p>
                  {flipState.timerStartedAt && (
                    <p
                      style={{
                        fontSize: "2rem",
                        color: "var(--accent-gold)",
                        fontWeight: "bold",
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
                    gap: "12px",
                  }}
                >
                  {flipState.teams.map((t) => {
                    const isMine = myTeam && myTeam.id === t.id;
                    return (
                      <div
                        key={t.id}
                        className="prompt-card"
                        style={{
                          textAlign: "center",
                          border: isMine
                            ? "2px solid var(--accent-gold)"
                            : undefined,
                        }}
                      >
                        <div className="prompt-badge">
                          {t.emoji} {t.name}
                          {isMine ? " (Ty)" : ""}
                        </div>
                        <p className="prompt-player" style={{ marginTop: "8px" }}>
                          {t.players.join(", ")}
                        </p>
                        <p className="prompt-text" style={{ fontSize: "1.8rem" }}>
                          {flipState.scores[t.id]}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    marginTop: "20px",
                  }}
                >
                  Odłóż telefon i graj! 📱➡️🥤
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* PLAYING (szpieg) */}
      {step === "playing" && gameType === "szpieg" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {/* Timer — na górze, zawsze widoczny */}
          {!szpiegReveal && szpiegTimer && (
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <p className={`spy-timer ${szpiegHeartbeat ? "urgent" : ""}`}>
                {formatTime(
                  Math.max(
                    0,
                    szpiegTimer.durationSec * 1000 -
                      (szpiegNow - szpiegTimer.startedAt)
                  )
                )}
              </p>
              {szpiegPanic ? (
                <p
                  style={{
                    color: "var(--accent-gold-light)",
                    fontWeight: "bold",
                  }}
                >
                  ⏸ Zamrożono (głosowanie)
                </p>
              ) : szpiegHeartbeat ? (
                <p style={{ color: "var(--red-wrong)", fontWeight: "bold" }}>
                  💓 Ostatnie sekundy!
                </p>
              ) : null}
            </div>
          )}

          {/* Czas minął */}
          {szpiegTimeUp && !szpiegResult && !szpiegReveal && (
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <p
                style={{
                  color: "var(--accent-gold)",
                  fontWeight: "bold",
                  fontSize: "1.25rem",
                }}
              >
                ⏰ Czas minął!
              </p>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                Ustalcie werdykt — prowadzący ogłosi wynik.
              </p>
            </div>
          )}

          {/* Wskaźnik tury: kto pyta ➜ kto odpowiada */}
          {!szpiegReveal && !szpiegPanic && !szpiegResult && szpiegTurn && (
            <div
              style={{
                textAlign: "center",
                marginTop: "12px",
                fontFamily: "var(--spy-type)",
              }}
            >
              {szpiegTurn.answererId ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
                  🔍 <strong style={{ color: "#fff" }}>{szpiegTurn.askerName}</strong>{" "}
                  pyta ➜{" "}
                  <strong style={{ color: "var(--accent-gold-light)" }}>
                    {szpiegTurn.answererName}
                  </strong>{" "}
                  odpowiada
                </p>
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
                  🔍 <strong style={{ color: "#fff" }}>{szpiegTurn.askerName}</strong>{" "}
                  wybiera, kogo zapytać…
                </p>
              )}
            </div>
          )}

          {/* Picker tury (dla aktywnego gracza) */}
          {!szpiegReveal &&
            !szpiegPanic &&
            !szpiegResult &&
            szpiegTurn &&
            (() => {
              const isAsker =
                szpiegTurn.askerId === playerId && !szpiegTurn.answererId;
              const isAnswerer = szpiegTurn.answererId === playerId;
              if (!isAsker && !isAnswerer) return null;
              return (
                <div style={{ marginTop: "10px" }}>
                  <p
                    style={{
                      color: "var(--accent-gold-light)",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontFamily: "var(--spy-type)",
                    }}
                  >
                    {isAsker
                      ? "Twoja kolej — wybierz, kogo pytasz:"
                      : `Odpowiadasz ${szpiegTurn.askerName}. Po odpowiedzi wybierz, kogo pytasz dalej:`}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      marginTop: "8px",
                    }}
                  >
                    {players
                      .filter((p) => p.id !== playerId)
                      .map((p) => (
                        <button
                          key={p.id}
                          className="spy-btn"
                          onClick={() => szpiegPickTarget(p.id)}
                        >
                          {p.name}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })()}

          {/* Karta Szpiega */}
          {!szpiegReveal && szpiegRole && !szpiegPanic && szpiegRole.isSpy && (
            <div
              className="spy-dossier"
              style={{ textAlign: "center", marginTop: "8px" }}
            >
              <span className="spy-stamp small">ŚCIŚLE TAJNE</span>
              <div style={{ marginTop: "16px" }} className="spy-role-emoji">
                🕵️
              </div>
              <div
                className="spy-location-name"
                style={{ fontSize: "1.6rem" }}
              >
                JESTEŚ SZPIEGIEM
              </div>
              <p
                style={{
                  fontFamily: "var(--spy-type)",
                  color: "#333",
                  marginTop: "10px",
                }}
              >
                Nie znasz lokalizacji. Udawaj, że wiesz, o czym mowa, i
                wydedukuj, gdzie jesteście.
              </p>
              <div className="spy-redacted" style={{ marginTop: "10px" }}>
                lokalizacja utajniona
              </div>

              <div style={{ marginTop: "18px" }}>
                <button
                  className="spy-btn"
                  onClick={() => setShowShotPicker((v) => !v)}
                >
                  🎯 Wskaż lokalizację
                </button>
                {showShotPicker && (
                  <div style={{ marginTop: "12px", textAlign: "left" }}>
                    <div className="spy-warning">
                      ⚠️ Strzał Życia jest ostateczny — pudło natychmiast
                      kończy grę i przegrywasz rundę.
                    </div>
                    <input
                      className="spy-search"
                      type="text"
                      placeholder="Szukaj lokalizacji…"
                      value={shotSearch}
                      onChange={(e) => setShotSearch(e.target.value)}
                      style={{ marginTop: "10px" }}
                    />
                    <div className="spy-loc-grid">
                      {szpiegRole.locations
                        .filter((l) =>
                          l.name
                            .toLowerCase()
                            .includes(shotSearch.toLowerCase())
                        )
                        .map((l) => (
                          <button
                            key={l.id}
                            className="spy-loc-btn"
                            onClick={() => setShotLocationId(l)}
                          >
                            {l.emoji} {l.name}
                          </button>
                        ))}
                    </div>
                    {shotLocationId && (
                      <div style={{ marginTop: "10px" }}>
                        <p
                          style={{
                            fontFamily: "var(--spy-type)",
                            color: "#333",
                          }}
                        >
                          Strzelasz w: {shotLocationId.emoji}{" "}
                          {shotLocationId.name}?
                        </p>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="spy-btn spy-btn-panic"
                            onClick={() => szpiegShot(shotLocationId.id)}
                          >
                            🎯 Strzelam
                          </button>
                          <button
                            className="spy-btn"
                            onClick={() => setShotLocationId(null)}
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Karta Agenta */}
          {!szpiegReveal && szpiegRole && !szpiegPanic && !szpiegRole.isSpy && (
            <div
              className="spy-dossier"
              style={{ textAlign: "center", marginTop: "8px" }}
            >
              <span className="spy-stamp small">TAJNE</span>
              <div style={{ marginTop: "16px" }}>
                <div className="spy-location-emoji">
                  {szpiegRole.locationEmoji}
                </div>
                <div className="spy-location-name">{szpiegRole.location}</div>
              </div>
              <p className="spy-role-label" style={{ marginTop: "6px" }}>
                {szpiegRole.emoji} {szpiegRole.role}
              </p>
              <p
                style={{
                  fontFamily: "var(--spy-type)",
                  color: "#444",
                  marginTop: "8px",
                }}
              >
                Jesteś agentem. Namierz Szpiega.
              </p>
            </div>
          )}

          {/* Przycisk oskarżenia */}
          {!szpiegReveal && szpiegRole && !szpiegPanic && !szpiegRole.isSpy && (
            <div className="spy-actions">
              <button
                className="spy-btn spy-btn-panic"
                onClick={() => setShowAccuse(true)}
              >
                🆘 Wskaż Szpiega
              </button>
              {showAccuse && (
                <div style={{ marginTop: "8px" }}>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      textAlign: "center",
                      marginBottom: "6px",
                    }}
                  >
                    Kogo podejrzewasz? (oskarżenie zamraża grę)
                  </p>
                  {players
                    .filter((p) => p.id !== playerId)
                    .map((p) => (
                      <button
                        key={p.id}
                        className="choice-card"
                        onClick={() => {
                          setShowAccuse(false);
                          szpiegAccuse(p.id);
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  <button
                    className="skip-button"
                    onClick={() => setShowAccuse(false)}
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Głosowanie w oskarżeniu */}
          {szpiegPanic && !szpiegReveal && !szpiegResult && (
            <div className="choice-section fade-in" style={{ marginTop: "16px" }}>
              <h3>🎯 Czy {szpiegPanic.accusedName} to Szpieg?</h3>
              {szpiegPanic.accusedId === playerId ? (
                <div className="waiting-section">
                  <p className="waiting-title">
                    Jesteś oskarżony — nie głosujesz.
                  </p>
                  <p className="waiting-dots">•••</p>
                </div>
              ) : szpiegVoted === null ? (
                <div className="spy-vote-btns">
                  <button
                    className="spy-btn spy-vote-yes"
                    onClick={() => szpiegVote(true)}
                  >
                    ✅ TAK
                  </button>
                  <button
                    className="spy-btn spy-vote-no"
                    onClick={() => szpiegVote(false)}
                  >
                    ❌ NIE
                  </button>
                </div>
              ) : (
                <div className="waiting-section">
                  <p className="waiting-title">Zagłosowano. Czekam na wynik…</p>
                  {szpiegPanicProgress && (
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {szpiegPanicProgress.votedCount} /{" "}
                      {szpiegPanicProgress.total}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rozwiązanie rundy */}
          {(szpiegResult || szpiegReveal) && (
            <div className="spy-reveal" style={{ marginTop: "16px" }}>
              {szpiegResult && (
                <p
                  style={{
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: "1.2rem",
                    textAlign: "center",
                  }}
                >
                  {szpiegResult.title}
                </p>
              )}
              {szpiegReveal && (
                <>
                  <p
                    style={{
                      textAlign: "center",
                      marginTop: "8px",
                      color: "#e5e7eb",
                    }}
                  >
                    📍 {szpiegReveal.locationEmoji} {szpiegReveal.location}
                  </p>
                  <p style={{ textAlign: "center", color: "#fff" }}>
                    🕵️ Szpieg: <strong>{szpiegReveal.spyName}</strong>
                  </p>
                  <div style={{ marginTop: "10px" }}>
                    {szpiegReveal.roles.map((r) => (
                      <div
                        key={r.playerId}
                        className={`role-row ${r.isSpy ? "spy" : ""}`}
                      >
                        <span>{r.emoji}</span>
                        <span style={{ flex: 1 }}>{r.playerName}</span>
                        <span>{r.isSpy ? "SZPIEG" : r.role}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <p
                style={{
                  textAlign: "center",
                  marginTop: "10px",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                }}
              >
                Czekaj na kolejną rundę…
              </p>
            </div>
          )}

          {/* Zasady */}
          <div style={{ marginTop: "18px", textAlign: "center" }}>
            <button
              className="btn btn-next"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--border-color)",
                color: "var(--accent-gold-light)",
              }}
              onClick={() => setShowSpyRules((v) => !v)}
            >
              {showSpyRules ? "Ukryj zasady" : "📜 Zasady i punktacja"}
            </button>
            {showSpyRules && (
              <div style={{ marginTop: "12px", textAlign: "left" }}>
                <SpyRules />
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAYING (zgadnij hasło) */}
      {step === "playing" && gameType === "haslo" && !gameOverData && (
        <div className="game-section">
          <div className="my-score-bar">
            Moje punkty: <strong>{myScorePoints}</strong>
          </div>

          {hasloWord && hasloWord.playerId === playerId && (
            <div className="prompt-card">
              <div className="prompt-badge">🔤 TWOJE HASŁO</div>
              <p className="prompt-text" style={{ fontSize: "2rem" }}>
                {hasloWord.word}
              </p>
              <p style={{ color: "var(--red-wrong)", marginTop: "8px" }}>
                🚫 Nie używaj: {hasloWord.taboo.join(", ")}
              </p>
              <p className="prompt-player" style={{ marginTop: "10px" }}>
                Opisuj, reszta zgaduje!
              </p>
            </div>
          )}

          {hasloWord && hasloWord.playerId !== playerId && (
            <div className="waiting-section">
              <p className="waiting-title">
                🔤 {hasloWord.playerName} opisuje hasło…
              </p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {!hasloWord && turnInfo && turnInfo.playerId === playerId && (
            <div className="waiting-section">
              <p className="waiting-title">Twoja kolej! Czekaj na hasło…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {!hasloWord && turnInfo && turnInfo.playerId !== playerId && (
            <div className="waiting-section">
              <p className="waiting-title">
                Czekaj… {turnInfo.playerName} zaraz opisze hasło
              </p>
              <p className="waiting-dots">•••</p>
            </div>
          )}

          {!hasloWord && !turnInfo && (
            <div className="waiting-section">
              <p className="waiting-title">Czekam na hasło…</p>
              <p className="waiting-dots">•••</p>
            </div>
          )}
        </div>
      )}

      {/* PLAYING (gry tur-bazowane: prawda / szalenstwo / krol / filmowy) */}
      {step === "playing" && isTurnGame(gameType) && !gameOverData && (
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
            !skipNotice &&
            gameType === "prawda" && (
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
            turnInfo.playerId === playerId &&
            !prompt &&
            !skipNotice &&
            gameType !== "prawda" && (
              <div className="waiting-section">
                <p className="waiting-title">Twoja kolej! Czekaj na kartę…</p>
                <p className="waiting-dots">•••</p>
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
                PROMPT_BADGES[prompt.type]?.className || "truth"
              }`}
            >
              <div className="prompt-badge">
                {PROMPT_BADGES[prompt.type]?.emoji}{" "}
                {PROMPT_BADGES[prompt.type]?.label}
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
          <button
            type="button"
            onClick={leaveGame}
            style={{
              marginTop: "24px",
              padding: "12px 28px",
              fontSize: "1rem",
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
            }}
          >
            Wyjdź z gry
          </button>
        </div>
      )}
      {/* FILM KONIEC — odpadnięcie / przegrana */}
      {showEliminationVideo && (
        <VideoOverlay
          src={eliminationVideo}
          onEnded={() => setEliminationDone(true)}
          muted
          showSoundToggle
          skipLabel="Pomiń"
        />
      )}

      {/* FILM ZWYCIĘSTWO — gdy gracz wygra */}
      {wonGame && !winDone && (
        <VideoOverlay
          src={WIN_VIDEO}
          onEnded={() => setWinDone(true)}
          muted
          showSoundToggle
          skipLabel="Pomiń"
        />
      )}
    </div>
  );
}