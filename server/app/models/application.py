import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    """Lifecycle states for an insurance application."""

    inquiry = "inquiry"
    screening = "screening"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"


class ProductType(str, enum.Enum):
    health = "health"
    life_accident = "life_accident"
    comprehensive = "comprehensive"


class AcquisitionSource(str, enum.Enum):
    """Where the applicant came from — powers the dashboard donut."""

    ml = "ml"
    email = "email"
    non_life = "non_life"
    google = "google"
    facebook = "facebook"
    direct = "direct"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference_no: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    applicant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    applicant_email: Mapped[str] = mapped_column(String(255), nullable=False)
    product_type: Mapped[ProductType] = mapped_column(
        Enum(ProductType, name="product_type"), nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"),
        nullable=False,
        default=ApplicationStatus.inquiry,
        index=True,
    )
    source: Mapped[AcquisitionSource] = mapped_column(
        Enum(AcquisitionSource, name="acquisition_source"),
        nullable=False,
        default=AcquisitionSource.direct,
        index=True,
    )
    premium: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
