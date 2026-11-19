from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetOverviewResponse, BudgetResponse
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("/", response_model=BudgetOverviewResponse)
def get_budgets_overview(
    month: int = Query(default=None, ge=1, le=12),
    year: int = Query(default=None, ge=2000, le=2100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    return BudgetService.get_budgets_for_month(
        db=db, user_id=current_user.id, month=target_month, year=target_year
    )


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = BudgetService.create_or_update_budget(
        db=db, user_id=current_user.id, budget_in=budget_in
    )
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_200_OK)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = BudgetService.delete_budget(db=db, user_id=current_user.id, budget_id=budget_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return {"message": "Budget successfully deleted"}
