"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { ChevronLeft, Filter, X } from 'lucide-react'
import BottomNav from "@/components/bottom-nav"
import AddTransactionModal from "@/components/add-transaction-modal"
import EditTransactionModal from "@/components/edit-transaction-modal"
import Loader from "@/components/loader"
import { useTheme, themeColors } from "@/contexts/theme-context"
import { transactionAPI, categoriesAPI } from "@/lib/api"

export default function TransactionsPage() {
  const router = useRouter()
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]

  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter states
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterPayment, setFilterPayment] = useState<string>("")
  const [filterMonth, setFilterMonth] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [filterType, filterCategory, filterPayment, filterMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [categoriesRes, transactionsRes] = await Promise.all([
        categoriesAPI.list(),
        transactionAPI.list({
          ...(filterCategory && { category: filterCategory }),
          ...(filterPayment && { paymentMethod: filterPayment }),
          ...(filterMonth && {
            year: parseInt(filterMonth.split("-")[0]),
            month: parseInt(filterMonth.split("-")[1]),
          }),
        }),
      ])

      setCategories(categoriesRes)
      let filtered = transactionsRes.transactions
      
      if (filterType !== "all") {
        filtered = filtered.filter((t) => t.type === filterType)
      }
      
      setTransactions(filtered)
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowEditModal(true)
  }

  const handleSuccess = () => {
    fetchData()
  }

  const clearFilters = () => {
    setFilterType("all")
    setFilterCategory("")
    setFilterPayment("")
    setFilterMonth("")
  }

  const activeFiltersCount = [filterType !== "all", filterCategory, filterPayment, filterMonth].filter(Boolean).length

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return <Loader />
  }

  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <div className="h-full overflow-y-auto pb-[72px]">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-base font-semibold text-gray-900">All Transactions</h1>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-700" />
                {activeFiltersCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
                {/* Type Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                  <div className="flex gap-2">
                    {["all", "income", "expense"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all capitalize ${
                          filterType === type
                            ? "text-white shadow-sm"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                        style={filterType === type ? { backgroundColor: colors.primary } : {}}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment Method</label>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="">All Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Month Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Month</label>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="p-4 space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No transactions found</p>
                <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              transactions.map((transaction) => {
                const category = categories.find((c) => c._id === transaction.categoryId)
                return (
                  <button
                    key={transaction._id}
                    onClick={() => handleTransactionClick(transaction)}
                    className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 ${
                          transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                        } rounded-xl flex items-center justify-center`}
                      >
                        {transaction.type === "income" ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                          </svg>
                        ) : category ? (
                          <span className="text-base">{category.icon}</span>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 13l-5 5m0 0l-5-5m5 5V6"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-900">
                          {transaction.note || category?.name || (transaction.type === "income" ? "Income" : "Expense")}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-400">{formatDate(transaction.date)}</p>
                          {transaction.paymentMethod && (
                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {transaction.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p
                      className={`text-xs font-bold ${
                        transaction.type === "income" ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      <BottomNav onAddClick={() => setShowAddModal(true)} />

      <AddTransactionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} />

      {selectedTransaction && (
        <EditTransactionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedTransaction(null)
          }}
          transaction={selectedTransaction}
          onSuccess={handleSuccess}
        />
      )}
    </main>
  )
}
