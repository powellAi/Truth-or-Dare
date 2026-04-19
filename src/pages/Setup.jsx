import { useState } from "react"
import { questions } from "../data/questions"
import { useTheme } from "../context/ThemeContext"

const categories = [
  { id: "funny", label: "Funny" },
  { id: "romantic", label: "Romantic" },
  { id: "wild", label: "Wild" },
  { id: "embarrassing", label: "Embarrassing" },
  { id: "deepPersonal", label: "Deep & Personal" },
  { id: "physicalChallenges", label: "Physical Challenges" },
]

const difficulties = [
  { id: "mild", label: "Mild", desc: "Keep it chill" },
  { id: "spicy", label: "Spicy", desc: "Getting interesting" },
  { id: "extreme", label: "Extreme", desc: "No mercy" },
]

export default function Setup({ goTo, startGame }) {
  const theme = useTheme()
  const [step, setStep] = useState(1)
  const [players, setPlayers] = useState([])
  const [playerInput, setPlayerInput] = useState("")
  const [playerGender, setPlayerGender] = useState("male")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [difficulty, setDifficulty] = useState("")
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [randomTarget, setRandomTarget] = useState(false)
  const [allowSameGender, setAllowSameGender] = useState(false)
  const [customTruths, setCustomTruths] = useState([])
  const [customDares, setCustomDares] = useState([])
  const [customInput, setCustomInput] = useState("")
  const [customType, setCustomType] = useState("truth")
  const [error, setError] = useState("")

  const addPlayer = () => {
    if (!playerInput.trim()) return setError("Enter a name!")
    if (players.find(p => p.name.toLowerCase() === playerInput.trim().toLowerCase()))
      return setError("Name already taken!")
    if (players.length >= 5) return setError("Max 5 players allowed!")
    setPlayers([...players, { name: playerInput.trim(), gender: playerGender, points: 0, skips: 5 }])
    setPlayerInput("")
    setError("")
  }

  const removePlayer = (index) => setPlayers(players.filter((_, i) => i !== index))

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const addCustomQuestion = () => {
    if (!customInput.trim()) return
    const input = customInput.trim().toLowerCase()
    const builtInPool = selectedCategories.flatMap(cat =>
      questions[customType][cat] ? questions[customType][cat][difficulty] : []
    )
    const alreadyInBuiltIn = builtInPool.some(q => q.toLowerCase() === input)
    const currentList = customType === "truth" ? customTruths : customDares
    const alreadyInCustom = currentList.some(q => q.toLowerCase() === input)
    if (alreadyInBuiltIn || alreadyInCustom) { setError("This question already exists!"); return }
    if (customType === "truth") setCustomTruths(prev => [...prev, customInput.trim()])
    else setCustomDares(prev => [...prev, customInput.trim()])
    setCustomInput("")
    setError("")
  }
const handleStart = () => {
    startGame({
      players,
      categories: selectedCategories,
      difficulty,
      timerSeconds,
      randomTarget,
      allowSameGender,
      customQuestions: { truth: customTruths, dare: customDares }
    })
  }

  const pageStyle = {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: theme.bg, padding: "40px 24px", transition: "background 0.3s",
  }

  const inputStyle = {
    background: theme.surface, border: `1.5px solid ${theme.border}`,
    borderRadius: "10px", padding: "14px 16px",
    color: theme.text, fontSize: "1rem", width: "100%",
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

  const labelStyle = {
    fontWeight: "800", marginBottom: "12px", color: theme.text,
    fontSize: "0.75rem", letterSpacing: "3px", textTransform: "uppercase",
  }

  const maxWidth = { width: "100%", maxWidth: "480px" }

  if (step === 1) return (
    <div style={pageStyle}>
      <div style={maxWidth}>
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Step 1 of 4</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "4px" }}>Players</h2>
        <p style={{ color: theme.textMuted, marginBottom: "32px", fontSize: "0.95rem" }}>Add at least 2 players to continue</p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Player name..."
            value={playerInput} onChange={e => setPlayerInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPlayer()} />
          <select value={playerGender} onChange={e => setPlayerGender(e.target.value)}
            style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {error && <p style={{ color: "#c0392b", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "600" }}>{error}</p>}
        <button onClick={addPlayer} style={btnPrimary}>Add Player</button>

        {players.length > 0 && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {players.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: "10px",
                border: `1.5px solid ${theme.border}`, background: theme.surface,
              }}>
                <span style={{ fontWeight: "700", color: theme.text }}>
                  {p.name} <span style={{ color: theme.textDim, fontSize: "0.8rem", fontWeight: "400" }}>• {p.gender}</span>
                </span>
                <button onClick={() => removePlayer(i)} style={{
                  background: "transparent", color: theme.textDim, border: "none",
                  cursor: "pointer", fontWeight: "700", fontSize: "1.1rem",
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
          <button onClick={() => goTo("home")} style={{ ...btnSecondary, width: "auto", padding: "14px 20px", marginTop: "0" }}>Back</button>
          <button onClick={() => { if (players.length < 2) return setError("Add at least 2 players!"); setError(""); setStep(2) }}
            style={{ ...btnPrimary, marginTop: "0" }}>Next</button>
        </div>
      </div>
    </div>
  )

  if (step === 2) return (
    <div style={pageStyle}>
      <div style={maxWidth}>
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Step 2 of 4</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "4px" }}>Settings</h2>
        <p style={{ color: theme.textMuted, marginBottom: "32px", fontSize: "0.95rem" }}>Pick your categories and difficulty</p>

        <p style={labelStyle}>Categories</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "32px" }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{
              padding: "14px", borderRadius: "10px",
              border: selectedCategories.includes(cat.id) ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
              background: selectedCategories.includes(cat.id) ? theme.btnBg : theme.surface,
              color: selectedCategories.includes(cat.id) ? theme.btnText : theme.textMuted,
              fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s",
            }}>{cat.label}</button>
          ))}
        </div>

        <p style={labelStyle}>Difficulty</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
          {difficulties.map(d => (
            <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
              padding: "14px 16px", borderRadius: "10px",
              border: difficulty === d.id ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
              background: difficulty === d.id ? theme.btnBg : theme.surface,
              color: difficulty === d.id ? theme.btnText : theme.textMuted,
              fontWeight: "700", fontSize: "0.9rem", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s",
            }}>
              <span>{d.label}</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{d.desc}</span>
            </button>
          ))}
        </div>

        {error && <p style={{ color: "#c0392b", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "600" }}>{error}</p>}

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setStep(1)} style={{ ...btnSecondary, width: "auto", padding: "14px 20px", marginTop: "0" }}>Back</button>
          <button onClick={() => {
            if (!difficulty) return setError("Pick a difficulty!")
            if (selectedCategories.length === 0) return setError("Pick at least one category!")
            setError(""); setStep(3)
          }} style={{ ...btnPrimary, marginTop: "0" }}>Next</button>
        </div>
      </div>
    </div>
  )

  if (step === 3) return (
    <div style={pageStyle}>
      <div style={maxWidth}>
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Step 3 of 4</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "4px" }}>Options</h2>
        <p style={{ color: theme.textMuted, marginBottom: "32px", fontSize: "0.95rem" }}>Final settings before the game</p>

        <p style={labelStyle}>Dare Timer</p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px" }}>
          <button onClick={() => setTimerSeconds(Math.max(10, timerSeconds - 10))}
            style={{ ...btnSecondary, width: "auto", padding: "10px 20px", marginTop: "0" }}>−</button>
          <span style={{ fontSize: "2.5rem", fontWeight: "900", color: theme.text, minWidth: "80px", textAlign: "center" }}>
            {timerSeconds}s
          </span>
          <button onClick={() => setTimerSeconds(timerSeconds + 10)}
            style={{ ...btnSecondary, width: "auto", padding: "10px 20px", marginTop: "0" }}>+</button>
        </div>

        <p style={labelStyle}>Random Target</p>
        <button onClick={() => setRandomTarget(!randomTarget)} style={{
          padding: "14px 16px", borderRadius: "10px",
          border: randomTarget ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
          background: randomTarget ? theme.btnBg : theme.surface,
          color: randomTarget ? theme.btnText : theme.textMuted,
          fontWeight: "700", width: "100%", cursor: "pointer",
          marginBottom: "10px", fontSize: "0.9rem", textAlign: "left", transition: "all 0.2s",
        }}>
          {randomTarget ? "On — questions directed at a random player" : "Off — no random targeting"}
        </button>

        {randomTarget && (
          <>
            <p style={{ ...labelStyle, marginTop: "16px" }}>Same Gender Targeting</p>
            <button onClick={() => setAllowSameGender(!allowSameGender)} style={{
              padding: "14px 16px", borderRadius: "10px",
              border: allowSameGender ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
              background: allowSameGender ? theme.btnBg : theme.surface,
              color: allowSameGender ? theme.btnText : theme.textMuted,
              fontWeight: "700", width: "100%", cursor: "pointer",
              marginBottom: "24px", fontSize: "0.9rem", textAlign: "left", transition: "all 0.2s",
            }}>
              {allowSameGender ? "On — same gender can be selected" : "Off — opposite gender only"}
            </button>
          </>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button onClick={() => setStep(2)} style={{ ...btnSecondary, width: "auto", padding: "14px 20px", marginTop: "0" }}>Back</button>
          <button onClick={() => setStep(4)} style={{ ...btnPrimary, marginTop: "0" }}>Next</button>
        </div>
      </div>
    </div>
  )

  if (step === 4) return (
    <div style={pageStyle}>
      <div style={maxWidth}>
        <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Step 4 of 4</p>
        <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "4px" }}>Custom Questions</h2>
        <p style={{ color: theme.textMuted, marginBottom: "32px", fontSize: "0.95rem" }}>Optional — add your own truths and dares</p>

        <p style={labelStyle}>Type</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {["truth", "dare"].map(t => (
            <button key={t} onClick={() => { setCustomType(t); setError("") }} style={{
              flex: 1, padding: "12px", borderRadius: "10px",
              border: customType === t ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`,
              background: customType === t ? theme.btnBg : theme.surface,
              color: customType === t ? theme.btnText : theme.textMuted,
              fontWeight: "700", fontSize: "0.85rem", cursor: "pointer",
              letterSpacing: "2px", textTransform: "uppercase",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input style={{ ...inputStyle, flex: 1 }}
            placeholder={`Write a custom ${customType}...`}
            value={customInput}
            onChange={e => { setCustomInput(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && addCustomQuestion()} />
          <button onClick={addCustomQuestion} style={{
            padding: "14px 20px", background: theme.btnBg, color: theme.btnText,
            borderRadius: "10px", fontWeight: "700", fontSize: "0.9rem",
            border: "none", cursor: "pointer",
          }}>Add</button>
        </div>

        {error && <p style={{ color: "#c0392b", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "600" }}>{error}</p>}

        {(customTruths.length > 0 || customDares.length > 0) && (
          <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", marginTop: "12px" }}>
            {customTruths.map((q, i) => (
              <div key={`t${i}`} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: "10px",
                border: `1.5px solid ${theme.border}`, background: theme.surface,
              }}>
                <span style={{ color: theme.textDim, fontSize: "0.75rem", marginRight: "8px", letterSpacing: "1px", flexShrink: 0 }}>TRUTH</span>
                <span style={{ color: theme.text, fontSize: "0.85rem", flex: 1 }}>{q}</span>
                <button onClick={() => setCustomTruths(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: "transparent", color: theme.textDim, border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "700", marginLeft: "8px" }}>×</button>
              </div>
            ))}
            {customDares.map((q, i) => (
              <div key={`d${i}`} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: "10px",
                border: `1.5px solid ${theme.border}`, background: theme.surface,
              }}>
                <span style={{ color: theme.textDim, fontSize: "0.75rem", marginRight: "8px", letterSpacing: "1px", flexShrink: 0 }}>DARE</span>
                <span style={{ color: theme.text, fontSize: "0.85rem", flex: 1 }}>{q}</span>
                <button onClick={() => setCustomDares(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: "transparent", color: theme.textDim, border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "700", marginLeft: "8px" }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button onClick={() => setStep(3)} style={{ ...btnSecondary, width: "auto", padding: "14px 20px", marginTop: "0" }}>Back</button>
          <button onClick={handleStart} style={{ ...btnPrimary, marginTop: "0" }}>Start Game</button>
        </div>
      </div>
    </div>
  )
}