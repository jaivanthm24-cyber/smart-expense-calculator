from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.category import Category
from app.models.savings import SavingsGoal
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RecentTransactionItem,
    CategoryBreakdownItem,
    MonthlyTrendItem,
)


class DashboardService:
    @staticmethod
    def parse_date_range(
        preset: Optional[str] = None,
        custom_start: Optional[date] = None,
        custom_end: Optional[date] = None,
    ) -> Tuple[date, date]:
        today = date.today()
        if preset == "today":
            return today, today
        elif preset == "this_week":
            # Monday of current week
            start = today - timedelta(days=today.weekday())
            return start, today
        elif preset == "this_month":
            start = date(today.year, today.month, 1)
            return start, today
        elif preset == "last_month":
            # first and last day of last month
            first_this_month = date(today.year, today.month, 1)
            last_day_prev = first_this_month - timedelta(days=1)
            first_day_prev = date(last_day_prev.year, last_day_prev.month, 1)
            return first_day_prev, last_day_prev
        elif preset == "this_year":
            return date(today.year, 1, 1), today
        elif custom_start and custom_end:
            return custom_start, custom_end
        else:
            # Default to this month
            start = date(today.year, today.month, 1)
            return start, today

    @staticmethod
    def get_dashboard_summary(
        db: Session,
        user_id: int,
        preset: Optional[str] = "this_month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> DashboardSummaryResponse:
        f_start, f_end = DashboardService.parse_date_range(preset, start_date, end_date)
        today = date.today()

        # Total Income in selected range
        total_income = (
            db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00")))
            .filter(
                Income.user_id == user_id,
                Income.date >= f_start,
                Income.date <= f_end,
            )
            .scalar()
            or Decimal("0.00")
        )

        # Total Expenses in selected range
        total_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= f_start,
                Expense.date <= f_end,
            )
            .scalar()
            or Decimal("0.00")
        )

        # Current Net Balance in selected range
        current_balance = total_income - total_expenses

        # Total Saved across active savings goals
        total_savings = (
            db.query(func.coalesce(func.sum(SavingsGoal.current_amount), Decimal("0.00")))
            .filter(SavingsGoal.user_id == user_id)
            .scalar()
            or Decimal("0.00")
        )

        # Current Month Spending
        first_of_month = date(today.year, today.month, 1)
        monthly_spending = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= first_of_month,
                Expense.date <= today,
            )
            .scalar()
            or Decimal("0.00")
        )

        # Monthly Budget Utilization
        current_month_budget = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.category_id == None,
                Budget.month == today.month,
                Budget.year == today.year,
            )
            .first()
        )
        if current_month_budget and current_month_budget.amount > 0:
            budget_util_pct = round(
                (float(monthly_spending) / float(current_month_budget.amount)) * 100.0, 1
            )
        else:
            budget_util_pct = 0.0

        # Savings rate in selected range
        if total_income > 0:
            savings_rate_pct = round(
                (float(max(Decimal("0.00"), current_balance)) / float(total_income)) * 100.0, 1
            )
        else:
            savings_rate_pct = 0.0

        # Highest spending category in range
        cat_spending = (
            db.query(
                Expense.category_id,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .filter(
                Expense.user_id == user_id,
                Expense.date >= f_start,
                Expense.date <= f_end,
            )
            .group_by(Expense.category_id)
            .order_by(desc("total"))
            .all()
        )

        highest_cat_name = None
        highest_cat_amount = Decimal("0.00")
        if cat_spending:
            highest_rec = cat_spending[0]
            highest_cat_amount = highest_rec.total or Decimal("0.00")
            if highest_rec.category_id:
                c = db.query(Category).filter(Category.id == highest_rec.category_id).first()
                highest_cat_name = c.name if c else "Uncategorized"
            else:
                highest_cat_name = "Uncategorized"

        # Category breakdown for charts
        cat_breakdown: List[CategoryBreakdownItem] = []
        for cs in cat_spending:
            cat_obj = db.query(Category).filter(Category.id == cs.category_id).first() if cs.category_id else None
            name = cat_obj.name if cat_obj else "Uncategorized"
            color = cat_obj.color if cat_obj and cat_obj.color else "#64748b"
            icon = cat_obj.icon if cat_obj else "tag"
            amt = cs.total or Decimal("0.00")
            pct = round((float(amt) / float(total_expenses) * 100.0), 1) if total_expenses > 0 else 0.0
            cat_breakdown.append(
                CategoryBreakdownItem(
                    category_id=cs.category_id,
                    category_name=name,
                    color=color,
                    icon=icon,
                    total_amount=amt,
                    percentage=pct,
                    transaction_count=cs.count,
                )
            )

        # Recent transactions: Union of top 5 incomes and top 5 expenses, ordered by date desc
        recent_expenses = (
            db.query(Expense)
            .filter(Expense.user_id == user_id)
            .order_by(Expense.date.desc(), Expense.id.desc())
            .limit(10)
            .all()
        )
        recent_incomes = (
            db.query(Income)
            .filter(Income.user_id == user_id)
            .order_by(Income.date.desc(), Income.id.desc())
            .limit(10)
            .all()
        )

        all_txns = []
        for exp in recent_expenses:
            c = exp.category
            all_txns.append(
                RecentTransactionItem(
                    id=exp.id,
                    type="expense",
                    title=exp.title,
                    amount=exp.amount,
                    date=exp.date,
                    category_name=c.name if c else "Uncategorized",
                    category_color=c.color if c and c.color else "#ef4444",
                    category_icon=c.icon if c else "credit-card",
                    payment_method=exp.payment_method,
                )
            )
        for inc in recent_incomes:
            c = inc.category
            all_txns.append(
                RecentTransactionItem(
                    id=inc.id,
                    type="income",
                    title=inc.title,
                    amount=inc.amount,
                    date=inc.date,
                    category_name=c.name if c else "Other Income",
                    category_color=c.color if c and c.color else "#10b981",
                    category_icon=c.icon if c else "arrow-down-left",
                    payment_method=inc.payment_method,
                )
            )

        # Sort combined transactions by date desc, then slice 8
        all_txns.sort(key=lambda x: x.date, reverse=True)
        recent_transactions = all_txns[:8]

        # Monthly Trends: Last 6 months history
        monthly_trends: List[MonthlyTrendItem] = []
        for i in range(5, -1, -1):
            # calculate month target
            target_year = today.year
            target_month = today.month - i
            while target_month <= 0:
                target_month += 12
                target_year -= 1

            m_income = (
                db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00")))
                .filter(
                    Income.user_id == user_id,
                    extract("month", Income.date) == target_month,
                    extract("year", Income.date) == target_year,
                )
                .scalar()
                or Decimal("0.00")
            )

            m_expense = (
                db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
                .filter(
                    Expense.user_id == user_id,
                    extract("month", Expense.date) == target_month,
                    extract("year", Expense.date) == target_year,
                )
                .scalar()
                or Decimal("0.00")
            )

            m_savings = max(Decimal("0.00"), m_income - m_expense)
            rate = round((float(m_savings) / float(m_income) * 100.0), 1) if m_income > 0 else 0.0

            month_label = date(target_year, target_month, 1).strftime("%b %Y")
            monthly_trends.append(
                MonthlyTrendItem(
                    month=month_label,
                    income=m_income,
                    expenses=m_expense,
                    savings=m_savings,
                    net_savings_rate=rate,
                )
            )

        return DashboardSummaryResponse(
            total_income=total_income,
            total_expenses=total_expenses,
            current_balance=current_balance,
            total_savings=total_savings,
            monthly_spending=monthly_spending,
            monthly_budget_utilization_pct=budget_util_pct,
            savings_rate_pct=savings_rate_pct,
            highest_spending_category=highest_cat_name,
            highest_spending_amount=highest_cat_amount,
            recent_transactions=recent_transactions,
            income_vs_expense_chart=monthly_trends,
            expense_category_breakdown=cat_breakdown,
            filter_start_date=f_start,
            filter_end_date=f_end,
        )
