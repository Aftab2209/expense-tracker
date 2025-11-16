"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Plus } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { transactionAPI, categoriesAPI, type ExpenseTransaction, type IncomeTransaction } from "@/lib/api"
import { useTheme, themeColors } from "@/contexts/theme-context"

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]

  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [note, setNote] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Other">("UPI")
  const [mood, setMood] = useState<"Worth it" | "Regret" | "Neutral">("Neutral")
  const [tags, setTags] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.list()
      setCategories(data)
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("Please enter a category name")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await categoriesAPI.create(newCategoryName, newCategoryIcon || "📁")
      await fetchCategories()
      setCategoryId(result._id)
      setShowAddCategory(false)
      setNewCategoryName("")
      setNewCategoryIcon("")
    } catch (err: any) {
      setError(err.message || "Failed to create category")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (type === "expense" && !categoryId) {
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

      let transaction: ExpenseTransaction | IncomeTransaction

      if (type === "expense") {
        transaction = {
          type: "expense",
          amount: Number.parseFloat(amount),
          categoryId,
          note: note || undefined,
          date: new Date(date).toISOString(),
          paymentMethod,
          mood,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        }
      } else {
        transaction = {
          type: "income",
          amount: Number.parseFloat(amount),
          note: note || undefined,
          date: new Date(date).toISOString(),
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        }
      }

      await transactionAPI.add(transaction)

      setAmount("")
      setNote("")
      setTags("")
      setCategoryId("")
      setDate(new Date().toISOString().slice(0, 16))

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-100 flex items-end md:items-center justify-center transition-opacity duration-300"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-base font-semibold text-gray-900">Add Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-6">
          <div className="space-y-4">
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === "expense" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === "income" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Income
              </button>
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
            {type === "expense" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                
                {!showAddCategory ? (
                  <>
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
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium hover:underline"
                      style={{ color: colors.primary }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Category
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Icon (Emoji)</label>
                      <Input
                        type="text"
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        placeholder="📁 (optional)"
                        maxLength={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Category Name</label>
                      <Input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Groceries, Entertainment"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={loading}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {loading ? "Adding..." : "Add Category"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategory(false)
                          setNewCategoryName("")
                          setNewCategoryIcon("")
                        }}
                        className="flex-1 py-2 px-3 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Note</label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={type === "expense" ? "Dinner with friends" : "Freelance work"}
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
            {type === "expense" && (
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
            {type === "expense" && (
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
            {loading ? "Saving..." : "Save Transaction"}
          </button>
        </div>
      </form>
    </div>
  )
}
