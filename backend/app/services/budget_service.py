from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetStatusItem, BudgetOverviewResponse


class BudgetService:
    @staticmethod
    def get_budgets_for_month(
        db: Session, user_id: int, month: int, year: int
    ) -> BudgetOverviewResponse:
        # Get all budgets set for this month and year
        budgets = (
            db.query(Budget)
            .filter(Budget.user_id == user_id, Budget.month == month, Budget.year == year)
            .all()
        )

        # Get total expenses for the current month
        total_month_spent = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == month,
                extract("year", Expense.date) == year,
            )
            .scalar()
            or Decimal("0.00")
        )

        # Get previous month spending for comparison
        prev_month = 12 if month == 1 else month - 1
        prev_year = year - 1 if month == 1 else year

        total_prev_month_spent = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == prev_month,
                extract("year", Expense.date) == prev_year,
            )
            .scalar()
            or Decimal("0.00")
        )

        # Find overall budget if any
        overall_budget_obj = next((b for b in budgets if b.category_id is None), None)
        total_budget_amount = overall_budget_obj.amount if overall_budget_obj else Decimal("0.00")

        # Category spending map for current month
        cat_expenses_cur = (
            db.query(Expense.category_id, func.sum(Expense.amount).label("spent"))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == month,
                extract("year", Expense.date) == year,
            )
            .group_by(Expense.category_id)
            .all()
        )
        cat_spent_map = {c[0]: c[1] for c in cat_expenses_cur if c[0] is not None}

        # Category spending map for previous month
        cat_expenses_prev = (
            db.query(Expense.category_id, func.sum(Expense.amount).label("spent"))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == prev_month,
                extract("year", Expense.date) == prev_year,
            )
            .group_by(Expense.category_id)
            .all()
        )
        prev_cat_spent_map = {c[0]: c[1] for c in cat_expenses_prev if c[0] is not None}

        budget_items: List[BudgetStatusItem] = []

        # Process each configured budget
        for b in budgets:
            if b.category_id is None:
                # Overall budget
                spent = total_month_spent
                prev_spent = total_prev_month_spent
                name = "Overall Monthly Budget"
                color = "#3b82f6"
                icon = "wallet"
                is_overall = True
            else:
                cat = db.query(Category).filter(Category.id == b.category_id).first()
                spent = cat_spent_map.get(b.category_id, Decimal("0.00"))
                prev_spent = prev_cat_spent_map.get(b.category_id, Decimal("0.00"))
                name = cat.name if cat else f"Category #{b.category_id}"
                color = cat.color if cat and cat.color else "#64748b"
                icon = cat.icon if cat and cat.icon else "tag"
                is_overall = False

            rem = b.amount - spent
            util_pct = (float(spent) / float(b.amount) * 100.0) if b.amount > 0 else 0.0

            if util_pct >= 100.0:
                b_status = "exceeded"
            elif util_pct >= b.alert_threshold:
                b_status = "warning"
            else:
                b_status = "normal"

            # Month-over-month change
            mom_pct = None
            if prev_spent and prev_spent > 0:
                mom_pct = round(((float(spent) - float(prev_spent)) / float(prev_spent)) * 100.0, 1)

            budget_items.append(
                BudgetStatusItem(
                    id=b.id,
                    category_id=b.category_id,
                    category_name=name,
                    category_color=color,
                    category_icon=icon,
                    budget_amount=b.amount,
                    spent_amount=spent,
                    remaining_amount=rem,
                    utilization_percentage=round(util_pct, 1),
                    is_overall=is_overall,
                    status=b_status,
                    alert_threshold=b.alert_threshold,
                    previous_month_spent=prev_spent,
                    month_over_month_change_pct=mom_pct,
                )
            )

        total_rem = (total_budget_amount - total_month_spent) if total_budget_amount > 0 else Decimal("0.00")
        overall_util = (
            (float(total_month_spent) / float(total_budget_amount) * 100.0)
            if total_budget_amount > 0
            else 0.0
        )
        is_exceeded = total_budget_amount > 0 and total_month_spent > total_budget_amount
        threshold = overall_budget_obj.alert_threshold if overall_budget_obj else 80
        is_warning = total_budget_amount > 0 and overall_util >= threshold

        return BudgetOverviewResponse(
            month=month,
            year=year,
            total_budget=total_budget_amount,
            total_spent=total_month_spent,
            total_remaining=total_rem,
            overall_utilization_pct=round(overall_util, 1),
            is_overall_exceeded=is_exceeded,
            is_overall_warning=is_warning,
            budgets=budget_items,
        )

    @staticmethod
    def create_or_update_budget(
        db: Session, user_id: int, budget_in: BudgetCreate
    ) -> Budget:
        # Check if already exists for this user, category, month, year
        existing = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.category_id == budget_in.category_id,
                Budget.month == budget_in.month,
                Budget.year == budget_in.year,
            )
            .first()
        )

        if existing:
            existing.amount = budget_in.amount
            existing.alert_threshold = budget_in.alert_threshold
            db.commit()
            db.refresh(existing)
            return existing

        new_budget = Budget(
            user_id=user_id,
            category_id=budget_in.category_id,
            amount=budget_in.amount,
            month=budget_in.month,
            year=budget_in.year,
            alert_threshold=budget_in.alert_threshold,
        )
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return new_budget

    @staticmethod
    def delete_budget(db: Session, user_id: int, budget_id: int) -> bool:
        budget = (
            db.query(Budget)
            .filter(Budget.id == budget_id, Budget.user_id == user_id)
            .first()
        )
        if not budget:
            return False
        db.delete(budget)
        db.commit()
        return True
