import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _generate_reference() -> str:
    return "PD-" + secrets.token_hex(4).upper()


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Application]:
    query = db.query(Application)
    if status_filter is not None:
        query = query.filter(Application.status == status_filter)
    return (
        query.order_by(Application.created_at.desc()).offset(offset).limit(limit).all()
    )


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.agent, UserRole.reviewer)),
) -> Application:
    application = Application(
        reference_no=_generate_reference(),
        applicant_name=payload.applicant_name,
        applicant_email=payload.applicant_email,
        product_type=payload.product_type,
        source=payload.source,
        premium=payload.premium,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Application:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    return application


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.reviewer)),
) -> Application:
    """Reviewer/admin only: advance status or adjust premium."""
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    if payload.status is not None:
        application.status = payload.status
    if payload.premium is not None:
        application.premium = payload.premium
    db.commit()
    db.refresh(application)
    return application
