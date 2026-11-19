from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.schemas.dashboard import CategoryBreakdownItem, MonthlyTrendItem


class CategoryReportDetail(BaseModel):
    category_name: str
    type: str  # income or expense
    total_amount: Decimal
    transaction_count: int
    percentage_of_total: float
    average_transaction: Decimal


class FinancialPeriodReport(BaseModel):
    period_title: str
    start_date: date
    end_date: date
    total_income: Decimal
    total_expenses: Decimal
    net_savings: Decimal
    savings_rate_pct: float
    budget_allocated: Optional[Decimal] = None
    budget_utilization_pct: Optional[float] = None
    top_expenses: List[CategoryReportDetail]
    top_incomes: List[CategoryReportDetail]
    monthly_breakdown: List[MonthlyTrendItem]
    total_transactions_count: int
