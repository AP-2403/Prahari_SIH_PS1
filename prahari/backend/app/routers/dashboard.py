"""Dashboard aggregation endpoint — GET /api/dashboard/{role} (§12)."""
import json
from collections import defaultdict
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Work, RiskScore, MP, Payment
from ..schemas import DashboardStats, WorkSummary
from .auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Load the national KPIs from the JSON snapshot (§5.7)
_CANDIDATE_PATHS = [
    Path(__file__).parent.parent.parent / "data" / "json_2026-09-22.json",
    Path(__file__).parent.parent / "data" / "json_2026-09-22.json",
    Path(__file__).parent.parent.parent.parent.parent / "data" / "json_2026-09-22.json",
    Path.cwd() / "data" / "json_2026-09-22.json",
    Path.cwd() / "prahari" / "backend" / "data" / "json_2026-09-22.json",
]

_DEFAULT_NATIONAL_KPIS = {
    "totalAllocated": 116819035627.53,
    "totalExpenditure": 39953382732.14,
    "totalRecommendedAmount": 79081497846.06,
    "utilizationPercentage": 67.69572905755385,
    "recommendationUtilizationPercentage": 67.69572905755385,
    "utilizationDefinition": "recommended_amount",
    "expenditurePercentage": 34.201089332331755,
    "totalMPs": 774,
    "totalWorksCompleted": 44028,
    "totalWorksRecommended": 131141,
    "completionRate": 33.57302445459467,
    "totalTransactions": 108695,
    "avgAllocation": 150928986.59887597,
    "pendingWorks": 87113,
    "paymentGap": 39.714678301233555,
    "completedWorksValue": 24086877004.61,
    "inProgressPayments": 15867357422.53,
}

_national_kpis = None


def _get_national_kpis():
    global _national_kpis
    if _national_kpis is None:
        for p in _CANDIDATE_PATHS:
            try:
                if p.exists():
                    with open(p, encoding="utf-8") as f:
                        raw = json.load(f)
                        data = raw.get("data", {})
                        if data and "totalAllocated" in data:
                            _national_kpis = data
                            return _national_kpis
            except Exception:
                continue
        _national_kpis = _DEFAULT_NATIONAL_KPIS
    return _national_kpis


def _risk_level(score) -> str:
    if score is None:
        return "unknown"
    if score >= 45:
        return "high"
    if score >= 20:
        return "medium"
    return "low"


def _work_summary(w: Work) -> WorkSummary:
    rs_score = w.risk_score.score_0_100 if w.risk_score else None
    return WorkSummary(
        id=w.id,
        work_id_source=w.work_id_source,
        title=w.title[:80] + "..." if w.title and len(w.title) > 80 else w.title,
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
        mp_name=w.mp.name if w.mp else None,
    )


def _aggregate_works(works: list[Work]) -> DashboardStats:
    """Compute all chart data from a list of Work rows."""
    total = len(works)
    completed = sum(1 for w in works if w.status == "Completed")
    recommended = sum(1 for w in works if w.status == "Recommended")

    # Risk buckets
    high = medium = low = 0
    risk_histogram = [{"bucket": f"{i*20}-{i*20+19}", "count": 0} for i in range(5)]
    for w in works:
        score = w.risk_score.score_0_100 if w.risk_score else None
        if score is None:
            continue
        if score >= 45:
            high += 1
        elif score >= 20:
            medium += 1
        else:
            low += 1
        bucket_idx = min(int(score // 20), 4)
        risk_histogram[bucket_idx]["count"] += 1

    # Fund utilization
    total_sanc = sum(w.sanctioned_amount or 0 for w in works)
    total_exp = sum(w.final_amount or 0 for w in works)
    util_pct = (total_exp / total_sanc * 100) if total_sanc > 0 else 0

    # Top 10 highest risk works
    scored_works = [w for w in works if w.risk_score]
    top_risk = sorted(scored_works, key=lambda w: w.risk_score.score_0_100, reverse=True)[:10]

    # Progress breakdown (donut)
    progress_breakdown = {
        "completed": completed,
        "recommended": recommended,
        "total": total,
        "completed_pct": round(completed / max(total, 1) * 100, 1),
        "recommended_pct": round(recommended / max(total, 1) * 100, 1),
    }

    # Fund utilization chart
    fund_chart = {
        "sanctioned": round(total_sanc),
        "used": round(total_exp),
        "remaining": round(total_sanc - total_exp),
        "utilization_pct": round(util_pct, 1),
    }

    # Monthly trend — use completion dates
    monthly: dict[str, float] = defaultdict(float)
    for w in works:
        if w.completion_date and w.final_amount:
            key = w.completion_date.strftime("%Y-%m")
            monthly[key] += w.final_amount
    trend_monthly = [
        {"month": k, "expenditure": round(v)}
        for k, v in sorted(monthly.items())[-18:]
    ]

    # Duplicate flag count — works with duplicate_ghost score > 0
    dup_count = sum(
        1 for w in works
        if w.risk_score and json.loads(w.risk_score.engine_breakdown_json or "{}").get("duplicate_ghost", 0) > 0
    )
    # Vendor collusion — works with vendor_network score > 0
    vendor_count = sum(
        1 for w in works
        if w.risk_score and json.loads(w.risk_score.engine_breakdown_json or "{}").get("vendor_network", 0) > 0
    )

    return DashboardStats(
        role="computed",
        scope_id=None,
        total_works=total,
        completed=completed,
        recommended=recommended,
        high_risk_count=high,
        medium_risk_count=medium,
        low_risk_count=low,
        total_sanctioned=round(total_sanc),
        total_expenditure=round(total_exp),
        utilization_pct=round(util_pct, 1),
        duplicate_flag_count=dup_count,
        vendor_collusion_count=vendor_count,
        top_risk_works=[_work_summary(w) for w in top_risk],
        chart_progress_breakdown=progress_breakdown,
        chart_fund_utilization=fund_chart,
        chart_risk_histogram=risk_histogram,
        chart_trend_monthly=trend_monthly,
    )


@router.get("/{role}", response_model=DashboardStats)
def get_dashboard(
    role: str,
    id: Optional[str] = Query(None),   # mp_id or constituency
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Work)

    # Role-based scoping
    effective_role = role.lower()

    if current_user.role == "mp_user":
        # Force scope to their MP regardless of requested role
        if current_user.linked_mp_id:
            q = q.filter(Work.mp_id == current_user.linked_mp_id)
        effective_role = "mp"
    elif current_user.role == "district_user":
        if current_user.linked_constituency:
            q = q.filter(Work.constituency == current_user.linked_constituency)
        effective_role = "district"
    else:
        # Admin can filter by role parameter
        if effective_role == "mp" and id:
            try:
                q = q.filter(Work.mp_id == int(id))
            except ValueError:
                pass
        elif effective_role in ("district", "state") and id:
            if effective_role == "district":
                q = q.filter(Work.constituency.ilike(f"%{id}%"))
            else:
                q = q.filter(Work.state.ilike(f"%{id}%"))

    # Prioritize scored works and high risk works for dashboard visibility
    works = (
        q.outerjoin(RiskScore)
        .order_by(RiskScore.score_0_100.desc().nullslast())
        .limit(2000)
        .all()
    )

    stats = _aggregate_works(works)
    stats.role = effective_role
    stats.scope_id = id

    # Attach national KPIs for ministry view
    if effective_role == "ministry" and current_user.role == "admin":
        stats.national_kpis = _get_national_kpis()

    return stats
