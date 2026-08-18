// Wspólny panel zasad i punktacji gry "Szaleństwo pytań" — ekran hosta i graczy.
import { SZALENSTWO_VOTE_OPTIONS } from "../data/truthOrDare";

export default function SzalenstwoRules() {
  return (
    <div className="spy-rules">
      <h3 style={{ marginTop: 0 }}>📜 Zasady i punktacja</h3>

      <h3>🎯 O co chodzi?</h3>
      <p>
        Host pokazuje kartę z szalonym pytaniem, a wybrany gracz odpowiada na
        głos przed całą grupą. Reszta ocenia jego odpowiedź w skali{" "}
        <strong>1–5</strong>.
      </p>

      <h3>🏆 Skala ocen</h3>
      <table>
        <thead>
          <tr>
            <th>Punkty</th>
            <th>Ocena</th>
            <th>Reakcja</th>
          </tr>
        </thead>
        <tbody>
          {SZALENSTWO_VOTE_OPTIONS.map((o) => (
            <tr key={o.key}>
              <td>+{o.points}</td>
              <td>
                {o.emoji} {o.label}
              </td>
              <td>{o.reaction}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
        Gracz dostaje średnią z ocen grupy (zaokrągloną). Im śmielsza i bardziej
        bezczelna odpowiedź, tym więcej punktów.
      </p>
    </div>
  );
}