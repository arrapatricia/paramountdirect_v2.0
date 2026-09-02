"""Seed the database with a default admin user and sample applications.

Run once after migrations:  python -m app.seed
Idempotent: safe to run multiple times.
"""

import random

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.application import (
    AcquisitionSource,
    Application,
    ApplicationStatus,
    ProductType,
)
from app.models.user import User, UserRole


def seed_admin(db) -> None:
    existing = db.query(User).filter(User.email == settings.first_admin_email).first()
    if existing:
        print(f"Admin already exists: {settings.first_admin_email}")
        return
    admin = User(
        email=settings.first_admin_email,
        full_name="Platform Admin",
        hashed_password=hash_password(settings.first_admin_password),
        role=UserRole.admin,
    )
    db.add(admin)
    db.commit()
    print(f"Created admin: {settings.first_admin_email} / {settings.first_admin_password}")


def seed_applications(db, n: int = 40) -> None:
    if db.query(Application).count() > 0:
        print("Applications already present, skipping sample data.")
        return
    sources = list(AcquisitionSource)
    products = list(ProductType)
    statuses = list(ApplicationStatus)
    for i in range(n):
        app_row = Application(
            reference_no=f"PD-SEED{i:04d}",
            applicant_name=f"Applicant {i + 1}",
            applicant_email=f"applicant{i + 1}@example.com",
            product_type=random.choice(products),
            source=random.choice(sources),
            status=random.choice(statuses),
            premium=round(random.uniform(1000, 25000), 2),
        )
        db.add(app_row)
    db.commit()
    print(f"Created {n} sample applications.")


def main() -> None:
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_applications(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
