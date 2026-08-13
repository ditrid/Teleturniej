// KWAKOUT — sklep (mock data)

export const coinPacks = [
  {
    id: "p1",
    name: "Kieszonkowe",
    coins: 500,
    bonus: 0,
    price: "4,99 zł",
    popular: false,
    icon: "🪙",
    gradient: "from-slate-400 to-slate-600",
  },
  {
    id: "p2",
    name: "Imprezowicz",
    coins: 1200,
    bonus: 150,
    price: "9,99 zł",
    popular: true,
    icon: "🥳",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    id: "p3",
    name: "Wodzirej",
    coins: 2600,
    bonus: 400,
    price: "19,99 zł",
    popular: false,
    icon: "🪩",
    gradient: "from-fuchsia-400 to-purple-600",
  },
  {
    id: "p4",
    name: "Celebryta",
    coins: 6000,
    bonus: 1200,
    price: "39,99 zł",
    popular: false,
    icon: "👑",
    gradient: "from-rose-400 to-red-600",
  },
];

export const cosmetics = [
  { id: "c1", type: "awatar", name: "Złota kaczka", icon: "🦆", price: 300, gradient: "from-amber-300 to-yellow-500" },
  { id: "c2", type: "awatar", name: "Kaczka VIP", icon: "🕶️", price: 500, gradient: "from-slate-300 to-slate-500" },
  { id: "c3", type: "awatar", name: "Kosmo-kaczka", icon: "👩‍🚀", price: 400, gradient: "from-cyan-300 to-blue-500" },
  { id: "c4", type: "tło", name: "Imprezowy neon", icon: "🌆", price: 600, gradient: "from-fuchsia-400 to-purple-600" },
  { id: "c5", type: "tło", name: "Kosmos", icon: "🌌", price: 750, gradient: "from-indigo-400 to-purple-700" },
  { id: "c6", type: "tło", name: "Złota noc", icon: "🌃", price: 900, gradient: "from-amber-300 to-orange-500" },
  { id: "c7", type: "naklejka", name: "Kaczka śmiech", icon: "😂", price: 150, gradient: "from-rose-400 to-red-500" },
  { id: "c8", type: "naklejka", name: "Kaczka myśli", icon: "🤔", price: 150, gradient: "from-slate-300 to-slate-500" },
  { id: "c9", type: "naklejka", name: "Kaczka strzał", icon: "🎯", price: 200, gradient: "from-lime-400 to-green-500" },
  { id: "c10", type: "tytuł", name: "Mistrz Quizu", icon: "🏅", price: 1000, gradient: "from-sky-400 to-blue-600" },
  { id: "c11", type: "tytuł", name: "Król Imprezy", icon: "👑", price: 1500, gradient: "from-amber-400 to-orange-600" },
  { id: "c12", type: "tytuł", name: "Gwiazda Wieczoru", icon: "🌟", price: 1200, gradient: "from-violet-400 to-purple-600" },
];

export const typeLabels = {
  awatar: "Awatary",
  "tło": "Tła",
  naklejka: "Naklejki",
  tytuł: "Tytuły",
};
