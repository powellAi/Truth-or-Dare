import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { auth } from "../firebase"
import { updateProfile } from "firebase/auth"


export default function Home({ goTo, currentUser }) {
  const [animated, setAnimated] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("phase1")
  const [rulesModal, setRulesModal] = useState(null)
  const theme = useTheme()

  const { logout, updateDisplayName } = useAuth()

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100)
  }, [])

  const hints = [
    "· Online play works best when everyone is in the same room",
    "· Each player needs their own device for online mode",
    "· The host sets up the game — guests just join with a code",
    "· Dare timer can be adjusted in setup before the game starts",
    "· Each player gets 5 skips — use them wisely",
    "· Completing a dare earns 2 points, a truth earns 1",
    "· The asker gains a point if you skip your turn",
    "· Add custom questions in step 4 of local setup",
  ]

  const [hintIndex, setHintIndex] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setHintVisible(false)
      setTimeout(() => {
        setHintIndex(prev => (prev + 1) % hints.length)
        setHintVisible(true)
      }, 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const phase1Rules = [
    { title: "Setup", desc: "Add at least 2 players, pick categories, difficulty and set a dare timer." },
    { title: "Taking Turns", desc: "Every player asks every other player exactly 2 questions each." },
    { title: "Truth", desc: "Answer the question honestly. Complete it and earn 1 point." },
    { title: "Dare", desc: "Complete the dare before the timer runs out. Earn 2 points." },
    { title: "Skipping", desc: "Each player gets 5 skips per game. Skip and lose 1 point. The asker gains 1 point." },
    { title: "Phone Passing", desc: "The phone is passed between players so each person only sees what they need to." },
    { title: "Winning", desc: "The player with the most points when the game ends wins." },
  ]

  const phase2Rules = [
    { title: "Create an Account", desc: "Register with your email to access online play." },
    { title: "Host a Game", desc: "The host sets up the game and shares a room code with friends." },
    { title: "Join a Game", desc: "Enter the room code to join a session hosted by a friend." },
    { title: "Separate Devices", desc: "Each player uses their own device. Screens show only what is relevant to you." },
    { title: "Private Chat", desc: "Chat privately with any player during the game without others seeing." },
    { title: "Premium", desc: "The host pays for a session pass or monthly plan. Guests get full premium during the session." },
    { title: "Player Limit", desc: "Standard sessions allow up to 6 players. Extended sessions allow up to 10." },
  ]

  const onlineHowToPlay = [
    { title: "Create an Account", desc: "Register with your email and display name. You need an account to access online play." },
    { title: "Create or Join a Room", desc: "Tap 'Play Online' then either create a new room or enter a 6-character room code shared by the host." },
    { title: "Wait in the Lobby", desc: "Once in the room, wait for all players to join. The host can see everyone who has joined and starts the game when ready." },
    { title: "Set Up the Game", desc: "The host picks categories, difficulty, dare timer length, and whether targets are chosen randomly." },
    { title: "Each Player Uses Their Own Device", desc: "Every player sees only their own screen. The game tells you whether you are asking or answering each turn." },
    { title: "How Turns Work", desc: "Each turn shows an ASKING player and an ANSWERING player. The answerer picks Truth or Dare. The asker reads the question out loud." },
    { title: "Scoring", desc: "Completing a Truth earns 1 point. Completing a Dare earns 2 points. Every player asks every other player exactly 2 questions." },
    { title: "Skips & Penalties", desc: "Each player starts with 5 skips. Using a skip costs 1 point from the answerer and gives 1 point to the asker. No skips left means no skipping." },
    { title: "Winning", desc: "The game ends when all turns are done. The player with the most points wins and is shown on the leaderboard." },
  ]

  const handleLogout = async () => {
    await logout()
    setProfileOpen(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, position: "relative", transition: "background 0.3s" }}>

      {/* Overlay for panels */}
      {(settingsOpen || profileOpen || rulesModal) && (
        <div
          onClick={() => { setSettingsOpen(false); setProfileOpen(false); setRulesModal(null) }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", zIndex: 10 }}
        />
      )}

      {/* Settings panel */}
      <div style={{
        position: "fixed", top: 0, left: settingsOpen ? 0 : "-420px",
        width: "380px", height: "100vh", background: theme.bg,
        borderRight: `1.5px solid ${theme.border}`,
        zIndex: 20, transition: "left 0.3s ease",
        display: "flex", flexDirection: "column",
        overflowY: "auto", padding: "32px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: theme.text }}>Settings</h2>
          <button onClick={() => setSettingsOpen(false)}
            style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: theme.textMuted }}>×</button>
        </div>

        <p style={{ fontSize: "0.75rem", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>Appearance</p>
        <button onClick={theme.toggleTheme} style={{
          padding: "14px 16px", borderRadius: "10px", border: `1.5px solid ${theme.border}`,
          background: theme.surface, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "28px", transition: "all 0.2s",
        }}>
          <span style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem" }}>{theme.isDark ? "Dark Mode" : "Light Mode"}</span>
          <span style={{ background: theme.isDark ? "#f0f0f0" : "#111", color: theme.isDark ? "#111" : "#fff", borderRadius: "20px", padding: "4px 12px", fontSize: "0.75rem", fontWeight: "700" }}>
            {theme.isDark ? "ON" : "OFF"}
          </span>
        </button>

        <p style={{ fontSize: "0.75rem", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>Audio</p>
        <div style={{ padding: "14px 16px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <span style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem" }}>Timer Sound</span>
          <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>On</span>
        </div>

        <p style={{ fontSize: "0.75rem", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>How To Play</p>
        <button onClick={() => { setRulesModal("phase1"); setSettingsOpen(false) }} style={{ padding: "14px 16px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", cursor: "pointer", transition: "all 0.2s" }}>
          <span style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem" }}>Local Play Rules</span>
          <span style={{ color: theme.textMuted, fontSize: "1rem" }}>→</span>
        </button>
        <button onClick={() => { setRulesModal("phase2"); setSettingsOpen(false) }} style={{ padding: "14px 16px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", cursor: "pointer", transition: "all 0.2s" }}>
          <span style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem" }}>Online Play Rules</span>
          <span style={{ color: theme.textMuted, fontSize: "1rem" }}>→</span>
        </button>
        <button onClick={() => { setRulesModal("onlineHowTo"); setSettingsOpen(false) }} style={{ padding: "14px 16px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", cursor: "pointer", transition: "all 0.2s" }}>
          <span style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem" }}>How To Play Online</span>
          <span style={{ color: theme.textMuted, fontSize: "1rem" }}>→</span>
        </button>

        <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: `1.5px solid ${theme.border}` }}>
          <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>Truth or Dare • v1.0 • Phase 2</p>
        </div>
      </div>

      {/* Profile panel */}
      <div style={{
        position: "fixed", top: 0, right: profileOpen ? 0 : "-420px",
        width: "380px", height: "100vh", background: theme.bg,
        borderLeft: `1.5px solid ${theme.border}`,
        zIndex: 20, transition: "right 0.3s ease",
        display: "flex", flexDirection: "column",
        overflowY: "auto", padding: "32px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: theme.text }}>Profile</h2>
          <button onClick={() => setProfileOpen(false)}
            style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: theme.textMuted }}>×</button>
        </div>

        {currentUser ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            {currentUser.photoURL
  ? <img src={currentUser.photoURL} alt="profile" 
      style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${theme.border}`, display: "block" }} />
  : <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: theme.surface, border: `1.5px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "900", color: theme.text }}>
      {currentUser.displayName?.[0]?.toUpperCase() || "?"}
    </div>
}
              
              <div>
                <p style={{ fontWeight: "900", color: theme.text, fontSize: "1.1rem" }}>{currentUser.displayName}</p>
<button onClick={() => { const name = prompt("Enter new display name:", currentUser.displayName); if (name?.trim()) { updateProfile(auth.currentUser, { displayName: name.trim() }) } }} style={{ background: "transparent", border: "none", color: theme.textMuted, fontSize: "0.75rem", cursor: "pointer", padding: 0, letterSpacing: "1px", textDecoration: "underline" }}>
  Edit name
</button>
              </div>
            </div>

            <p style={{ fontSize: "0.75rem", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>Stats</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "32px" }}>
              {[
                { label: "Games Played", value: "0" },
                { label: "Games Won", value: "0" },
                { label: "Dares Done", value: "0" },
                { label: "Truths Done", value: "0" },
              ].map((stat, i) => (
                <div key={i} style={{ padding: "14px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface, textAlign: "center" }}>
                  <p style={{ fontSize: "1.5rem", fontWeight: "900", color: theme.text }}>{stat.value}</p>
                  <p style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: "4px" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <button onClick={handleLogout} style={{ padding: "14px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: "transparent", color: "#c0392b", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", transition: "all 0.2s" }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <p style={{ color: theme.textMuted, marginBottom: "24px", fontSize: "0.95rem" }}>Sign in to access online play, track your stats and connect with friends.</p>
            <button onClick={() => { goTo("login"); setProfileOpen(false) }} style={{ padding: "14px", borderRadius: "10px", border: "none", background: theme.btnBg, color: theme.btnText, fontWeight: "800", fontSize: "0.9rem", cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", transition: "all 0.2s" }}>Sign In</button>
            <button onClick={() => { goTo("register"); setProfileOpen(false) }} style={{ padding: "14px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textMuted, fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", transition: "all 0.2s" }}>Create Account</button>
          </>
        )}
      </div>

      {/* Rules Modal */}
      {rulesModal && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "480px", maxHeight: "80vh", background: theme.bg, borderRadius: "20px", border: `1.5px solid ${theme.border}`, zIndex: 30, overflowY: "auto", padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: theme.text }}>
              {rulesModal === "phase1" ? "Local Play Rules" : rulesModal === "phase2" ? "Online Play Rules" : "How To Play Online"}
            </h2>
            <button onClick={() => setRulesModal(null)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: theme.textMuted }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {(rulesModal === "phase1" ? phase1Rules : rulesModal === "phase2" ? phase2Rules : onlineHowToPlay).map((rule, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: "10px", border: `1.5px solid ${theme.border}`, background: theme.surface }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "900", color: theme.textDim, letterSpacing: "2px" }}>{String(i + 1).padStart(2, "0")}</span>
                  <p style={{ fontWeight: "800", color: theme.text, fontSize: "0.9rem" }}>{rule.title}</p>
                </div>
                <p style={{ color: theme.textMuted, fontSize: "0.85rem", lineHeight: "1.6", paddingLeft: "28px" }}>{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", zIndex: 5 }}>
        <button onClick={() => setSettingsOpen(true)} style={{ background: "transparent", border: `1.5px solid ${theme.border}`, borderRadius: "10px", padding: "10px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ width: "18px", height: "2px", background: theme.text, borderRadius: "1px" }} />
          <div style={{ width: "18px", height: "2px", background: theme.text, borderRadius: "1px" }} />
          <div style={{ width: "18px", height: "2px", background: theme.text, borderRadius: "1px" }} />
        </button>
        <button onClick={() => setProfileOpen(true)} style={{ background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: "50%", width: "42px", height: "42px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "1rem", color: theme.text }}>
          {currentUser?.photoURL
  ? <img src={currentUser.photoURL} alt="profile" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
  : currentUser?.displayName?.[0]?.toUpperCase() || "?"}
        </button>
      </div>

      {/* ✅ Main content — fully in flow, no absolute positioning for hint */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px 40px", // top padding for fixed top bar
        textAlign: "center",
      }}>

        {/* Title */}
        <div style={{
          opacity: animated ? 1 : 0,
          transform: animated ? "translateY(0)" : "translateY(-20px)",
          transition: "all 0.7s ease",
        }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "6px", textTransform: "uppercase", color: theme.textDim, marginBottom: "24px" }}>THE GAME</p>
          <h1 style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontWeight: "900", color: theme.text, letterSpacing: "-3px", lineHeight: "1", marginBottom: "8px" }}>TRUTH</h1>
          <h1 style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontWeight: "900", color: theme.border, letterSpacing: "-3px", lineHeight: "1", marginBottom: "8px" }}>OR</h1>
          <h1 style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontWeight: "900", color: theme.text, letterSpacing: "-3px", lineHeight: "1", marginBottom: "48px" }}>DARE</h1>
        </div>

        {/* Buttons + hint + signed in — all in normal flow */}
        <div style={{
          opacity: animated ? 1 : 0,
          transform: animated ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s ease 0.3s",
          display: "flex", flexDirection: "column", gap: "12px",
          width: "100%", maxWidth: "280px",
          alignItems: "center",
        }}>
          <button onClick={() => goTo("setup")} style={{ padding: "16px 40px", fontSize: "0.9rem", fontWeight: "800", background: theme.btnBg, color: theme.btnText, borderRadius: "12px", letterSpacing: "3px", textTransform: "uppercase", transition: "all 0.2s ease", border: "none", cursor: "pointer", width: "100%" }}>
            Play Local
          </button>

          <button onClick={() => { currentUser ? goTo("onlinehome") : goTo("login") }} style={{ padding: "16px 40px", fontSize: "0.9rem", fontWeight: "800", background: "transparent", color: theme.text, borderRadius: "12px", letterSpacing: "3px", textTransform: "uppercase", transition: "all 0.2s ease", border: `1.5px solid ${theme.text}`, cursor: "pointer", width: "100%" }}>
            Play Online
          </button>

          {/* ✅ Hint in normal flow — no absolute, no overlap ever */}
          <p style={{
            color: theme.text,
            fontSize: "0.85rem",
            letterSpacing: "1px",
            textAlign: "center",
            width: "100%",
            marginTop: "50px",
            opacity: hintVisible ? 0.4 : 0,
            transition: "opacity 0.6s ease",
            minHeight: "1.5em", // reserves space so layout doesn't jump
          }}>
            {hints[hintIndex]}
          </p>

        </div>

        {/* Footer */}
        <p style={{ color: theme.textDim, fontSize: "0.7rem", letterSpacing: "3px", textTransform: "uppercase", marginTop: "85px" }}>
          Truth or Dare • {currentUser ? "Online" : "Local"} Play
        </p>
      </div>
    </div>
  )
}
