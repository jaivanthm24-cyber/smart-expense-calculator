import io
import csv
from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.income import Income
from app.models.expense import Expense
from app.models.category import Category
from app.models.budget import Budget
from app.schemas.reports import FinancialPeriodReport, CategoryReportDetail
from app.schemas.dashboard import MonthlyTrendItem
from app.services.dashboard_service import DashboardService


class ReportService:
    @staticmethod
    def get_period_report(
        db: Session,
        user_id: int,
        preset: Optional[str] = "this_month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> FinancialPeriodReport:
        f_start, f_end = DashboardService.parse_date_range(preset, start_date, end_date)

        # Incomes
        total_income = (
            db.query(func.coalesce(func.sum(Income.amount), Decimal("0.00")))
            .filter(Income.user_id == user_id, Income.date >= f_start, Income.date <= f_end)
            .scalar()
            or Decimal("0.00")
        )

        # Expenses
        total_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
            .filter(Expense.user_id == user_id, Expense.date >= f_start, Expense.date <= f_end)
            .scalar()
            or Decimal("0.00")
        )

        net_savings = total_income - total_expenses
        savings_rate = (
            round((float(max(Decimal("0.00"), net_savings)) / float(total_income)) * 100.0, 1)
            if total_income > 0
            else 0.0
        )

        # Total counts
        exp_count = (
            db.query(func.count(Expense.id))
            .filter(Expense.user_id == user_id, Expense.date >= f_start, Expense.date <= f_end)
            .scalar()
            or 0
        )
        inc_count = (
            db.query(func.count(Income.id))
            .filter(Income.user_id == user_id, Income.date >= f_start, Income.date <= f_end)
            .scalar()
            or 0
        )
        total_txns = exp_count + inc_count

        # Top Expenses by Category
        cat_exp = (
            db.query(
                Expense.category_id,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("cnt"),
            )
            .filter(Expense.user_id == user_id, Expense.date >= f_start, Expense.date <= f_end)
            .group_by(Expense.category_id)
            .order_by(desc("total"))
            .all()
        )
        top_expenses: List[CategoryReportDetail] = []
        for ce in cat_exp:
            cat = db.query(Category).filter(Category.id == ce.category_id).first() if ce.category_id else None
            c_name = cat.name if cat else "Uncategorized"
            tot = ce.total or Decimal("0.00")
            pct = round((float(tot) / float(total_expenses) * 100.0), 1) if total_expenses > 0 else 0.0
            avg_txn = round(tot / Decimal(str(max(1, ce.cnt))), 2)
            top_expenses.append(
                CategoryReportDetail(
                    category_name=c_name,
                    type="expense",
                    total_amount=tot,
                    transaction_count=ce.cnt,
                    percentage_of_total=pct,
                    average_transaction=avg_txn,
                )
            )

        # Top Incomes by Category
        cat_inc = (
            db.query(
                Income.category_id,
                func.sum(Income.amount).label("total"),
                func.count(Income.id).label("cnt"),
            )
            .filter(Income.user_id == user_id, Income.date >= f_start, Income.date <= f_end)
            .group_by(Income.category_id)
            .order_by(desc("total"))
            .all()
        )
        top_incomes: List[CategoryReportDetail] = []
        for ci in cat_inc:
            cat = db.query(Category).filter(Category.id == ci.category_id).first() if ci.category_id else None
            c_name = cat.name if cat else "Other Income"
            tot = ci.total or Decimal("0.00")
            pct = round((float(tot) / float(total_income) * 100.0), 1) if total_income > 0 else 0.0
            avg_txn = round(tot / Decimal(str(max(1, ci.cnt))), 2)
            top_incomes.append(
                CategoryReportDetail(
                    category_name=c_name,
                    type="income",
                    total_amount=tot,
                    transaction_count=ci.cnt,
                    percentage_of_total=pct,
                    average_transaction=avg_txn,
                )
            )

        # Overall Budget check if date range matches a single month
        budget_allocated = None
        budget_util_pct = None
        if f_start.year == f_end.year and f_start.month == f_end.month:
            b_obj = (
                db.query(Budget)
                .filter(
                    Budget.user_id == user_id,
                    Budget.category_id == None,
                    Budget.month == f_start.month,
                    Budget.year == f_start.year,
                )
                .first()
            )
            if b_obj:
                budget_allocated = b_obj.amount
                if b_obj.amount > 0:
                    budget_util_pct = round((float(total_expenses) / float(b_obj.amount) * 100.0), 1)

        # Monthly breakdown
        today = date.today()
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

        title = f"Financial Report ({f_start.strftime('%b %d, %Y')} – {f_end.strftime('%b %d, %Y')})"

        return FinancialPeriodReport(
            period_title=title,
            start_date=f_start,
            end_date=f_end,
            total_income=total_income,
            total_expenses=total_expenses,
            net_savings=net_savings,
            savings_rate_pct=savings_rate,
            budget_allocated=budget_allocated,
            budget_utilization_pct=budget_util_pct,
            top_expenses=top_expenses,
            top_incomes=top_incomes,
            monthly_breakdown=monthly_trends,
            total_transactions_count=total_txns,
        )

    @staticmethod
    def export_csv(
        db: Session,
        user_id: int,
        preset: Optional[str] = "this_month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        txn_type: Optional[str] = "all",  # 'all', 'income', 'expense'
    ) -> str:
        f_start, f_end = DashboardService.parse_date_range(preset, start_date, end_date)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["Type", "Date", "Title", "Category", "Amount", "Payment Method", "Description", "Notes"])

        if txn_type in ["all", "income"]:
            incomes = (
                db.query(Income)
                .filter(Income.user_id == user_id, Income.date >= f_start, Income.date <= f_end)
                .order_by(Income.date.desc())
                .all()
            )
            for inc in incomes:
                c_name = inc.category.name if inc.category else "Other Income"
                writer.writerow([
                    "Income",
                    inc.date.isoformat(),
                    inc.title,
                    c_name,
                    str(inc.amount),
                    inc.payment_method,
                    inc.description or "",
                    "",
                ])

        if txn_type in ["all", "expense"]:
            expenses = (
                db.query(Expense)
                .filter(Expense.user_id == user_id, Expense.date >= f_start, Expense.date <= f_end)
                .order_by(Expense.date.desc())
                .all()
            )
            for exp in expenses:
                c_name = exp.category.name if exp.category else "Uncategorized"
                writer.writerow([
                    "Expense",
                    exp.date.isoformat(),
                    exp.title,
                    c_name,
                    str(exp.amount),
                    exp.payment_method,
                    exp.description or "",
                    exp.notes or "",
                ])

        return output.getvalue()

    @staticmethod
    def export_pdf(
        db: Session,
        user_id: int,
        user_name: str,
        user_email: str,
        preset: Optional[str] = "this_month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> bytes:
        report = ReportService.get_period_report(db, user_id, preset, start_date, end_date)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#64748b"),
        )
        heading2_style = ParagraphStyle(
            "DocH2",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=12,
            spaceAfter=6,
        )

        elements = []

        # Header Title
        elements.append(Paragraph("Smart Expense Calculator – Executive Financial Report", title_style))
        elements.append(
            Paragraph(
                f"Generated for: <b>{user_name}</b> ({user_email}) &nbsp;|&nbsp; Period: <b>{report.period_title}</b>",
                subtitle_style,
            )
        )
        elements.append(Spacer(1, 14))

        # KPI Metrics Table
        kpi_data = [
            ["Total Income", "Total Expenses", "Net Savings", "Savings Rate"],
            [
                f"${report.total_income:,.2f}",
                f"${report.total_expenses:,.2f}",
                f"${report.net_savings:,.2f}",
                f"{report.savings_rate_pct}%",
            ],
        ]
        kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#475569")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#ffffff")),
                ("TEXTCOLOR", (0, 1), (0, 1), colors.HexColor("#16a34a")),  # income green
                ("TEXTCOLOR", (1, 1), (1, 1), colors.HexColor("#dc2626")),  # expense red
                ("TEXTCOLOR", (2, 1), (2, 1), colors.HexColor("#2563eb")),  # savings blue
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 1), (-1, 1), 14),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 1), (-1, 1), 10),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
            ])
        )
        elements.append(kpi_table)
        elements.append(Spacer(1, 16))

        # Top Expenses Section
        elements.append(Paragraph("Expense Breakdown by Category", heading2_style))
        exp_table_data = [["Category", "Transactions", "Total Amount", "% of Expenses", "Avg / Txn"]]
        if report.top_expenses:
            for exp in report.top_expenses:
                exp_table_data.append([
                    exp.category_name,
                    str(exp.transaction_count),
                    f"${exp.total_amount:,.2f}",
                    f"{exp.percentage_of_total}%",
                    f"${exp.average_transaction:,.2f}",
                ])
        else:
            exp_table_data.append(["No expense data recorded in this period", "-", "$0.00", "0%", "$0.00"])

        exp_table = Table(exp_table_data, colWidths=[180, 80, 90, 80, 90])
        exp_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("PADDING", (0, 0), (-1, -1), 5),
            ])
        )
        elements.append(exp_table)
        elements.append(Spacer(1, 14))

        # Top Incomes Section
        elements.append(Paragraph("Income Breakdown by Category", heading2_style))
        inc_table_data = [["Source", "Transactions", "Total Amount", "% of Income", "Avg / Txn"]]
        if report.top_incomes:
            for inc in report.top_incomes:
                inc_table_data.append([
                    inc.category_name,
                    str(inc.transaction_count),
                    f"${inc.total_amount:,.2f}",
                    f"{inc.percentage_of_total}%",
                    f"${inc.average_transaction:,.2f}",
                ])
        else:
            inc_table_data.append(["No income data recorded in this period", "-", "$0.00", "0%", "$0.00"])

        inc_table = Table(inc_table_data, colWidths=[180, 80, 90, 80, 90])
        inc_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("PADDING", (0, 0), (-1, -1), 5),
            ])
        )
        elements.append(inc_table)
        elements.append(Spacer(1, 16))

        # Footer note
        elements.append(
            Paragraph(
                "<i>This automated report was produced by Smart Expense Calculator. All computations are securely audited from database records.</i>",
                subtitle_style,
            )
        )

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
