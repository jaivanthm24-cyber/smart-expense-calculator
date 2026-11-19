from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class SavingsContributionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    date: date
    notes: Optional[str] = None


class SavingsContributionResponse(BaseModel):
    id: int
    goal_id: int
    user_id: int
    amount: Decimal
    date: date
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    target_amount: Decimal = Field(..., gt=0, decimal_places=2)
    current_amount: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    target_date: date
    category: Optional[str] = Field(default="General", max_length=100)
    notes: Optional[str] = None
    status: str = Field(default="in_progress")


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    target_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    current_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    target_date: Optional[date] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    progress_percentage: float
    remaining_amount: Decimal
    days_remaining: int
    monthly_target_needed: Decimal
    contributions: List[SavingsContributionResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
