import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark"
  })

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem("theme", next ? "dark" : "light")
      return next
    })
  }

  const theme = {
    isDark,
    toggleTheme,
    bg: isDark ? "#111111" : "#ffffff",
    surface: isDark ? "#1a1a1a" : "#f8f8f8",
    border: isDark ? "#2a2a2a" : "#e0e0e0",
    text: isDark ? "#f0f0f0" : "#111111",
    textMuted: isDark ? "#888" : "#888",
    textDim: isDark ? "#555" : "#bbb",
    btnBg: isDark ? "#f0f0f0" : "#111111",
    btnText: isDark ? "#111111" : "#ffffff",
    btnOutlineBg: isDark ? "transparent" : "transparent",
    btnOutlineColor: isDark ? "#f0f0f0" : "#111111",
    btnOutlineBorder: isDark ? "#f0f0f0" : "#111111",
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}