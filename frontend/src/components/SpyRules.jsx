// Wspólny panel zasad i punktacji gry "Szpieg" — używany na ekranie hosta i graczy.
export default function SpyRules() {
  return (
    <div className="spy-rules">
      <h3 style={{ marginTop: 0 }}>📜 Zasady i punktacja</h3>
      <p>
        Wszyscy znają lokalizację — poza Szpiegiem. Rozmawiajcie i zadawajcie
        podchwytliwe pytania, by namierzyć Szpiega, zanim on zgadnie, gdzie
        jesteście.
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
