"use client"

import {
  ChevronRight,
  Check,
  User,
  Lock,
  Bell,
  HelpCircle,
  Shield,
  FileText,
  Smartphone,
  Globe,
  CreditCard,
  Download,
  DollarSign,
  ChevronLeft,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/bottom-nav"
import SalaryModal from "@/components/salary-modal"
import AddTransactionModal from "@/components/add-transaction-modal"
import { useTheme, themeColors, type ThemeColor } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"

export default function SettingsPage() {
  const router = useRouter()
  const { themeColor, setThemeColor } = useTheme()
  const { user, logout } = useAuth()
  const colors = themeColors[themeColor]

  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const colorOptions: { name: string; value: ThemeColor; color: string }[] = [
    { name: "Coral", value: "coral", color: "#FF6B4A" },
    { name: "Purple", value: "purple", color: "#7B68EE" },
    { name: "Blue", value: "blue", color: "#4A9DFF" },
    { name: "Green", value: "green", color: "#4ADE80" },
    { name: "Pink", value: "pink", color: "#FF4A9D" },
  ]

  const handleSalarySuccess = () => {
    // Modal will close automatically
  }

  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <div className="h-full overflow-y-auto pb-[72px]">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-sm font-semibold text-gray-900">Settings</h1>
            </div>
          </div>

          <div className="p-4 space-y-5">
            <div>
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Theme Color</h2>
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setThemeColor(option.value)}
                      className="flex flex-col items-center gap-1 flex-1 min-w-0"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: option.color }}
                      >
                        {themeColor === option.value && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-[8px] text-gray-500 font-medium truncate w-full text-center">
                        {option.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Account</h2>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {[
                  { label: "Profile Settings", icon: User, onClick: () => {} },
                  {
                    label: "Salary Info",
                    icon: DollarSign,
                    onClick: () => setShowSalaryModal(true),
                    subtitle: user?.monthlySalary ? `₹${user.monthlySalary.toLocaleString("en-IN")}` : undefined,
                  },
                  { label: "Security & Password", icon: Lock, onClick: () => {} },
                  { label: "Notifications", icon: Bell, onClick: () => {} },
                  { label: "Payment Methods", icon: CreditCard, onClick: () => {} },
                ].map((item, index, arr) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                      index !== arr.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <item.icon className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-900">{item.label}</p>
                        {item.subtitle && <p className="text-[10px] text-gray-500">{item.subtitle}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Preferences</h2>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {[
                  { label: "Language", icon: Globe, value: "English" },
                  { label: "Currency", icon: CreditCard, value: "INR (₹)" },
                  { label: "App Version", icon: Smartphone, value: "2.1.0" },
                ].map((item, index, arr) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                      index !== arr.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <item.icon className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500">{item.value}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                Support & Legal
              </h2>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {[
                  { label: "Help & Support", icon: HelpCircle },
                  { label: "Privacy Policy", icon: Shield },
                  { label: "Terms of Service", icon: FileText },
                  { label: "Export Data", icon: Download },
                ].map((item, index, arr) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                      index !== arr.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <item.icon className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={logout}
              style={{ backgroundColor: colors.primary }}
              className="w-full py-3 rounded-2xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>

          <SalaryModal
            isOpen={showSalaryModal}
            onClose={() => setShowSalaryModal(false)}
            onSuccess={handleSalarySuccess}
          />

          <AddTransactionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => {}} />
        </div>
      </div>

      <BottomNav onAddClick={() => setShowAddModal(true)} />
    </main>
  )
}
