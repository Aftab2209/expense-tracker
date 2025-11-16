"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { userAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useTheme, themeColors } from "@/contexts/theme-context"

interface SalaryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SalaryModal({ isOpen, onClose, onSuccess }: SalaryModalProps) {
  const { user, updateUser } = useAuth()
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]

  const [monthlySalary, setMonthlySalary] = useState("")
  const [payday, setPayday] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && user) {
      setMonthlySalary(user.monthlySalary?.toString() || "")
      setPayday(user.payday?.toString() || "1")
    }
  }, [isOpen, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!monthlySalary || Number.parseFloat(monthlySalary) <= 0) {
      setError("Please enter a valid salary amount")
      return
    }

    const paydayNum = Number.parseInt(payday)
    if (paydayNum < 1 || paydayNum > 31) {
      setError("Payday must be between 1 and 31")
      return
    }

    setLoading(true)

    try {
      const result = await userAPI.updateSalary(Number.parseFloat(monthlySalary), paydayNum)
      updateUser(result.user)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update salary")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md">
        <div className="border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Update Salary Info</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monthly Salary <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="40000"
                step="1"
                required
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payday (Day of Month) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={payday}
              onChange={(e) => setPayday(e.target.value)}
              placeholder="1"
              min="1"
              max="31"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Enter a day between 1-31</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white py-6 text-base font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? "Updating..." : "Update Salary"}
          </Button>
        </form>
      </div>
    </div>
  )
}
