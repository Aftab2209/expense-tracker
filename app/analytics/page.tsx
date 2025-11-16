"use client"

import { useState, useEffect } from "react"
import { useTheme, themeColors } from "@/contexts/theme-context"
import BottomNav from "@/components/bottom-nav"
import AddTransactionModal from "@/components/add-transaction-modal"
import Loader from "@/components/loader"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { dashboardAPI, categoriesAPI, transactionAPI } from "@/lib/api"

export default function AnalyticsPage() {
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const router = useRouter()

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboard = await dashboardAPI.get()
        setDashboardData(dashboard)

        const transactions = await transactionAPI.list({
          year: dashboard.year,
          month: dashboard.month,
          limit: 1000,
        })

        const categories = await categoriesAPI.list()
        const categoryMap = new Map(categories.map((c: any) => [c._id, c]))

        const categoryTotals: { [key: string]: number } = {}
        transactions.transactions
          .filter((t: any) => t.type === "expense" && t.categoryId)
          .forEach((t: any) => {
            const catId = t.categoryId
            categoryTotals[catId] = (categoryTotals[catId] || 0) + t.amount
          })

        const breakdown = Object.entries(categoryTotals)
          .map(([catId, amount]) => ({
            name: categoryMap.get(catId)?.name || "Unknown",
            amount: amount as number,
            percentage: ((amount as number) / dashboard.totalSpent) * 100,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        const chartColors = ["#2C3E50", "#FF6B4A", "#8B5CF6", "#10B981", "#F59E0B"]
        const breakdownWithColors = breakdown.map((item, index) => ({
          ...item,
          color: chartColors[index] || "#6B7280",
        }))

        setCategoryBreakdown(breakdownWithColors)
      } catch (error) {
        console.error("[v0] Error fetching analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`

  const handleTransactionSuccess = () => {
    const fetchData = async () => {
      try {
        const dashboard = await dashboardAPI.get()
        setDashboardData(dashboard)

        const transactions = await transactionAPI.list({
          year: dashboard.year,
          month: dashboard.month,
          limit: 1000,
        })

        const categories = await categoriesAPI.list()
        const categoryMap = new Map(categories.map((c: any) => [c._id, c]))

        const categoryTotals: { [key: string]: number } = {}
        transactions.transactions
          .filter((t: any) => t.type === "expense" && t.categoryId)
          .forEach((t: any) => {
            const catId = t.categoryId
            categoryTotals[catId] = (categoryTotals[catId] || 0) + t.amount
          })

        const breakdown = Object.entries(categoryTotals)
          .map(([catId, amount]) => ({
            name: categoryMap.get(catId)?.name || "Unknown",
            amount: amount as number,
            percentage: ((amount as number) / dashboard.totalSpent) * 100,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        const chartColors = ["#2C3E50", "#FF6B4A", "#8B5CF6", "#10B981", "#F59E0B"]
        const breakdownWithColors = breakdown.map((item, index) => ({
          ...item,
          color: chartColors[index] || "#6B7280",
        }))

        setCategoryBreakdown(breakdownWithColors)
      } catch (error) {
        console.error("[v0] Error fetching analytics data:", error)
      }
    }
    fetchData()
  }

  if (loading) {
    return <Loader />
  }

  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <div className="h-full overflow-y-auto pb-[72px]">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-left font-semibold text-gray-900 text-sm">Analytics</h1>
            </div>
          </div>

          <div className="px-4 pt-4">
            {dashboardData && (
              <div className="mb-4">
                <p className="text-gray-600 text-xs mb-3">
                  You have Spent{" "}
                  <span className="font-semibold" style={{ color: colors.primary }}>
                    {formatCurrency(dashboardData.totalSpent)}
                  </span>{" "}
                  <span className="text-[10px] text-gray-400">
                    {new Date(dashboardData.year, dashboardData.month - 1).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <div className="space-y-2">
                  <div className="h-7 rounded-full overflow-hidden" style={{ backgroundColor: colors.primary }}>
                    <div className="h-full flex items-center justify-between px-3 text-white text-xs font-medium">
                      <span>{(100 - dashboardData.percentRemaining).toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="h-7 bg-gray-200 rounded-full flex items-center justify-end px-3">
                    <span className="text-xs font-medium text-gray-700">
                      {dashboardData.percentRemaining.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-900">Expense Breakdown</h2>
              </div>

              {categoryBreakdown.length > 0 ? (
                <div className="bg-white rounded-2xl p-4">
                  <div className="h-56 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={activeIndex !== undefined ? 98 : 90}
                          paddingAngle={3}
                          dataKey="amount"
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(undefined)}
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              style={{
                                filter: activeIndex === index ? "brightness(1.1)" : "none",
                                transition: "all 0.3s ease",
                              }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {categoryBreakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(undefined)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full transition-transform"
                            style={{
                              backgroundColor: item.color,
                              transform: activeIndex === index ? "scale(1.3)" : "scale(1)",
                            }}
                          />
                          <span className="text-xs text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-900">{item.percentage.toFixed(1)}%</div>
                          <div className="text-[10px] text-gray-500">{formatCurrency(item.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-xs">No expense data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTransactionSuccess}
      />

      <BottomNav onAddClick={() => setShowAddModal(true)} />
    </main>
  )
}
