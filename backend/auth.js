// Autentykacja: Google OAuth 2.0 + JWT w ciasteczku httpOnly.

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const { prisma, requireDb } = require("./db");

const COOKIE_NAME = "kwakout_token";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-zmien-mnie";
const TOKEN_TTL = "7d";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dni

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const AUTH_CALLBACK_URL =
  process.env.AUTH_CALLBACK_URL ||
  "http://localhost:5173/auth/google/callback";

// Strategia Google — rejestrowana tylko gdy są poświadczenia.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: AUTH_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile);
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

// Znajdź użytkownika po koncie Google lub utwórz nowego (logowanie = rejestracja).
async function findOrCreateUser(profile) {
  const db = requireDb();
  const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
  if (!email) {
    throw new Error("Profil Google nie zawiera adresu email.");
  }

  const existingAccount = await db.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.id,
      },
    },
    include: { user: true },
  });
  if (existingAccount) return existingAccount.user;

  // Linkuj konto po emailu albo utwórz nowego użytkownika.
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: profile.displayName || email.split("@")[0],
        avatar: "🦆",
      },
    });
  }

  await db.oAuthAccount.create({
    data: {
      provider: "google",
      providerAccountId: profile.id,
      userId: user.id,
    },
  });

  return user;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Kształt użytkownika wysyłany do klienta (bez wrażliwych pól).
function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    coins: user.coins,
    level: user.level,
  };
}

module.exports = {
  passport,
  COOKIE_NAME,
  JWT_SECRET,
  TOKEN_MAX_AGE_MS,
  FRONTEND_URL,
  AUTH_CALLBACK_URL,
  findOrCreateUser,
  signToken,
  verifyToken,
  toPublicUser,
};
