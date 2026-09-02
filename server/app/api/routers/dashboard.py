from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.application import AcquisitionSource, Application
from app.models.user import User
from app.schemas.application import AcquisitionSlice, DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_SOURCE_LABELS: dict[AcquisitionSource, str] = {
    AcquisitionSource.ml: "ML",
    AcquisitionSource.email: "Email",
    AcquisitionSource.non_life: "Non-Life",
    AcquisitionSource.google: "Google",
    AcquisitionSource.facebook: "Facebook",
    AcquisitionSource.direct: "Direct",
}


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DashboardSummary:
    """Powers the dashboard KPIs and the Customer Acquisition donut."""
    total_applications = db.query(func.count(Application.id)).scalar() or 0
    total_premium = float(
        db.query(func.coalesce(func.sum(Application.premium), 0)).scalar() or 0
    )

    counts_by_source = dict(
        db.query(Application.source, func.count(Application.id))
        .group_by(Application.source)
        .all()
    )

    acquisition = [
        AcquisitionSlice(
            source=source,
            label=label,
            count=int(counts_by_source.get(source, 0)),
        )
        for source, label in _SOURCE_LABELS.items()
    ]

    return DashboardSummary(
        total_applications=total_applications,
        total_premium=total_premium,
        acquisition=acquisition,
    )
