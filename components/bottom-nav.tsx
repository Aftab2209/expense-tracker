"use client"

import { Home, BarChart3, Plus, Calendar, Settings } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme, themeColors } from "@/contexts/theme-context"

interface BottomNavProps {
  onAddClick?: () => void
}

export default function BottomNav({ onAddClick }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]

  const navItems = [
    { icon: Home, label: "Home", path: "/", filled: true },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: null, label: "Add", path: null },
    { icon: Calendar, label: "Calendar", path: "/expenses" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-inset-bottom z-50">
      <nav className="flex items-center justify-around h-[68px] px-4 relative max-w-md mx-auto">
        {navItems.map((item, index) => {
          if (index === 2) {
            return (
              <button
                key="fab"
                onClick={onAddClick}
                className="flex items-center justify-center w-[52px] h-[52px] text-white rounded-full shadow-lg hover:opacity-90 transition-all active:scale-95 -mt-6"
                style={{
                  backgroundColor: colors.primary,
                  boxShadow: `0 4px 12px ${colors.primary}40`,
                }}
                aria-label={item.label}
              >
                <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </button>
            )
          }

          const Icon = item.icon!
          const isActive = pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => item.path && router.push(item.path)}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all active:scale-95"
              style={{
                color: isActive ? colors.primary : "#9CA3AF",
                opacity: isActive ? 1 : 0.7,
              }}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" strokeWidth={2} fill={isActive && item.filled ? colors.primary : "none"} />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
