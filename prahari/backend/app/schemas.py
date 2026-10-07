"""Pydantic schemas for all API responses (§11)."""
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


# ── Auth ────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str
    username: str
    linked_mp_id: Optional[int] = None
    linked_constituency: Optional[str] = None
    linked_state: Optional[str] = None


class MeResponse(BaseModel):
    id: int
    username: str
    role: str
    linked_mp_id: Optional[int] = None
    linked_constituency: Optional[str] = None
    linked_state: Optional[str] = None


# ── MP ───────────────────────────────────────────────────────────────────────
class MPOut(BaseModel):
    id: int
    name: str
    house: Optional[str]
    state: Optional[str]
    constituency: Optional[str]
    entitlement_total: float
    allocated_amount: float
    total_expenditure: float
    utilization_pct: float
    completed_works_count: int
    recommended_works_count: int
    completion_rate_pct: float
    balance_unpaid: float

    class Config:
        from_attributes = True


# ── Work ─────────────────────────────────────────────────────────────────────
class WorkSummary(BaseModel):
    id: int
    work_id_source: Optional[str]
    title: str
    category: Optional[str]
    state: Optional[str]
    constituency: Optional[str]
    implementing_agency: Optional[str]
    sanctioned_amount: float
    final_amount: float
    status: str
    has_images: bool
    lat: Optional[float]
    lng: Optional[float]
    risk_score: Optional[float] = None
    mp_name: Optional[str] = None

    class Config:
        from_attributes = True


class RiskScoreOut(BaseModel):
    score_0_100: float
    engine_breakdown: dict
    shap_reasons: list[str]
    confidence_by_irregularity: dict
    guideline_clause: Optional[str]
    computed_at: Optional[datetime]

    class Config:
        from_attributes = True


class PhotoOut(BaseModel):
    id: int
    file_path: Optional[str]
    gps_lat: Optional[float]
    gps_lng: Optional[float]
    timestamp: Optional[datetime]
    phash: Optional[str]
    is_synthetic_sample: bool
    progress_pct_claimed: Optional[int]

    class Config:
        from_attributes = True


class WorkDetail(BaseModel):
    id: int
    work_id_source: Optional[str]
    title: str
    category: Optional[str]
    state: Optional[str]
    constituency: Optional[str]
    implementing_agency: Optional[str]
    sanctioned_amount: float
    final_amount: float
    sanctioned_date: Optional[datetime]
    completion_date: Optional[datetime]
    status: str
    has_images: bool
    avg_rating: Optional[float]
    lat: Optional[float]
    lng: Optional[float]
    unit_quantity: Optional[float]
    unit_type: Optional[str]
    mp_name: Optional[str] = None
    risk_score: Optional[RiskScoreOut] = None
    photos: list[PhotoOut] = []

    class Config:
        from_attributes = True


# ── Progress photo check ──────────────────────────────────────────────────────
class ProgressCheckOut(BaseModel):
    work_id: int
    authenticity_score: float
    verdict: str
    subcheck_breakdown: dict
    previous_photo_id: Optional[int]
    new_photo_id: Optional[int]
    is_within_deadline: Optional[bool] = True
    deadline_status: Optional[str] = "Within 1-Year Deadline"
    new_progress_pct: Optional[int] = 100
    work_completed: Optional[bool] = False
    message: Optional[str] = ""


# ── Dashboard ─────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    role: str
    scope_id: Optional[str]
    total_works: int
    completed: int
    recommended: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    total_sanctioned: float
    total_expenditure: float
    utilization_pct: float
    duplicate_flag_count: int
    vendor_collusion_count: int
    top_risk_works: list[WorkSummary]
    chart_progress_breakdown: dict
    chart_fund_utilization: dict
    chart_risk_histogram: list[dict]
    chart_trend_monthly: list[dict]
    national_kpis: Optional[dict] = None


# ── Vendors ───────────────────────────────────────────────────────────────────
class VendorGraphOut(BaseModel):
    nodes: list[dict]
    edges: list[dict]
    clusters: list[dict]
    concentration_flags: list[dict]
    node_count: int
    edge_count: int
    collusion_ring_count: int


# ── Upload ───────────────────────────────────────────────────────────────────
class UploadPreviewOut(BaseModel):
    upload_id: str
    detected_type: str
    row_count: int
    preview_rows: list[dict]
    column_mapping: dict
    issues: list[str]


class JobStatusOut(BaseModel):
    job_id: str
    status: str
    stage: Optional[str]
    progress_pct: float
    log: list[str]


# ── Feedback ──────────────────────────────────────────────────────────────────
class FeedbackIn(BaseModel):
    work_id: int
    verdict: bool
    note: Optional[str] = ""
    officer_role: Optional[str] = "admin"


# ── Assistant ─────────────────────────────────────────────────────────────────
class ChatHistoryItem(BaseModel):
    role: str
    text: str


class ChatMessage(BaseModel):
    message: str
    history: Optional[list[ChatHistoryItem]] = None
    mp_scope_id: Optional[int] = None
    api_key: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    source: str = "claude"


class QueryRequest(BaseModel):
    message: str
    mp_scope_id: Optional[int] = None
    api_key: Optional[str] = None


class QueryResponse(BaseModel):
    sql: str
    results: list[dict]
    row_count: int


# ── Citizen ───────────────────────────────────────────────────────────────────
class CitizenWorkOut(BaseModel):
    work_id_source: Optional[str]
    title: str
    category: Optional[str]
    status: str
    sanctioned_amount: float
    constituency: Optional[str]
    state: Optional[str]
    has_images: bool
    completion_date: Optional[datetime]
    verified_badge: str   # 'verified' | 'flagged' | 'pending'
    risk_level: str       # 'low' | 'medium' | 'high' (no score number exposed)
    photos: list[PhotoOut] = []
