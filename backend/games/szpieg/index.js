// Gra: Szpieg (klon Spyfall) — blef, dedukcja i psychologiczna walka.
// Wszyscy gracze dostają tę samą lokalizację i unikalne role, jeden losowy gracz
// zostaje Szpiegiem (nie zna lokalizacji). Rozgrywka: przesłuchanie na żywo +
// 5-minutowy stoper z biciem serca na końcu.
//
// Trzy drogi zakończenia rundy (wszystkie "wszystko albo nic"):
//  1. Szybkie Oskarżenie (Panic Button) — gracz wskazuje cel, reszta głosuje TAK/NIE.
//  2. Strzał Życia — Szpieg zgaduje lokalizację (pudło = natychmiastowa porażka).
//  3. Koniec timera — host wybiera werdykt.
//
// Punktacja (baza + modyfikatory):
//  - Wygrana Szpiega: +2; wygrana Agentów: +1 każdy.
//  - Oskarżenie niewinnego: Szpieg +2, Oskarżyciel -1, Ofiara -1.
//  - Bonus przetrwania: +1 za każdą pełną minutę, gdy Szpieg wygrał przez upływ czasu.
const { SPY_LOCATIONS, SPY_ROLE } = require("../../spyfallData");
const { shuffleArray } = require("../../engine/utils");

const DEFAULT_DURATION_SEC = 300;

