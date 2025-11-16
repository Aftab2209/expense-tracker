// API utility functions with authentication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "APIError"
  }
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Token expired or invalid
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    throw new APIError(401, "Session expired. Please login again.")
  }

  const data = await response.json()

  if (!response.ok) {
    throw new APIError(response.status, data.message || "An error occurred")
  }

  return data
}

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse<{
      message: string
      token: string
      user: {
        _id: string
        email: string
        name: string
        monthlySalary: number
        payday?: number
      }
    }>(response)
  },
}

// Dashboard API
export const dashboardAPI = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<{
      year: number
      month: number
      baseSalary: number
      totalIncome: number
      appliedBudget: number
      totalAvailable: number
      totalSpent: number
      remaining: number
      percentRemaining: number
      monthlyBudgetApplied: string
    }>(response)
  },
}

// Categories API
export const categoriesAPI = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<
      Array<{
        _id: string
        userId: string | null
        name: string
        icon: string
      }>
    >(response)
  },

  create: async (name: string, icon: string) => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, icon }),
    })
    return handleResponse<{ success: boolean; _id: string }>(response)
  },

  update: async (id: string, name: string, icon: string) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, icon }),
    })
    return handleResponse<{ success: boolean }>(response)
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse<{ success: boolean }>(response)
  },
}

// Transaction API
export type TransactionType = "income" | "expense"

export interface ExpenseTransaction {
  type: "expense"
  amount: number
  categoryId: string
  note?: string
  date: string
  paymentMethod?: "Cash" | "UPI" | "Card" | "Other"
  mood?: "Worth it" | "Regret" | "Neutral"
  tags?: string[]
}

export interface IncomeTransaction {
  type: "income"
  amount: number
  note?: string
  date: string
  tags?: string[]
}

export const transactionAPI = {
  add: async (transaction: ExpenseTransaction | IncomeTransaction) => {
    const response = await fetch(`${API_BASE_URL}/api/transaction`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction),
    })
    return handleResponse<{ success: boolean; type: string; _id: string }>(response)
  },

  list: async (params?: {
    year?: number
    month?: number
    limit?: number
    skip?: number
    category?: string
    paymentMethod?: string
    tags?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }

    const response = await fetch(`${API_BASE_URL}/api/transaction?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<{
      total: number
      count: number
      transactions: Array<{
        _id: string
        type: "income" | "expense"
        amount: number
        categoryId?: string
        note?: string
        date: string
        paymentMethod?: string
        mood?: string
        tags?: string[]
      }>
    }>(response)
  },
}

// Reports API
export const reportsAPI = {
  monthly: async (year: number) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/monthly?year=${year}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<{
      year: number
      months: Array<{
        year: number
        month: number
        totalSpent: number
        totalIncome: number
        net: number
        appliedBase: number
      }>
    }>(response)
  },

  daily: async (year: number, month: number) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/daily?year=${year}&month=${month}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<{
      year: number
      month: number
      days: Array<{
        day: number
        date: string
        totalSpent: number
        totalIncome: number
        transactions: Array<{
          _id: string
          type: "income" | "expense"
          amount: number
          categoryId?: string
          note?: string
          date: string
        }>
      }>
    }>(response)
  },
}

// Budget API
export const budgetAPI = {
  get: async (year: number, month: number) => {
    const response = await fetch(`${API_BASE_URL}/api/budgets?year=${year}&month=${month}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse<
      | {
          _id?: string
          year: number
          month: number
          totalBudgetLimit: number
        }
      | {}
    >(response)
  },

  create: async (year: number, month: number, totalBudgetLimit: number) => {
    const response = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ year, month, totalBudgetLimit }),
    })
    return handleResponse<{ success: boolean }>(response)
  },
}

// User API
export const userAPI = {
  updateSalary: async (monthlySalary: number, payday: number) => {
    const response = await fetch(`${API_BASE_URL}/api/user/salary`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ monthlySalary, payday }),
    })
    return handleResponse<{
      success: boolean
      user: {
        _id: string
        email: string
        name: string
        monthlySalary: number
        payday: number
      }
    }>(response)
  },
}
