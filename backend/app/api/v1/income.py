from typing import Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.income import Income
from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
    IncomeResponse,
    IncomeListResponse,
)

router = APIRouter(prefix="/income", tags=["Income"])


@router.get("/", response_model=IncomeListResponse)
def list_incomes(
    search: Optional[str] = Query(None, description="Search by title or description"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    sort_by: str = Query("date", pattern="^(date|amount|title)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Income).filter(Income.user_id == current_user.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Income.title.ilike(search_filter)) | (Income.description.ilike(search_filter))
        )
    if category_id:
        query = query.filter(Income.category_id == category_id)
    if start_date:
        query = query.filter(Income.date >= start_date)
    if end_date:
        query = query.filter(Income.date <= end_date)
    if payment_method:
        query = query.filter(Income.payment_method == payment_method)

    total_amount = (
        query.with_entities(func.coalesce(func.sum(Income.amount), Decimal("0.00"))).scalar()
        or Decimal("0.00")
    )
    total_count = query.count()

    order_col = getattr(Income, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(order_col), desc(Income.id))
    else:
        query = query.order_by(asc(order_col), asc(Income.id))

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return IncomeListResponse(
        items=[IncomeResponse.model_validate(item) for item in items],
        total=total_count,
        page=page,
        page_size=page_size,
        total_amount=total_amount,
    )


@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income_in: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = Income(
        user_id=current_user.id,
        category_id=income_in.category_id,
        title=income_in.title,
        amount=income_in.amount,
        date=income_in.date,
        payment_method=income_in.payment_method,
        description=income_in.description,
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = (
        db.query(Income)
        .filter(Income.id == income_id, Income.user_id == current_user.id)
        .first()
    )
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income entry not found")
    return income


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income_in: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = (
        db.query(Income)
        .filter(Income.id == income_id, Income.user_id == current_user.id)
        .first()
    )
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income entry not found")

    update_data = income_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(income, field, val)

    db.commit()
    db.refresh(income)
    return income


@router.delete("/{income_id}", status_code=status.HTTP_200_OK)
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = (
        db.query(Income)
        .filter(Income.id == income_id, Income.user_id == current_user.id)
        .first()
    )
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income entry not found")

    db.delete(income)
    db.commit()
    return {"message": "Income entry successfully deleted"}
