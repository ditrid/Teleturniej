import { useEffect, useRef, useState } from "react";
import "../styles/theme.css";

export default function Scoreboard({ scores, showLives = true }) {
  const prevScoresRef = useRef({});
  const [flash, setFlash] = useState({});

  // Podświetla gracza, którego wynik się zmienił (zielono = wzrost, czerwono = spadek).
  useEffect(() => {
    const changed = {};
    (scores || []).forEach((p) => {
      const prev = prevScoresRef.current[p.id];
      if (prev !== undefined && prev !== p.score) {
        changed[p.id] = p.score > prev ? "up" : "down";
      }
    });
    const map = {};
    (scores || []).forEach((p) => {
      map[p.id] = p.score;
    });
    prevScoresRef.current = map;
    if (Object.keys(changed).length > 0) {
      setFlash(changed);
      const t = setTimeout(() => setFlash({}), 900);
      return () => clearTimeout(t);
    }
  }, [scores]);

  if (!scores || scores.length === 0) {
    return null;
  }

  const avatars = ["🦊", "🐸", "🐱", "🐶", "🦄", "🐼", "🐨", "🦁"];

  return (
    <div
      className="scoreboard"
      style={{
        background: "var(--bg-panel)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        border: "1px solid var(--border-color)",
      }}
    >
      <h2
        style={{
          color: "var(--accent-gold)",
          marginBottom: "15px",
          fontSize: "1.3rem",
          textAlign: "center",
        }}
      >
        🏆 TABELA WYNIKÓW
      </h2>
      <div>
        {scores.map((player, index) => (
          <div
            key={player.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 15px",
              background:
                index === 0 ? "rgba(255, 212, 0, 0.1)" : "var(--bg-dark)",
              borderRadius: "var(--radius)",
              marginBottom: "6px",
              border:
                index === 0
                  ? "1px solid rgba(255, 212, 0, 0.3)"
                  : "1px solid transparent",
              transition: "background 0.3s ease",
            }}
          >
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color:
                  index === 0
                    ? "var(--accent-gold)"
                    : "var(--text-secondary)",
                minWidth: "25px",
              }}
            >
              {index + 1}.
            </span>
            <span
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent-purple)",
                fontSize: "1.2rem",
              }}
            >
              {avatars[index % avatars.length]}
            </span>
            <span
              style={{
                flex: 1,
                fontWeight: "500",
              }}
            >
              {player.name}
            </span>
            {showLives && (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  marginRight: "10px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "1.2rem",
                      opacity: i < player.lives ? 1 : 0.3,
                      transition: "all 0.3s ease",
                    }}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            )}
            <span
              key={player.score}
              style={{
                fontWeight: "bold",
                color:
                  flash[player.id] === "up"
                    ? "#22c55e"
                    : flash[player.id] === "down"
                      ? "#ef4444"
                      : "var(--accent-gold)",
                fontSize: "1.1rem",
                minWidth: "50px",
                textAlign: "right",
                transition: "color 0.4s ease, transform 0.3s ease",
                transform: flash[player.id] ? "scale(1.15)" : "scale(1)",
              }}
            >
              {flash[player.id] === "up" ? "▲ " : flash[player.id] === "down" ? "▼ " : ""}
              {player.score} pkt
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
