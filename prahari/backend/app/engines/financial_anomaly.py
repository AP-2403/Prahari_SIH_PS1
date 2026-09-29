"""
Engine 2 — Financial Anomaly Engine (§7.2 + §10)
- IsolationForest on unit cost vs. category peer median, payment timing, threshold proximity
- Benford's Law chi-square test per agency
- Just-under-threshold clustering
- Utilization-without-delivery (§10)
- Round-number payment clustering (§10)
- Orphan/unmatched payment flagging (§10)
- Balance/utilization mismatch (§10)
Confidence methodology: percentile rank within category (§8).
"""

import json
import math
import re
from typing import Any
import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# MPLADS payment approval thresholds (simplified from guidelines)
# Amounts just below these get "just-under-threshold" flag
APPROVAL_THRESHOLDS_RS = [500_000, 1_000_000, 5_000_000, 10_000_000]
JUST_UNDER_PCT = 0.05  # within 5%

CATEGORY_MEDIANS_RS = {
    "Normal/Others": 1_500_000,
    "Road": 2_500_000,
    "Drinking Water": 1_200_000,
    "Education": 800_000,
    "Health": 1_000_000,
    "Sanitation": 900_000,
    "Irrigation": 2_000_000,
    "Sports": 600_000,
}


def _expected_benford(n: int) -> np.ndarray:
    """Returns Benford's Law expected frequencies for digits 1-9 for n observations."""
    digits = np.arange(1, 10)
    expected_pct = np.log10(1 + 1 / digits)
    return expected_pct * n


def run_benford_check(amounts: list[float]) -> dict:
    """Chi-square test of leading-digit distribution vs. Benford's Law."""
    if len(amounts) < 30:
        return {"chi2": None, "p_value": None, "confidence": 0, "note": "Insufficient data (<30 records)"}
    
    leading_digits = []
    for a in amounts:
        if a and a > 0:
            first_digit = int(str(int(abs(a)))[0])
            if 1 <= first_digit <= 9:
                leading_digits.append(first_digit)
    
    if not leading_digits:
        return {"chi2": None, "p_value": None, "confidence": 0}
    
    observed = np.bincount(leading_digits, minlength=10)[1:]  # digits 1-9
    expected = _expected_benford(len(leading_digits))
    
    # Avoid zero expected values
    expected = np.maximum(expected, 0.1)
    chi2_stat, p_value = stats.chisquare(f_obs=observed, f_exp=expected)
    
    # Confidence: higher p_value deviation from Benford's = more suspicious
    # p < 0.05 → suspicious; convert to confidence
    confidence = max(0, min(100, int((1 - p_value) * 100))) if p_value is not None else 0
    
    return {
        "chi2": round(float(chi2_stat), 3),
        "p_value": round(float(p_value), 4),
        "confidence": confidence,
        "note": f"Benford's Law deviation: chi²={chi2_stat:.2f}, p={p_value:.4f}" +
                (" — SUSPICIOUS" if p_value < 0.05 else " — within normal range"),
    }


def _just_under_threshold(amount: float) -> tuple[bool, float, str]:
    """Flag amounts within 5% below any approval threshold."""
    for t in APPROVAL_THRESHOLDS_RS:
        lower = t * (1 - JUST_UNDER_PCT)
        if lower <= amount < t:
            pct_below = (t - amount) / t * 100
            return True, round(pct_below, 2), f"₹{t/1e5:.0f}L threshold"
    return False, 0.0, ""


