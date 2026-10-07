"""Engines endpoint — POST /api/engines/run (§11)."""
import asyncio
import json
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
from ..models import Work, Payment, MP, JobStatus, RiskScore
from ..schemas import JobStatusOut
from .auth import require_admin

router = APIRouter(prefix="/api/engines", tags=["engines"])

# In-memory job store for the processing console
_jobs: dict[str, dict] = {}


def _sync_job_to_disk(job_id: str):
    if job_id in _jobs:
        try:
            job_file = Path(tempfile.gettempdir()) / f"prahari_job_{job_id}.json"
            with open(job_file, "w") as f:
                json.dump(_jobs[job_id], f)
        except Exception:
            pass


def _append_log(job_id: str, msg: str):
    if job_id in _jobs:
        _jobs[job_id]["log"].append(f"[{datetime.utcnow().strftime('%H:%M:%S')}] {msg}")
        _sync_job_to_disk(job_id)


async def _run_engines_job(job_id: str, work_ids: list[int] | None = None):
    """Background task: run all engines on (subset of) works."""
    _jobs[job_id] = {"status": "running", "stage": "init", "progress": 0, "log": []}
    _sync_job_to_disk(job_id)
    _append_log(job_id, "🚀 Engine run started")

    db = SessionLocal()
    try:
        from ..engines.explain import run_all_engines_for_work
        from ..engines.predictive_delay import train_or_load_model
        from ..engines.vendor_network import build_vendor_graph

        # Load / train delay model
        _jobs[job_id]["stage"] = "training_model"
        _append_log(job_id, "📊 Training / loading Predictive Delay model...")
        all_works = db.query(Work).limit(4000).all()
        all_payments = db.query(Payment).limit(10000).all()
        delay_model, auc = train_or_load_model(all_works, all_payments)
        _append_log(job_id, f"✅ Delay model ready (held-out AUC: {auc:.3f})")

        # Build vendor graph
        _jobs[job_id]["stage"] = "vendor_graph"
        _append_log(job_id, "🕸️  Building vendor network graph (Louvain)...")
        all_mps = db.query(MP).limit(200).all()
        payments_with_vendors = (
            db.query(Payment).filter(Payment.vendor_id.isnot(None)).limit(10000).all()
        )
        graph_cache = build_vendor_graph(payments_with_vendors, all_mps)
        _append_log(
            job_id,
            f"✅ Vendor graph: {graph_cache['node_count']} nodes, "
            f"{graph_cache['collusion_ring_count']} collusion rings detected"
        )

        # Score works (include both Recommended and Completed)
        is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
        if work_ids:
            works_to_score = db.query(Work).filter(Work.id.in_(work_ids)).all()
        else:
            rec_limit = 50 if is_serverless else 1000
            comp_limit = 50 if is_serverless else 500
            rec_works = db.query(Work).filter(Work.status == "Recommended").limit(rec_limit).all()
            comp_works = db.query(Work).filter(Work.status == "Completed").limit(comp_limit).all()
            works_to_score = rec_works + comp_works

        total = len(works_to_score)
        _jobs[job_id]["stage"] = "scoring"
        _append_log(job_id, f"⚙️  Scoring {total} works across 5 engines...")

        step = 10 if is_serverless else 100
        for i, work in enumerate(works_to_score):
            try:
                run_all_engines_for_work(
                    work, db,
                    graph_cache=graph_cache,
                    delay_model=delay_model,
                )
            except Exception as e:
                _append_log(job_id, f"⚠️  Work {work.id}: {str(e)[:60]}")

            if (i + 1) % step == 0 or i == total - 1:
                pct = round((i + 1) / max(total, 1) * 100, 1)
                _jobs[job_id]["progress"] = pct
                _append_log(job_id, f"   ... {i + 1}/{total} scored ({pct}%)")
                db.commit()
                _sync_job_to_disk(job_id)
                await asyncio.sleep(0)   # yield to event loop

        db.commit()
        _jobs[job_id]["stage"] = "done"
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["progress"] = 100.0
        _append_log(job_id, f"🎉 Scoring complete — {total} works risk-scored!")
        _sync_job_to_disk(job_id)

    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["stage"] = "error"
        _append_log(job_id, f"❌ Error: {str(e)}")
        import traceback
        _append_log(job_id, traceback.format_exc()[:300])
        _sync_job_to_disk(job_id)
    finally:
        db.close()


@router.post("/run", response_model=JobStatusOut)
async def run_engines(
    background_tasks: BackgroundTasks,
    admin=Depends(require_admin),
):
    job_id = str(uuid.uuid4())
    background_tasks.add_task(_run_engines_job, job_id)
    return JobStatusOut(
        job_id=job_id,
        status="running",
        stage="init",
        progress_pct=0.0,
        log=["Engine run initiated..."],
    )


@router.get("/status/{job_id}", response_model=JobStatusOut)
def get_engine_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        job_file = Path(tempfile.gettempdir()) / f"prahari_job_{job_id}.json"
        if job_file.exists():
            try:
                with open(job_file, "r") as f:
                    job = json.load(f)
                    _jobs[job_id] = job
            except Exception:
                pass
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusOut(
        job_id=job_id,
        status=job["status"],
        stage=job.get("stage"),
        progress_pct=job.get("progress", 0),
        log=job.get("log", []),
    )

