from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.savings import SavingsGoal, SavingsContribution
from app.schemas.savings import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    SavingsContributionCreate,
    SavingsContributionResponse,
)


class SavingsService:
    @staticmethod
    def _enrich_goal(goal: SavingsGoal) -> SavingsGoalResponse:
        progress = (
            float(goal.current_amount) / float(goal.target_amount) * 100.0
            if goal.target_amount > 0
            else 0.0
        )
        remaining = max(Decimal("0.00"), goal.target_amount - goal.current_amount)

        today = date.today()
        days_rem = (goal.target_date - today).days

        # Calculate monthly target needed
        if remaining <= 0 or days_rem <= 0:
            monthly_needed = Decimal("0.00")
        else:
            months = max(1.0, days_rem / 30.44)
            monthly_needed = round(remaining / Decimal(str(months)), 2)

        contributions_resp = [
            SavingsContributionResponse.model_validate(c) for c in goal.contributions
        ]

        return SavingsGoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            target_date=goal.target_date,
            category=goal.category,
            notes=goal.notes,
            status=goal.status,
            progress_percentage=round(min(100.0, max(0.0, progress)), 1),
            remaining_amount=remaining,
            days_remaining=days_rem,
            monthly_target_needed=monthly_needed,
            contributions=contributions_resp,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
        )

    @staticmethod
    def list_goals(db: Session, user_id: int) -> List[SavingsGoalResponse]:
        goals = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.user_id == user_id)
            .order_by(SavingsGoal.created_at.desc())
            .all()
        )
        return [SavingsService._enrich_goal(g) for g in goals]

    @staticmethod
    def create_goal(
        db: Session, user_id: int, goal_in: SavingsGoalCreate
    ) -> SavingsGoalResponse:
        goal = SavingsGoal(
            user_id=user_id,
            name=goal_in.name,
            target_amount=goal_in.target_amount,
            current_amount=goal_in.current_amount,
            target_date=goal_in.target_date,
            category=goal_in.category or "General",
            notes=goal_in.notes,
            status=goal_in.status or "in_progress",
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return SavingsService._enrich_goal(goal)

    @staticmethod
    def update_goal(
        db: Session, user_id: int, goal_id: int, goal_in: SavingsGoalUpdate
    ) -> SavingsGoalResponse:
        goal = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found"
            )

        update_data = goal_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)

        if goal.current_amount >= goal.target_amount and goal.status == "in_progress":
            goal.status = "completed"

        db.commit()
        db.refresh(goal)
        return SavingsService._enrich_goal(goal)

    @staticmethod
    def delete_goal(db: Session, user_id: int, goal_id: int) -> bool:
        goal = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
            .first()
        )
        if not goal:
            return False
        db.delete(goal)
        db.commit()
        return True

    @staticmethod
    def add_contribution(
        db: Session, user_id: int, goal_id: int, contrib_in: SavingsContributionCreate
    ) -> SavingsGoalResponse:
        goal = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
            .first()
        )
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found"
            )

        contribution = SavingsContribution(
            goal_id=goal.id,
            user_id=user_id,
            amount=contrib_in.amount,
            date=contrib_in.date,
            notes=contrib_in.notes,
        )
        db.add(contribution)

        # Update current amount
        goal.current_amount += contrib_in.amount
        if goal.current_amount >= goal.target_amount:
            goal.status = "completed"

        db.commit()
        db.refresh(goal)
        return SavingsService._enrich_goal(goal)
