import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { db } from "../../firebase"
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"

// ── Sanitizer ──────────────────────────────────────────────
// Strips any HTML/script tags from user input to prevent XSS
const sanitize = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim()

// ── Emoji picker (simple) ───────────────────────────────────
const EMOJIS = ["😂", "❤️", "🔥", "👍", "😮", "😢", "🎉", "💯", "🤔", "😎"]

export default function Chat({ roomId = "general" }) {
  const { currentUser } = useAuth()
  const theme = useTheme()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [showEmojis, setShowEmojis] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // ── Listen to messages in real time ──────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc")
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return unsubscribe
  }, [roomId])

  // ── Auto scroll to latest message ────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Send message ──────────────────────────────────────────
  const handleSend = async () => {
    const clean = sanitize(text)
    if (!clean) return
    if (clean.length > 500) return setError("Message too long (max 500 characters)")

    try {
      setLoading(true)
      setError("")
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: clean,                          // sanitized before saving
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL,
        createdAt: serverTimestamp(),
      })
      setText("")
      setShowEmojis(false)
    } catch (err) {
      console.error("Send error:", err)
      setError("Failed to send message. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji)
    setShowEmojis(false)
  }

  // ── Styles ────────────────────────────────────────────────
  const s = {
    container: {
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: "400px", maxHeight: "80vh",
      background: theme.bg, borderRadius: "16px",
      border: `1.5px solid ${theme.border}`, overflow: "hidden",
    },
    header: {
      padding: "16px 20px",
      borderBottom: `1.5px solid ${theme.border}`,
      background: theme.surface,
    },
    headerTitle: {
      color: theme.text, fontWeight: "800",
      fontSize: "1rem", letterSpacing: "1px",
      textTransform: "uppercase", margin: 0,
    },
    headerSub: {
      color: theme.textMuted, fontSize: "0.75rem", margin: "2px 0 0",
    },
    messageList: {
      flex: 1, overflowY: "auto",
      padding: "16px", display: "flex",
      flexDirection: "column", gap: "12px",
    },
    messageBubble: (isOwn) => ({
      display: "flex", flexDirection: "column",
      alignItems: isOwn ? "flex-end" : "flex-start",
    }),
    bubbleInner: (isOwn) => ({
      maxWidth: "75%", padding: "10px 14px",
      borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
      background: isOwn ? theme.btnBg : theme.surface,
      color: isOwn ? theme.btnText : theme.text,
      fontSize: "0.9rem", lineHeight: "1.4",
      wordBreak: "break-word",
    }),
    bubbleMeta: {
      fontSize: "0.7rem", color: theme.textMuted,
      marginTop: "4px", paddingLeft: "4px",
    },
    inputRow: {
      display: "flex", alignItems: "center", gap: "8px",
      padding: "12px 16px",
      borderTop: `1.5px solid ${theme.border}`,
      background: theme.surface, position: "relative",
    },
    input: {
      flex: 1, background: theme.bg,
      border: `1.5px solid ${theme.border}`,
      borderRadius: "10px", padding: "10px 14px",
      color: theme.text, fontSize: "0.9rem",
      outline: "none", resize: "none",
    },
    iconBtn: {
      background: "transparent", border: "none",
      cursor: "pointer", fontSize: "1.3rem",
      color: theme.textMuted, padding: "6px",
      borderRadius: "8px", transition: "all 0.15s",
    },
    sendBtn: {
      padding: "10px 18px", background: theme.btnBg,
      color: theme.btnText, border: "none",
      borderRadius: "10px", fontWeight: "700",
      fontSize: "0.85rem", cursor: "pointer",
      letterSpacing: "1px", textTransform: "uppercase",
      transition: "all 0.2s",
    },
    emojiPicker: {
      position: "absolute", bottom: "70px", left: "16px",
      background: theme.surface, border: `1.5px solid ${theme.border}`,
      borderRadius: "12px", padding: "10px",
      display: "flex", flexWrap: "wrap", gap: "6px",
      width: "220px", zIndex: 10,
    },
    emojiBtn: {
      background: "transparent", border: "none",
      cursor: "pointer", fontSize: "1.4rem",
      borderRadius: "6px", padding: "4px",
      transition: "transform 0.1s",
    },
    error: {
      color: "#c0392b", fontSize: "0.8rem",
      padding: "4px 16px", fontWeight: "600",
    },
    emptyState: {
      flex: 1, display: "flex", alignItems: "center",
      justifyContent: "center", color: theme.textMuted,
      fontSize: "0.85rem", fontStyle: "italic",
    },
    charCount: {
      fontSize: "0.7rem", color: text.length > 450 ? "#c0392b" : theme.textMuted,
      alignSelf: "flex-end", paddingBottom: "2px", whiteSpace: "nowrap",
    },
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp.toDate?.() ?? new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <p style={s.headerTitle}>#{roomId}</p>
        <p style={s.headerSub}>{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div style={s.messageList}>
        {messages.length === 0 ? (
          <div style={s.emptyState}>No messages yet. Say something! 👋</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.authorId === currentUser?.uid
            return (
              <div key={msg.id} style={s.messageBubble(isOwn)}>
                {!isOwn && (
                  <span style={{ fontSize: "0.75rem", color: theme.textMuted, marginBottom: "2px", paddingLeft: "4px" }}>
                    {msg.authorName || "Anonymous"}
                  </span>
                )}
                <div style={s.bubbleInner(isOwn)}>
                  {/* Safe — text was sanitized before saving to Firestore */}
                  {msg.text}
                </div>
                <span style={s.bubbleMeta}>{formatTime(msg.createdAt)}</span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <p style={s.error}>{error}</p>}

      {/* Emoji Picker */}
      {showEmojis && (
        <div style={s.emojiPicker}>
          {EMOJIS.map((emoji) => (
            <button key={emoji} style={s.emojiBtn} onClick={() => addEmoji(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div style={s.inputRow}>
        <button style={s.iconBtn} onClick={() => setShowEmojis((v) => !v)} title="Emoji">
          😊
        </button>
        <textarea
          style={s.input}
          rows={1}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
        />
        <span style={s.charCount}>{text.length}/500</span>
        <button style={s.sendBtn} onClick={handleSend} disabled={loading || !text.trim()}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  )
}
