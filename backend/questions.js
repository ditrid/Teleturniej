const questions = [
  {
    id: 1,
    question: "Która planeta w Układzie Słonecznym jest największa?",
    answers: ["Wenus", "Mars", "Jowisz", "Saturn"],
    correct: 2,
  },
  {
    id: 2,
    question: "Ile kości ma dorosły człowiek?",
    answers: ["186", "206", "226", "256"],
    correct: 1,
  },
  {
    id: 3,
    question: "Kto napisał 'Pana Tadeusza'?",
    answers: [
      "Juliusz Słowacki",
      "Adam Mickiewicz",
      "Henryk Sienkiewicz",
      "Bolesław Prus",
    ],
    correct: 1,
  },
  {
    id: 4,
    question: "Jaki jest symbol chemiczny złota?",
    answers: ["Ag", "Au", "Fe", "Cu"],
    correct: 1,
  },
  {
    id: 5,
    question: "Ile wynosi pierwiastek kwadratowy z 144?",
    answers: ["10", "11", "12", "14"],
    correct: 2,
  },
  {
    id: 6,
    question: "Stolicą którego kraju jest Canberra?",
    answers: ["Nowej Zelandii", "Australii", "Kanady", "RPA"],
    correct: 1,
  },
  {
    id: 7,
    question: "W którym roku wybuchła II Wojna Światowa?",
    answers: ["1938", "1939", "1940", "1941"],
    correct: 1,
  },
  {
    id: 8,
    question: "Ile kolorów ma tęcza?",
    answers: ["5", "6", "7", "8"],
    correct: 2,
  },
  {
    id: 9,
    question: "Jak nazywa się największy ocean na Ziemi?",
    answers: ["Atlantycki", "Indyjski", "Arktyczny", "Spokojny"],
    correct: 3,
  },
  {
    id: 10,
    question: "Który pierwiastek ma symbol 'O'?",
    answers: ["Osm", "Ołów", "Tlen", "Ozon"],
    correct: 2,
  },
  {
    id: 11,
    question: "Ile sekund ma godzina?",
    answers: ["360", "600", "3600", "6000"],
    correct: 2,
  },
  {
    id: 12,
    question: "Kto namalował 'Mona Lisę'?",
    answers: [
      "Vincent van Gogh",
      "Leonardo da Vinci",
      "Pablo Picasso",
      "Michelangelo",
    ],
    correct: 1,
  },
  {
    id: 13,
    question: "Jak się nazywa stolica Polski?",
    answers: ["Kraków", "Gdańsk", "Warszawa", "Wrocław"],
    correct: 2,
  },
  {
    id: 14,
    question: "Ile to 7 × 8?",
    answers: ["48", "54", "56", "64"],
    correct: 2,
  },
  {
    id: 15,
    question: "Jaka jest temperatura wrzenia wody w stopniach Celsjusza?",
    answers: ["90°C", "95°C", "100°C", "110°C"],
    correct: 2,
  },
  {
    id: 16,
    question: "Kto jest autorem teorii względności?",
    answers: [
      "Isaac Newton",
      "Albert Einstein",
      "Niels Bohr",
      "Stephen Hawking",
    ],
    correct: 1,
  },
  {
    id: 17,
    question: "Ile kontynentów jest na Ziemi?",
    answers: ["5", "6", "7", "8"],
    correct: 2,
  },
  {
    id: 18,
    question: "Jakie jest największe zwierzę na świecie?",
    answers: ["Słoń afrykański", "Płetwal błękitny", "Rekin wielorybi", "Żyrafa"],
    correct: 1,
  },
  {
    id: 19,
    question: "W którym roku odbył się chrzest Polski?",
    answers: ["966", "1000", "1025", "1138"],
    correct: 0,
  },
  {
    id: 20,
    question: "Jak nazywa się najwyższa góra świata?",
    answers: ["K2", "Mount Everest", "Kilimandżaro", "Mont Blanc"],
    correct: 1,
  },
];

const finalQuestions = [
  {
    id: "f1",
    question: "Jaka jest prędkość światła w próżni?",
    answers: [
      "ok. 300 000 km/s",
      "ok. 150 000 km/s",
      "ok. 1 000 000 km/s",
      "ok. 30 000 km/s",
    ],
    correct: 0,
  },
  {
    id: "f2",
    question: "Kto napisał 'Zbrodnię i karę'?",
    answers: [
      "Lew Tołstoj",
      "Fiodor Dostojewski",
      "Anton Czechow",
      "Iwan Turgieniew",
    ],
    correct: 1,
  },
  {
    id: "f3",
    question: "Ile nóg ma pająk?",
    answers: ["6", "8", "10", "12"],
    correct: 1,
  },
  {
    id: "f4",
    question: "Jakie jest chemiczne oznaczenie sodu?",
    answers: ["S", "So", "Na", "No"],
    correct: 2,
  },
  {
    id: "f5",
    question: "Który rok jest rokiem przestępnym?",
    answers: ["1900", "2000", "2100", "2022"],
    correct: 1,
  },
  {
    id: "f6",
    question: "Jaka jest waluta Japonii?",
    answers: ["Won", "Jen", "Juan", "Dong"],
    correct: 1,
  },
  {
    id: "f7",
    question: "Ile zer ma miliard?",
    answers: ["6", "7", "8", "9"],
    correct: 3,
  },
  {
    id: "f8",
    question: "Kto skomponował 'Cztery pory roku'?",
    answers: ["Bach", "Mozart", "Vivaldi", "Beethoven"],
    correct: 2,
  },
  {
    id: "f9",
    question: "Jaki jest główny składnik powietrza?",
    answers: ["Tlen", "Azot", "Dwutlenek węgla", "Argon"],
    correct: 1,
  },
  {
    id: "f10",
    question: "W jakim języku mówi się w Brazylii?",
    answers: ["Hiszpańskim", "Portugalskim", "Angielskim", "Francuskim"],
    correct: 1,
  },
];

module.exports = { questions, finalQuestions };