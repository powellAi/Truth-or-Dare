import { useState, lazy, Suspense, useEffect } from "react"
import { useAuth } from "./context/AuthContext"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

// ✅ Lazy load ALL page components
const Home = lazy(() => import("./pages/Home"))
const Setup = lazy(() => import("./pages/Setup"))
const Game = lazy(() => import("./pages/Game"))
const Leaderboard = lazy(() => import("./pages/Leaderboard"))
const Login = lazy(() => import("./pages/Online/Login"))
const Register = lazy(() => import("./pages/Online/Register"))
const ForgotPassword = lazy(() => import("./pages/Online/ForgotPassword"))
const GameOnline = lazy(() => import("./pages/Online/GameOnline"))
const SetupOnline = lazy(() => import("./pages/Online/SetupOnline"))
const LeaderboardOnline = lazy(() => import("./pages/Online/LeaderboardOnline"))
const OnlineHome = lazy(() => import("./pages/Online/OnlineHome"))
const Lobby = lazy(() => import("./pages/Online/Lobby"))

// ✅ Loading component
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #ffffff)",
    }} />
  )
}

export default function App() {
  const { currentUser } = useAuth()
  const [screen, setScreen] = useState("home")
  const [gameData, setGameData] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [roomPlayers, setRoomPlayers] = useState([])

  // ✅ Preload common screens in background after mount
  useEffect(() => {
    import("./pages/Setup")
    import("./pages/Online/OnlineHome")
    import("./pages/Online/Login")
  }, [])

  const goTo = (screen) => setScreen(screen)

  const startGame = (data) => {
    setGameData(data)
    setScreen("game")
  }

  const endGame = (players) => {
    setGameData((prev) => ({ ...prev, players }))
    setScreen("leaderboard")
  }

  const replayWithSamePlayers = () => {
    setGameData((prev) => ({
      ...prev,
      players: (prev?.players ?? []).map(p => ({ ...p, points: 0, skips: 5 })),
    }))
  }

  const startOnlineGame = async (data) => {
    setGameData(data)
    setScreen("gameonline")
    if (roomCode) {
      try {
        await updateDoc(doc(db, "rooms", roomCode), {
          status: "playing",
          gameSettings: data,
        })
      } catch (e) {
        console.error("Failed to start room:", e)
      }
    }
  }

  const endOnlineGame = (players) => {
    setGameData((prev) => ({ ...prev, players }))
    setScreen("leaderboardonline")
  }

  const withSuspense = (Component, props) => (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  )

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return withSuspense(Home, { goTo, currentUser })
      case "login":
        return withSuspense(Login, { goTo })
      case "register":
        return withSuspense(Register, { goTo })
      case "forgotPassword":
        return withSuspense(ForgotPassword, { goTo })
      case "setup":
        return withSuspense(Setup, { goTo, startGame })
      case "game":
        return gameData ? withSuspense(Game, { gameData, endGame, goTo }) : null
      case "leaderboard":
        return gameData ? withSuspense(Leaderboard, { gameData, goTo, replayWithSamePlayers }) : null
      case "onlinehome":
        return withSuspense(OnlineHome, { goTo, currentUser, setRoomCode, onStartGame: (players) => { setRoomPlayers(players); goTo("setuponline") } })
      case "setuponline":
        return withSuspense(SetupOnline, { goTo, startGame: startOnlineGame, initialPlayers: roomPlayers })
      case "lobby":
        return withSuspense(Lobby, { goTo, roomCode, currentUser, onGameStart: startOnlineGame })
      case "gameonline":
        return gameData ? withSuspense(GameOnline, { gameData, endGame: endOnlineGame, goTo, roomCode, currentUser }) : null
      case "leaderboardonline":
  return gameData ? withSuspense(LeaderboardOnline, { goTo, startGame: startOnlineGame, gameData, currentUser, isOnline: true }) : null
    
  default:
        return withSuspense(Home, { goTo, currentUser })
    }
  }

  return renderScreen()
}