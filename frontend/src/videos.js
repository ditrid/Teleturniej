// Ścieżki do filmów (pliki znajdują się w frontend/public/images/,
// dzięki czemu Vite serwuje je pod /images/... — zarówno w dev, jak i w buildzie).

export const INTRO_VIDEO = "/images/Kwakout_Intro.mp4";

export const WIN_VIDEO = "/images/kaczka_win.mp4";

export const ELIMINATION_VIDEOS = [
  "/images/koniec1.mp4",
  "/images/koniec2.mp4",
  "/images/koniec3.mp4",
];

export const LOADING_VIDEOS = [
  "/images/loading1.mp4",
  "/images/loading2.mp4",
];

// Zwraca losowy element z listy (np. losowy film "koniec" / "loading").
export function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}
