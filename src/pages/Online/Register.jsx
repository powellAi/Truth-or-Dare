import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { db } from "../../firebase"
import { doc, setDoc } from "firebase/firestore"

export default function Register({ goTo }) {
  const { register } = useAuth()
  const theme = useTheme()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirm.trim())
      return setError("Fill in all fields!")
    if (password !== confirm) return setError("Passwords do not match!")

    const strongPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])(.{8,})$/
    if (!strongPassword.test(password)) return setError("Password must be 8+ characters with a number and special character!")

    if (username.length < 6) return setError("Username must be at least 6 characters!")

    try {
      setLoading(true)
      setError("")
      const result = await register(email, password, username)
      await setDoc(doc(db, "users", result.user.uid), {
        username, email, uid: result.user.uid,
        createdAt: new Date().toISOString(),
        gamesPlayed: 0, gamesWon: 0, friends: [], photoURL: null,
      })
      goTo("setuponline")
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use!")
      } else {
        setError("Something went wrong. Try again!")
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: theme.surface, border: `1.5px solid ${theme.border}`,
    borderRadius: "10px", padding: "14px 16px", color: theme.text,
    fontSize: "1rem", width: "100%", marginBottom: "12px",
  }

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
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Join the Game</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "32px", letterSpacing: "-1px" }}>Create Account</h2>

        <input style={inputStyle} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input style={inputStyle} placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <input style={inputStyle} placeholder="Confirm password" type="password" value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleRegister()} />

        {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "600" }}>{error}</p>}

        <button onClick={handleRegister} style={btnPrimary} disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <button onClick={() => goTo("login")} style={btnSecondary}>
          Already have an account? Sign In
        </button>
        <button onClick={() => goTo("home")} style={btnSecondary}>
          Back to Home
        </button>
      </div>
    </div>
  )
}