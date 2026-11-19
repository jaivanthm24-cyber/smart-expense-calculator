import { api } from './api'
import {
  Category,
  Income,
  IncomeListResponse,
  Expense,
  ExpenseListResponse,
  BudgetOverviewResponse,
  SavingsGoal,
  DashboardSummaryResponse,
  AnalyticsOverviewResponse,
  InsightsResponse,
  FinancialPeriodReport,
} from '@/types'

export const financeService = {
  // Categories
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    const res = await api.get('/categories/', { params: { type } })
    return res.data
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await api.post('/categories/', data)
    return res.data
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`)
  },

  // Income
  async getIncomes(params?: {
    search?: string
    category_id?: number
    start_date?: string
    end_date?: string
    payment_method?: string
    sort_by?: string
    sort_order?: string
    page?: number
    page_size?: number
  }): Promise<IncomeListResponse> {
    const res = await api.get('/income/', { params })
    return res.data
  },

  async createIncome(data: {
    title: string
    amount: number | string
    date: string
    payment_method: string
    description?: string
    category_id?: number | null
  }): Promise<Income> {
    const res = await api.post('/income/', data)
    return res.data
  },

  async updateIncome(
    id: number,
    data: Partial<{
      title: string
      amount: number | string
      date: string
      payment_method: string
      description?: string
      category_id?: number | null
    }>
  ): Promise<Income> {
    const res = await api.put(`/income/${id}`, data)
    return res.data
  },

  async deleteIncome(id: number): Promise<void> {
    await api.delete(`/income/${id}`)
  },

  // Expenses
  async getExpenses(params?: {
    search?: string
    category_id?: number
    start_date?: string
    end_date?: string
    payment_method?: string
    sort_by?: string
    sort_order?: string
    page?: number
    page_size?: number
  }): Promise<ExpenseListResponse> {
    const res = await api.get('/expenses/', { params })
    return res.data
  },

  async createExpense(data: {
    title: string
    amount: number | string
    date: string
    payment_method: string
    description?: string
    notes?: string
    category_id?: number | null
  }): Promise<Expense> {
    const res = await api.post('/expenses/', data)
    return res.data
  },

  async updateExpense(
    id: number,
    data: Partial<{
      title: string
      amount: number | string
      date: string
      payment_method: string
      description?: string
      notes?: string
      category_id?: number | null
    }>
  ): Promise<Expense> {
    const res = await api.put(`/expenses/${id}`, data)
    return res.data
  },

  async deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`)
  },

  // Budgets
  async getBudgetsOverview(month?: number, year?: number): Promise<BudgetOverviewResponse> {
    const res = await api.get('/budgets/', { params: { month, year } })
    return res.data
  },

  async setBudget(data: {
    amount: number | string
    month: number
    year: number
    category_id?: number | null
    alert_threshold?: number
  }): Promise<void> {
    await api.post('/budgets/', data)
  },

  async deleteBudget(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`)
  },

  // Savings Goals
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const res = await api.get('/savings-goals/')
    return res.data
  },

  async createSavingsGoal(data: {
    name: string
    target_amount: number | string
    current_amount?: number | string
    target_date: string
    category?: string
    notes?: string
  }): Promise<SavingsGoal> {
    const res = await api.post('/savings-goals/', data)
    return res.data
  },

  async updateSavingsGoal(
    id: number,
    data: Partial<{
      name: string
      target_amount: number | string
      current_amount: number | string
      target_date: string
      category: string
      notes: string
      status: string
    }>
  ): Promise<SavingsGoal> {
    const res = await api.put(`/savings-goals/${id}`, data)
    return res.data
  },

  async deleteSavingsGoal(id: number): Promise<void> {
    await api.delete(`/savings-goals/${id}`)
  },

  async addSavingsContribution(
    goalId: number,
    data: { amount: number | string; date: string; notes?: string }
  ): Promise<SavingsGoal> {
    const res = await api.post(`/savings-goals/${goalId}/contributions`, data)
    return res.data
  },

  // Dashboard
  async getDashboardSummary(
    preset?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardSummaryResponse> {
    const res = await api.get('/dashboard/summary', {
      params: { preset, start_date: startDate, end_date: endDate },
    })
    return res.data
  },

  // Analytics
  async getAnalyticsOverview(
    preset?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsOverviewResponse> {
    const res = await api.get('/analytics/overview', {
      params: { preset, start_date: startDate, end_date: endDate },
    })
    return res.data
  },

  // Insights
  async getInsights(): Promise<InsightsResponse> {
    const res = await api.get('/insights/')
    return res.data
  },

  // Reports
  async getPeriodReport(
    preset?: string,
    startDate?: string,
    endDate?: string
  ): Promise<FinancialPeriodReport> {
    const res = await api.get('/reports/period', {
      params: { preset, start_date: startDate, end_date: endDate },
    })
    return res.data
  },

  async downloadCSV(preset?: string, startDate?: string, endDate?: string, type: string = 'all') {
    const res = await api.get('/reports/export/csv', {
      params: { preset, start_date: startDate, end_date: endDate, type },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `financial_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  async downloadPDF(preset?: string, startDate?: string, endDate?: string) {
    const res = await api.get('/reports/export/pdf', {
      params: { preset, start_date: startDate, end_date: endDate },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `financial_report_${new Date().toISOString().slice(0, 10)}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },
}
