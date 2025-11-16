"use client"

import { useState } from "react"

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

const CATEGORY_ICONS = [
  { icon: "🍔", label: "Food" },
  { icon: "🛒", label: "Shopping" },
  { icon: "🚗", label: "Transport" },
  { icon: "🏠", label: "Home" },
  { icon: "💊", label: "Health" },
  { icon: "🎬", label: "Entertainment" },
  { icon: "📚", label: "Education" },
  { icon: "👕", label: "Clothing" },
  { icon: "✈️", label: "Travel" },
  { icon: "💰", label: "Salary" },
  { icon: "💳", label: "Bills" },
  { icon: "🎁", label: "Gifts" },
  { icon: "🏋️", label: "Fitness" },
  { icon: "☕", label: "Cafe" },
  { icon: "🍕", label: "Restaurant" },
  { icon: "🎮", label: "Gaming" },
  { icon: "📱", label: "Tech" },
  { icon: "⛽", label: "Fuel" },
  { icon: "🐕", label: "Pets" },
  { icon: "💇", label: "Beauty" },
  { icon: "🔧", label: "Maintenance" },
  { icon: "📦", label: "Other" },
]

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {CATEGORY_ICONS.map(({ icon, label }) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          title={label}
          className={`aspect-square flex items-center justify-center text-2xl rounded-lg transition-all hover:scale-110 ${
            value === icon
              ? "bg-blue-100 ring-2 ring-blue-500 scale-110"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
