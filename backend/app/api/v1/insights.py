from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.insights import InsightsResponse
from app.services.insights_service import InsightsService

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/", response_model=InsightsResponse)
def get_insights(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return InsightsService.generate_insights(db=db, user_id=current_user.id)
