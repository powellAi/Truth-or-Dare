import { useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"

// ── Rate Limiter ────────────────────────────────────────────
// Max 5 attempts, 15 minute lockout
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

export default function Login({ goTo }) {
  const { login, loginWithGoogle } = useAuth()
  const theme = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Rate limiting state
  const attempts = useRef(0)
  const lockedUntil = useRef(null)
  const [lockMessage, setLockMessage] = useState("")

  const isLocked = () => {
    if (lockedUntil.current && Date.now() < lockedUntil.current) {
      const mins = Math.ceil((lockedUntil.current - Date.now()) / 60000)
      setLockMessage(`Too many attempts. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`)
      return true
    }
    // Reset if lockout expired
    if (lockedUntil.current && Date.now() >= lockedUntil.current) {
      attempts.current = 0
      lockedUntil.current = null
      setLockMessage("")
    }
    return false
  }

  const handleLogin = async () => {
    if (isLocked()) return
    if (!email.trim() || !password.trim()) return setError("Fill in all fields!")

    try {
      setLoading(true)
      setError("")
      await login(email, password)
      attempts.current = 0 // reset on success
      goTo("onlinehome")
    } catch (err) {
      attempts.current += 1
      if (attempts.current >= MAX_ATTEMPTS) {
        lockedUntil.current = Date.now() + LOCKOUT_MS
        const mins = LOCKOUT_MS / 60000
        setLockMessage(`Too many failed attempts. Locked for ${mins} minutes.`)
        setError("")
      } else {
        const left = MAX_ATTEMPTS - attempts.current
        setError(`Invalid email or password! ${left} attempt${left > 1 ? "s" : ""} left.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (isLocked()) return
    try {
      setLoading(true)
      await loginWithGoogle()
      goTo("onlinehome")
    } catch (err) {
      setError("Google sign-in failed!")
      alert(err.code + ": " + err.message)
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
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Welcome Back</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "32px", letterSpacing: "-1px" }}>Sign In</h2>

        <input style={inputStyle} placeholder="Email address" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <input style={inputStyle} placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />

        {lockMessage && (
          <p style={{ color: "#e67e22", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "600" }}>
            🔒 {lockMessage}
          </p>
        )}
        {error && (
          <p style={{ color: "#c0392b", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "600" }}>
            {error}
          </p>
        )}

        <button onClick={handleLogin} style={btnPrimary} disabled={loading || !!lockMessage}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button onClick={handleGoogle} style={{ ...btnSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} disabled={loading || !!lockMessage}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" />
          Continue with Google
        </button>

        <button onClick={() => goTo("register")} style={btnSecondary}>
          Create Account
        </button>
        <button onClick={() => goTo("forgotPassword")} style={btnSecondary}>
          Forgot Password?
        </button>
        <button onClick={() => goTo("home")} style={btnSecondary}>
          Back to Home
        </button>
      </div>
    </div>
  )
}