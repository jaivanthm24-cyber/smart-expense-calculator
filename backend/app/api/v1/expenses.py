from typing import Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseListResponse,
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/", response_model=ExpenseListResponse)
def list_expenses(
    search: Optional[str] = Query(None, description="Search by title, description or notes"),
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
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Expense.title.ilike(search_filter))
            | (Expense.description.ilike(search_filter))
            | (Expense.notes.ilike(search_filter))
        )
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)

    total_amount = (
        query.with_entities(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).scalar()
        or Decimal("0.00")
    )
    total_count = query.count()

    order_col = getattr(Expense, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(order_col), desc(Expense.id))
    else:
        query = query.order_by(asc(order_col), asc(Expense.id))

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return ExpenseListResponse(
        items=[ExpenseResponse.model_validate(item) for item in items],
        total=total_count,
        page=page,
        page_size=page_size,
        total_amount=total_amount,
    )


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = Expense(
        user_id=current_user.id,
        category_id=expense_in.category_id,
        title=expense_in.title,
        amount=expense_in.amount,
        date=expense_in.date,
        payment_method=expense_in.payment_method,
        description=expense_in.description,
        notes=expense_in.notes,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense record not found"
        )
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense record not found"
        )

    update_data = expense_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(expense, field, val)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense record not found"
        )

    db.delete(expense)
    db.commit()
    return {"message": "Expense record successfully deleted"}