module.exports = {
  id: "szpieg",
  name: "Szpieg",
  emoji: "🕵️",
  description: "Zgadnij, kto jest Szpiegiem — zanim on zgadnie, gdzie jesteście.",
  maxPlayers: 12,
  defaults: { durationSec: DEFAULT_DURATION_SEC },

  initState() {
    return {
      location: null, // { id, name, emoji, roles }
      assignments: {}, // playerId -> { role, emoji, isSpy }
      spyId: null,
      durationSec: DEFAULT_DURATION_SEC,
      timerStartedAt: null, // serwerowy timestamp startu (działa, gdy !paused)
      remainingMs: null, // pozostały czas przy pauzie
      paused: false,
      panic: null, // { accusedId, accusedName, initiatorId, votes: { playerId -> bool } }
      revealed: false,
      roundNumber: 0,
      askerId: null, // kto aktualnie pyta
      answererId: null, // kto odpowiada (null = pytający jeszcze nie wybrał)
    };
  },

  start(game, settings = {}) {
    if (game.players.length < 3) {
      return { ok: false, error: "Za mało graczy (min. 3)" };
    }
    game.durationSec = Number(settings.duration) || DEFAULT_DURATION_SEC;
    // Punkty resetujemy tylko przy pierwszym starcie (gdy gra dopiero wyszła z lobby).
    if (game.status === "lobby") {
      game.players.forEach((p) => {
        p.score = 0;
      });
    }
    this.deal(game);
    game.status = "round";
    return { ok: true };
  },

  // Losuje lokalizację i przydziela role (jedna z nich to Szpieg).
  deal(game) {
    const loc = SPY_LOCATIONS[Math.floor(Math.random() * SPY_LOCATIONS.length)];
    const shuffled = shuffleArray([...game.players]);
    const spy = shuffled[0];
    const roles = shuffleArray([...loc.roles]).slice(0, shuffled.length - 1);

    const assignments = {};
    shuffled.forEach((p, i) => {
      if (p.id === spy.id) {
        assignments[p.id] = { role: SPY_ROLE.label, emoji: SPY_ROLE.emoji, isSpy: true };
      } else {
        const r = roles.shift();
        assignments[p.id] = { role: r.label, emoji: r.emoji, isSpy: false };
      }
    });

    game.location = loc;
    game.assignments = assignments;
    game.spyId = spy.id;
    game.timerStartedAt = null;
    game.remainingMs = null;
    game.paused = false;
    game.panic = null;
    game.revealed = false;
    game.askerId = null;
    game.answererId = null;
    game.roundNumber += 1;
  },

  // Widok hosta (bez ujawniania, kto jest Szpiegiem — to dopiero przy reveal).
  getHostState(game) {
    return {
      location: game.location ? game.location.name : null,
      locationEmoji: game.location ? game.location.emoji : null,
      durationSec: game.durationSec,
      roundNumber: game.roundNumber,
      playersCount: game.players.length,
    };
  },

  // Tajna rola konkretnego gracza (wysyłana tylko do niego).
  getPlayerRole(game, playerId) {
    const a = game.assignments[playerId];
    if (!a) return null;
    if (a.isSpy) {
      return {
        isSpy: true,
        role: SPY_ROLE.label,
        emoji: SPY_ROLE.emoji,
        locations: this.getLocations(),
      };
    }
    return {
      isSpy: false,
      role: a.role,
      emoji: a.emoji,
      location: game.location ? game.location.name : null,
      locationEmoji: game.location ? game.location.emoji : null,
    };
  },

  // Lista wszystkich lokalizacji (dla wyszukiwarki Szpiega).
  getLocations() {
    return SPY_LOCATIONS.map((l) => ({ id: l.id, name: l.name, emoji: l.emoji }));
  },

  startTimer(game) {
    game.timerStartedAt = Date.now();
    game.paused = false;
    game.remainingMs = null;
    this.initTurn(game);
    return { startedAt: game.timerStartedAt, durationSec: game.durationSec };
  },

  // Losuje pierwszego pytającego i czyści cel (początek tury).
  initTurn(game) {
    if (!game.players || game.players.length === 0) return null;
    const first = game.players[Math.floor(Math.random() * game.players.length)];
    game.askerId = first.id;
    game.answererId = null;
    return this.getTurnState(game);
  },

  // Stan tury: kto pyta, a kto odpowiada.
  getTurnState(game) {
    const asker = game.players.find((p) => p.id === game.askerId);
    const answerer = game.players.find((p) => p.id === game.answererId);
    return {
      askerId: game.askerId,
      askerName: asker ? asker.name : "",
      answererId: game.answererId,
      answererName: answerer ? answerer.name : "",
    };
  },

  // Przejście tury: aktywny gracz wybiera, kogo pyta dalej.
  pickTarget(game, playerId, targetId) {
    if (game.revealed || game.panic) return null;
    if (!game.askerId || playerId === targetId) return null;
    const activeId = game.answererId || game.askerId;
    if (playerId !== activeId) return null;
    const target = game.players.find((p) => p.id === targetId);
    if (!target) return null;
    if (game.answererId) {
      game.askerId = game.answererId; // odpowiadający staje się pytającym
    }
    game.answererId = targetId;
    return this.getTurnState(game);
  },

  pauseTimer(game) {
    if (!game.timerStartedAt || game.paused) return null;
    const elapsed = Date.now() - game.timerStartedAt;
    game.remainingMs = Math.max(0, game.durationSec * 1000 - elapsed);
    game.paused = true;
    return { remainingMs: game.remainingMs };
  },

  resumeTimer(game) {
    if (!game.paused) return null;
    const rem = game.remainingMs != null ? game.remainingMs : game.durationSec * 1000;
    game.timerStartedAt = Date.now() - (game.durationSec * 1000 - rem);
    game.paused = false;
    game.remainingMs = null;
    return { startedAt: game.timerStartedAt, durationSec: game.durationSec };
  },

  // --- Szybkie Oskarżenie (Panic Button) ---
  accuse(game, playerId, targetId) {
    if (game.panic || game.revealed || !game.timerStartedAt) return null;
    if (playerId === targetId) return null;
    const target = game.players.find((p) => p.id === targetId);
    if (!target) return null;

    this.pauseTimer(game);
    game.panic = {
      accusedId: targetId,
      accusedName: target.name,
      initiatorId: playerId,
      votes: {},
    };
    return {
      accusedId: targetId,
      accusedName: target.name,
      initiatorId: playerId,
      remainingMs: game.remainingMs,
    };
  },

  votePanic(game, playerId, agree) {
    if (!game.panic) return null;
    if (playerId === game.panic.accusedId) return null; // oskarżony nie głosuje
    game.panic.votes[playerId] = !!agree;
    const voters = game.players.filter((p) => p.id !== game.panic.accusedId);
    return { votedCount: Object.keys(game.panic.votes).length, total: voters.length };
  },

  resolvePanic(game) {
    if (!game.panic) return null;
    const accusedIsSpy = game.panic.accusedId === game.spyId;
    const voters = game.players.filter((p) => p.id !== game.panic.accusedId);
    const allAgree =
      voters.length > 0 && voters.every((p) => game.panic.votes[p.id] === true);

    const spy = game.players.find((p) => p.id === game.spyId);
    const accuser = game.players.find((p) => p.id === game.panic.initiatorId);
    const victim = game.players.find((p) => p.id === game.panic.accusedId);

    let result;
    if (accusedIsSpy && allAgree) {
      // Scenariusz 1: jednogłośnie trafiono Szpiega → Agenci +1, Szpieg 0.
      game.players.forEach((p) => {
        if (p.id !== game.spyId) p.score += 1;
      });
      result = {
        outcome: "agents-catch",
        title: "Agenci namierzyli Szpiega!",
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
        accusedId: game.panic.accusedId,
        accuserId: game.panic.initiatorId,
        unanimous: true,
      };
    } else if (!accusedIsSpy) {
      // Scenariusz 2: oskarżono niewinnego → Szpieg +2, Oskarżyciel -1, Ofiara -1.
      if (spy) spy.score += 2;
      if (accuser) accuser.score -= 1;
      if (victim) victim.score -= 1;
      result = {
        outcome: "spy-bluff",
        title: "Kompromitacja — wskazano niewinnego!",
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
        accusedId: game.panic.accusedId,
        accusedName: game.panic.accusedName,
        accuserId: game.panic.initiatorId,
        accuserName: accuser ? accuser.name : "",
      };
    } else {
      // Szpieg trafiony, ale bez jednomyślności → ucieczka, Szpieg +2.
      if (spy) spy.score += 2;
      result = {
        outcome: "spy-escape",
        title: "Szpieg uciekł — brak jednomyślności!",
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
        accusedId: game.panic.accusedId,
      };
    }

    game.panic = null;
    this.finishRound(game);
    return result;
  },

  // --- Strzał Życia ---
  shot(game, playerId, locationId) {
    if (game.revealed || game.panic || !game.timerStartedAt) return null;
    if (playerId !== game.spyId) return null;

    const correct = game.location && game.location.id === locationId;
    const spy = game.players.find((p) => p.id === game.spyId);

    let result;
    if (correct) {
      if (spy) spy.score += 2;
      result = {
        outcome: "spy-shot",
        title: "Strzał życia trafiony!",
        correct: true,
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
      };
    } else {
      game.players.forEach((p) => {
        if (p.id !== game.spyId) p.score += 1;
      });
      result = {
        outcome: "agents-shot",
        title: "Strzał życia chybiony!",
        correct: false,
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
      };
    }

    this.finishRound(game);
    return result;
  },

  // --- Werdykt hosta po końcu timera ---
  resolveHost(game, spyWon) {
    if (game.revealed) return null;
    const spy = game.players.find((p) => p.id === game.spyId);

    let result;
    if (spyWon) {
      let survival = 0;
      if (spy) {
        spy.score += 2;
        survival = Math.floor(game.durationSec / 60);
        spy.score += survival;
      }
      result = {
        outcome: "spy-timeup",
        title: "Szpieg odgadł lokalizację!",
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
        survival,
      };
    } else {
      game.players.forEach((p) => {
        if (p.id !== game.spyId) p.score += 1;
      });
      result = {
        outcome: "agents-timeup",
        title: "Agenci złapali Szpiega!",
        spyId: game.spyId,
        spyName: spy ? spy.name : "",
      };
    }

    this.finishRound(game);
    return result;
  },

  // Wspólne zakończenie rundy: czyści timer i oznacza ujawnienie.
  finishRound(game) {
    game.timerStartedAt = null;
    game.remainingMs = null;
    game.paused = false;
    game.revealed = true;
  },

  // Publiczne rozwiązanie rundy (dla wszystkich po zakończeniu).
  reveal(game) {
    return {
      location: game.location ? game.location.name : null,
      locationEmoji: game.location ? game.location.emoji : null,
      spyId: game.spyId,
      spyName: game.players.find((p) => p.id === game.spyId)?.name || "",
      roles: game.players.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        role: game.assignments[p.id] ? game.assignments[p.id].role : "?",
        emoji: game.assignments[p.id] ? game.assignments[p.id].emoji : "",
        isSpy: game.assignments[p.id] ? game.assignments[p.id].isSpy : false,
      })),
    };
  },

  // Nowa runda (ponowne rozdanie, punkty zostają).
  nextRound(game) {
    this.deal(game);
    game.status = "round";
    return { ok: true };
  },
};
