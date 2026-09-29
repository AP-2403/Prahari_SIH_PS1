"""
PRAHARI — Main FastAPI Application
Backend for the MPLADS Fraud/Anomaly Detection Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import engine, SessionLocal, Base
from . import models  # ensure models are imported before create_all

app = FastAPI(
    title="PRAHARI API",
    description="AI-powered MPLADS fraud/anomaly detection — SIH 2026",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5180",
        "http://127.0.0.1:5180",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files as static (for photo display)
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Include routers
from .routers.auth import router as auth_router
from .routers.works import router as works_router
from .routers.dashboard import router as dashboard_router
from .routers.engines import router as engines_router
from .routers.vendors import router as vendors_router
from .routers.upload import router as upload_router
from .routers.assistant import router as assistant_router
from .routers.feedback_citizen_risk import (
    feedback_router, citizen_router, risk_router
)

app.include_router(auth_router)
app.include_router(works_router)
app.include_router(dashboard_router)
app.include_router(engines_router)
app.include_router(vendors_router)
app.include_router(upload_router)
app.include_router(assistant_router)
app.include_router(feedback_router)
app.include_router(citizen_router)
app.include_router(risk_router)


@app.on_event("startup")
async def startup():
    """Create tables and seed the database on first run."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from .seed_data import seed_database
        result = seed_database(db)
        log_text = "\n".join(result.get("log", [result.get("status", "")]))
        print(log_text.encode("ascii", errors="replace").decode("ascii"))
    except Exception as e:
        import traceback
        print(f"Seed error: {e}")
        traceback.print_exc()
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "name": "PRAHARI",
        "version": "1.0.0",
        "description": "AI-powered MPLADS Fraud & Anomaly Detection",
        "team": "The_Semicolons | SIH 2026 | PS ID 26102",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
