export interface User {
  id: number
  email: string
  full_name: string
  currency: string
  monthly_income_target?: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface Category {
  id: number
  user_id?: number | null
  name: string
  type: 'income' | 'expense'
  icon?: string | null
  color?: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Income {
  id: number
  user_id: number
  category_id?: number | null
  title: string
  amount: string
  date: string
  payment_method: string
  description?: string | null
  category?: Category | null
  created_at: string
  updated_at: string
}

export interface IncomeListResponse {
  items: Income[]
  total: number
  page: number
  page_size: number
  total_amount: string
}

export interface Expense {
  id: number
  user_id: number
  category_id?: number | null
  title: string
  amount: string
  date: string
  payment_method: string
  description?: string | null
  notes?: string | null
  category?: Category | null
  created_at: string
  updated_at: string
}

export interface ExpenseListResponse {
  items: Expense[]
  total: number
  page: number
  page_size: number
  total_amount: string
}

export interface BudgetStatusItem {
  id: number
  category_id?: number | null
  category_name: string
  category_color?: string | null
  category_icon?: string | null
  budget_amount: string
  spent_amount: string
  remaining_amount: string
  utilization_percentage: number
  is_overall: boolean
  status: 'normal' | 'warning' | 'exceeded'
  alert_threshold: number
  previous_month_spent?: string | null
  month_over_month_change_pct?: number | null
}

export interface BudgetOverviewResponse {
  month: number
  year: number
  total_budget: string
  total_spent: string
  total_remaining: string
  overall_utilization_pct: number
  is_overall_exceeded: boolean
  is_overall_warning: boolean
  budgets: BudgetStatusItem[]
}

export interface SavingsContribution {
  id: number
  goal_id: number
  user_id: number
  amount: string
  date: string
  notes?: string | null
  created_at: string
}

export interface SavingsGoal {
  id: number
  user_id: number
  name: string
  target_amount: string
  current_amount: string
  target_date: string
  category?: string | null
  notes?: string | null
  status: 'in_progress' | 'completed' | 'paused'
  progress_percentage: number
  remaining_amount: string
  days_remaining: number
  monthly_target_needed: string
  contributions: SavingsContribution[]
  created_at: string
  updated_at: string
}

export interface CategoryBreakdownItem {
  category_id?: number | null
  category_name: string
  color: string
  icon?: string | null
  total_amount: string
  percentage: number
  transaction_count: number
}

export interface MonthlyTrendItem {
  month: string
  income: string
  expenses: string
  savings: string
  net_savings_rate: number
}

export interface RecentTransactionItem {
  id: number
  type: 'income' | 'expense'
  title: string
  amount: string
  date: string
  category_name: string
  category_color: string
  category_icon?: string | null
  payment_method: string
}

export interface DashboardSummaryResponse {
  total_income: string
  total_expenses: string
  current_balance: string
  total_savings: string
  monthly_spending: string
  monthly_budget_utilization_pct: number
  savings_rate_pct: number
  highest_spending_category?: string | null
  highest_spending_amount: string
  recent_transactions: RecentTransactionItem[]
  income_vs_expense_chart: MonthlyTrendItem[]
  expense_category_breakdown: CategoryBreakdownItem[]
  filter_start_date: string
  filter_end_date: string
}

export interface WeeklyPatternItem {
  day_of_week: string
  total_amount: string
  average_amount: string
  percentage: number
}

export interface DailySpendingItem {
  date: string
  day_name: string
  amount: string
}

export interface MonthlyComparisonItem {
  metric: string
  current_period: string
  previous_period: string
  change_amount: string
  change_percentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface AnalyticsOverviewResponse {
  start_date: string
  end_date: string
  total_income: string
  total_expenses: string
  net_savings: string
  savings_rate_pct: number
  average_daily_spending: string
  highest_expense_day?: DailySpendingItem | null
  highest_expense_category?: string | null
  weekly_spending_patterns: WeeklyPatternItem[]
  monthly_trends: MonthlyTrendItem[]
  category_breakdown: CategoryBreakdownItem[]
  comparisons: MonthlyComparisonItem[]
}

export interface InsightItem {
  id: string
  type: 'warning' | 'positive' | 'tip' | 'critical' | 'info'
  category: 'budget' | 'expense' | 'income' | 'savings' | 'general'
  title: string
  message: string
  metric?: string | null
  change_pct?: number | null
  action_suggestion?: string | null
}

export interface InsightsResponse {
  total_insights: number
  health_score: number
  summary_sentence: string
  insights: InsightItem[]
}

export interface CategoryReportDetail {
  category_name: string
  type: 'income' | 'expense'
  total_amount: string
  transaction_count: number
  percentage_of_total: number
  average_transaction: string
}

export interface FinancialPeriodReport {
  period_title: string
  start_date: string
  end_date: string
  total_income: string
  total_expenses: string
  net_savings: string
  savings_rate_pct: number
  budget_allocated?: string | null
  budget_utilization_pct?: number | null
  top_expenses: CategoryReportDetail[]
  top_incomes: CategoryReportDetail[]
  monthly_breakdown: MonthlyTrendItem[]
  total_transactions_count: number
}
