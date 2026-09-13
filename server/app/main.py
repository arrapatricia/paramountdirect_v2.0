from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import applications, auth, dashboard
from app.core.config import settings

app = FastAPI(
    title="Paramount Direct API",
    description="Backend API for the Paramount Direct insurance platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(dashboard.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
