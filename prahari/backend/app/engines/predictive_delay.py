"""
Engine 5 — Predictive Delay & Lapse Engine (§7.5)
- GradientBoostingClassifier trained on synthetic delay labels
- Features: work age, category, agency historical on-time rate, days since last payment
- Output: predict_proba()[:,1] × 100 = delay probability (§8)
"""

import json
import random
import pickle
import os
from datetime import datetime
from typing import Any

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_model.pkl")

CATEGORY_RISK_BASE = {
    "Normal/Others": 0.35,
    "Road": 0.45,
    "Drinking Water": 0.30,
    "Education": 0.25,
    "Health": 0.28,
    "Sanitation": 0.32,
    "Irrigation": 0.50,
    "Sports": 0.20,
}


def _extract_features(work, agency_on_time_rate: float, days_since_payment: int) -> list[float]:
    """Extract numeric features for delay prediction."""
    now = datetime.utcnow()
    
    # Work age in days from sanction date
    if work.sanctioned_date:
        age_days = (now - work.sanctioned_date).days
    else:
        age_days = 180  # default

    # Category risk
    cat_risk = CATEGORY_RISK_BASE.get(work.category or "Normal/Others", 0.35)

    # Amount relative to median
    amount = work.sanctioned_amount or work.final_amount or 1_000_000
    amount_log = np.log10(max(amount, 1000))

    # Agency on-time rate (0-1)
    on_time = max(0.0, min(1.0, agency_on_time_rate))

    # Days since last payment (capped)
    dsince = min(days_since_payment, 365)

    # Has images (positive signal)
    has_img = 1.0 if work.has_images else 0.0

    return [age_days, cat_risk, amount_log, on_time, dsince, has_img]


def _generate_synthetic_training_data(works: list, payments: list) -> tuple[np.ndarray, np.ndarray]:
    """
    Create synthetic (X, y) training data from the ingested works.
    y=1 means "delayed/lapsed", y=0 means "on time".
    We label completed works as on-time (0) and very-old recommended works as delayed (1).
    """
    random.seed(42)
    X, y = [], []

    train_works = works
    if len(works) > 4000:
        train_works = random.sample(works, 4000)

    # Agency on-time rates: simplified from data
    agency_completed: dict[str, int] = {}
    agency_total: dict[str, int] = {}
    for w in train_works:
        agency = w.implementing_agency or "UNKNOWN"
        agency_total[agency] = agency_total.get(agency, 0) + 1
        if w.status == "Completed":
            agency_completed[agency] = agency_completed.get(agency, 0) + 1

    # Last payment dates per work
    payment_dates: dict[int, datetime] = {}
    for p in payments[:20000]:
        if p.work_id and p.payment_date:
            if p.work_id not in payment_dates or p.payment_date > payment_dates[p.work_id]:
                payment_dates[p.work_id] = p.payment_date

    now = datetime.utcnow()
    for w in train_works:
        agency = w.implementing_agency or "UNKNOWN"
        on_time_rate = (agency_completed.get(agency, 0) / max(agency_total.get(agency, 1), 1))
        
        last_pay = payment_dates.get(w.id)
        days_since = (now - last_pay).days if last_pay else 180

        features = _extract_features(w, on_time_rate, days_since)

        # Label: completed works = 0 (on time), old recommended = 1 (delayed)
        if w.status == "Completed":
            label = 0
        elif w.sanctioned_date and (now - w.sanctioned_date).days > 365:
            label = 1  # definitely overdue
        else:
            # Probabilistic label based on risk factors
            p_delayed = (
                0.1
                + (0.3 if days_since > 180 else 0)
                + (0.2 if on_time_rate < 0.3 else 0)
                + (0.2 if (w.sanctioned_date and (now - w.sanctioned_date).days > 270) else 0)
                + (0.1 if not w.has_images else 0)
            )
            label = 1 if random.random() < p_delayed else 0

        X.append(features)
        y.append(label)

    return np.array(X), np.array(y)


def train_or_load_model(works: list, payments: list) -> tuple[GradientBoostingClassifier, float]:
    """Train the GradientBoosting model (or load if cached). Returns (model, auc)."""
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                cached = pickle.load(f)
            return cached["model"], cached["auc"]
        except Exception:
            pass

    X, y = _generate_synthetic_training_data(works, payments)
    
    if len(X) < 10:
        # Not enough data — return a stub model
        model = GradientBoostingClassifier(n_estimators=10, random_state=42)
        model.fit([[0.5] * 6], [0])
        return model, 0.5

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingClassifier(
        n_estimators=50,
        max_depth=3,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    if len(set(y_test)) > 1:
        proba = model.predict_proba(X_test)[:, 1]
        auc = float(roc_auc_score(y_test, proba))
    else:
        auc = 0.5

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": model, "auc": auc}, f)

    return model, auc


def run_predictive_delay_engine(
    work,
    payments: list,
    model: GradientBoostingClassifier,
    agency_on_time_rate: float,
) -> dict[str, Any]:
    """Predict delay probability for a single work."""
    now = datetime.utcnow()
    work_payments = [p for p in payments if p.work_id == work.id]
    
    last_pay_date = None
    for p in work_payments:
        if p.payment_date:
            if last_pay_date is None or p.payment_date > last_pay_date:
                last_pay_date = p.payment_date

    days_since = (now - last_pay_date).days if last_pay_date else 180

    features = _extract_features(work, agency_on_time_rate, days_since)
    
    try:
        proba = float(model.predict_proba([features])[0][1])
    except Exception:
        proba = 0.3

    delay_probability = round(proba * 100, 1)

    # Severity buckets
    if delay_probability >= 70:
        severity = "high"
        detail = f"High probability ({delay_probability:.0f}%) of missing the 1-year completion deadline"
    elif delay_probability >= 40:
        severity = "medium"
        detail = f"Moderate delay risk ({delay_probability:.0f}%) — agency historical on-time rate: {agency_on_time_rate*100:.0f}%"
    else:
        severity = "low"
        detail = f"Low delay risk ({delay_probability:.0f}%)"

    score = min(int(delay_probability * 0.1), 10)

    findings = []
    if delay_probability >= 40:
        findings.append({
            "check": "Predictive delay risk",
            "detail": detail,
            "confidence": delay_probability,
            "confidence_method": "GradientBoostingClassifier.predict_proba()[:,1] × 100 (§8)",
            "severity": severity,
            "score_contribution": score,
        })

    return {
        "engine": "predictive_delay",
        "score": score,
        "delay_probability": delay_probability,
        "findings": findings,
        "finding_count": len(findings),
    }
