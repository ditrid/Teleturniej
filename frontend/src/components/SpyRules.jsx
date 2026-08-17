// Wspólny panel zasad i punktacji gry "Szpieg" — używany na ekranie hosta i graczy.
export default function SpyRules() {
  return (
    <div className="spy-rules">
      <h3 style={{ marginTop: 0 }}>📜 Zasady i punktacja</h3>

      <h3>🎯 O co chodzi?</h3>
      <p>
        Cała ekipa siedzi w jednym pokoju. Każdy gracz dostaje na swoim telefonie
        tę samą, tajną <strong>lokalizację</strong> (np. Kino) oraz unikalną{" "}
        <strong>rolę</strong> (np. Kasjer, Widz, Bileter). Jeden losowy gracz zostaje{" "}
        <strong>Szpiegiem</strong> — <strong>nie zna lokalizacji</strong> i jego
        telefon milczy. Agenci próbują namierzyć Szpiega, a Szpieg udaje, że wie,
        o czym mowa, i próbuje wydedukować, gdzie się znajduje.
      </p>

      <h3>🗣️ Jak wygląda rozgrywka?</h3>
      <p>
        Gracze rozmawiają twarzą w twarz i zadają sobie nawzajem podchwytliwe
        pytania. Pytania mają być na tyle <strong>ogólne</strong>, by nie zdradzić
        lokalizacji Szpiegowi, ale na tyle <strong>konkretne</strong>, by agenci
        rozpoznali, kto nie wie, gdzie jest. Na telefonach odlicza się stoper, a
        w ostatnich sekundach wszystkie telefony zaczynają synchronicznie bić
        sercem.
      </p>

      <h3>💬 Przykładowe pytania</h3>
      <p>
        Dobre pytanie jest ogólne, ale ujawnia lokalizację tylko komuś, kto ją
        zna. Oto przykłady, od których możesz zacząć:
      </p>
      <ul style={{ paddingLeft: "18px", margin: "8px 0", listStyle: "disc" }}>
        <li>„Czy przychodzisz tu często?"</li>
        <li>„Jak długo już tu pracujesz?"</li>
        <li>„Potrzebowałeś rezerwacji albo biletu, żeby tu być?"</li>
        <li>„Co robisz po wyjściu stąd?"</li>
        <li>„Podoba Ci się to, co tu serwują?"</li>
        <li>„Byłeś tu w zeszłym tygodniu?"</li>
        <li>„Jak tu dotarłeś — pieszo, autem czy komunikacją?"</li>
        <li>„Czy warto było tu przyjść?"</li>
      </ul>
      <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>
        💡 <strong>Subtelna podpowiedź</strong> (sprawdzasz agenta, nie zdradzając
        Szpiegowi): „Czy pachnie tu popcornem?" — w Kinie odpowiedź jest oczywista,
        a Szpieg będzie tylko zgadywał.
      </p>
      <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>
        🕵️ <strong>Jesteś Szpiegiem?</strong> Odpowiadaj wymijająco, powtarzaj słowa
        innych, zadawaj ogólne pytania i podsłuchuj kontekst. Gdy zbierzesz dość
        wskazówek — użyj <strong>Strzału Życia</strong> i wskaż lokalizację.
      </p>

      <h3>Trzy sposoby zakończenia rundy</h3>
      <p>🆘 <strong>Wskaż Szpiega</strong> — zamraża grę; reszta głosuje TAK/NIE.</p>
      <p>🎯 <strong>Strzał Życia</strong> — Szpieg zgaduje lokalizację. Pudło = porażka.</p>
      <p>⏱️ <strong>Koniec czasu</strong> — prowadzący wybiera werdykt.</p>

      <h3>Punkty</h3>
      <table>
        <thead>
          <tr>
            <th>Zdarzenie</th>
            <th>Punkty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Wygrana Szpiega</td>
            <td>+2</td>
          </tr>
          <tr>
            <td>Wygrana Agentów</td>
            <td>+1 każdy</td>
          </tr>
          <tr>
            <td>Oskarżono niewinnego</td>
            <td>Szpieg +2 · oskarżyciel −1 · ofiara −1</td>
          </tr>
          <tr>
            <td>Szpieg wygrał przez czas</td>
            <td>+2 i +1 za każdą pełną minutę</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
        Oskarżony nie głosuje. Jednogłośne TAK + trafiony Szpieg = wygrana
        agentów. Wskazanie niewinnego = natychmiastowa wygrana Szpiega.
      </p>
    </div>
  );
}
