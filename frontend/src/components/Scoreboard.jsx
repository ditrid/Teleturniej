import "../styles/theme.css";

export default function Scoreboard({ scores }) {
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
                index === 0 ? "rgba(212, 175, 55, 0.1)" : "var(--bg-dark)",
              borderRadius: "var(--radius)",
              marginBottom: "6px",
              border:
                index === 0
                  ? "1px solid rgba(212, 175, 55, 0.3)"
                  : "1px solid transparent",
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
            <span
              style={{
                fontWeight: "bold",
                color: "var(--accent-gold)",
                fontSize: "1.1rem",
                minWidth: "50px",
                textAlign: "right",
              }}
            >
              {player.score} pkt
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}