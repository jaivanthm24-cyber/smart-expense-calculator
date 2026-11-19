from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from app.models.income import Income
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    WeeklyPatternItem,
    DailySpendingItem,
    MonthlyComparisonItem,
)
from app.schemas.dashboard import CategoryBreakdownItem, MonthlyTrendItem
from app.services.dashboard_service import DashboardService


class AnalyticsService:
    @staticmethod
    def get_analytics(
        db: Session,
        user_id: int,
        preset: Optional[str] = "this_month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> AnalyticsOverviewResponse:
        f_start, f_end = DashboardService.parse_date_range(preset, start_date, end_date)
        today = date.today()

        # Total Income & Expenses in current filter range
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

        net_savings = total_income - total_expenses
        savings_rate = (
            round((float(max(Decimal("0.00"), net_savings)) / float(total_income)) * 100.0, 1)
            if total_income > 0
            else 0.0
        )

        # Average Daily Spending
        days_in_range = max(1, (f_end - f_start).days + 1)
        avg_daily = round(total_expenses / Decimal(str(days_in_range)), 2)

        # Highest expense day
        daily_expenses = (
            db.query(Expense.date, func.sum(Expense.amount).label("total"))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= f_start,
                Expense.date <= f_end,
            )
            .group_by(Expense.date)
            .order_by(desc("total"))
            .all()
        )

        highest_day_item = None
        if daily_expenses:
            top_day = daily_expenses[0]
            highest_day_item = DailySpendingItem(
                date=top_day.date,
                day_name=top_day.date.strftime("%A"),
                amount=top_day.total,
            )

        # Weekly Spending Patterns (Monday through Sunday)
        # Fetch expenses in range and aggregate by day of week in Python to be fully cross-database compatible
        expenses_in_range = (
            db.query(Expense.date, Expense.amount)
            .filter(
                Expense.user_id == user_id,
                Expense.date >= f_start,
                Expense.date <= f_end,
            )
            .all()
        )

        days_map = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
        dow_totals = {i: Decimal("0.00") for i in range(7)}
        dow_counts = {i: 0 for i in range(7)}

        for exp_date, exp_amt in expenses_in_range:
            weekday = exp_date.weekday()
            dow_totals[weekday] += exp_amt
            dow_counts[weekday] += 1

        weekly_patterns: List[WeeklyPatternItem] = []
        for i in range(7):
            tot = dow_totals[i]
            cnt = max(1, dow_counts[i])
            avg = round(tot / Decimal(str(cnt)), 2)
            pct = round((float(tot) / float(total_expenses) * 100.0), 1) if total_expenses > 0 else 0.0
            weekly_patterns.append(
                WeeklyPatternItem(
                    day_of_week=days_map[i],
                    total_amount=tot,
                    average_amount=avg,
                    percentage=pct,
                )
            )

        # Category breakdown
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
        category_breakdown: List[CategoryBreakdownItem] = []
        for cs in cat_spending:
            cat_obj = db.query(Category).filter(Category.id == cs.category_id).first() if cs.category_id else None
            name = cat_obj.name if cat_obj else "Uncategorized"
            if highest_cat_name is None:
                highest_cat_name = name
            color = cat_obj.color if cat_obj and cat_obj.color else "#64748b"
            icon = cat_obj.icon if cat_obj else "tag"
            amt = cs.total or Decimal("0.00")
            pct = round((float(amt) / float(total_expenses) * 100.0), 1) if total_expenses > 0 else 0.0
            category_breakdown.append(
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

        # Previous Period Comparison: Calculate previous matching period
        period_duration = f_end - f_start
        prev_f_end = f_start - timedelta(days=1)
        prev_f_start = prev_f_end - period_duration

        prev_income = (
            db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00")))
            .filter(
                Income.user_id == user_id,
                Income.date >= prev_f_start,
                Income.date <= prev_f_end,
            )
            .scalar()
            or Decimal("0.00")
        )

        prev_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= prev_f_start,
                Expense.date <= prev_f_end,
            )
            .scalar()
            or Decimal("0.00")
        )

        prev_savings = prev_income - prev_expenses

        comparisons: List[MonthlyComparisonItem] = []
        # Income comparison
        inc_diff = total_income - prev_income
        inc_pct = round((float(inc_diff) / float(prev_income) * 100.0), 1) if prev_income > 0 else 0.0
        comparisons.append(
            MonthlyComparisonItem(
                metric="Total Income",
                current_period=total_income,
                previous_period=prev_income,
                change_amount=inc_diff,
                change_percentage=inc_pct,
                trend="up" if inc_diff > 0 else "down" if inc_diff < 0 else "stable",
            )
        )

        # Expense comparison
        exp_diff = total_expenses - prev_expenses
        exp_pct = round((float(exp_diff) / float(prev_expenses) * 100.0), 1) if prev_expenses > 0 else 0.0
        comparisons.append(
            MonthlyComparisonItem(
                metric="Total Expenses",
                current_period=total_expenses,
                previous_period=prev_expenses,
                change_amount=exp_diff,
                change_percentage=exp_pct,
                trend="up" if exp_diff > 0 else "down" if exp_diff < 0 else "stable",
            )
        )

        # Net Savings comparison
        sav_diff = net_savings - prev_savings
        sav_pct = round((float(sav_diff) / float(abs(prev_savings)) * 100.0), 1) if prev_savings != 0 else 0.0
        comparisons.append(
            MonthlyComparisonItem(
                metric="Net Savings",
                current_period=net_savings,
                previous_period=prev_savings,
                change_amount=sav_diff,
                change_percentage=sav_pct,
                trend="up" if sav_diff > 0 else "down" if sav_diff < 0 else "stable",
            )
        )

        # Monthly Trends (last 6 months)
        monthly_trends: List[MonthlyTrendItem] = []
        for i in range(5, -1, -1):
            t_year = today.year
            t_month = today.month - i
            while t_month <= 0:
                t_month += 12
                t_year -= 1

            m_inc = (
                db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00")))
                .filter(
                    Income.user_id == user_id,
                    extract("month", Income.date) == t_month,
                    extract("year", Income.date) == t_year,
                )
                .scalar()
                or Decimal("0.00")
            )
            m_exp = (
                db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
                .filter(
                    Expense.user_id == user_id,
                    extract("month", Expense.date) == t_month,
                    extract("year", Expense.date) == t_year,
                )
                .scalar()
                or Decimal("0.00")
            )
            m_sav = max(Decimal("0.00"), m_inc - m_exp)
            rate = round((float(m_sav) / float(m_inc) * 100.0), 1) if m_inc > 0 else 0.0

            monthly_trends.append(
                MonthlyTrendItem(
                    month=date(t_year, t_month, 1).strftime("%b %Y"),
                    income=m_inc,
                    expenses=m_exp,
                    savings=m_sav,
                    net_savings_rate=rate,
                )
            )

        return AnalyticsOverviewResponse(
            start_date=f_start,
            end_date=f_end,
            total_income=total_income,
            total_expenses=total_expenses,
            net_savings=net_savings,
            savings_rate_pct=savings_rate,
            average_daily_spending=avg_daily,
            highest_expense_day=highest_day_item,
            highest_expense_category=highest_cat_name,
            weekly_spending_patterns=weekly_patterns,
            monthly_trends=monthly_trends,
            category_breakdown=category_breakdown,
            comparisons=comparisons,
        )
