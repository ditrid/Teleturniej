// KWAKOUT — ranking graczy + drużyna (mock data) — redesign imprezowy

export const leaderboard = [
  { id: 1, name: "QuackMaster", avatar: "🦆", score: 2450, delta: "+2", trend: "up", level: 12 },
  { id: 2, name: "Imprezowiczka", avatar: "🦊", score: 1980, delta: "+1", trend: "up", level: 10 },
  { id: 3, name: "Kaczor", avatar: "🐸", score: 1750, delta: "—", trend: "flat", level: 9 },
  { id: 4, name: "Szef Imprezy", avatar: "🐼", score: 1560, delta: "+3", trend: "up", level: 12, isMe: true },
  { id: 5, name: "PartyQueen", avatar: "🦄", score: 1420, delta: "−1", trend: "down", level: 8 },
  { id: 6, name: "DJ Kaczka", avatar: "🎧", score: 1280, delta: "—", trend: "flat", level: 7 },
  { id: 7, name: "Imprezowicz", avatar: "🦁", score: 1150, delta: "+5", trend: "up", level: 6 },
  { id: 8, name: "Natalia", avatar: "🐨", score: 980, delta: "−2", trend: "down", level: 6 },
];

export const currentUser = {
  id: 4,
  name: "Szef Imprezy",
  avatar: "🐼",
  score: 1560,
  rank: 4,
  level: 12,
  xp: 785,
  xpMax: 1200,
  coins: 2150,
  title: "Szef Imprezy",
  gamesPlayed: 24,
  challenges: 156,
  wins: 8,
};

export const teamMembers = [
  { id: 1, name: "Kaczor", avatar: "🟡", level: 10, online: true },
  { id: 2, name: "QuackMaster", avatar: "🟢", level: 8, online: true },
  { id: 3, name: "Imprezowiczka", avatar: "🔵", level: 7, online: false },
];
