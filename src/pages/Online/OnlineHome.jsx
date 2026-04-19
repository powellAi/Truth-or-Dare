import { db } from "../../firebase"
import { useTheme } from "../../context/ThemeContext"
import { useState, useEffect } from "react"
import {
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
  serverTimestamp, onSnapshot, collection, query, where, getDocs
} from "firebase/firestore"

export default function OnlineHome({ goTo, currentUser, setRoomCode, onStartGame }) {
  const theme = useTheme()
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomCreated, setRoomCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [friendSearch, setFriendSearch] = useState("")

  // --- Real state ---
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([]) // incoming
  const [sentRequests, setSentRequests] = useState([])       // outgoing
  const [notifications, setNotifications] = useState([])
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState("")
  const [searching, setSearching] = useState(false)
  const [liveRoom, setLiveRoom] = useState(null)

  // --- Ensure user doc exists in Firestore ---
  useEffect(() => {
    if (!currentUser) return
    const userRef = doc(db, "users", currentUser.uid)
    getDoc(userRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(userRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || "",
          username: (currentUser.displayName || "").toLowerCase().replace(/\s+/g, ""),
          photoURL: currentUser.photoURL || "",  
          friends: [],
          pendingRequests: [],
          sentRequests: [],
          roomInvites: [],
          status: "online",
          createdAt: serverTimestamp(),
        })
      } else {
        // Mark as online
        updateDoc(userRef, { status: "online" })
      }
    })
    // Mark offline on unmount
    return () => {
      updateDoc(userRef, { status: "offline" }).catch(() => {})
    }
  }, [currentUser])

  // --- Listen to current user's doc for friends / requests / notifications ---
  useEffect(() => {
    if (!currentUser) return
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), async (snap) => {
      if (!snap.exists()) return
      const data = snap.data()

      const friendUids = data.friends || []
      const incoming = data.pendingRequests || []
      const outgoing = data.sentRequests || []
      const roomInvites = data.roomInvites || []

      setSentRequests(outgoing)

      // Load friend details
      const friendDocs = await Promise.all(
        friendUids.map(uid => getDoc(doc(db, "users", uid)))
      )
      setFriends(friendDocs.filter(d => d.exists()).map(d => d.data()))

      // Load incoming request details
      const reqDocs = await Promise.all(
        incoming.map(uid => getDoc(doc(db, "users", uid)))
      )
      const reqData = reqDocs.filter(d => d.exists()).map(d => d.data())
      setPendingRequests(reqData)

      // Build notifications from pending requests AND room invites
      const friendRequestNotifs = reqData.map(r => ({
        type: "friendRequest",
        from: r.displayName,
        fromUid: r.uid,
      }))

      const roomInviteNotifs = roomInvites.map(invite => ({
        type: "roomInvite",
        from: invite.from,
        fromUid: invite.fromUid,
        roomCode: invite.roomCode,
        timestamp: invite.timestamp,
      }))

      setNotifications([...friendRequestNotifs, ...roomInviteNotifs])
    })
    return () => unsub()
  }, [currentUser])

  // --- Room listener ---
  useEffect(() => {
    if (!roomCreated) return
    const unsub = onSnapshot(doc(db, "rooms", roomCreated), (snap) => {
      if (snap.exists()) setLiveRoom(snap.data())
    })
    return () => unsub()
  }, [roomCreated])

  // --- Search by username or displayName ---
  const handleSearch = async () => {
    const term = friendSearch.trim().toLowerCase()
    if (!term) return
    setSearching(true)
    setSearchError("")
    setSearchResult(null)
    try {
      // Search by username field
      const q = query(collection(db, "users"), where("username", "==", term))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const found = snap.docs[0].data()
        if (found.uid === currentUser.uid) {
          setSearchError("That's you!")
        } else {
          setSearchResult(found)
        }
      } else {
        // Fallback: search by displayName lowercase
        const q2 = query(collection(db, "users"), where("displayName", "==", friendSearch.trim()))
        const snap2 = await getDocs(q2)
        if (!snap2.empty) {
          const found = snap2.docs[0].data()
          if (found.uid === currentUser.uid) {
            setSearchError("That's you!")
          } else {
            setSearchResult(found)
          }
        } else {
          setSearchError("No user found with that username.")
        }
      }
    } catch (e) {
      setSearchError("Search failed. Try again.")
    }
    setSearching(false)
  }

  // --- Send Friend Request ---
  const handleSendRequest = async (targetUid) => {
    if (!currentUser) return
    try {
      // Add to target's pendingRequests
      await updateDoc(doc(db, "users", targetUid), {
        pendingRequests: arrayUnion(currentUser.uid),
      })
      // Track in sender's sentRequests
      await updateDoc(doc(db, "users", currentUser.uid), {
        sentRequests: arrayUnion(targetUid),
      })
      setSearchResult(prev => ({ ...prev, _requestSent: true }))
    } catch (e) {
      console.error("Failed to send request:", e)
    }
  }

  // --- Accept Friend Request ---
  const handleAccept = async (fromUid) => {
    if (!currentUser) return
    try {
      const myRef = doc(db, "users", currentUser.uid)
      const theirRef = doc(db, "users", fromUid)
      // Add each other as friends
      await updateDoc(myRef, {
        friends: arrayUnion(fromUid),
        pendingRequests: arrayRemove(fromUid),
      })
      await updateDoc(theirRef, {
        friends: arrayUnion(currentUser.uid),
        sentRequests: arrayRemove(currentUser.uid),
      })
    } catch (e) {
      console.error("Failed to accept:", e)
    }
  }

  // --- Decline Friend Request ---
  const handleDecline = async (fromUid) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        pendingRequests: arrayRemove(fromUid),
      })
      await updateDoc(doc(db, "users", fromUid), {
        sentRequests: arrayRemove(currentUser.uid),
      })
    } catch (e) {
      console.error("Failed to decline:", e)
    }
  }

  // --- Invite Friend to Room ---
  const handleInviteToRoom = async (friendUid) => {
    if (!currentUser || !roomCreated) return
    try {
      const friendRef = doc(db, "users", friendUid)
      await updateDoc(friendRef, {
        roomInvites: arrayUnion({
          from: currentUser.displayName,
          fromUid: currentUser.uid,
          roomCode: roomCreated,
          timestamp: Date.now(),
        })
      })
    } catch (e) {
      console.error("Failed to send invite:", e)
    }
  }

  // --- Accept Room Invite ---
  const handleAcceptInvite = async (invite) => {
    if (!currentUser) return
    try {
      // Remove the invite from notifications
      await updateDoc(doc(db, "users", currentUser.uid), {
        roomInvites: arrayRemove(invite)
      })
      // Join the room
      setJoinCode(invite.roomCode)
      await handleJoinRoomByCode(invite.roomCode)
      setNotificationsOpen(false)
    } catch (e) {
      console.error("Failed to accept invite:", e)
    }
  }

  // --- Decline Room Invite ---
  const handleDeclineInvite = async (invite) => {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        roomInvites: arrayRemove(invite)
      })
    } catch (e) {
      console.error("Failed to decline invite:", e)
    }
  }

  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const handleCreateRoom = async () => {
    if (!currentUser) return
    setCreating(true)
    const code = generateRoomCode()
    try {
      await setDoc(doc(db, "rooms", code), {
        hostId: currentUser.uid,
        hostName: currentUser.displayName,
        status: "waiting",
        players: [{ uid: currentUser.uid, displayName: currentUser.displayName, isHost: true }],
        gameSettings: null,
        createdAt: serverTimestamp(),
      })
      setRoomCode(code)
      setRoomCreated(code)
      setActiveSection("room")
    } catch (e) {
      console.error("Failed to create room:", e)
    }
    setCreating(false)
  }

  const handleJoinRoomByCode = async (code) => {
    if (!code || !currentUser) return
    setJoinError("")
    setJoining(true)
    try {
      const roomRef = doc(db, "rooms", code)
      const roomSnap = await getDoc(roomRef)
      if (!roomSnap.exists()) { setJoinError("Room not found!"); setJoining(false); return }
      const roomData = roomSnap.data()
      if (roomData.status !== "waiting") { setJoinError("Game already started!"); setJoining(false); return }
      if (roomData.players.length >= 6) { setJoinError("Room is full!"); setJoining(false); return }

      const alreadyInRoom = roomData.players.some(p => p.uid === currentUser.uid)
      if (alreadyInRoom) { setJoinError("You're already in this room on another device!"); setJoining(false); return }

      await updateDoc(roomRef, {
        players: arrayUnion({ uid: currentUser.uid, displayName: currentUser.displayName, isHost: false })
      })
      setRoomCode(code)
      goTo("lobby")
    } catch (e) {
      setJoinError("Failed to join. Try again.")
    }
    setJoining(false)
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !currentUser) return
    await handleJoinRoomByCode(joinCode.trim().toUpperCase())
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCreated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const initials = currentUser?.displayName?.[0]?.toUpperCase() || "?"
  const unreadCount = notifications.length

  const alreadyFriend = (uid) => friends.some(f => f.uid === uid)
  const alreadySent = (uid) => sentRequests.includes(uid)

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 24px", borderBottom: `1.5px solid ${theme.border}`,
        position: "sticky", top: 0, background: theme.bg, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: theme.surface, border: `1.5px solid ${theme.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "900", fontSize: "1rem", color: theme.text,
         }}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="avatar" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
              : initials
            }
          </div>
          <div>
            <p style={{ fontWeight: "800", fontSize: "0.95rem", color: theme.text, margin: 0 }}>{currentUser?.displayName || "Player"}</p>
            <p style={{ fontSize: "0.7rem", color: theme.textMuted, margin: 0, letterSpacing: "1px" }}>Online</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} style={{
              background: theme.surface, border: `1.5px solid ${theme.border}`,
              borderRadius: "10px", width: "42px", height: "42px",
              cursor: "pointer", fontSize: "1.2rem", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>🔔</button>
            {unreadCount > 0 && (
              <div style={{
                position: "absolute", top: "-6px", right: "-6px",
                background: "#e74c3c", color: "#fff", borderRadius: "50%",
                width: "18px", height: "18px", fontSize: "0.65rem",
                fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center",
              }}>{unreadCount}</div>
            )}
          </div>
          <button onClick={() => goTo("home")} style={{
            background: "transparent", border: `1.5px solid ${theme.border}`,
            borderRadius: "10px", padding: "8px 14px", cursor: "pointer",
            color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700",
            letterSpacing: "2px", textTransform: "uppercase",
          }}>Back</button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div style={{
          position: "absolute", top: "80px", right: "24px", width: "300px",
          background: theme.bg, border: `1.5px solid ${theme.border}`,
          borderRadius: "14px", zIndex: 50, padding: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}>
          <p style={{ fontWeight: "800", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>Notifications</p>
          {notifications.length === 0 ? (
            <p style={{ color: theme.textMuted, fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>No new notifications</p>
          ) : notifications.map((n, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: "10px",
              border: `1.5px solid ${theme.border}`, background: theme.surface, marginBottom: "8px",
            }}>
              {n.type === "friendRequest" ? (
                <>
                  <div>
                    <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.85rem", margin: 0 }}>{n.from}</p>
                    <p style={{ color: theme.textMuted, fontSize: "0.72rem", margin: 0 }}>Sent you a friend request</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => { handleAccept(n.fromUid); setNotificationsOpen(false) }} style={{
                      padding: "6px 10px", borderRadius: "8px", border: "none",
                      background: theme.btnBg, color: theme.btnText,
                      fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>✓</button>
                    <button onClick={() => { handleDecline(n.fromUid); setNotificationsOpen(false) }} style={{
                      padding: "6px 10px", borderRadius: "8px",
                      border: `1.5px solid ${theme.border}`, background: "transparent",
                      color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.85rem", margin: 0 }}>{n.from}</p>
                    <p style={{ color: theme.textMuted, fontSize: "0.72rem", margin: 0 }}>Invited you to room {n.roomCode}</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => handleAcceptInvite(n)} style={{
                      padding: "6px 10px", borderRadius: "8px", border: "none",
                      background: theme.btnBg, color: theme.btnText,
                      fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>Join</button>
                    <button onClick={() => handleDeclineInvite(n)} style={{
                      padding: "6px 10px", borderRadius: "8px",
                      border: `1.5px solid ${theme.border}`, background: "transparent",
                      color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>✕</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "24px", maxWidth: "480px", margin: "0 auto" }}>
        {activeSection === "home" && (
          <>
            {/* Room section */}
            <div style={{ marginBottom: "32px" }}>
              <button onClick={handleCreateRoom} disabled={creating} style={{
                width: "100%", padding: "18px", borderRadius: "14px",
                border: "none", background: theme.btnBg, color: theme.btnText,
                fontWeight: "900", fontSize: "1rem", cursor: creating ? "not-allowed" : "pointer",
                letterSpacing: "3px", textTransform: "uppercase", marginBottom: "12px",
              }}>
                {creating ? "Creating..." : "Create Room"}
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError("") }}
                  placeholder="Enter room code"
                  maxLength={6}
                  style={{
                    flex: 1, padding: "14px 16px", borderRadius: "12px",
                    border: `1.5px solid ${joinError ? "#e74c3c" : theme.border}`,
                    background: theme.surface, color: theme.text,
                    fontSize: "0.95rem", fontWeight: "700", letterSpacing: "4px",
                    textTransform: "uppercase", outline: "none",
                  }}
                />
                <button onClick={handleJoinRoom} disabled={joinCode.trim().length < 4 || joining} style={{
                  padding: "14px 20px", borderRadius: "12px",
                  border: `1.5px solid ${theme.border}`, background: theme.surface,
                  color: joinCode.trim().length >= 4 ? theme.text : theme.textMuted,
                  fontWeight: "800", fontSize: "0.85rem",
                  cursor: joinCode.trim().length >= 4 ? "pointer" : "not-allowed",
                  letterSpacing: "2px", textTransform: "uppercase",
                }}>
                  {joining ? "..." : "Join"}
                </button>
              </div>
              {joinError && <p style={{ color: "#e74c3c", fontSize: "0.8rem", fontWeight: "600", marginTop: "8px" }}>{joinError}</p>}
            </div>

            {/* Friends section */}
            <div>
              <p style={{ fontWeight: "800", fontSize: "0.75rem", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>Friends</p>

              {/* Search */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  value={friendSearch}
                  onChange={e => { setFriendSearch(e.target.value); setSearchResult(null); setSearchError("") }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Search by username..."
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: "10px",
                    border: `1.5px solid ${theme.border}`, background: theme.surface,
                    color: theme.text, fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
                  }}
                />
                <button onClick={handleSearch} disabled={searching || !friendSearch.trim()} style={{
                  padding: "12px 16px", borderRadius: "10px",
                  border: `1.5px solid ${theme.border}`, background: theme.surface,
                  color: theme.text, fontWeight: "700", fontSize: "0.8rem",
                  cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
                }}>{searching ? "..." : "Search"}</button>
              </div>

              {/* Search error */}
              {searchError && <p style={{ color: "#e74c3c", fontSize: "0.8rem", fontWeight: "600", marginBottom: "8px" }}>{searchError}</p>}

              {/* Search result */}
              {searchResult && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: "10px",
                  border: `1.5px solid ${theme.border}`, background: theme.surface, marginBottom: "12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: theme.bg, border: `1.5px solid ${theme.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "900", fontSize: "0.9rem", color: theme.text,
                    }}>{searchResult.displayName?.[0]?.toUpperCase()}</div>
                    <div>
                      <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem", margin: 0 }}>{searchResult.displayName}</p>
                      <p style={{ color: theme.textMuted, fontSize: "0.72rem", margin: 0 }}>@{searchResult.username}</p>
                    </div>
                  </div>
                  {alreadyFriend(searchResult.uid) ? (
                    <span style={{ color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700" }}>Friends ✓</span>
                  ) : alreadySent(searchResult.uid) || searchResult._requestSent ? (
                    <span style={{ color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700" }}>Sent ✓</span>
                  ) : (
                    <button onClick={() => handleSendRequest(searchResult.uid)} style={{
                      padding: "6px 14px", borderRadius: "8px", border: "none",
                      background: theme.btnBg, color: theme.btnText,
                      fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>Add</button>
                  )}
                </div>
              )}

              {/* Pending incoming requests */}
              {pendingRequests.length > 0 && pendingRequests.map((req, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: "10px",
                  border: `1.5px solid ${theme.border}`, background: theme.surface, marginBottom: "8px",
                }}>
                  <div>
                    <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem", margin: 0 }}>{req.displayName}</p>
                    <p style={{ color: theme.textMuted, fontSize: "0.75rem", margin: 0 }}>Friend request</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleAccept(req.uid)} style={{
                      padding: "6px 12px", borderRadius: "8px", border: "none",
                      background: theme.btnBg, color: theme.btnText,
                      fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>✓</button>
                    <button onClick={() => handleDecline(req.uid)} style={{
                      padding: "6px 12px", borderRadius: "8px",
                      border: `1.5px solid ${theme.border}`, background: "transparent",
                      color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                    }}>✕</button>
                  </div>
                </div>
              ))}

              {/* Friends list */}
              {friends.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "32px 16px",
                  border: `1.5px dashed ${theme.border}`, borderRadius: "12px",
                  color: theme.textMuted, fontSize: "0.85rem",
                }}>No friends yet. Search above to add some.</div>
              ) : friends.map((friend, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: "10px",
                  border: `1.5px solid ${theme.border}`, background: theme.surface, marginBottom: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: theme.bg, border: `1.5px solid ${theme.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "900", fontSize: "0.9rem",
                      }}>{friend.displayName?.[0]?.toUpperCase()}</div>
                      <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: "10px", height: "10px", borderRadius: "50%",
                        background: friend.status === "online" ? "#27ae60" : friend.status === "ingame" ? "#f39c12" : "#7f8c8d",
                        border: `2px solid ${theme.bg}`,
                      }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem", margin: 0 }}>{friend.displayName}</p>
                      <p style={{ color: theme.textMuted, fontSize: "0.7rem", margin: 0 }}>
                        {friend.status === "online" ? "Online" : friend.status === "ingame" ? "In Game" : "Offline"}
                      </p>
                    </div>
                  </div>
                  {roomCreated && friend.status === "online" && (
                    <button onClick={() => handleInviteToRoom(friend.uid)} style={{
                      padding: "6px 12px", borderRadius: "8px",
                      border: `1.5px solid ${theme.border}`, background: theme.btnBg,
                      color: theme.btnText, fontSize: "0.7rem", fontWeight: "700",
                      cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
                    }}>Invite</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Room section */}
        {activeSection === "room" && roomCreated && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <button onClick={() => setActiveSection("home")} style={{
                background: "transparent", border: `1.5px solid ${theme.border}`,
                borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
                color: theme.textMuted, fontSize: "0.75rem", fontWeight: "700",
              }}>← Back</button>
              <p style={{ fontWeight: "900", fontSize: "1.1rem", color: theme.text, margin: 0 }}>Your Room</p>
            </div>

            <div style={{
              textAlign: "center", padding: "32px 24px", borderRadius: "16px",
              border: `1.5px solid ${theme.border}`, background: theme.surface, marginBottom: "20px",
            }}>
              <p style={{ fontSize: "0.7rem", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", color: theme.textMuted, marginBottom: "8px" }}>Room Code</p>
              <p style={{ fontSize: "3rem", fontWeight: "900", color: theme.text, letterSpacing: "8px", margin: "0 0 16px" }}>{roomCreated}</p>
              <button onClick={handleCopyCode} style={{
                padding: "10px 24px", borderRadius: "10px",
                border: `1.5px solid ${theme.border}`, background: copied ? theme.btnBg : "transparent",
                color: copied ? theme.btnText : theme.textMuted,
                fontWeight: "700", fontSize: "0.8rem", cursor: "pointer",
                letterSpacing: "2px", textTransform: "uppercase",
              }}>{copied ? "Copied!" : "Copy Code"}</button>
            </div>

            <p style={{ fontWeight: "800", fontSize: "0.75rem", letterSpacing: "3px", textTransform: "uppercase", color: theme.text, marginBottom: "12px" }}>
              Players ({liveRoom?.players?.length || 1})
            </p>
            {(liveRoom?.players || [{ uid: currentUser?.uid, displayName: currentUser?.displayName, isHost: true }]).map((player, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: "10px",
                border: `1.5px solid ${theme.border}`, background: theme.surface, marginBottom: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: theme.bg, border: `1.5px solid ${theme.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "900", fontSize: "0.85rem", color: theme.text,
                  }}>
                    {player.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem", margin: 0 }}>
                    {player.displayName}
                    {player.isHost && <span style={{ color: theme.textMuted, fontSize: "0.7rem", marginLeft: "8px" }}>Host</span>}
                  </p>
                </div>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27ae60" }} />
              </div>
            ))}

            <button onClick={() => {
              const players = liveRoom?.players || [{ uid: currentUser?.uid, displayName: currentUser?.displayName, isHost: true }]
              onStartGame(players)
            }} style={{
              width: "100%", padding: "16px", borderRadius: "12px",
              border: "none", background: theme.btnBg, color: theme.btnText,
              fontWeight: "900", fontSize: "0.9rem", cursor: "pointer",
              letterSpacing: "3px", textTransform: "uppercase",
            }}>Start Game</button>
          </div>
        )}
      </div>
    </div>
  )
}
