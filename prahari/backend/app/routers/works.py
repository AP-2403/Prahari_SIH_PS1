"""Works endpoints — GET /api/works, GET /api/works/{id} (§11)."""
import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Work, RiskScore, MP
from ..schemas import WorkSummary, WorkDetail, RiskScoreOut, PhotoOut
from .auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/works", tags=["works"])


def _risk_score_out(rs) -> Optional[RiskScoreOut]:
    if not rs:
        return None
    return RiskScoreOut(
        score_0_100=rs.score_0_100,
        engine_breakdown=json.loads(rs.engine_breakdown_json or "{}"),
        shap_reasons=json.loads(rs.shap_reasons_json or "[]"),
        confidence_by_irregularity=json.loads(rs.confidence_by_irregularity_json or "{}"),
        guideline_clause=rs.guideline_clause,
        computed_at=rs.computed_at,
    )


def _work_summary(w: Work) -> WorkSummary:
    rs_score = w.risk_score.score_0_100 if w.risk_score else None
    mp_name = w.mp.name if w.mp else None
    return WorkSummary(
        id=w.id,
        work_id_source=w.work_id_source,
        title=w.title,
        category=w.category,
        state=w.state,
        constituency=w.constituency,
        implementing_agency=w.implementing_agency,
        sanctioned_amount=w.sanctioned_amount or 0,
        final_amount=w.final_amount or 0,
        status=w.status,
        has_images=w.has_images,
        lat=w.lat,
        lng=w.lng,
        risk_score=rs_score,
        mp_name=mp_name,
    )


@router.get("", response_model=list[WorkSummary])
def list_works(
    district: Optional[str] = Query(None),
    mp: Optional[str] = Query(None),
    mp_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    min_risk: Optional[float] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Scope filter for non-admin users
    q = db.query(Work)

    if current_user.role == "mp_user" and current_user.linked_mp_id:
        q = q.filter(Work.mp_id == current_user.linked_mp_id)
    elif current_user.role == "district_user" and current_user.linked_constituency:
        q = q.filter(Work.constituency == current_user.linked_constituency)

    if district:
        q = q.filter(Work.constituency.ilike(f"%{district}%"))
    if mp_id:
        q = q.filter(Work.mp_id == mp_id)
    if state:
        q = q.filter(Work.state.ilike(f"%{state}%"))
    if status:
        q = q.filter(Work.status == status)
    if min_risk is not None:
        q = q.join(RiskScore, isouter=True).filter(RiskScore.score_0_100 >= min_risk)

    works = q.offset(offset).limit(limit).all()
    return [_work_summary(w) for w in works]


@router.get("/{work_id}", response_model=WorkDetail)
def get_work(
    work_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    w = db.query(Work).filter(Work.id == work_id).first()
    if not w:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Work not found")

    # Scope enforcement
    if current_user.role == "mp_user" and current_user.linked_mp_id:
        if w.mp_id != current_user.linked_mp_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not in your scope")
    elif current_user.role == "district_user" and current_user.linked_constituency:
        if w.constituency != current_user.linked_constituency:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not in your scope")

    photos_out = [
        PhotoOut(
            id=p.id,
            file_path=p.file_path,
            gps_lat=p.gps_lat,
            gps_lng=p.gps_lng,
            timestamp=p.timestamp,
            phash=p.phash,
            is_synthetic_sample=p.is_synthetic_sample,
            progress_pct_claimed=p.progress_pct_claimed,
        )
        for p in (w.photos or [])
    ]

    return WorkDetail(
        id=w.id,
        work_id_source=w.work_id_source,
        title=w.title,
        category=w.category,
        state=w.state,
        constituency=w.constituency,
        implementing_agency=w.implementing_agency,
        sanctioned_amount=w.sanctioned_amount or 0,
        final_amount=w.final_amount or 0,
        sanctioned_date=w.sanctioned_date,
        completion_date=w.completion_date,
        status=w.status,
        has_images=w.has_images,
        avg_rating=w.avg_rating,
        lat=w.lat,
        lng=w.lng,
        unit_quantity=w.unit_quantity,
        unit_type=w.unit_type,
        mp_name=w.mp.name if w.mp else None,
        risk_score=_risk_score_out(w.risk_score),
        photos=photos_out,
    )
