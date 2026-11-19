from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import date
from decimal import Decimal


class CategoryBreakdownItem(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    color: str
    icon: Optional[str] = None
    total_amount: Decimal
    percentage: float
    transaction_count: int


class MonthlyTrendItem(BaseModel):
    month: str  # e.g. "Jan 2026" or "2026-01"
    income: Decimal
    expenses: Decimal
    savings: Decimal
    net_savings_rate: float


class RecentTransactionItem(BaseModel):
    id: int
    type: str  # 'income' or 'expense'
    title: str
    amount: Decimal
    date: date
    category_name: str
    category_color: str
    category_icon: Optional[str] = None
    payment_method: str


class DashboardSummaryResponse(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    current_balance: Decimal
    total_savings: Decimal
    monthly_spending: Decimal
    monthly_budget_utilization_pct: float
    savings_rate_pct: float
    highest_spending_category: Optional[str] = None
    highest_spending_amount: Decimal = Decimal("0.00")
    recent_transactions: List[RecentTransactionItem]
    income_vs_expense_chart: List[MonthlyTrendItem]
    expense_category_breakdown: List[CategoryBreakdownItem]
    filter_start_date: date
    filter_end_date: date
