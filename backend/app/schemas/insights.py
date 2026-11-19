from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal


class InsightItem(BaseModel):
    id: str
    type: str  # 'warning', 'positive', 'tip', 'critical', 'info'
    category: str  # 'budget', 'expense', 'income', 'savings', 'general'
    title: str
    message: str
    metric: Optional[str] = None
    change_pct: Optional[float] = None
    action_suggestion: Optional[str] = None


class InsightsResponse(BaseModel):
    total_insights: int
    health_score: int  # 0 to 100 calculated financial health score
    summary_sentence: str
    insights: List[InsightItem]
