// KWAKOUT — baza lokalizacji i ról do gry "Szpieg" (klon Spyfall).
// 50 lokalizacji, każda z 12 unikalnymi rolami (obsługuje do 12 graczy bez powtórek).
// Szpieg nie widzi lokalizacji — dostaje tylko swoją rolę "Szpieg".

const SPY_LOCATIONS = [
  {
    id: "kino", name: "Kino", emoji: "🎬", roles: [
      { label: "Kasjer", emoji: "🎟️" }, { label: "Bileter", emoji: "🎫" }, { label: "Widz", emoji: "🙂" }, { label: "Krytyk filmowy", emoji: "📝" },
      { label: "Operator", emoji: "🎥" }, { label: "Sprzedawca popcornu", emoji: "🍿" }, { label: "Sprzątaczka", emoji: "🧹" }, { label: "Ochroniarz", emoji: "💂" },
      { label: "Reżyser", emoji: "🎬" }, { label: "Aktor", emoji: "🎭" }, { label: "Kaskader", emoji: "🤸" }, { label: "Montażysta", emoji: "💻" },
    ],
  },
  {
    id: "szpital", name: "Szpital", emoji: "🏥", roles: [
      { label: "Lekarz", emoji: "🩺" }, { label: "Pielęgniarka", emoji: "💉" }, { label: "Chirurg", emoji: "🔪" }, { label: "Pacjent", emoji: "🛏️" },
      { label: "Recepcjonistka", emoji: "☎️" }, { label: "Anestezjolog", emoji: "😴" }, { label: "Sanitariusz", emoji: "🚑" }, { label: "Farmaceuta", emoji: "💊" },
      { label: "Psycholog", emoji: "🧠" }, { label: "Kucharz szpitalny", emoji: "🍲" }, { label: "Ratownik medyczny", emoji: "🚨" }, { label: "Dyrektor", emoji: "📋" },
    ],
  },
  {
    id: "restauracja", name: "Restauracja", emoji: "🍽️", roles: [
      { label: "Kelner", emoji: "🍽️" }, { label: "Szef kuchni", emoji: "👨‍🍳" }, { label: "Kucharz", emoji: "🍳" }, { label: "Sommelier", emoji: "🍷" },
      { label: "Barman", emoji: "🍸" }, { label: "Gość", emoji: "🍴" }, { label: "Krytyk kulinarny", emoji: "📝" }, { label: "Zmywak", emoji: "🧽" },
      { label: "Dostawca", emoji: "🚚" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Dekorator", emoji: "🌸" }, { label: "Ochroniarz", emoji: "💂" },
    ],
  },
  {
    id: "statek-piracki", name: "Statek piracki", emoji: "🏴‍☠️", roles: [
      { label: "Kapitan", emoji: "🎩" }, { label: "Pierwszy oficer", emoji: "🧭" }, { label: "Bosman", emoji: "⚓" }, { label: "Kanonier", emoji: "💣" },
      { label: "Nawigator", emoji: "🗺️" }, { label: "Kuk", emoji: "🍲" }, { label: "Majtek", emoji: "🪢" }, { label: "Więzień", emoji: "⛓️" },
      { label: "Poszukiwacz skarbów", emoji: "💰" }, { label: "Sternik", emoji: "⚓" }, { label: "Obserwator", emoji: "🔭" }, { label: "Chirurg pokładowy", emoji: "🩺" },
    ],
  },
  {
    id: "stacja-kosmiczna", name: "Stacja kosmiczna", emoji: "🚀", roles: [
      { label: "Astronauta", emoji: "👨‍🚀" }, { label: "Dowódca misji", emoji: "🎖️" }, { label: "Inżynier pokładowy", emoji: "🔧" }, { label: "Lekarz kosmiczny", emoji: "🩺" },
      { label: "Pilot", emoji: "✈️" }, { label: "Naukowiec", emoji: "🔬" }, { label: "Technik", emoji: "🛠️" }, { label: "Kontroler lotu", emoji: "🎛️" },
      { label: "Kosmonauta", emoji: "🧑‍🚀" }, { label: "Specjalista ładunku", emoji: "📦" }, { label: "Robotyk", emoji: "🤖" }, { label: "Astronom", emoji: "🔭" },
    ],
  },
  {
    id: "lotnisko", name: "Lotnisko", emoji: "✈️", roles: [
      { label: "Pilot", emoji: "👨‍✈️" }, { label: "Stewardesa", emoji: "💁" }, { label: "Kontroler lotów", emoji: "🎛️" }, { label: "Celnik", emoji: "🛃" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Pasażer", emoji: "🧳" }, { label: "Bagażowy", emoji: "🧳" }, { label: "Bileter", emoji: "🎫" },
      { label: "Mechanik", emoji: "🔧" }, { label: "Taksówkarz", emoji: "🚕" }, { label: "Sprzedawca", emoji: "🛍️" }, { label: "Sprzątaczka", emoji: "🧹" },
    ],
  },
  {
    id: "korporacja", name: "Korporacja", emoji: "🏢", roles: [
      { label: "Prezes", emoji: "👔" }, { label: "Sekretarka", emoji: "📞" }, { label: "Księgowy", emoji: "🧮" }, { label: "Prawnik", emoji: "⚖️" },
      { label: "Programista", emoji: "💻" }, { label: "Menedżer", emoji: "📊" }, { label: "Stażysta", emoji: "🎓" }, { label: "Specjalista HR", emoji: "👥" },
      { label: "Marketingowiec", emoji: "📣" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Sprzątaczka", emoji: "🧹" }, { label: "Analityk", emoji: "📈" },
    ],
  },
  {
    id: "cyrk", name: "Cyrk", emoji: "🎪", roles: [
      { label: "Klaun", emoji: "🤡" }, { label: "Akrobata", emoji: "🤸" }, { label: "Żongler", emoji: "🤹" }, { label: "Pogromca lwów", emoji: "🦁" },
      { label: "Magik", emoji: "🎩" }, { label: "Siłacz", emoji: "💪" }, { label: "Trapezistka", emoji: "🎪" }, { label: "Konferansjer", emoji: "🎤" },
      { label: "Treser", emoji: "🐘" }, { label: "Bileter", emoji: "🎫" }, { label: "Sprzedawca waty", emoji: "🍭" }, { label: "Muzyk", emoji: "🎺" },
    ],
  },
  {
    id: "kasyno", name: "Kasyno", emoji: "🎰", roles: [
      { label: "Krupier", emoji: "🃏" }, { label: "Gracz", emoji: "🎲" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Szef sali", emoji: "👔" },
      { label: "Barman", emoji: "🍸" }, { label: "Kelnerka", emoji: "🍹" }, { label: "Kasjer", emoji: "💵" }, { label: "Pokerzysta", emoji: "♠️" },
      { label: "Iluzjonista", emoji: "🎩" }, { label: "Kelner", emoji: "🍽️" }, { label: "Menedżer", emoji: "📊" }, { label: "Kamerdyner", emoji: "🎩" },
    ],
  },
  {
    id: "baza-wojskowa", name: "Baza wojskowa", emoji: "🪖", roles: [
      { label: "Generał", emoji: "🎖️" }, { label: "Żołnierz", emoji: "🪖" }, { label: "Snajper", emoji: "🎯" }, { label: "Inżynier", emoji: "🔧" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Medyk", emoji: "⛑️" }, { label: "Radiowiec", emoji: "📻" }, { label: "Saper", emoji: "💣" },
      { label: "Dowódca", emoji: "👨‍✈️" }, { label: "Rekrut", emoji: "🎖️" }, { label: "Mechanik", emoji: "🔩" }, { label: "Zwiadowca", emoji: "🧭" },
    ],
  },
  {
    id: "hotel", name: "Hotel", emoji: "🏨", roles: [
      { label: "Recepcjonista", emoji: "🛎️" }, { label: "Portier", emoji: "🚪" }, { label: "Pokojówka", emoji: "🧺" }, { label: "Gość", emoji: "🧳" },
      { label: "Konsjerż", emoji: "🗝️" }, { label: "Barman", emoji: "🍸" }, { label: "Kucharz", emoji: "🍳" }, { label: "Menedżer", emoji: "📊" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Bagażowy", emoji: "🧳" }, { label: "Kelner", emoji: "🍽️" }, { label: "Sprzątaczka", emoji: "🧹" },
    ],
  },
  {
    id: "szkola", name: "Szkoła", emoji: "🏫", roles: [
      { label: "Nauczyciel", emoji: "👩‍🏫" }, { label: "Uczeń", emoji: "🎒" }, { label: "Dyrektor", emoji: "📋" }, { label: "Woźny", emoji: "🔧" },
      { label: "Bibliotekarz", emoji: "📚" }, { label: "Pedagog", emoji: "👩‍🏫" }, { label: "Nauczyciel WF", emoji: "⚽" }, { label: "Sekretarka", emoji: "☎️" },
      { label: "Kucharka", emoji: "🍲" }, { label: "Nauczyciel matematyki", emoji: "➗" }, { label: "Sprzątaczka", emoji: "🧹" }, { label: "Psycholog", emoji: "🧠" },
    ],
  },
  {
    id: "zoo", name: "Zoo", emoji: "🦁", roles: [
      { label: "Opiekun zwierząt", emoji: "🐒" }, { label: "Weterynarz", emoji: "🩺" }, { label: "Bileter", emoji: "🎫" }, { label: "Zwiedzający", emoji: "👨‍👩‍👧" },
      { label: "Karmiciel", emoji: "🥕" }, { label: "Sprzedawca pamiątek", emoji: "🧸" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Ogrodnik", emoji: "🌳" },
      { label: "Fotograf", emoji: "📸" }, { label: "Animator", emoji: "🎈" }, { label: "Dozorca", emoji: "🔧" }, { label: "Pracownik obsługi", emoji: "🧹" },
    ],
  },
  {
    id: "teatr", name: "Teatr", emoji: "🎭", roles: [
      { label: "Aktor", emoji: "🎭" }, { label: "Reżyser", emoji: "🎬" }, { label: "Sufler", emoji: "📖" }, { label: "Kostiumograf", emoji: "👗" },
      { label: "Oświetleniowiec", emoji: "💡" }, { label: "Scenograf", emoji: "🖼️" }, { label: "Bileter", emoji: "🎫" }, { label: "Widz", emoji: "👏" },
      { label: "Charakteryzator", emoji: "💄" }, { label: "Rekwizytor", emoji: "🎭" }, { label: "Inspicjent", emoji: "🎛️" }, { label: "Muzyk", emoji: "🎻" },
    ],
  },
  {
    id: "muzeum", name: "Muzeum", emoji: "🏛️", roles: [
      { label: "Kustosz", emoji: "🏺" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Kasjer", emoji: "💵" },
      { label: "Konserwator", emoji: "🖌️" }, { label: "Archeolog", emoji: "⛏️" }, { label: "Historyk", emoji: "📜" }, { label: "Zwiedzający", emoji: "👀" },
      { label: "Kurator", emoji: "🖼️" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Fotograf", emoji: "📸" }, { label: "Recepcjonista", emoji: "📞" },
    ],
  },
  {
    id: "plaza", name: "Plaża", emoji: "🏖️", roles: [
      { label: "Ratownik", emoji: "🛟" }, { label: "Turysta", emoji: "🧳" }, { label: "Sprzedawca lodów", emoji: "🍦" }, { label: "Surfer", emoji: "🏄" },
      { label: "Rybak", emoji: "🎣" }, { label: "Plażowicz", emoji: "☀️" }, { label: "Trener siatkówki", emoji: "🏐" }, { label: "Barman", emoji: "🍹" },
      { label: "Masażysta", emoji: "💆" }, { label: "Sprzedawca kremów", emoji: "🧴" }, { label: "Wypożyczalnia parasoli", emoji: "⛱️" }, { label: "Fotograf", emoji: "📸" },
    ],
  },
  {
    id: "supermarket", name: "Supermarket", emoji: "🛒", roles: [
      { label: "Kasjer", emoji: "💵" }, { label: "Magazynier", emoji: "📦" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Klient", emoji: "🛒" },
      { label: "Kierownik", emoji: "📊" }, { label: "Piekarz", emoji: "🥖" }, { label: "Rzeźnik", emoji: "🥩" }, { label: "Sprzedawca warzyw", emoji: "🥕" },
      { label: "Dostawca", emoji: "🚚" }, { label: "Sprzątaczka", emoji: "🧹" }, { label: "Informatyk", emoji: "💻" }, { label: "Promotor", emoji: "📣" },
    ],
  },
  {
    id: "pociag", name: "Pociąg", emoji: "🚆", roles: [
      { label: "Maszynista", emoji: "👨‍✈️" }, { label: "Konduktor", emoji: "🎫" }, { label: "Pasażer", emoji: "🧳" }, { label: "Bileter", emoji: "🎫" },
      { label: "Kucharz wagonu", emoji: "🍲" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Dyżurny ruchu", emoji: "🎛️" },
      { label: "Mechanik", emoji: "🔧" }, { label: "Kierownik pociągu", emoji: "📋" }, { label: "Roznosiciel napojów", emoji: "☕" }, { label: "Podróżny", emoji: "🎒" },
    ],
  },
  {
    id: "stadion", name: "Stadion piłkarski", emoji: "⚽", roles: [
      { label: "Piłkarz", emoji: "⚽" }, { label: "Bramkarz", emoji: "🧤" }, { label: "Trener", emoji: "👨‍🏫" }, { label: "Sędzia", emoji: "🟨" },
      { label: "Kibic", emoji: "📣" }, { label: "Komentator", emoji: "🎙️" }, { label: "Sprzedawca kiełbasek", emoji: "🌭" }, { label: "Ochroniarz", emoji: "💂" },
      { label: "Fotoreporter", emoji: "📸" }, { label: "Masażysta", emoji: "💆" }, { label: "Spiker", emoji: "🎤" }, { label: "Działacz", emoji: "📋" },
    ],
  },
  {
    id: "wiezienie", name: "Więzienie", emoji: "⛓️", roles: [
      { label: "Strażnik", emoji: "👮" }, { label: "Więzień", emoji: "🔒" }, { label: "Naczelnik", emoji: "📋" }, { label: "Adwokat", emoji: "⚖️" },
      { label: "Psycholog", emoji: "🧠" }, { label: "Kucharz", emoji: "🍲" }, { label: "Lekarz", emoji: "🩺" }, { label: "Pracownik socjalny", emoji: "🤝" },
      { label: "Rewizor", emoji: "🔍" }, { label: "Kapelan", emoji: "🙏" }, { label: "Technik monitoringu", emoji: "📹" }, { label: "Kurator", emoji: "📋" },
    ],
  },

  {
    id: "ambasada", name: "Ambasada", emoji: "🕊️", roles: [
      { label: "Ambasador", emoji: "🎖️" }, { label: "Dyplomata", emoji: "🤝" }, { label: "Sekretarka", emoji: "☎️" }, { label: "Tłumacz", emoji: "🗣️" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Attaché", emoji: "📋" }, { label: "Konsul", emoji: "🏛️" }, { label: "Recepcjonista", emoji: "📞" },
      { label: "Kucharz", emoji: "🍳" }, { label: "Kierowca", emoji: "🚗" }, { label: "Analityk", emoji: "📈" }, { label: "Szef protokołu", emoji: "🎩" },
    ],
  },
  {
    id: "statek-wycieczkowy", name: "Statek wycieczkowy", emoji: "🛳️", roles: [
      { label: "Kapitan", emoji: "🎩" }, { label: "Sternik", emoji: "⚓" }, { label: "Animator", emoji: "🎈" }, { label: "Kelner", emoji: "🍽️" },
      { label: "Kucharz", emoji: "🍳" }, { label: "Pasażer", emoji: "🧳" }, { label: "Ratownik", emoji: "🛟" }, { label: "Muzyk", emoji: "🎷" },
      { label: "Barman", emoji: "🍹" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Mechanik", emoji: "🔧" }, { label: "Fotograf", emoji: "📸" },
    ],
  },
  {
    id: "kopalnia-zlota", name: "Kopalnia złota", emoji: "⛏️", roles: [
      { label: "Górnik", emoji: "⛏️" }, { label: "Sztygar", emoji: "🎖️" }, { label: "Geolog", emoji: "🪨" }, { label: "Inżynier", emoji: "🔧" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Medyk", emoji: "⛑️" }, { label: "Właściciel kopalni", emoji: "💰" }, { label: "Poszukiwacz złota", emoji: "💰" },
      { label: "Operator maszyn", emoji: "🛠️" }, { label: "Strażnik", emoji: "💂" }, { label: "Geodeta", emoji: "📐" }, { label: "Sprzedawca", emoji: "🛍️" },
    ],
  },
  {
    id: "oboz-w-lesie", name: "Obóz w lesie", emoji: "🏕️", roles: [
      { label: "Harcerz", emoji: "🏕️" }, { label: "Leśniczy", emoji: "🌲" }, { label: "Kucharz obozowy", emoji: "🍲" }, { label: "Ratownik", emoji: "🛟" },
      { label: "Wędrowiec", emoji: "🥾" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Muzykant", emoji: "🎸" },
      { label: "Fotograf", emoji: "📸" }, { label: "Medyk", emoji: "⛑️" }, { label: "Instruktor", emoji: "👨‍🏫" }, { label: "Zbieracz grzybów", emoji: "🍄" },
    ],
  },
  {
    id: "biblioteka", name: "Biblioteka", emoji: "📚", roles: [
      { label: "Bibliotekarz", emoji: "📚" }, { label: "Czytelnik", emoji: "📖" }, { label: "Archiwista", emoji: "🗄️" }, { label: "Kataloger", emoji: "🏷️" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Kustosz", emoji: "🏺" }, { label: "Wolontariusz", emoji: "🤝" }, { label: "Informatyk", emoji: "💻" },
      { label: "Pisarz", emoji: "✍️" }, { label: "Student", emoji: "🎓" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Sprzątacz", emoji: "🧹" },
    ],
  },
  {
    id: "klinika-psychiatryczna", name: "Klinika psychiatryczna", emoji: "🧠", roles: [
      { label: "Psychiatra", emoji: "👨‍⚕️" }, { label: "Pacjent", emoji: "🛏️" }, { label: "Pielęgniarz", emoji: "💉" }, { label: "Psycholog", emoji: "🧠" },
      { label: "Terapeuta", emoji: "🤝" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Kucharz", emoji: "🍲" },
      { label: "Sanitariusz", emoji: "🚑" }, { label: "Stażysta", emoji: "🎓" }, { label: "Dyrektor", emoji: "📋" }, { label: "Pracownik socjalny", emoji: "🤝" },
    ],
  },
  {
    id: "wesele", name: "Wesele", emoji: "💒", roles: [
      { label: "Panna młoda", emoji: "👰" }, { label: "Pan młody", emoji: "🤵" }, { label: "Drużba", emoji: "🎩" }, { label: "Ksiądz", emoji: "🙏" },
      { label: "Wodzirej", emoji: "🎤" }, { label: "Kelner", emoji: "🍽️" }, { label: "Kucharz", emoji: "🍳" }, { label: "Fotograf", emoji: "📸" },
      { label: "Kamerzysta", emoji: "🎥" }, { label: "Gość", emoji: "🥂" }, { label: "Muzyk", emoji: "🎻" }, { label: "Kwiaciarka", emoji: "💐" },
    ],
  },
  {
    id: "lodz-podwodna", name: "Łódź podwodna", emoji: "🌊", roles: [
      { label: "Kapitan", emoji: "🎖️" }, { label: "Nawigator", emoji: "🧭" }, { label: "Sonarzysta", emoji: "📡" }, { label: "Mechanik", emoji: "🔧" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Radiooperator", emoji: "📻" }, { label: "Lekarz", emoji: "🩺" }, { label: "Torpedysta", emoji: "🚀" },
      { label: "Sternik", emoji: "⚓" }, { label: "Obserwator", emoji: "🔭" }, { label: "Elektryk", emoji: "⚡" }, { label: "Kwatermistrz", emoji: "📋" },
    ],
  },
  {
    id: "studio-filmowe", name: "Studio filmowe", emoji: "🎥", roles: [
      { label: "Reżyser", emoji: "🎬" }, { label: "Aktor", emoji: "🎭" }, { label: "Operator", emoji: "🎥" }, { label: "Scenarzysta", emoji: "✍️" },
      { label: "Dźwiękowiec", emoji: "🎙️" }, { label: "Oświetleniowiec", emoji: "💡" }, { label: "Charakteryzator", emoji: "💄" }, { label: "Kostiumograf", emoji: "👗" },
      { label: "Producent", emoji: "💰" }, { label: "Rekwizytor", emoji: "🎭" }, { label: "Asystent", emoji: "📋" }, { label: "Kaskader", emoji: "🤸" },
    ],
  },
  {
    id: "oboz-wspinaczkowy", name: "Obóz wspinaczkowy", emoji: "🏔️", roles: [
      { label: "Alpinista", emoji: "🧗" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Ratownik górski", emoji: "⛑️" }, { label: "Medyk", emoji: "🩺" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Schroniskowy", emoji: "🏠" }, { label: "Instruktor", emoji: "👨‍🏫" }, { label: "Geolog", emoji: "🪨" },
      { label: "Fotograf", emoji: "📸" }, { label: "Turysta", emoji: "🥾" }, { label: "Zwiadowca", emoji: "🔭" }, { label: "Meteorolog", emoji: "🌦️" },
    ],
  },

  {
    id: "cmentarz", name: "Cmentarz", emoji: "⚰️", roles: [
      { label: "Grabarz", emoji: "⚰️" }, { label: "Ksiądz", emoji: "🙏" }, { label: "Ogrodnik", emoji: "🌳" }, { label: "Żałobnik", emoji: "🕯️" },
      { label: "Kamieniarz", emoji: "🪦" }, { label: "Dozorca", emoji: "🔧" }, { label: "Kwiaciarz", emoji: "💐" }, { label: "Historyk", emoji: "📜" },
      { label: "Przewodnik", emoji: "🧭" }, { label: "Konserwator", emoji: "🖌️" }, { label: "Murarz", emoji: "🧱" }, { label: "Pracownik krematorium", emoji: "🔥" },
    ],
  },
  {
    id: "palac-krolewski", name: "Pałac królewski", emoji: "👑", roles: [
      { label: "Król", emoji: "👑" }, { label: "Królowa", emoji: "👸" }, { label: "Strażnik", emoji: "💂" }, { label: "Lokaj", emoji: "🎩" },
      { label: "Kucharz", emoji: "🍳" }, { label: "Dama dworu", emoji: "👗" }, { label: "Rycerz", emoji: "⚔️" }, { label: "Błazen", emoji: "🤡" },
      { label: "Skarbnik", emoji: "💰" }, { label: "Posłaniec", emoji: "📜" }, { label: "Ogrodnik", emoji: "🌳" }, { label: "Muzykant", emoji: "🎻" },
    ],
  },
  {
    id: "targ", name: "Targ", emoji: "🧺", roles: [
      { label: "Sprzedawca warzyw", emoji: "🥕" }, { label: "Sprzedawca ryb", emoji: "🐟" }, { label: "Klient", emoji: "🛍️" }, { label: "Rzeźnik", emoji: "🥩" },
      { label: "Piekarz", emoji: "🥖" }, { label: "Serowar", emoji: "🧀" }, { label: "Kwiaciarz", emoji: "💐" }, { label: "Rzemieślnik", emoji: "🪵" },
      { label: "Przekupka", emoji: "🧺" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Muzykant", emoji: "🎺" }, { label: "Sprzedawca miodu", emoji: "🍯" },
    ],
  },
  {
    id: "port-rybacki", name: "Port rybacki", emoji: "⚓", roles: [
      { label: "Rybak", emoji: "🎣" }, { label: "Kapitan kutra", emoji: "🎩" }, { label: "Przetwórca ryb", emoji: "🐟" }, { label: "Sprzedawca ryb", emoji: "🐠" },
      { label: "Mechanik", emoji: "🔧" }, { label: "Nawigator", emoji: "🧭" }, { label: "Doker", emoji: "🪝" }, { label: "Kucharz", emoji: "🍲" },
      { label: "Latarnik", emoji: "💡" }, { label: "Strażnik portu", emoji: "💂" }, { label: "Szyper", emoji: "⚓" }, { label: "Handlarz", emoji: "🤝" },
    ],
  },
  {
    id: "wesole-miasteczko", name: "Wesołe miasteczko", emoji: "🎡", roles: [
      { label: "Operator karuzeli", emoji: "🎠" }, { label: "Sprzedawca waty", emoji: "🍭" }, { label: "Klaun", emoji: "🤡" }, { label: "Iluzjonista", emoji: "🎩" },
      { label: "Bileter", emoji: "🎫" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Mechanik", emoji: "🔧" }, { label: "Konferansjer", emoji: "🎤" },
      { label: "Sprzedawca losów", emoji: "🎟️" }, { label: "Animator", emoji: "🎈" }, { label: "Kierownik", emoji: "📊" }, { label: "Muzyk", emoji: "🎺" },
    ],
  },
  {
    id: "obserwatorium", name: "Obserwatorium astronomiczne", emoji: "🔭", roles: [
      { label: "Astronom", emoji: "🔭" }, { label: "Technik", emoji: "🛠️" }, { label: "Naukowiec", emoji: "🔬" }, { label: "Stażysta", emoji: "🎓" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Fotograf", emoji: "📸" },
      { label: "Inżynier", emoji: "🔧" }, { label: "Programista", emoji: "💻" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Astrofizyk", emoji: "🌌" },
    ],
  },
  {
    id: "spa", name: "Spa", emoji: "💆", roles: [
      { label: "Masażysta", emoji: "💆" }, { label: "Kosmetyczka", emoji: "💅" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Gość", emoji: "🧖" },
      { label: "Saunamistrz", emoji: "🔥" }, { label: "Fryzjer", emoji: "💇" }, { label: "Manikiurzystka", emoji: "💅" }, { label: "Trener", emoji: "🏋️" },
      { label: "Dietetyk", emoji: "🥗" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Kelner", emoji: "🍹" },
    ],
  },
  {
    id: "stacja-benzynowa", name: "Stacja benzynowa", emoji: "⛽", roles: [
      { label: "Sprzedawca", emoji: "💵" }, { label: "Kierowca", emoji: "🚗" }, { label: "Mechanik", emoji: "🔧" }, { label: "Kasjer", emoji: "🧾" },
      { label: "Menedżer", emoji: "📊" }, { label: "Dostawca paliwa", emoji: "🛢️" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Ochroniarz", emoji: "💂" },
      { label: "Pracownik myjni", emoji: "🚿" }, { label: "Pracownik sklepu", emoji: "🛍️" }, { label: "Serwisant", emoji: "🛠️" }, { label: "Barman", emoji: "☕" },
    ],
  },
  {
    id: "bank", name: "Bank", emoji: "🏦", roles: [
      { label: "Kasjer", emoji: "💵" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Doradca klienta", emoji: "🤝" }, { label: "Menedżer", emoji: "📊" },
      { label: "Klient", emoji: "🧑‍💼" }, { label: "Analityk", emoji: "📈" }, { label: "Księgowy", emoji: "🧮" }, { label: "Informatyk", emoji: "💻" },
      { label: "Prawnik", emoji: "⚖️" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Sprzątaczka", emoji: "🧹" }, { label: "Kurier", emoji: "📦" },
    ],
  },
  {
    id: "komisariat", name: "Komisariat policji", emoji: "🚓", roles: [
      { label: "Policjant", emoji: "👮" }, { label: "Detektyw", emoji: "🕵️" }, { label: "Komendant", emoji: "🎖️" }, { label: "Dyżurny", emoji: "📞" },
      { label: "Technik kryminalistyki", emoji: "🔬" }, { label: "Prokurator", emoji: "⚖️" }, { label: "Aresztant", emoji: "🔒" }, { label: "Recepcjonista", emoji: "📞" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Medyk", emoji: "⛑️" }, { label: "Rzecznik", emoji: "🎤" },
    ],
  },

  {
    id: "remiza-strazacka", name: "Remiza strażacka", emoji: "🚒", roles: [
      { label: "Strażak", emoji: "🧑‍🚒" }, { label: "Dowódca", emoji: "🎖️" }, { label: "Dyspozytor", emoji: "📞" }, { label: "Mechanik", emoji: "🔧" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Medyk", emoji: "⛑️" }, { label: "Inspektor", emoji: "📋" }, { label: "Ochotnik", emoji: "🤝" },
      { label: "Sprzątacz", emoji: "🧹" }, { label: "Trener", emoji: "🏋️" }, { label: "Kierowca", emoji: "🚒" }, { label: "Operator drabiny", emoji: "🪜" },
    ],
  },
  {
    id: "stocznia", name: "Stocznia", emoji: "🚢", roles: [
      { label: "Spawacz", emoji: "🔥" }, { label: "Inżynier", emoji: "🔧" }, { label: "Doker", emoji: "🪝" }, { label: "Projektant", emoji: "📐" },
      { label: "Kierownik", emoji: "📊" }, { label: "Malarz kadłubów", emoji: "🖌️" }, { label: "Elektryk", emoji: "⚡" }, { label: "Suwnicowy", emoji: "🛠️" },
      { label: "Inspektor jakości", emoji: "🔍" }, { label: "Kucharz", emoji: "🍲" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Zaopatrzeniowiec", emoji: "📦" },
    ],
  },
  {
    id: "fast-food", name: "Fast food", emoji: "🍔", roles: [
      { label: "Kasjer", emoji: "💵" }, { label: "Kucharz", emoji: "🍔" }, { label: "Menadżer", emoji: "📊" }, { label: "Dostawca", emoji: "🛵" },
      { label: "Klient", emoji: "🍟" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Kierownik zmiany", emoji: "📋" }, { label: "Ochroniarz", emoji: "💂" },
      { label: "Pracownik okienka", emoji: "🚗" }, { label: "Serwisant", emoji: "🔧" }, { label: "Magazynier", emoji: "📦" }, { label: "Animator", emoji: "🎈" },
    ],
  },
  {
    id: "bezludna-wyspa", name: "Bezludna wyspa", emoji: "🏝️", roles: [
      { label: "Rozbitek", emoji: "🏝️" }, { label: "Poszukiwacz skarbów", emoji: "💰" }, { label: "Robinson", emoji: "🧔" }, { label: "Naukowiec", emoji: "🔬" },
      { label: "Ratownik", emoji: "🛟" }, { label: "Turysta", emoji: "🧳" }, { label: "Rybak", emoji: "🎣" }, { label: "Kucharz", emoji: "🍲" },
      { label: "Budowniczy szałasu", emoji: "🛖" }, { label: "Obserwator ptaków", emoji: "🦜" }, { label: "Zbieracz kokosów", emoji: "🥥" }, { label: "Medyk", emoji: "⛑️" },
    ],
  },
  {
    id: "metro", name: "Metro", emoji: "🚇", roles: [
      { label: "Maszynista", emoji: "👨‍✈️" }, { label: "Dyżurny ruchu", emoji: "🎛️" }, { label: "Konduktor", emoji: "🎫" }, { label: "Pasażer", emoji: "🧳" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Mechanik", emoji: "🔧" }, { label: "Kasjer", emoji: "💵" },
      { label: "Informatyk", emoji: "💻" }, { label: "Kierownik stacji", emoji: "📊" }, { label: "Bileter", emoji: "🎫" }, { label: "Muzykant", emoji: "🎸" },
    ],
  },
  {
    id: "ogrod-botaniczny", name: "Ogród botaniczny", emoji: "🌿", roles: [
      { label: "Ogrodnik", emoji: "🌳" }, { label: "Botanik", emoji: "🌿" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Kasjer", emoji: "💵" },
      { label: "Kustosz", emoji: "🏺" }, { label: "Naukowiec", emoji: "🔬" }, { label: "Fotograf", emoji: "📸" }, { label: "Wolontariusz", emoji: "🤝" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Sprzedawca roślin", emoji: "🪴" }, { label: "Architekt krajobrazu", emoji: "📐" }, { label: "Sprzątacz", emoji: "🧹" },
    ],
  },
  {
    id: "winnica", name: "Winnica", emoji: "🍷", roles: [
      { label: "Winiarz", emoji: "🍇" }, { label: "Sommelier", emoji: "🍷" }, { label: "Zbieracz winogron", emoji: "🧺" }, { label: "Enolog", emoji: "🧪" },
      { label: "Kucharz", emoji: "🍲" }, { label: "Sprzedawca", emoji: "💵" }, { label: "Przewodnik", emoji: "🧭" }, { label: "Kelner", emoji: "🍽️" },
      { label: "Kierownik", emoji: "📊" }, { label: "Murarz piwnic", emoji: "🧱" }, { label: "Etykieciarz", emoji: "🏷️" }, { label: "Gość", emoji: "🥂" },
    ],
  },
  {
    id: "schronisko-gorskie", name: "Schronisko górskie", emoji: "⛰️", roles: [
      { label: "Gospodarz", emoji: "🏠" }, { label: "Kucharz", emoji: "🍲" }, { label: "Ratownik", emoji: "⛑️" }, { label: "Turysta", emoji: "🥾" },
      { label: "Przewodnik", emoji: "🧭" }, { label: "Medyk", emoji: "🩺" }, { label: "Sprzątacz", emoji: "🧹" }, { label: "Muzykant", emoji: "🎸" },
      { label: "Dostawca", emoji: "🚚" }, { label: "Recepcjonista", emoji: "📞" }, { label: "Meteorolog", emoji: "🌦️" }, { label: "Zwiadowca", emoji: "🔭" },
    ],
  },
  {
    id: "antykwariat", name: "Antykwariat", emoji: "📜", roles: [
      { label: "Antykwariusz", emoji: "📚" }, { label: "Klient", emoji: "🧑‍💼" }, { label: "Rzeczoznawca", emoji: "🔍" }, { label: "Konserwator", emoji: "🖌️" },
      { label: "Historyk", emoji: "📜" }, { label: "Sprzedawca", emoji: "💵" }, { label: "Kolekcjoner", emoji: "🏺" }, { label: "Księgowy", emoji: "🧮" },
      { label: "Ochroniarz", emoji: "💂" }, { label: "Dostawca", emoji: "📦" }, { label: "Programista", emoji: "💻" }, { label: "Sprzątacz", emoji: "🧹" },
    ],
  },
  {
    id: "sad", name: "Sąd", emoji: "⚖️", roles: [
      { label: "Sędzia", emoji: "👨‍⚖️" }, { label: "Prokurator", emoji: "⚖️" }, { label: "Adwokat", emoji: "💼" }, { label: "Oskarżony", emoji: "🔒" },
      { label: "Ławnik", emoji: "👥" }, { label: "Protokolant", emoji: "📝" }, { label: "Ochroniarz", emoji: "💂" }, { label: "Recepcjonista", emoji: "📞" },
      { label: "Kurator", emoji: "📋" }, { label: "Tłumacz", emoji: "🗣️" }, { label: "Dziennikarz", emoji: "🎤" }, { label: "Woźny", emoji: "🔧" },
    ],
  },

];

const SPY_ROLE = { label: "Szpieg", emoji: "🕵️" };

module.exports = { SPY_LOCATIONS, SPY_ROLE };
