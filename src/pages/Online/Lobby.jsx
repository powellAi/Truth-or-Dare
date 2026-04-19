import { useEffect, useState } from "react"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../../firebase"
import { useTheme } from "../../context/ThemeContext"

export default function Lobby({ goTo, roomCode, currentUser, onGameStart }) {
  const theme = useTheme()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomCode) { goTo("onlinehome"); return }
    const unsub = onSnapshot(doc(db, "rooms", roomCode), (snap) => {
      if (!snap.exists()) { goTo("onlinehome"); return }
      const data = snap.data()
      setRoom(data)
      setLoading(false)
      if (data.status === "playing" && data.gameSettings) {
        onGameStart(data.gameSettings)
      }
    })
    return () => unsub()
  }, [roomCode])

  const handleLeave = async () => {
    if (!room || !currentUser) return
    try {
      await updateDoc(doc(db, "rooms", roomCode), {
        players: room.players.filter(p => p.uid !== currentUser.uid)
      })
    } catch (e) {}
    goTo("onlinehome")
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <p>Connecting...</p>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 24px", borderBottom: `1.5px solid ${theme.border}`,
        position: "sticky", top: 0, background: theme.bg, zIndex: 10,
      }}>
        <div>
          <p style={{ fontWeight: "900", fontSize: "1.1rem", color: theme.text, margin: 0 }}>Waiting Room</p>
          <p style={{ color: theme.textMuted, fontSize: "0.75rem", margin: 0, letterSpacing: "2px" }}>Code: {roomCode}</p>
        </div>
        <button onClick={handleLeave} style={{
          background: "transparent", border: `1.5px solid ${theme.border}`,
          borderRadius: "10px", padding: "8px 14px", cursor: "pointer",
          color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700",
          letterSpacing: "2px", textTransform: "uppercase",
        }}>Leave</button>
      </div>

      <div style={{ padding: "24px", maxWidth: "480px", margin: "0 auto" }}>
        <div style={{
          textAlign: "center", padding: "28px",
          background: theme.surface, borderRadius: "14px",
          border: `1.5px solid ${theme.border}`, marginBottom: "28px",
        }}>
          <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>⏳</p>
          <p style={{ fontWeight: "800", color: theme.text, margin: "0 0 4px", fontSize: "1rem" }}>
            Waiting for host to start
          </p>
          <p style={{ color: theme.textMuted, fontSize: "0.85rem", margin: 0 }}>
            {room?.hostName} is setting up the game
          </p>
        </div>

        <p style={{ fontWeight: "800", fontSize: "0.75rem", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>
          Players ({room?.players?.length || 0})
        </p>

        {room?.players?.map((player, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderRadius: "10px",
            border: `1.5px solid ${theme.border}`, background: theme.surface,
            marginBottom: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: theme.bg, border: `1.5px solid ${theme.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "900", fontSize: "0.9rem", color: theme.text,
              }}>
                {player.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem", margin: 0 }}>
                  {player.displayName}
                  {player.isHost && <span style={{ color: theme.textMuted, fontSize: "0.7rem", marginLeft: "8px" }}>Host</span>}
                  {player.uid === currentUser?.uid && <span style={{ color: theme.textMuted, fontSize: "0.7rem", marginLeft: "8px" }}>You</span>}
                </p>
              </div>
            </div>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27ae60" }} />
          </div>
        ))}
      </div>
    </div>
  )
}