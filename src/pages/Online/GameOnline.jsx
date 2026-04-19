import { useState, useEffect, useRef } from "react"
import { questions } from "../../data/questions"
import { useTheme } from "../../context/ThemeContext"
import { db } from "../../firebase"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"

export default function GameOnline({ gameData, endGame, goTo, currentUser, roomCode }) {
  const { players: initialPlayers, categories, difficulty, timerSeconds, customQuestions, randomPickType, pickTimerSeconds, askerPicksQuestion } = gameData
  const theme = useTheme()

  const categoryLabels = {
    funny: "Funny",
    romantic: "Romantic",
    wild: "Wild",
    embarrassing: "Embarrassing",
    deepPersonal: "Deep & Personal",
    physicalChallenges: "Physical Challenges",
  }

  const buildPool = () => {
    const pool = { truth: [], dare: [] }
    categories.forEach(cat => {
      if (questions.truth[cat]) {
        questions.truth[cat][difficulty].forEach(q => pool.truth.push({ text: q, category: cat }))
      }
      if (questions.dare[cat]) {
        questions.dare[cat][difficulty].forEach(q => pool.dare.push({ text: q, category: cat }))
      }
    })
    pool.truth = pool.truth.sort(() => Math.random() - 0.5)
    pool.dare = pool.dare.sort(() => Math.random() - 0.5)
    return pool
  }

  const buildTurnQueue = (players) => {
    const queue = []
    for (let i = 0; i < players.length; i++) {
      for (let j = 0; j < players.length; j++) {
        if (i !== j) {
          queue.push({ askerIndex: i, targetIndex: j, questionNum: 1 })
          queue.push({ askerIndex: i, targetIndex: j, questionNum: 2 })
        }
      }
    }
    return queue.sort(() => Math.random() - 0.5)
  }

  // ✅ Host = first player in the list (same logic as Lobby)
  const isHost = initialPlayers?.[0]?.uid === currentUser?.uid

  const [players, setPlayers] = useState(initialPlayers)
  const [pool, setPool] = useState(buildPool)
  // ✅ turnQueue starts null — loaded from Firestore so ALL devices share the same queue
  const [turnQueue, setTurnQueue] = useState(null)
  const [turnIndex, setTurnIndex] = useState(0)
  const [phase, setPhase] = useState("announce")
  const [type, setType] = useState("")
  const [question, setQuestion] = useState("")
  const [timer, setTimer] = useState(timerSeconds)
  const [timerActive, setTimerActive] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)
  const [playerStats, setPlayerStats] = useState(
    initialPlayers.reduce((acc, p) => ({ ...acc, [p.name]: { truth: 0, dare: 0 } }), {})
  )
  const [questionOptions, setQuestionOptions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const intervalRef = useRef(null)
  const audioCtx = useRef(null)

  // ✅ Only host builds and pushes the queue once — everyone else receives it
  useEffect(() => {
    if (!isHost || !roomCode) return
    const queue = buildTurnQueue(initialPlayers)
    updateDoc(doc(db, "rooms", roomCode), {
      gameState: {
        phase: "announce",
        turnIndex: 0,
        turnQueue: queue,
        type: "",
        question: "",
        players: initialPlayers,
      }
    }).catch(e => console.error("Failed to init game state:", e))
  }, [])

  // ✅ Everyone listens to Firestore for all state changes including turnQueue
  useEffect(() => {
    if (!roomCode) return
    const unsub = onSnapshot(doc(db, "rooms", roomCode), (snap) => {
      if (!snap.exists()) return
      const gs = snap.data().gameState
      if (!gs) return
      if (gs.turnQueue) setTurnQueue(gs.turnQueue)
      if (gs.phase !== undefined) setPhase(gs.phase)
      if (gs.turnIndex !== undefined) setTurnIndex(gs.turnIndex)
      if (gs.players) setPlayers(gs.players)
      if (gs.type !== undefined) setType(gs.type)
      if (gs.question !== undefined) setQuestion(gs.question)
      if (gs.questionOptions) setQuestionOptions(gs.questionOptions)
    })
    return () => unsub()
  }, [roomCode])

  const pushState = async (updates) => {
    if (!roomCode) return
    try {
      await updateDoc(doc(db, "rooms", roomCode), { gameState: updates })
    } catch (e) {
      console.error("Sync failed:", e)
    }
  }

  const currentTurn = turnQueue ? turnQueue[turnIndex] : null
  const asker = currentTurn ? players[currentTurn.askerIndex] : null
  const target = currentTurn ? players[currentTurn.targetIndex] : null

  const myName = currentUser?.displayName
  const myUid = currentUser?.uid
  const isTarget = target && (target.uid === myUid || target.name === myName)
  const isAsker = asker && (asker.uid === myUid || asker.name === myName)

  const initAudio = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.current.state === "suspended") audioCtx.current.resume()
  }

  const playBeep = () => {
    try {
      initAudio()
      const ctx = audioCtx.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
    } catch (e) {}
  }

  useEffect(() => {
    if (turnQueue && turnIndex >= turnQueue.length) endGame(players)
  }, [turnIndex, turnQueue])

  useEffect(() => {
    if (timerActive && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          const next = prev - 1
          if (next <= 10 && next > 0) playBeep()
          return next
        })
      }, 1000)
    } else if (timer === 0) {
      clearInterval(intervalRef.current)
      setTimerActive(false)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerActive, timer])

  const handlePick = async (pickedType) => {
    const available = pool[pickedType]
    if (available.length === 0) {
      const other = pickedType === "truth" ? "dare" : "truth"
      if (pool[other].length === 0) { endGame(players); return }
      alert(`No more ${pickedType} questions left!`)
      return
    }
    setType(pickedType)
    setPlayerStats(prev => ({
      ...prev,
      [target.name]: { ...prev[target.name], [pickedType]: prev[target.name][pickedType] + 1 }
    }))

    if (askerPicksQuestion) {
      const count = Math.min(10, available.length)
      const options = available.slice(0, count)
      setPool(prev => ({ ...prev, [pickedType]: prev[pickedType].slice(count) }))
      setQuestionOptions(options)
      setSelectedCategory("all")
      await pushState({ phase: "askerPickQuestion", type: pickedType, questionOptions: options, turnIndex, turnQueue, players })
    } else {
      const q = available[0].text
      setPool(prev => ({ ...prev, [pickedType]: prev[pickedType].slice(1) }))
      await pushState({ phase: "passToAsker", type: pickedType, question: q, turnIndex, turnQueue, players })
    }
  }

  const handleAskerConfirm = async () => {
    initAudio()
    setTimer(timerSeconds)
    setTimerActive(type === "dare")
    await pushState({ phase: "question", turnIndex, turnQueue, type, question, players })
  }

  const handleComplete = async () => {
    const updated = players.map(p =>
      p.name === target.name ? { ...p, points: p.points + (type === "dare" ? 2 : 1) } : p
    )
    setTimerActive(false)
    await pushState({ phase: "result", players: updated, turnIndex, turnQueue, type })
  }

  const handleDidNotComplete = async () => {
    if (target.skips <= 0) return setShowSkipWarning(true)
    const updated = players.map(p => {
      if (p.name === target.name) return { ...p, skips: p.skips - 1, points: Math.max(0, p.points - 1) }
      if (p.name === asker.name) return { ...p, points: p.points + 1 }
      return p
    })
    setTimerActive(false)
    setShowSkipWarning(false)
    await pushState({ phase: "result", players: updated, turnIndex, turnQueue, type })
  }

  const nextTurn = async () => {
    const newIndex = turnIndex + 1
    setTimerActive(false)
    setShowSkipWarning(false)
    await pushState({ phase: "announce", turnIndex: newIndex, turnQueue, type: "", question: "", players })
  }

  const handleEndGame = () => endGame(players)

  const timerColor = timer > timerSeconds * 0.5 ? theme.text : timer > timerSeconds * 0.25 ? "#f39c12" : "#c0392b"

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

  // Show loading until Firestore delivers the turnQueue
  if (!turnQueue || !currentTurn) return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: theme.textMuted, fontSize: "0.9rem", letterSpacing: "2px" }}>Loading game...</p>
    </div>
  )

  const waitingBox = (msg) => (
    <div style={{ padding: "20px", background: theme.surface, borderRadius: "14px", border: `1px solid ${theme.border}`, textAlign: "center", marginTop: "12px" }}>
      <p style={{ color: theme.textMuted, fontSize: "0.85rem", marginBottom: "16px" }}>{msg}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button style={{ ...btnSecondary, marginTop: 0, width: "auto", padding: "10px 20px" }}>💬 Chat</button>
        <button style={{ ...btnSecondary, marginTop: 0, width: "auto", padding: "10px 20px" }}>🎤 Voice</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, transition: "background 0.3s", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "480px", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {players.map((p, i) => (
            <div key={i} style={{
              padding: "6px 12px", borderRadius: "20px",
              background: i === currentTurn.askerIndex ? theme.btnBg : theme.surface,
              color: i === currentTurn.askerIndex ? theme.btnText : theme.textMuted,
              fontSize: "0.8rem", fontWeight: "700", border: `1px solid ${theme.border}`,
            }}>{p.name} • {p.points}pts</div>
          ))}
        </div>
        <button onClick={handleEndGame} style={{ padding: "8px 14px", background: "transparent", color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: "8px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer", letterSpacing: "1px" }}>END</button>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: "480px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "2px" }}>TURN {turnIndex + 1} OF {turnQueue.length}</span>
          <span style={{ color: theme.textDim, fontSize: "0.75rem" }}>{pool.truth.length} truths • {pool.dare.length} dares left</span>
        </div>
        <div style={{ height: "2px", background: theme.surface, borderRadius: "1px" }}>
          <div style={{ height: "100%", width: `${(turnIndex / turnQueue.length) * 100}%`, background: theme.text, borderRadius: "1px", transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Your name banner */}
      <p style={{ width: "100%", maxWidth: "480px", textAlign: "center", color: theme.textMuted, fontSize: "0.8rem", fontWeight: "700", letterSpacing: "2px", marginBottom: "20px" }}>
        YOU — {currentUser?.displayName}
      </p>

      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* Phase 1 — Announce Turn */}
        {phase === "announce" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "24px" }}>This Turn</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "32px" }}>
              <div>
                <p style={{ color: theme.textMuted, fontSize: "0.7rem", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "6px" }}>Asking</p>
                <p style={{ color: theme.text, fontSize: "1.6rem", fontWeight: "900" }}>{asker.name}</p>
              </div>
              <div style={{ color: theme.border, fontSize: "1.8rem" }}>→</div>
              <div>
                <p style={{ color: theme.textMuted, fontSize: "0.7rem", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "6px" }}>Answering</p>
                <p style={{ color: theme.text, fontSize: "1.6rem", fontWeight: "900" }}>{target.name}</p>
              </div>
            </div>
            {isTarget ? (
              <>
                <p style={{ color: theme.textDim, fontSize: "0.85rem", marginBottom: "28px" }}>It's your turn to answer!</p>
                <button onClick={async () => { await pushState({ phase: "targetConfirm", turnIndex, turnQueue, players }) }} style={btnPrimary}>Ready</button>
              </>
            ) : isAsker ? (
              <>
                <p style={{ color: theme.textDim, fontSize: "0.85rem", marginBottom: "28px" }}>Get ready to ask</p>
                {waitingBox(`Waiting for ${target.name} to get ready...`)}
              </>
            ) : (
              waitingBox(`Waiting for ${target.name}...`)
            )}
            <button onClick={handleEndGame} style={btnSecondary}>End Game</button>
          </div>
        )}

        {/* Phase 2 — Target Confirms Ready */}
        {phase === "targetConfirm" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px" }}>Ready?</p>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "900", color: theme.text, marginBottom: "8px", letterSpacing: "-1px" }}>{target.name}</h2>
            <p style={{ color: theme.textDim, fontSize: "0.85rem", marginBottom: "32px" }}>{target.skips} skips left • {target.points} pts</p>
            {isTarget ? (
              <button onClick={async () => {
                if (randomPickType) {
                  const picked = Math.random() < 0.5 ? "truth" : "dare"
                  await handlePick(picked)
                } else {
                  await pushState({ phase: "pick", turnIndex, turnQueue, players })
                }
              }} style={btnPrimary}>Ready</button>
            ) : waitingBox(`Waiting for ${target.name} to get ready...`)}
          </div>
        )}

        {/* Phase 3 — Pick Truth or Dare */}
        {phase === "pick" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px" }}>Choose</p>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "32px", letterSpacing: "-1px" }}>Truth or Dare?</h2>
            {isTarget ? (
              <div style={{ display: "flex", gap: "12px" }}>
                {(() => {
                  const stats = playerStats[target.name]
                  const dareAhead = stats.dare > stats.truth + 1
                  const truthAhead = stats.truth > stats.dare + 1
                  return (
                    <>
                      <button onClick={() => handlePick("truth")} disabled={pool.truth.length === 0} style={{ flex: 1, padding: "20px", borderRadius: "14px", background: theme.surface, color: pool.truth.length === 0 ? theme.textDim : theme.text, fontWeight: "900", fontSize: "1.1rem", border: dareAhead ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`, cursor: pool.truth.length === 0 ? "not-allowed" : "pointer", letterSpacing: "2px", textTransform: "uppercase", transition: "all 0.2s" }}>
                        Truth
                        {pool.truth.length === 0 && <div style={{ fontSize: "0.6rem", marginTop: "4px", color: theme.textDim }}>Done</div>}
                        {dareAhead && pool.truth.length > 0 && <div style={{ fontSize: "0.6rem", color: theme.textMuted, marginTop: "4px", letterSpacing: "1px" }}>Suggested</div>}
                      </button>
                      <button onClick={() => handlePick("dare")} disabled={pool.dare.length === 0} style={{ flex: 1, padding: "20px", borderRadius: "14px", background: pool.dare.length === 0 ? theme.surface : theme.btnBg, color: pool.dare.length === 0 ? theme.textDim : theme.btnText, fontWeight: "900", fontSize: "1.1rem", border: `1.5px solid ${theme.border}`, cursor: pool.dare.length === 0 ? "not-allowed" : "pointer", letterSpacing: "2px", textTransform: "uppercase", transition: "all 0.2s" }}>
                        Dare
                        {pool.dare.length === 0 && <div style={{ fontSize: "0.6rem", marginTop: "4px", color: theme.textDim }}>Done</div>}
                        {truthAhead && pool.dare.length > 0 && <div style={{ fontSize: "0.6rem", color: theme.textMuted, marginTop: "4px", letterSpacing: "1px" }}>Suggested</div>}
                      </button>
                    </>
                  )
                })()}
              </div>
            ) : waitingBox(`Waiting for ${target.name} to choose...`)}
          </div>
        )}

        {/* Phase 3b — Asker Picks Question from List */}
        {phase === "askerPickQuestion" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "20px", background: theme.surface, color: theme.textMuted, fontWeight: "700", fontSize: "0.75rem", marginBottom: "24px", letterSpacing: "3px", textTransform: "uppercase", border: `1px solid ${theme.border}` }}>
              {type} chosen
            </div>
            {isAsker ? (
              <>
                <p style={{ color: theme.text, fontSize: "1rem", fontWeight: "800", marginBottom: "16px" }}>
                  Pick a question to ask {target.name}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                  <button onClick={() => setSelectedCategory("all")} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", border: selectedCategory === "all" ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`, background: selectedCategory === "all" ? theme.btnBg : theme.surface, color: selectedCategory === "all" ? theme.btnText : theme.textMuted, cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" }}>All</button>
                  {[...new Set(questionOptions.map(q => q.category))].map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", border: selectedCategory === cat ? `2px solid ${theme.text}` : `1.5px solid ${theme.border}`, background: selectedCategory === cat ? theme.btnBg : theme.surface, color: selectedCategory === cat ? theme.btnText : theme.textMuted, cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" }}>{categoryLabels[cat] || cat}</button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
                  {questionOptions
                    .filter(q => selectedCategory === "all" || q.category === selectedCategory)
                    .map((q, i) => (
                      <button key={i} onClick={async () => {
                        initAudio()
                        setTimer(timerSeconds)
                        setTimerActive(type === "dare")
                        await pushState({ phase: "question", question: q.text, turnIndex, turnQueue, type, players })
                      }} style={{ padding: "16px 20px", borderRadius: "14px", background: theme.surface, color: theme.text, fontWeight: "500", fontSize: "0.9rem", border: `1.5px solid ${theme.border}`, cursor: "pointer", textAlign: "left", lineHeight: "1.6", transition: "all 0.2s" }}>
                        <span style={{ display: "block", fontSize: "0.65rem", color: theme.textMuted, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>{categoryLabels[q.category] || q.category}</span>
                        {q.text}
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "20px", background: theme.surface, borderRadius: "14px", border: `1px solid ${theme.border}` }}>
                <p style={{ color: theme.textMuted, fontSize: "0.9rem", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "2px" }}>{type} was chosen</p>
                <p style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Waiting for {asker.name} to pick a question...</p>
              </div>
            )}
          </div>
        )}

        {/* Phase 4 — Pass to Asker */}
        {phase === "passToAsker" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "24px" }}>Get Ready</p>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "900", color: theme.text, marginBottom: "8px", letterSpacing: "-1px" }}>{asker.name}</h2>
            {isAsker ? (
              <>
                <p style={{ color: theme.textMuted, fontSize: "0.9rem", marginBottom: "32px" }}>Get ready to read the {type} out loud</p>
                <button onClick={handleAskerConfirm} style={btnPrimary}>I'm Ready</button>
              </>
            ) : (
              <>
                <p style={{ color: theme.textMuted, fontSize: "0.9rem", marginBottom: "32px" }}>Get ready to answer</p>
                {waitingBox(`Waiting for ${asker.name} to get ready...`)}
              </>
            )}
          </div>
        )}

        {/* Phase 5 — Question */}
        {phase === "question" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "20px", background: theme.surface, color: theme.textMuted, fontWeight: "700", fontSize: "0.75rem", marginBottom: "16px", letterSpacing: "3px", textTransform: "uppercase", border: `1px solid ${theme.border}` }}>{type}</div>
            <p style={{ color: theme.textMuted, fontSize: "0.85rem", marginBottom: "16px" }}>
              Read this to <span style={{ color: theme.text, fontWeight: "700" }}>{target.name}</span>
            </p>
            <p style={{ fontSize: "1.1rem", fontWeight: "500", color: theme.text, lineHeight: "1.7", marginBottom: "24px", padding: "20px", background: theme.surface, borderRadius: "14px", border: `1px solid ${theme.border}`, textAlign: "left" }}>{question}</p>
            {type === "dare" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: timerColor, transition: "color 0.5s" }}>{timer}s</div>
                <div style={{ height: "3px", background: theme.surface, borderRadius: "2px", marginTop: "10px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(timer / timerSeconds) * 100}%`, background: timerColor, borderRadius: "2px", transition: "width 1s linear, background 0.5s" }} />
                </div>
              </div>
            )}
            {isAsker ? (
              <>
                <p style={{ color: theme.textDim, fontSize: "0.8rem", marginBottom: "4px", letterSpacing: "2px", textTransform: "uppercase" }}>Did {target.name} complete it?</p>
                <button onClick={handleComplete} style={btnPrimary}>Completed</button>
                {showSkipWarning && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: "10px" }}>{target.name} has no skips left!</p>}
                <button onClick={handleDidNotComplete} style={{ ...btnSecondary, opacity: target.skips <= 0 ? 0.3 : 1 }}>Did Not Complete ({target.skips} skips left)</button>
              </>
            ) : (
              <div style={{ padding: "16px", background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, textAlign: "center" }}>
                <p style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Watching <strong>{asker.name}</strong> ask <strong>{target.name}</strong>...</p>
              </div>
            )}
          </div>
        )}

        {/* Phase 6 — Result */}
        {phase === "result" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.textDim, fontSize: "0.75rem", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "24px" }}>Result</p>
            <h3 style={{ fontSize: "2rem", fontWeight: "900", color: theme.text, marginBottom: "8px" }}>{type === "dare" ? "+2 points" : "+1 point"}</h3>
            <p style={{ color: theme.textMuted, marginBottom: "40px", fontSize: "0.9rem" }}>{target.name} completed the {type}</p>
            {isAsker
              ? <button onClick={nextTurn} style={btnPrimary}>Next Turn</button>
              : <div style={{ padding: "16px", background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, textAlign: "center" }}><p style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Waiting for next turn...</p></div>
            }
          </div>
        )}

      </div>

      {/* Online info bar */}
      <div style={{ width: "100%", maxWidth: "480px", marginTop: "32px", padding: "14px 18px", background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}` }}>
        <p style={{ fontWeight: "800", fontSize: "0.7rem", letterSpacing: "3px", textTransform: "uppercase", color: theme.textMuted, marginBottom: "8px" }}>Game Info</p>
        <p style={{ color: theme.textMuted, fontSize: "0.8rem", margin: "3px 0" }}><strong>Room:</strong> {roomCode}</p>
        <p style={{ color: theme.textMuted, fontSize: "0.8rem", margin: "3px 0" }}><strong>Players:</strong> {players.map(p => p.name).join(", ")}</p>
        <p style={{ color: theme.textMuted, fontSize: "0.8rem", margin: "3px 0" }}><strong>Turn:</strong> {turnIndex + 1} of {turnQueue.length}</p>
      </div>

    </div>
  )
}
