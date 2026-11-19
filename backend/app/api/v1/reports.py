from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.reports import FinancialPeriodReport
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/period", response_model=FinancialPeriodReport)
def get_period_report(
    preset: Optional[str] = Query(
        "this_month",
        pattern="^(today|this_week|this_month|last_month|this_year|custom)$",
        description="Filter preset",
    ),
    start_date: Optional[date] = Query(None, description="Custom start date"),
    end_date: Optional[date] = Query(None, description="Custom end date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReportService.get_period_report(
        db=db,
        user_id=current_user.id,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/export/csv")
def export_csv(
    preset: Optional[str] = Query("this_month"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: Optional[str] = Query("all", pattern="^(all|income|expense)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    csv_content = ReportService.export_csv(
        db=db,
        user_id=current_user.id,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
        txn_type=type,
    )
    filename = f"financial_report_{date.today().isoformat()}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/pdf")
def export_pdf(
    preset: Optional[str] = Query("this_month"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf_bytes = ReportService.export_pdf(
        db=db,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )
    filename = f"financial_report_{date.today().isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
