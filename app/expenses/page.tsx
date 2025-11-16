"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme, themeColors } from "@/contexts/theme-context"
import BottomNav from "@/components/bottom-nav"
import AddTransactionModal from "@/components/add-transaction-modal"
import Loader from "@/components/loader"
import { useRouter } from 'next/navigation'
import { reportsAPI } from "@/lib/api"

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay()
}

export default function ExpensesPage() {
  const { themeColor } = useTheme()
  const colors = themeColors[themeColor]
  const router = useRouter()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().getDate())
  const [dailyData, setDailyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const daysOfWeek = ["Su", "M", "T", "W", "T", "F", "S"]

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = getFirstDayOfMonth(month, year)

  useEffect(() => {
    const fetchDailyData = async () => {
      setLoading(true)
      try {
        const data = await reportsAPI.daily(year, month + 1) // month is 1-indexed in API
        setDailyData(data)
      } catch (error) {
        console.error("[v0] Error fetching daily data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDailyData()
  }, [year, month])

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(1)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(1)
  }

  const handleDateClick = (day: number) => {
    setSelectedDate(day)
  }

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const selectedDayData = dailyData?.days?.find((d: any) => d.day === selectedDate)
  const selectedDayExpenses = selectedDayData?.transactions || []

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

  const getCategoryIcon = (type: string) => {
    return type === "income" ? "��" : "💸"
  }

  const handleTransactionSuccess = () => {
    const fetchDailyData = async () => {
      setLoading(true)
      try {
        const data = await reportsAPI.daily(year, month + 1)
        setDailyData(data)
      } catch (error) {
        console.error("[v0] Error fetching daily data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDailyData()
  }

  if (loading && !dailyData) {
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
              <h1 className="text-left font-semibold text-gray-900 text-sm">Expenses</h1>
            </div>
          </div>

          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <button className="p-1" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="font-medium text-gray-900 text-sm">{monthName}</span>
              <button className="p-1" onClick={handleNextMonth}>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-3 mb-4">
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {daysOfWeek.map((day, i) => (
                  <div key={i} className="text-center text-[10px] text-gray-400 font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, i) => (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {day && (
                      <button
                        onClick={() => handleDateClick(day)}
                        className={`w-full h-full rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                          day === selectedDate ? "text-white shadow-lg scale-105" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={day === selectedDate ? { backgroundColor: colors.primary } : {}}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-[240px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-900">
                  Expenses for {monthName.split(" ")[0]} {selectedDate}
                </h2>
                {selectedDayData && (
                  <div className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {formatCurrency(selectedDayData.totalSpent)}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="bg-white rounded-xl p-6 text-center">
                  <p className="text-gray-400 text-xs">Loading...</p>
                </div>
              ) : selectedDayExpenses.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDayExpenses.map((transaction: any) => (
                    <div key={transaction._id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${
                            transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                          } flex items-center justify-center text-xl`}
                        >
                          {getCategoryIcon(transaction.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-xs">
                            {transaction.note || (transaction.type === "income" ? "Income" : "Expense")}
                          </h3>
                          <p className="text-[10px] text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold text-xs ${transaction.type === "income" ? "text-green-600" : ""}`}
                          style={transaction.type === "expense" ? { color: colors.primary } : {}}
                        >
                          {transaction.type === "income" ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 text-center">
                  <p className="text-gray-400 text-xs">No transactions recorded for this day</p>
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
