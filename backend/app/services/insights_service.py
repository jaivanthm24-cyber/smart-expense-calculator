from datetime import date, timedelta
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.category import Category
from app.models.savings import SavingsGoal
from app.schemas.insights import InsightItem, InsightsResponse


class InsightsService:
    @staticmethod
    def generate_insights(db: Session, user_id: int) -> InsightsResponse:
        today = date.today()
        insights: List[InsightItem] = []
        health_score = 75  # baseline score

        # 1. Current vs Previous Month Total Spending
        cur_month_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == today.month,
                extract("year", Expense.date) == today.year,
            )
            .scalar()
            or Decimal("0.00")
        )

        prev_month = 12 if today.month == 1 else today.month - 1
        prev_year = today.year - 1 if today.month == 1 else today.year
        prev_month_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == prev_month,
                extract("year", Expense.date) == prev_year,
            )
            .scalar()
            or Decimal("0.00")
        )

        cur_month_income = (
            db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00")))
            .filter(
                Income.user_id == user_id,
                extract("month", Income.date) == today.month,
                extract("year", Income.date) == today.year,
            )
            .scalar()
            or Decimal("0.00")
        )

        # Insight: Income vs Expense ratio this month
        if cur_month_income > 0:
            spend_ratio = float(cur_month_expenses) / float(cur_month_income)
            if spend_ratio > 1.0:
                health_score -= 20
                insights.append(
                    InsightItem(
                        id="exp_exceeds_income",
                        type="critical",
                        category="expense",
                        title="Expenses Exceed Income",
                        message=f"You have spent ${cur_month_expenses:,.2f} this month, which exceeds your earned income of ${cur_month_income:,.2f}.",
                        metric=f"{round(spend_ratio * 100, 1)}% of income",
                        change_pct=round(spend_ratio * 100, 1),
                        action_suggestion="Review discretionary spending and delay large non-essential purchases until next month.",
                    )
                )
            elif spend_ratio <= 0.6:
                health_score += 10
                insights.append(
                    InsightItem(
                        id="healthy_savings_rate",
                        type="positive",
                        category="savings",
                        title="Strong Savings Rate",
                        message=f"You have retained {round((1 - spend_ratio) * 100, 1)}% of your income this month after expenses.",
                        metric=f"{round((1 - spend_ratio) * 100, 1)}% saved",
                        action_suggestion="Consider allocating part of your surplus to your high-priority savings goals.",
                    )
                )

        # 2. Overall Budget Utilization check
        current_budget = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.category_id == None,
                Budget.month == today.month,
                Budget.year == today.year,
            )
            .first()
        )

        if current_budget and current_budget.amount > 0:
            util_pct = (float(cur_month_expenses) / float(current_budget.amount)) * 100.0
            if util_pct >= 100.0:
                health_score -= 15
                insights.append(
                    InsightItem(
                        id="budget_exceeded",
                        type="critical",
                        category="budget",
                        title="Monthly Budget Limit Exceeded",
                        message=f"You have spent ${cur_month_expenses:,.2f}, surpassing your set overall budget of ${current_budget.amount:,.2f}.",
                        metric=f"{round(util_pct, 1)}% used",
                        change_pct=round(util_pct - 100, 1),
                        action_suggestion="Cap spending on non-essential categories for the remainder of this month.",
                    )
                )
            elif util_pct >= current_budget.alert_threshold:
                health_score -= 5
                insights.append(
                    InsightItem(
                        id="budget_warning",
                        type="warning",
                        category="budget",
                        title="Approaching Monthly Budget Limit",
                        message=f"You have utilized {round(util_pct, 1)}% of your monthly budget. Remaining allowance: ${(current_budget.amount - cur_month_expenses):,.2f}.",
                        metric=f"{round(util_pct, 1)}% used",
                        action_suggestion="Track remaining daily spending closely to stay within budget targets.",
                    )
                )

        # 3. Category MoM Comparison (e.g. Food, Transportation, Shopping)
        cur_cat_spending = (
            db.query(Expense.category_id, func.sum(Expense.amount).label("total"))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == today.month,
                extract("year", Expense.date) == today.year,
            )
            .group_by(Expense.category_id)
            .all()
        )
        cur_cat_map = {c[0]: c[1] for c in cur_cat_spending if c[0]}

        prev_cat_spending = (
            db.query(Expense.category_id, func.sum(Expense.amount).label("total"))
            .filter(
                Expense.user_id == user_id,
                extract("month", Expense.date) == prev_month,
                extract("year", Expense.date) == prev_year,
            )
            .group_by(Expense.category_id)
            .all()
        )
        prev_cat_map = {c[0]: c[1] for c in prev_cat_spending if c[0]}

        for cat_id, cur_amt in cur_cat_map.items():
            prev_amt = prev_cat_map.get(cat_id, Decimal("0.00"))
            if prev_amt > Decimal("50.00"):  # only evaluate meaningful amounts
                diff_pct = float(cur_amt - prev_amt) / float(prev_amt) * 100.0
                cat_obj = db.query(Category).filter(Category.id == cat_id).first()
                cat_name = cat_obj.name if cat_obj else f"Category #{cat_id}"

                if diff_pct >= 25.0:
                    health_score -= 5
                    insights.append(
                        InsightItem(
                            id=f"cat_spike_{cat_id}",
                            type="warning",
                            category="expense",
                            title=f"{cat_name} Expenses Increased",
                            message=f"Your {cat_name.lower()} expenses rose by {round(diff_pct, 1)}% (${cur_amt:,.2f}) compared to last month (${prev_amt:,.2f}).",
                            metric=f"+{round(diff_pct, 1)}%",
                            change_pct=round(diff_pct, 1),
                            action_suggestion=f"Inspect your recent {cat_name.lower()} transactions to identify unexpected charges.",
                        )
                    )
                elif diff_pct <= -20.0:
                    health_score += 5
                    insights.append(
                        InsightItem(
                            id=f"cat_drop_{cat_id}",
                            type="positive",
                            category="expense",
                            title=f"Reduced {cat_name} Spending",
                            message=f"Great job! Your spending in {cat_name.lower()} decreased by {abs(round(diff_pct, 1))}% compared to last month.",
                            metric=f"{round(diff_pct, 1)}%",
                            change_pct=round(diff_pct, 1),
                            action_suggestion="Maintain these savings habits to build your emergency reserve.",
                        )
                    )

        # 4. Savings Goals Progress
        active_goals = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.user_id == user_id, SavingsGoal.status == "in_progress")
            .all()
        )
        for g in active_goals:
            prog = (float(g.current_amount) / float(g.target_amount) * 100.0) if g.target_amount > 0 else 0
            if prog >= 80.0:
                insights.append(
                    InsightItem(
                        id=f"goal_close_{g.id}",
                        type="positive",
                        category="savings",
                        title=f"Almost Reached '{g.name}' Goal!",
                        message=f"You are at {round(prog, 1)}% of your target for '{g.name}'. Only ${(g.target_amount - g.current_amount):,.2f} remaining!",
                        metric=f"{round(prog, 1)}%",
                        action_suggestion=f"A small boost of ${(g.target_amount - g.current_amount):,.2f} will mark this goal complete.",
                    )
                )

        # Clamp health score between 20 and 100
        health_score = max(20, min(100, health_score))

        # Determine overall summary sentence
        if health_score >= 85:
            summary = "Excellent financial health! Your spending is well-disciplined and your savings rate is healthy."
        elif health_score >= 70:
            summary = "Good financial standing. A few areas can be optimized to strengthen your budget margins."
        elif health_score >= 50:
            summary = "Moderate financial strain. High category spending or budget utilization requires attention."
        else:
            summary = "Financial alert: Your monthly expenses are outstripping your income or budget thresholds."

        if not insights:
            insights.append(
                InsightItem(
                    id="welcome_insight",
                    type="info",
                    category="general",
                    title="Smart Financial Engine Active",
                    message="As you record more incomes and expenses, intelligent rule-based suggestions will automatically highlight spending trends here.",
                    action_suggestion="Log your daily transactions and establish monthly category budgets to receive customized advice.",
                )
            )

        return InsightsResponse(
            total_insights=len(insights),
            health_score=health_score,
            summary_sentence=summary,
            insights=insights,
        )
