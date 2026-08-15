// KWAKOUT — baza pytań "Melodia czy Fałsz" (wersja tekstowa).
// Gracze zgadują utwór/wykonawcę po fragmencie tekstu.

const melodiaPytania = [
  { id: "mu1", question: "„Mama, just killed a man…” — kto to śpiewa?", answers: ["Queen", "The Beatles", "Led Zeppelin", "Pink Floyd"], correct: 0 },
  { id: "mu2", question: "„Sweet Caroline…” — czyj to przebój?", answers: ["Elton John", "Neil Diamond", "Billy Joel", "Rod Stewart"], correct: 1 },
  { id: "mu3", question: "„Yesterday, all my troubles seemed so far away…” — kto to śpiewa?", answers: ["The Rolling Stones", "The Beatles", "The Who", "The Kinks"], correct: 1 },
  { id: "mu4", question: "„Hello, it's me…” — czyj to hit?", answers: ["Beyoncé", "Adele", "Rihanna", "Lady Gaga"], correct: 1 },
  { id: "mu5", question: "„Billie Jean is not my lover…” — kto to śpiewa?", answers: ["Prince", "Michael Jackson", "Stevie Wonder", "Marvin Gaye"], correct: 1 },
  { id: "mu6", question: "„Smells Like Teen Spirit…” — czyj to utwór?", answers: ["Nirvana", "Pearl Jam", "Soundgarden", "Foo Fighters"], correct: 0 },
  { id: "mu7", question: "„Hotel California…” — kto to śpiewa?", answers: ["Creedence", "The Eagles", "Lynyrd Skynyrd", "Fleetwood Mac"], correct: 1 },
  { id: "mu8", question: "„We Are the Champions…” — czyj to hymn?", answers: ["AC/DC", "Queen", "Bon Jovi", "Guns N' Roses"], correct: 1 },
  { id: "mu9", question: "„Imagine there's no heaven…” — kto to śpiewa?", answers: ["John Lennon", "Paul McCartney", "George Harrison", "Bob Dylan"], correct: 0 },
  { id: "mu10", question: "„Despacito…” — czyj to przebój?", answers: ["Enrique Iglesias", "Luis Fonsi", "Ricky Martin", "Maluma"], correct: 1 },
  { id: "mu11", question: "„Dni, których nie znamy…” — kto to śpiewa?", answers: ["Czesław Niemen", "Marek Grechuta", "Zbigniew Wodecki", "Grzegorz Turnau"], correct: 1 },
  { id: "mu12", question: "„Jolka, Jolka pamiętasz…” — czyj to utwór?", answers: ["Budka Suflera", "Perfect", "Dżem", "Lady Pank"], correct: 0 },
  { id: "mu13", question: "„Autobiografia…” — kto to śpiewa?", answers: ["Maanam", "Perfect", "Republika", "Kombi"], correct: 1 },
  { id: "mu14", question: "„Kocham Cię jak Irlandię…” — czyj to hit?", answers: ["Kobranocka", "Sztywny Pal Azji", "T.Love", "Dezerter"], correct: 0 },
  { id: "mu15", question: "„Prześliczna wiolonczelistka…” — kto to śpiewa?", answers: ["Skaldowie", "Czerwone Gitary", "Trubadurzy", "2 plus 1"], correct: 0 },
  { id: "mu16", question: "„Małgośka, szkoda łez…” — czyj to przebój?", answers: ["Maryla Rodowicz", "Urszula Sipińska", "Halina Frąckowiak", "Irena Santor"], correct: 0 },
  { id: "mu17", question: "„Rolling in the Deep…” — kto to śpiewa?", answers: ["Dua Lipa", "Adele", "Alicia Keys", "Sia"], correct: 1 },
  { id: "mu18", question: "„Let it go, let it go…” — z jakiego filmu?", answers: ["Vaiana", "Kraina lodu", "Zaplątani", "Król Lew"], correct: 1 },
  { id: "mu19", question: "„Windą do nieba…” — kto to śpiewa?", answers: ["2 plus 1", "Anna Jantar", "Irena Jarocka", "Krystyna Prońko"], correct: 0 },
  { id: "mu20", question: "„Thriller…” — czyj to utwór?", answers: ["Michael Jackson", "Justin Timberlake", "Bruno Mars", "Pharrell Williams"], correct: 0 },
  { id: "mu21", question: "„Do kołyski…” — czyj to utwór?", answers: ["Dżem", "IRA", "Kult", "Hey"], correct: 0 },
  { id: "mu22", question: "„Ale jazz!…” — kto to śpiewa?", answers: ["Sanah", "Vito Bambino", "Dawid Podsiadło", "Mata"], correct: 1 },
  { id: "mu23", question: "„Zacznij od Bacha…” — kto to śpiewa?", answers: ["Marek Grechuta", "Zbigniew Wodecki", "Andrzej Zaucha", "Mieczysław Fogg"], correct: 1 },
  { id: "mu24", question: "„Shape of You…” — czyj to hit?", answers: ["Sam Smith", "Ed Sheeran", "Shawn Mendes", "Charlie Puth"], correct: 1 },
];

module.exports = { melodiaPytania };

