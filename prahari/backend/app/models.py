"""ORM models matching §6 of the build specification."""
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, Index
)
from sqlalchemy.orm import relationship
from .database import Base


class MP(Base):
    __tablename__ = "mps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)          # normalized uppercase
    name_raw = Column(String)                                   # as it appears in source file
    house = Column(String)                                      # 'Lok Sabha' | 'Rajya Sabha'
    state = Column(String, index=True)
    constituency = Column(String, index=True)
    entitlement_total = Column(Float, default=0.0)

    # From mplads_mp_summary
    allocated_amount = Column(Float, default=0.0)
    amount_recommended = Column(Float, default=0.0)
    total_expenditure = Column(Float, default=0.0)
    utilization_pct = Column(Float, default=0.0)
    completed_works_count = Column(Integer, default=0)
    recommended_works_count = Column(Integer, default=0)
    completion_rate_pct = Column(Float, default=0.0)
    balance_unpaid = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    successful_payments = Column(Integer, default=0)
    pending_payments = Column(Integer, default=0)
    avg_rating = Column(String)

    works = relationship("Work", back_populates="mp")
    users = relationship("User", back_populates="linked_mp")


class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    work_id_source = Column(String, index=True)    # original Work ID from CSV
    title = Column(Text, nullable=False)
    category = Column(String, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"), index=True)
    state = Column(String, index=True)
    constituency = Column(String, index=True)
    implementing_agency = Column(String)
    sanctioned_amount = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    sanctioned_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String, default="Recommended")  # 'Recommended' | 'Completed'
    has_images = Column(Boolean, default=False)
    avg_rating = Column(Float, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    unit_quantity = Column(Float, nullable=True)
    unit_type = Column(String, nullable=True)

    mp = relationship("MP", back_populates="works")
    payments = relationship("Payment", back_populates="work")
    photos = relationship("Photo", back_populates="work")
    risk_score = relationship("RiskScore", back_populates="work", uselist=False)
    progress_checks = relationship("ProgressCheck", back_populates="work")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)

    payments = relationship("Payment", back_populates="vendor")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True, index=True)
    amount = Column(Float, default=0.0)
    payment_date = Column(DateTime, nullable=True)
    payment_status = Column(String)
    match_confidence = Column(Float, default=0.0)   # 0-1: how confident the join was
    match_method = Column(String)                   # 'exact' | 'semantic' | 'unmatched'

    # Raw denormalized fields for display
    mp_name_raw = Column(String)
    constituency_raw = Column(String)
    state_raw = Column(String)
    work_description_raw = Column(Text)
    ida_raw = Column(String)

    work = relationship("Work", back_populates="payments")
    vendor = relationship("Vendor", back_populates="payments")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), index=True)
    file_path = Column(String)
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    timestamp = Column(DateTime, nullable=True)
    phash = Column(String, nullable=True)           # hex perceptual hash
    is_synthetic_sample = Column(Boolean, default=False)
    progress_pct_claimed = Column(Integer, nullable=True)  # 25/50/75/100
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    work = relationship("Work", back_populates="photos")


class ProgressCheck(Base):
    __tablename__ = "progress_checks"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), index=True)
    previous_photo_id = Column(Integer, ForeignKey("photos.id"), nullable=True)
    new_photo_id = Column(Integer, ForeignKey("photos.id"), nullable=True)
    authenticity_score = Column(Float)   # 0-100
    subcheck_breakdown_json = Column(Text)   # JSON string
    verdict = Column(String)   # 'genuine' | 'reused' | 'inconclusive'
    computed_at = Column(DateTime, default=datetime.utcnow)

    work = relationship("Work", back_populates="progress_checks")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), unique=True, index=True)
    score_0_100 = Column(Float, default=0.0)
    engine_breakdown_json = Column(Text)     # per-engine sub-scores
    shap_reasons_json = Column(Text)         # top 3-5 SHAP reasons as list
    confidence_by_irregularity_json = Column(Text)   # §8 method-typed percentages
    guideline_clause = Column(Text, nullable=True)
    computed_at = Column(DateTime, default=datetime.utcnow)

    work = relationship("Work", back_populates="risk_score")


class OfficerFeedback(Base):
    __tablename__ = "officer_feedback"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), index=True)
    flag_true_or_false = Column(Boolean)   # True = genuine issue, False = false alarm
    note = Column(Text)
    officer_role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)   # 'admin' | 'mp_user' | 'district_user'
    linked_mp_id = Column(Integer, ForeignKey("mps.id"), nullable=True)
    linked_constituency = Column(String, nullable=True)
    linked_state = Column(String, nullable=True)

    linked_mp = relationship("MP", back_populates="users")


class VendorEdge(Base):
    """Stores graph edges for the vendor network (substitute for Neo4j)."""
    __tablename__ = "vendor_edges"

    id = Column(Integer, primary_key=True, index=True)
    from_node = Column(String, nullable=False, index=True)   # MP/District/Agency/Vendor name
    to_node = Column(String, nullable=False, index=True)
    from_type = Column(String)   # 'mp' | 'district' | 'agency' | 'vendor'
    to_type = Column(String)
    weight = Column(Float, default=1.0)    # total payment value
    louvain_community = Column(Integer, nullable=True)


class JobStatus(Base):
    """Tracks async processing job state for the Processing Console."""
    __tablename__ = "job_statuses"

    id = Column(String, primary_key=True)   # UUID
    status = Column(String, default="pending")   # pending/running/done/error
    stage = Column(String, nullable=True)
    log_json = Column(Text, default="[]")
    progress_pct = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
