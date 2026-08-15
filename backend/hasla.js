// KWAKOUT — baza haseł do "Zgadnij Hasło" (Password / Taboo).
// Każde hasło ma 3 słowa zakazane, których nie wolno użyć przy opisywaniu.

const hasla = [
  { id: "h1", word: "Piłka nożna", taboo: ["sport", "bramka", "mecz"] },
  { id: "h2", word: "Szkoła", taboo: ["nauka", "lekcje", "nauczyciel"] },
  { id: "h3", word: "Wakacje", taboo: ["lato", "urlop", "morze"] },
  { id: "h4", word: "Książka", taboo: ["czytać", "strony", "biblioteka"] },
  { id: "h5", word: "Pizza", taboo: ["jedzenie", "ser", "włoska"] },
  { id: "h6", word: "Komputer", taboo: ["klawiatura", "ekran", "internet"] },
  { id: "h7", word: "Ślub", taboo: ["małżeństwo", "panna młoda", "obrączki"] },
  { id: "h8", word: "Zima", taboo: ["śnieg", "mróz", "lód"] },
  { id: "h9", word: "Samochód", taboo: ["auto", "kierowca", "droga"] },
  { id: "h10", word: "Pies", taboo: ["zwierzę", "szczekać", "smycz"] },
  { id: "h11", word: "Kawa", taboo: ["napój", "kofeina", "poranek"] },
  { id: "h12", word: "Teatr", taboo: ["scena", "aktor", "sztuka"] },
  { id: "h13", word: "Plaża", taboo: ["piasek", "morze", "parasol"] },
  { id: "h14", word: "Lekarz", taboo: ["szpital", "pacjent", "recepta"] },
  { id: "h15", word: "Święta", taboo: ["Boże Narodzenie", "choinka", "prezenty"] },
  { id: "h16", word: "Telefon", taboo: ["dzwonić", "sms", "komórka"] },
  { id: "h17", word: "Lotnisko", taboo: ["samolot", "bagaż", "odlot"] },
  { id: "h18", word: "Sushi", taboo: ["ryż", "ryba", "japońskie"] },
  { id: "h19", word: "Basen", taboo: ["pływać", "woda", "kąpiel"] },
  { id: "h20", word: "Śniadanie", taboo: ["rano", "jeść", "jajka"] },
  { id: "h21", word: "Kino", taboo: ["film", "bilet", "ekran"] },
  { id: "h22", word: "Rower", taboo: ["jechać", "pedały", "koła"] },
  { id: "h23", word: "Konkurs", taboo: ["nagroda", "wygrać", "jury"] },
  { id: "h24", word: "Wiosna", taboo: ["kwiaty", "pora roku", "ciepło"] },
  { id: "h25", word: "Gitara", taboo: ["instrument", "struny", "grać"] },
  { id: "h26", word: "Gotowanie", taboo: ["kuchnia", "przepis", "garnek"] },
  { id: "h27", word: "Muzeum", taboo: ["obrazy", "wystawa", "zwiedzać"] },
  { id: "h28", word: "Prezydent", taboo: ["państwo", "rząd", "polityk"] },
  { id: "h29", word: "Śnieg", taboo: ["biały", "zima", "płatki"] },
  { id: "h30", word: "Taniec", taboo: ["muzyka", "kroki", "parkiet"] },
];

module.exports = { hasla };
