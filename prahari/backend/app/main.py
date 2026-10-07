"""
PRAHARI — Main FastAPI Application
Backend for the MPLADS Fraud/Anomaly Detection Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv

# Load local environment variables from prahari/backend/.env or root .env
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / ".env")
load_dotenv()

from .database import engine, SessionLocal, Base
from . import models  # ensure models are imported before create_all

app = FastAPI(
    title="PRAHARI API",
    description="AI-powered MPLADS fraud/anomaly detection — SIH 2026",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files as static (for photo display)
from .routers.upload import UPLOAD_DIR
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
    # Ensure sample assets from bundled uploads directory are copied to UPLOAD_DIR
    bundled_uploads = Path(__file__).parent.parent / "uploads"
    if bundled_uploads.exists() and UPLOAD_DIR != bundled_uploads:
        import shutil
        for item in bundled_uploads.glob("*"):
            if item.is_file():
                dest = UPLOAD_DIR / item.name
                if not dest.exists():
                    try:
                        shutil.copyfile(item, dest)
                    except Exception:
                        pass

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



@app.get("/health")
def health():
    return {"status": "ok"}


# ── Mount Frontend SPA in production if built ──────────────────────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "prahari-frontend" / "dist"
if not FRONTEND_DIST.exists():
    FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend_dist"

if FRONTEND_DIST.exists():
    from fastapi.responses import FileResponse
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str = ""):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi") or full_path.startswith("uploads"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        target = FRONTEND_DIST / full_path
        if full_path and target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": "PRAHARI",
            "version": "1.0.0",
            "description": "AI-powered MPLADS Fraud & Anomaly Detection",
            "team": "The_Semicolons | SIH 2026 | PS ID 26102",
            "docs": "/docs",
        }
