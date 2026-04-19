import { useState } from "react"
import { auth } from "../../firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useTheme } from "../../context/ThemeContext"

export default function ForgotPassword({ goTo }) {
  const theme = useTheme()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) return setError("Enter your email!")
    try {
      setLoading(true)
      setError("")
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with that email!")
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
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Account Recovery</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "8px", letterSpacing: "-1px" }}>Reset Password</h2>
        <p style={{ color: theme.textMuted, marginBottom: "32px", fontSize: "0.95rem" }}>
          Enter your email and we'll send you a reset link
        </p>

        {success ? (
          <div style={{
            padding: "20px", borderRadius: "10px",
            border: `1.5px solid ${theme.border}`, background: theme.surface,
            marginBottom: "24px",
          }}>
            <p style={{ fontWeight: "800", color: theme.text, marginBottom: "8px" }}>Email sent!</p>
            <p style={{ color: theme.textMuted, fontSize: "0.9rem" }}>
              Check your inbox for a password reset link.
            </p>
          </div>
        ) : (
          <>
            <input style={inputStyle} placeholder="Email address" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()} />
            {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "600" }}>{error}</p>}
            <button onClick={handleReset} style={btnPrimary} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}

        <button onClick={() => goTo("login")} style={btnSecondary}>
          Back to Sign In
        </button>
      </div>
    </div>
  )
}