# KwakOut — Frontend

Gry mobilne na imprezy: quizy, muzyka, memy i wyzwania. Jeden kod PIN i cała ekipa gra razem na telefonach.

## Stack

- **React 19** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`) — design tokens w `src/index.css` (`@theme`)
- **react-router-dom v7**
- **socket.io-client** — komunikacja z serwerem gry (`/socket.io` proxowany na `localhost:5000`)
- **qrcode** — generowanie QR w panelu prowadzącego
- **oxlint** — lint

## Komendy

```bash
npm install      # instaluje zależności
npm run dev      # serwer deweloperski (host: true, dostęp z LAN)
npm run build    # build produkcyjny do dist/
npm run preview  # podgląd zbudowanej aplikacji
npm run lint     # oxlint
```

## Struktura

```
src/
├── App.jsx                 # routing (Layout + strony funkcyjne)
├── main.jsx                # entry point
├── index.css               # Tailwind v4: @theme (kolory night/gold, fonty), base, utilities
├── components/             # Navbar, Hero, GameCard, Leaderboard, QuickCodeModal, Footer itd.
├── context/                # SocketContext (gra), QuickCodeContext (modal PIN)
├── data/                   # mock data: games, leaderboard, challenges, shop
├── pages/                  # Home, Games, Challenges, Rankings, Shop, HowItWorks, Join, Host
└── styles/                 # legacy CSS stron funkcyjnych (Join/Host): theme, player, host
```

## Routing

| Ścieżka           | Strona                        |
| ----------------- | ----------------------------- |
| `/`               | Strona główna (landing)       |
| `/gry`            | Biblioteka gier               |
| `/wyzwania`       | Wyzwania                      |
| `/rankingi`       | Rankingi                      |
| `/sklep`          | Sklep (monety, kosmetyki)     |
| `/jak-to-dziala`  | Jak to działa? + FAQ          |
| `/join`           | Dołącz do gry (gracz)         |
| `/host`           | Panel prowadzącego (host)     |

## Design

Ciemny motyw „night" (grafity) z akcentem złotym (Tailwind tokens: `night-*`, `gold-*`, `cyan-*`). Fonty: **Outfit** (display) + **Inter** (body). Strony marketingowe używają wspólnego layoutu (`Navbar` + `Footer` + `QuickCodeModal`); `Join`/`Host` są pełnoekranowe z własnym, legacy CSS opartym o zmienne z `theme.css`.

