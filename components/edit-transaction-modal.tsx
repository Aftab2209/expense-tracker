"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Trash2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { transactionAPI, categoriesAPI } from "@/lib/api"
import { useTheme, themeColors } from "@/contexts/theme-context"

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: any
  onSuccess: () => void
}

export default function EditTransactionModal({ isOpen, onClose, transaction, onSuccess }: EditTransactionModalProps) {
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]

  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [note, setNote] = useState("")
  const [date, setDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Other">("UPI")
  const [mood, setMood] = useState<"Worth it" | "Regret" | "Neutral">("Neutral")
  const [tags, setTags] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && transaction) {
      setAmount(transaction.amount?.toString() || "")
      setCategoryId(transaction.categoryId || "")
      setNote(transaction.note || "")
      setDate(transaction.date ? new Date(transaction.date).toISOString().slice(0, 16) : "")
      setPaymentMethod(transaction.paymentMethod || "UPI")
      setMood(transaction.mood || "Neutral")
      setTags(transaction.tags?.join(", ") || "")
      fetchCategories()
    }
  }, [isOpen, transaction])

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.list()
      setCategories(data)
    } catch (err) {
      console.error("[v0] Error fetching categories:", err)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (transaction.type === "expense" && !categoryId) {
      setError("Please select a category")
      return
    }

    setLoading(true)

    try {
      const tagsArray = tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      const updateData: any = {
        type: transaction.type,
        amount: Number.parseFloat(amount),
        note: note || undefined,
        date: new Date(date).toISOString(),
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      }

      if (transaction.type === "expense") {
        updateData.categoryId = categoryId
        updateData.paymentMethod = paymentMethod
        updateData.mood = mood
      }

      await transactionAPI.update(transaction._id, updateData)

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update transaction")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    setError("")

    try {
      await transactionAPI.delete(transaction._id)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !transaction) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center transition-opacity duration-300"
      onClick={onClose}
    >
      <form
        onSubmit={handleUpdate}
        className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-base font-semibold text-gray-900">Edit Transaction</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-6">
          <div className="space-y-4">
            {/* Type Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  transaction.type === "income"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {transaction.type === "income" ? "Income" : "Expense"}
              </span>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all"
                  style={{ fontSize: '16px' }}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>

            {/* Category (Expense only) */}
            {transaction.type === "expense" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
                  style={{
                    fontSize: '16px',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.25em 1.25em",
                    paddingRight: "2.5rem",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Note</label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all"
                style={{ fontSize: '16px' }}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Date & Time</label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all"
                style={{ fontSize: '16px' }}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Payment Method (Expense only) */}
            {transaction.type === "expense" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Cash", "UPI", "Card", "Other"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
                        paymentMethod === method
                          ? "text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={paymentMethod === method ? { backgroundColor: colors.primary } : {}}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mood (Expense only) */}
            {transaction.type === "expense" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Mood</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Worth it", "Regret", "Neutral"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
                        mood === m ? "text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={mood === m ? { backgroundColor: colors.primary } : {}}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Tags</label>
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dinner, friends, celebration"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all"
                style={{ fontSize: '16px' }}
                onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <p className="mt-1.5 text-[11px] text-gray-500">Separate tags with commas</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl">{error}</div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3.5 rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 4px 12px ${colors.primary}40`,
            }}
          >
            {loading ? "Updating..." : "Update Transaction"}
          </button>
        </div>
      </form>
    </div>
  )
}
