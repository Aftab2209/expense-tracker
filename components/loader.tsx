"use client"

import { themeColors, useTheme } from "@/contexts/theme-context"

export default function Loader() {
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]

  return (
    <div className="fixed inset-0  z-[100] flex items-center justify-center" style={{
      backgroundColor: colors.primary,
      boxShadow: `0 4px 12px ${colors.primary}40`,
      opacity : 0.3
    }}>
      <img
        src="/cat-loader-unscreen.gif"
        alt="Loading"
        className="w-36 h-36 object-contain"
      />
    </div>
  )
}
