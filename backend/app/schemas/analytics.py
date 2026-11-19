from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.schemas.dashboard import CategoryBreakdownItem, MonthlyTrendItem


class DailySpendingItem(BaseModel):
    date: date
    day_name: str
    amount: Decimal


class WeeklyPatternItem(BaseModel):
    day_of_week: str  # Monday, Tuesday, etc.
    total_amount: Decimal
    average_amount: Decimal
    percentage: float


class MonthlyComparisonItem(BaseModel):
    metric: str
    current_period: Decimal
    previous_period: Decimal
    change_amount: Decimal
    change_percentage: float
    trend: str  # 'up', 'down', 'stable'


class AnalyticsOverviewResponse(BaseModel):
    start_date: date
    end_date: date
    total_income: Decimal
    total_expenses: Decimal
    net_savings: Decimal
    savings_rate_pct: float
    average_daily_spending: Decimal
    highest_expense_day: Optional[DailySpendingItem] = None
    highest_expense_category: Optional[str] = None
    weekly_spending_patterns: List[WeeklyPatternItem]
    monthly_trends: List[MonthlyTrendItem]
    category_breakdown: List[CategoryBreakdownItem]
    comparisons: List[MonthlyComparisonItem]
