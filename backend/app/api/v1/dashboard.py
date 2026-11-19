from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
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
    return DashboardService.get_dashboard_summary(
        db=db,
        user_id=current_user.id,
        preset=preset,
        start_date=start_date,
        end_date=end_date,
    )
