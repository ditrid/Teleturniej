// Warstwa dostępu do bazy danych (Prisma).
// Graceful degradation: bez DATABASE_URL serwer dalej działa
// (silnik gier realtime), a funkcje bazodanowe (auth, profil, sklep) są wyłączone.

const { PrismaClient } = require("@prisma/client");

let prisma = null;
let dbReady = false;

if (process.env.DATABASE_URL) {
  prisma = new PrismaClient();
  dbReady = true;
} else {
  console.warn(
    "[DB] DATABASE_URL nie jest ustawione — funkcje bazodanowe (logowanie, profil, sklep) są wyłączone."
  );
}

function requireDb() {
  if (!dbReady) {
    const err = new Error(
      "Baza danych nie jest skonfigurowana. Ustaw DATABASE_URL w backend/.env"
    );
    err.status = 503;
    throw err;
  }
  return prisma;
}

module.exports = { prisma, dbReady, requireDb };
