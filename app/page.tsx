"use client"
import { Search } from 'lucide-react'
import { useState, useEffect } from "react"
import BottomNav from "@/components/bottom-nav"
import AddTransactionModal from "@/components/add-transaction-modal"
import Loader from "@/components/loader"
import { useTheme, themeColors } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"
import { dashboardAPI, transactionAPI } from "@/lib/api"

export default function Home() {
  const { themeColor } = useTheme()
  const { user } = useAuth()
  const colors = themeColors[themeColor]

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [dashboard, transactionsRes] = await Promise.all([dashboardAPI.get(), transactionAPI.list({ limit: 6 })])
      setDashboardData(dashboard)
      setTransactions(transactionsRes.transactions)
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionSuccess = () => {
    fetchData()
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return <Loader />
  }

  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <div className="h-full overflow-y-auto pb-[72px]">
        <div className="max-w-md mx-auto w-full p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-xs">Hello,</p>
              <h1 className="text-lg font-semibold text-gray-900">{user?.name || "Aftab"}</h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div
            className={`relative rounded-3xl bg-gradient-to-br ${colors.cardGradient} p-5 mb-4 overflow-hidden shadow-2xl`}
            style={{
              boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)",
              transform: "perspective(1000px) rotateX(2deg)",
              aspectRatio: "1.586/1",
              maxWidth: "100%",
            }}
          >
            <div className="relative z-10 h-full flex flex-col py-1 gap-6 ">
              <div className='h-1/2 max-h-1/2'>
                <p className="text-white/70 text-xs mb-1">
                  {dashboardData?.monthlyBudgetApplied === "custom" ? "Custom Budget" : "Total Available"}
                </p>
                <h2 className="text-white text-2xl font-bold">{formatCurrency(dashboardData?.totalAvailable || 0)}</h2>
                <div className="mt-2 flex items-center gap-2 text-white/80 text-[10px]">
                  <span>Salary: {formatCurrency(dashboardData?.baseSalary || 0)}</span>
                  {dashboardData?.totalIncome > 0 && (
                    <span className="text-green-300">+ Income: {formatCurrency(dashboardData.totalIncome)}</span>
                  )}
                </div>
              </div>

              <div className="flex h-1/2 max-h-1/2 justify-between pr-1 ">
                <div className="flex-1 min-w-0 min-h-1/2">
                  <div className="flex gap-3 text-white/60 text-[10px] font-mono mb-2">
                    <span>2654</span>
                    <span>7545</span>
                    <span>3807</span>
                    <span>1965</span>
                  </div>
                  <p className="text-white text-sm font-medium tracking-wide truncate pr-2">
                    {user?.name?.toUpperCase() || "AFTAB"}
                  </p>
                </div>
                <div className="flex -space-x-2 flex-shrink-0 min-h-1/2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 shadow-lg" />
                </div>
              </div>

            </div>

            {/* <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" /> */}
          </div>

          {dashboardData && (
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Spent this month</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(dashboardData.totalSpent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-bold" style={{ color: colors.primary }}>
                    {formatCurrency(dashboardData.remaining)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${100 - dashboardData.percentRemaining}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {dashboardData.percentRemaining.toFixed(1)}% left
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900 font-semibold text-xs">Recent Transactions</h3>
              <button className="text-xs text-gray-500 font-medium">View All</button>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-gray-500 text-sm">No transactions yet</div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction._id} className="bg-white rounded-2xl p-3.5 flex items-center justify-between">
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
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {transaction.note || (transaction.type === "income" ? "Income" : "Expense")}
                        </p>
                        <p className="text-[10px] text-gray-400">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <p
                      className={`text-xs font-bold ${transaction.type === "income" ? "text-green-600" : "text-gray-900"}`}
                    >
                      {transaction.type === "income" ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transaction modal */}
          <AddTransactionModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleTransactionSuccess}
          />
        </div>
      </div>

      <BottomNav onAddClick={() => setShowAddModal(true)} />
    </main>
  )
}
