"""Remaining routers: feedback, citizen, risk."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OfficerFeedback, Work, RiskScore
from ..schemas import FeedbackIn, CitizenWorkOut, PhotoOut
from .auth import get_current_user
from ..models import User

# ── Feedback router ───────────────────────────────────────────────────────────
feedback_router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@feedback_router.post("")
def submit_feedback(req: FeedbackIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fb = OfficerFeedback(
        work_id=req.work_id,
        flag_true_or_false=req.verdict,
        note=req.note or "",
        officer_role=current_user.role,
    )
    db.add(fb)
    db.commit()
    return {"status": "ok", "feedback_id": fb.id}


@feedback_router.get("")
def list_flagged_works(
    min_risk: float = 40.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Review queue — all works with risk score above threshold, with feedback status."""
    q = (
        db.query(Work)
        .join(RiskScore, isouter=True)
        .filter(RiskScore.score_0_100 >= min_risk)
        .order_by(RiskScore.score_0_100.desc())
    )
    if current_user.role == "district_user" and current_user.linked_constituency:
        q = q.filter(Work.constituency == current_user.linked_constituency)

    q = q.limit(200)

    import json
    results = []
    for w in q.all():
        fb = db.query(OfficerFeedback).filter(OfficerFeedback.work_id == w.id).order_by(OfficerFeedback.created_at.desc()).first()
        results.append({
            "work_id": w.id,
            "title": w.title[:80],
            "constituency": w.constituency,
            "state": w.state,
            "status": w.status,
            "risk_score": w.risk_score.score_0_100 if w.risk_score else None,
            "shap_reasons": json.loads(w.risk_score.shap_reasons_json or "[]") if w.risk_score else [],
            "guideline_clause": w.risk_score.guideline_clause if w.risk_score else None,
            "feedback_status": ("verified" if fb and fb.flag_true_or_false else
                               "false_alarm" if fb and not fb.flag_true_or_false else "pending"),
            "feedback_note": fb.note if fb else None,
        })
    return results


# ── Citizen router ────────────────────────────────────────────────────────────
citizen_router = APIRouter(prefix="/api/citizen", tags=["citizen"])


@citizen_router.get("/work/{work_id}", response_model=CitizenWorkOut)
def citizen_work(work_id: int, db: Session = Depends(get_db)):
    """Public endpoint — no login required. Returns only public-safe fields."""
    w = db.query(Work).filter(Work.id == work_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Work not found")

    rs = w.risk_score
    if rs:
        if rs.score_0_100 >= 70:
            risk_level = "high"
        elif rs.score_0_100 >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
    else:
        risk_level = "low"

    # Verified badge: based on officer feedback
    fb = db.query(OfficerFeedback).filter(OfficerFeedback.work_id == work_id).order_by(OfficerFeedback.created_at.desc()).first()
    if fb and fb.flag_true_or_false:
        verified_badge = "flagged"
    elif fb and not fb.flag_true_or_false:
        verified_badge = "verified"
    else:
        verified_badge = "pending"

    photos_out = [
        PhotoOut(
            id=p.id,
            file_path=p.file_path,
            gps_lat=None,  # Don't expose exact GPS publicly
            gps_lng=None,
            timestamp=p.timestamp,
            phash=None,
            is_synthetic_sample=p.is_synthetic_sample,
            progress_pct_claimed=p.progress_pct_claimed,
        )
        for p in (w.photos or [])[:3]
    ]

    return CitizenWorkOut(
        work_id_source=w.work_id_source,
        title=w.title,
        category=w.category,
        status=w.status,
        sanctioned_amount=w.sanctioned_amount or 0,
        constituency=w.constituency,
        state=w.state,
        has_images=w.has_images,
        completion_date=w.completion_date,
        verified_badge=verified_badge,
        risk_level=risk_level,
        photos=photos_out,
    )


# ── Risk router ───────────────────────────────────────────────────────────────
risk_router = APIRouter(prefix="/api/risk", tags=["risk"])


@risk_router.get("/{work_id}")
def get_risk(work_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import json
    w = db.query(Work).filter(Work.id == work_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Work not found")
    rs = w.risk_score
    if not rs:
        raise HTTPException(status_code=404, detail="Risk score not computed yet — run engines first")
    return {
        "work_id": work_id,
        "score": rs.score_0_100,
        "engine_breakdown": json.loads(rs.engine_breakdown_json or "{}"),
        "shap_reasons": json.loads(rs.shap_reasons_json or "[]"),
        "confidence_by_irregularity": json.loads(rs.confidence_by_irregularity_json or "{}"),
        "guideline_clause": rs.guideline_clause,
        "computed_at": rs.computed_at.isoformat() if rs.computed_at else None,
    }