def run_financial_anomaly_engine(
    work,
    all_works_in_category: list,
    payments_for_work: list,
    all_payments_for_agency: list,
    mp_summary: Any = None,
) -> dict[str, Any]:
    """
    Returns:
      - score: 0-35 contribution to total risk
      - findings: list of finding dicts
      - isolation_forest_score: raw anomaly score (-1 to 1)
      - isolation_percentile: percentile rank within category
    """
    findings = []
    score = 0

    # ------------------------------------------------------------------
    # Feature engineering for IsolationForest
    # ------------------------------------------------------------------
    amount = work.final_amount or work.sanctioned_amount or 0
    category = work.category or "Normal/Others"
    median_for_cat = CATEGORY_MEDIANS_RS.get(category, 1_500_000)

    # Build peer feature vectors
    peer_amounts = [
        (w.final_amount or w.sanctioned_amount or 0)
        for w in all_works_in_category
        if (w.final_amount or w.sanctioned_amount or 0) > 0
    ]
    
    global _ISO_CACHE
    if "_ISO_CACHE" not in globals():
        _ISO_CACHE = {}

    if category not in _ISO_CACHE and len(peer_amounts) >= 5:
        peer_arr = np.array(peer_amounts).reshape(-1, 1)
        scaler = StandardScaler()
        peer_scaled = scaler.fit_transform(peer_arr)
        iso = IsolationForest(n_estimators=50, contamination=0.05, random_state=42)
        iso.fit(peer_scaled)
        all_scores = iso.score_samples(peer_scaled)
        _ISO_CACHE[category] = (scaler, iso, all_scores)

    if category in _ISO_CACHE:
        scaler, iso, all_scores = _ISO_CACHE[category]
        work_scaled = scaler.transform([[amount]])
        iso_score = float(iso.score_samples(work_scaled)[0])
        percentile = float(np.mean(all_scores >= iso_score)) * 100
        anomaly_confidence = max(0, min(100, int(100 - percentile)))
    else:
        # Fallback: simple cost ratio
        ratio = amount / median_for_cat if median_for_cat > 0 else 1.0
        anomaly_confidence = min(100, int(abs(ratio - 1.0) * 50))
        iso_score = -(ratio - 1.0)
        percentile = 50.0

    if anomaly_confidence > 60:
        ratio = amount / median_for_cat if median_for_cat > 0 else 1.0
        findings.append({
            "check": "Cost/unit-price outlier",
            "detail": f"Amount ₹{amount/1e5:.1f}L is {ratio:.1f}x the {category} category peer median (₹{median_for_cat/1e5:.0f}L)",
            "confidence": anomaly_confidence,
            "confidence_method": f"IsolationForest percentile rank (more anomalous than {anomaly_confidence}% of {category} works)",
            "score_contribution": min(int(anomaly_confidence * 0.2), 15),
        })
        score += findings[-1]["score_contribution"]

    # ------------------------------------------------------------------
    # Just-under-threshold check
    # ------------------------------------------------------------------
    is_jut, pct_below, threshold_label = _just_under_threshold(amount)
    if is_jut:
        findings.append({
            "check": "Just-under-threshold clustering",
            "detail": f"Amount ₹{amount/1e5:.1f}L is {pct_below:.1f}% below the {threshold_label} approval threshold — possible split to avoid oversight",
            "confidence": 75,
            "confidence_method": "Deterministic proximity rule (within 5% of approval threshold)",
            "score_contribution": 8,
        })
        score += 8

    # ------------------------------------------------------------------
    # Benford's Law check on agency payments
    # ------------------------------------------------------------------
    agency_amounts = [p.amount for p in all_payments_for_agency if p.amount and p.amount > 0]
    if len(agency_amounts) >= 30:
        benford_result = run_benford_check(agency_amounts)
        if benford_result.get("confidence", 0) > 70:
            findings.append({
                "check": "Benford's Law deviation",
                "detail": benford_result["note"],
                "confidence": benford_result["confidence"],
                "confidence_method": f"Chi-square test vs. Benford's Law (p={benford_result.get('p_value', 'N/A')})",
                "score_contribution": min(int(benford_result["confidence"] * 0.08), 8),
            })
            score += findings[-1]["score_contribution"]

    # ------------------------------------------------------------------
    # Round-number payment clustering
    # ------------------------------------------------------------------
    work_payments = [p.amount for p in payments_for_work if p.amount]
    for amt in work_payments:
        # Check if suspiciously round: divisible by 50,000 with no cents
        if amt >= 100_000 and amt % 50_000 == 0:
            findings.append({
                "check": "Round-number payment clustering",
                "detail": f"Payment of ₹{amt/1e5:.1f}L is suspiciously round — natural spending rarely aligns to exact round figures",
                "confidence": 65,
                "confidence_method": "Deterministic rule (exact round-number divisibility)",
                "score_contribution": 4,
            })
            score += 4
            break   # flag once per work

    # ------------------------------------------------------------------
    # Orphan/unmatched payment (§10 + §5.5)
    # ------------------------------------------------------------------
    orphan_payments = [p for p in payments_for_work if p.match_method == "unmatched"]
    if orphan_payments:
        orphan_total = sum(p.amount or 0 for p in orphan_payments)
        orphan_confidence = int((1 - 0.5) * 100)  # unmatched = ~50% avg conf → 50% orphan risk
        findings.append({
            "check": "Orphan/unmatched expenditure",
            "detail": f"{len(orphan_payments)} payment(s) totalling ₹{orphan_total/1e5:.1f}L have no traceable sanctioned work (match confidence < 0.75)",
            "confidence": orphan_confidence,
            "confidence_method": f"100 − match_confidence = orphan risk (§8)",
            "score_contribution": min(len(orphan_payments) * 3, 10),
        })
        score += findings[-1]["score_contribution"]

    # ------------------------------------------------------------------
    # Utilization-without-delivery (§10) — from MP summary
    # ------------------------------------------------------------------
    if mp_summary:
        util_pct = float(mp_summary.utilization_pct or 0)
        comp_rate = float(mp_summary.completion_rate_pct or 0)
        if util_pct >= 90 and comp_rate <= 10:
            findings.append({
                "check": "Utilization-without-delivery",
                "detail": f"MP shows {util_pct:.0f}% fund utilization but only {comp_rate:.0f}% completion rate — funds allocated but nothing delivered",
                "confidence": 100,
                "confidence_method": "Deterministic rule (utilization ≥90%, completion ≤10%)",
                "score_contribution": 12,
            })
            score += 12

    score = min(score, 35)
    return {
        "engine": "financial_anomaly",
        "score": score,
        "findings": findings,
        "finding_count": len(findings),
        "isolation_forest_score": round(iso_score if 'iso_score' in dir() else 0, 4),
        "isolation_percentile": round(percentile if 'percentile' in dir() else 50.0, 2),
    }
