from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from app.schemas.category import CategoryResponse


class IncomeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    date: date
    payment_method: str = Field(default="Bank Transfer", max_length=50)
    description: Optional[str] = None
    category_id: Optional[int] = None


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    date: Optional[date] = None
    payment_method: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    category_id: Optional[int] = None


class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    category: Optional[CategoryResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncomeListResponse(BaseModel):
    items: List[IncomeResponse]
    total: int
    page: int
    page_size: int
    total_amount: Decimal
