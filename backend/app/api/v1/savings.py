from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.savings import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    SavingsContributionCreate,
)
from app.services.savings_service import SavingsService

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])


@router.get("/", response_model=List[SavingsGoalResponse])
def list_savings_goals(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return SavingsService.list_goals(db=db, user_id=current_user.id)


@router.post("/", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    goal_in: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SavingsService.create_goal(db=db, user_id=current_user.id, goal_in=goal_in)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SavingsService.update_goal(
        db=db, user_id=current_user.id, goal_id=goal_id, goal_in=goal_in
    )


@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = SavingsService.delete_goal(db=db, user_id=current_user.id, goal_id=goal_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found"
        )
    return {"message": "Savings goal successfully deleted"}


@router.post("/{goal_id}/contributions", response_model=SavingsGoalResponse)
def add_savings_contribution(
    goal_id: int,
    contrib_in: SavingsContributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SavingsService.add_contribution(
        db=db, user_id=current_user.id, goal_id=goal_id, contrib_in=contrib_in
    )
