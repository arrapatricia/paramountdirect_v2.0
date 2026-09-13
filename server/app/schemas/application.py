from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.application import AcquisitionSource, ApplicationStatus, ProductType


class ApplicationCreate(BaseModel):
    applicant_name: str
    applicant_email: EmailStr
    product_type: ProductType
    source: AcquisitionSource = AcquisitionSource.direct
    premium: float = 0


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    premium: float | None = None


class ApplicationOut(BaseModel):
    id: int
    reference_no: str
    applicant_name: str
    applicant_email: EmailStr
    product_type: ProductType
    status: ApplicationStatus
    source: AcquisitionSource
    premium: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AcquisitionSlice(BaseModel):
    """One segment of the Customer Acquisition donut."""

    source: AcquisitionSource
    label: str
    count: int


class DashboardSummary(BaseModel):
    total_applications: int
    total_premium: float
    acquisition: list[AcquisitionSlice]
