// Wspólne, bezstanowe helpery silnika (bez zależności cyklicznych).

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { shuffleArray, generateCode };
