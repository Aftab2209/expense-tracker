"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type ThemeColor = "coral" | "purple" | "blue" | "green" | "pink"

interface ThemeContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const themeColors = {
  coral: {
    primary: "#FF6B4A",
    primaryDark: "#E65A3D",
    gradient: "from-[#FF6B4A] to-[#FF8A6B]",
    cardGradient: "from-[#3A3A52] to-[#2A2A3E]",
  },
  purple: {
    primary: "#7B68EE",
    primaryDark: "#6A5ADB",
    gradient: "from-[#7B68EE] to-[#9B88FF]",
    cardGradient: "from-[#4A3F7A] to-[#3A2F6A]",
  },
  blue: {
    primary: "#4A9DFF",
    primaryDark: "#3A8DEE",
    gradient: "from-[#4A9DFF] to-[#6AADFF]",
    cardGradient: "from-[#2A4A7A] to-[#1A3A6A]",
  },
  green: {
    primary: "#4ADE80",
    primaryDark: "#3ACD70",
    gradient: "from-[#4ADE80] to-[#6AEE9A]",
    cardGradient: "from-[#2A5A3F] to-[#1A4A2F]",
  },
  pink: {
    primary: "#FF4A9D",
    primaryDark: "#EE3A8D",
    gradient: "from-[#FF4A9D] to-[#FF6AAD]",
    cardGradient: "from-[#5A2A4A] to-[#4A1A3A]",
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColor] = useState<ThemeColor>("coral")

  useEffect(() => {
    const saved = localStorage.getItem("themeColor") as ThemeColor
    if (saved && themeColors[saved]) {
      setThemeColor(saved)
    }
  }, [])

  const handleSetThemeColor = (color: ThemeColor) => {
    setThemeColor(color)
    localStorage.setItem("themeColor", color)
  }

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor: handleSetThemeColor }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
