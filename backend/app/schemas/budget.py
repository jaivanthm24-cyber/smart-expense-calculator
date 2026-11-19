from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.category import CategoryResponse


class BudgetBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    category_id: Optional[int] = None  # None indicates overall monthly budget
    alert_threshold: int = Field(default=80, ge=10, le=100)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    alert_threshold: Optional[int] = Field(None, ge=10, le=100)


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    category: Optional[CategoryResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetStatusItem(BaseModel):
    id: int
    category_id: Optional[int] = None
    category_name: str
    category_color: Optional[str] = None
    category_icon: Optional[str] = None
    budget_amount: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    utilization_percentage: float
    is_overall: bool
    status: str  # 'normal', 'warning', 'exceeded'
    alert_threshold: int
    previous_month_spent: Optional[Decimal] = None
    month_over_month_change_pct: Optional[float] = None


class BudgetOverviewResponse(BaseModel):
    month: int
    year: int
    total_budget: Decimal
    total_spent: Decimal
    total_remaining: Decimal
    overall_utilization_pct: float
    is_overall_exceeded: bool
    is_overall_warning: bool
    budgets: List[BudgetStatusItem]
