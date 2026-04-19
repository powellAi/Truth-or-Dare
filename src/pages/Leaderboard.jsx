import { useTheme } from "../context/ThemeContext"

export default function Leaderboard({ gameData, goTo, replayWithSamePlayers }) {
  if (!gameData || !gameData.players) return <div>Loading...</div>
  const { players } = gameData
  const theme = useTheme()

  const sorted = [...players].sort((a, b) => b.points - a.points)
  const medals = ["I", "II", "III"]

  const btnPrimary = {
    padding: "14px 28px", background: theme.btnBg, color: theme.btnText,
    borderRadius: "10px", fontWeight: "800", fontSize: "0.9rem",
    letterSpacing: "2px", textTransform: "uppercase", width: "100%",
    marginTop: "12px", cursor: "pointer", border: "none", transition: "all 0.2s",
  }

  const btnSecondary = {
    padding: "14px 28px", background: "transparent", color: theme.textMuted,
    borderRadius: "10px", fontWeight: "600", fontSize: "0.9rem",
    letterSpacing: "2px", textTransform: "uppercase", width: "100%",
    marginTop: "8px", border: `1.5px solid ${theme.border}`, cursor: "pointer", transition: "all 0.2s",
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: theme.bg, padding: "24px", transition: "background 0.3s",
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px" }}>Game Over</p>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "900", color: theme.text, letterSpacing: "-1px", marginBottom: "8px" }}>
            {sorted[0]?.name} wins
          </h2>
          <p style={{ color: theme.textDim, fontSize: "0.85rem", letterSpacing: "2px" }}>
            FINAL STANDINGS
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
          {sorted.map((player, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderRadius: "14px",
              background: i === 0 ? theme.surface : "transparent",
              border: i === 0 ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{
                  fontSize: "0.75rem", fontWeight: "900",
                  color: i === 0 ? theme.text : theme.textDim,
                  letterSpacing: "2px", minWidth: "20px",
                }}>
                  {medals[i] || i + 1}
                </span>
                <div>
                  <p style={{ fontWeight: "800", color: i === 0 ? theme.text : theme.textMuted, fontSize: "1rem" }}>
                    {player.name}
                  </p>
                  <p style={{ color: theme.textDim, fontSize: "0.8rem" }}>
                    {player.gender} • {player.skips} skips remaining
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: "900", color: i === 0 ? theme.text : theme.textDim }}>
                  {player.points}
                </p>
                <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "1px" }}>pts</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={replayWithSamePlayers} style={btnPrimary}>
          Replay Same Players
        </button>
        <button onClick={() => goTo("setup")} style={btnSecondary}>
          New Game
        </button>
        <button onClick={() => goTo("home")} style={btnSecondary}>
          Home
        </button>
      </div>
    </div>
  )
}