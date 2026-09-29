"""
SHAP Explainability Wrapper (§7.6)
Converts engine outputs into plain-English "why" reasons.
Also runs SHAP on the GradientBoosting model.
"""

import json
from typing import Any

# Engine weights for the combined 0-100 score
ENGINE_WEIGHTS = {
    "compliance": 1.0,          # 0-40 points
    "financial_anomaly": 1.0,   # 0-35 points
    "duplicate_ghost": 1.0,     # 0-25 points
    "vendor_network": 1.0,      # 0-15 points (extra points add to total)
    "predictive_delay": 1.0,    # 0-10 points
}
# Max sum without capping = 40+35+25+15+10 = 125; we map to 0-100
MAX_RAW_SCORE = 125.0


def combine_scores(engine_results: dict[str, dict]) -> tuple[float, dict]:
    """
    Weighted sum of all engine sub-scores → normalised 0-100.
    Returns (combined_score, breakdown_dict).
    """
    raw = 0.0
    breakdown = {}
    for engine_name, result in engine_results.items():
        sub = result.get("score", 0)
        breakdown[engine_name] = sub
        raw += sub * ENGINE_WEIGHTS.get(engine_name, 1.0)

    combined = min(round(raw / MAX_RAW_SCORE * 100, 1), 100.0)
    return combined, breakdown


def _top_findings(engine_results: dict[str, dict], top_n: int = 5) -> list[dict]:
    """Collect all individual findings sorted by score_contribution descending."""
    all_findings = []
    
    for engine_name, result in engine_results.items():
        for key in ("violations", "findings"):
            for finding in result.get(key, []):
                finding = dict(finding)
                finding["engine"] = engine_name
                all_findings.append(finding)
    
    return sorted(all_findings, key=lambda f: f.get("score_contribution", 0), reverse=True)[:top_n]


def _finding_to_english(finding: dict) -> str:
    """Convert a structured finding dict to a plain-English sentence."""
    check = finding.get("rule") or finding.get("check") or "Unknown check"
    detail = finding.get("detail", "")
    confidence = finding.get("confidence", 0)
    method = finding.get("confidence_method", "")
    clause = finding.get("clause", "")

    sentence = f"**{check}** ({confidence:.0f}% confidence via {method}): {detail}"
    if clause:
        sentence += f" — *{clause}*"
    return sentence


def generate_shap_reasons(
    work,
    engine_results: dict[str, dict],
    model=None,
) -> tuple[list[str], dict, str | None]:
    """
    Returns:
      - reasons: list of 3-5 plain-English explanation strings
      - confidence_by_irregularity: dict mapping irregularity_type → confidence_dict
      - top_guideline_clause: most relevant clause string (if any)
    """
    top_findings = _top_findings(engine_results, top_n=5)

    reasons = []
    for f in top_findings:
        reasons.append(_finding_to_english(f))

    # Build the confidence_by_irregularity structure (§8)
    confidence_by_irregularity = {}
    for engine_name, result in engine_results.items():
        for key in ("violations", "findings"):
            for finding in result.get(key, []):
                check_name = finding.get("rule") or finding.get("check") or "unknown"
                safe_key = check_name.lower().replace(" ", "_").replace("/", "_")[:40]
                confidence_by_irregularity[safe_key] = {
                    "label": check_name,
                    "confidence": finding.get("confidence", 0),
                    "method": finding.get("confidence_method", ""),
                    "detail": finding.get("detail", ""),
                    "clause": finding.get("clause", ""),
                    "engine": engine_name,
                    "score_contribution": finding.get("score_contribution", 0),
                }

    # Top guideline clause from compliance engine
    top_clause = None
    for v in engine_results.get("compliance", {}).get("violations", []):
        if v.get("clause"):
            top_clause = v["clause"]
            break

# Global caches for explainability and peer lookups
_SHAP_EXPLAINER = None
_PEERS_CACHE = {}


def _get_shap_explainer(model):
    global _SHAP_EXPLAINER
    if _SHAP_EXPLAINER is None and model is not None:
        try:
            import shap
            _SHAP_EXPLAINER = shap.TreeExplainer(model)
        except Exception:
            _SHAP_EXPLAINER = False
    return _SHAP_EXPLAINER if _SHAP_EXPLAINER is not False else None


def generate_shap_reasons(
    work,
    engine_results: dict[str, dict],
    model=None,
) -> tuple[list[str], dict, str | None]:
    """
    Returns:
      - reasons: list of 3-5 plain-English explanation strings
      - confidence_by_irregularity: dict mapping irregularity_type → confidence_dict
      - top_guideline_clause: most relevant clause string (if any)
    """
    top_findings = _top_findings(engine_results, top_n=5)

    reasons = []
    for f in top_findings:
        reasons.append(_finding_to_english(f))

    # Build the confidence_by_irregularity structure (§8)
    confidence_by_irregularity = {}
    for engine_name, result in engine_results.items():
        for key in ("violations", "findings"):
            for finding in result.get(key, []):
                check_name = finding.get("rule") or finding.get("check") or "unknown"
                safe_key = check_name.lower().replace(" ", "_").replace("/", "_")[:40]
                confidence_by_irregularity[safe_key] = {
                    "label": check_name,
                    "confidence": finding.get("confidence", 0),
                    "method": finding.get("confidence_method", ""),
                    "detail": finding.get("detail", ""),
                    "clause": finding.get("clause", ""),
                    "engine": engine_name,
                    "score_contribution": finding.get("score_contribution", 0),
                }

    # Top guideline clause from compliance engine
    top_clause = None
    for v in engine_results.get("compliance", {}).get("violations", []):
        if v.get("clause"):
            top_clause = v["clause"]
            break

    # If model + SHAP available, try to get feature importances as extra reason
    if model is not None:
        try:
            expl = _get_shap_explainer(model)
            if expl is not None:
                import numpy as np
                from .predictive_delay import _extract_features
                features = _extract_features(work, 0.5, 180)
                shap_values = expl.shap_values(np.array([features]))
                feature_names = [
                    "work_age_days", "category_risk", "amount_log10",
                    "agency_on_time_rate", "days_since_payment", "has_images"
                ]
                if shap_values is not None:
                    sv = shap_values[0] if isinstance(shap_values, list) else shap_values[0]
                    top_shap = sorted(zip(feature_names, sv), key=lambda x: abs(x[1]), reverse=True)[:3]
                    shap_sentence = "SHAP top drivers: " + "; ".join(
                        f"{name}={val:+.3f}" for name, val in top_shap
                    )
                    reasons.append(shap_sentence)
        except Exception:
            pass  # SHAP is enhancement, not required

    if not reasons:
        reasons = ["No significant anomalies detected by any engine."]

    return reasons, confidence_by_irregularity, top_clause


def run_all_engines_for_work(work, db, graph_cache: dict | None = None, delay_model=None):
    """
    Orchestrator: run all 5 engines for a single work, combine, persist to RiskScore.
    Returns the full engine_results dict.
    """
    from . import compliance as comp_engine
    from . import financial_anomaly as fin_engine
    from . import duplicate_ghost as dup_engine
    from . import vendor_network as vnet_engine
    from . import predictive_delay as delay_engine
    from ..models import Work, Payment, RiskScore

    # Compliance
    comp_result = comp_engine.run_compliance_engine(work, db)

    # Financial anomaly — peers in same category
    global _PEERS_CACHE
    cat = work.category or "Normal/Others"
    if cat not in _PEERS_CACHE:
        _PEERS_CACHE[cat] = (
            db.query(Work)
            .filter(Work.category == cat)
            .limit(100)
            .all()
        )
    peers = _PEERS_CACHE[cat]

    work_payments = db.query(Payment).filter(Payment.work_id == work.id).all()
    agency_payments = []
    mp_summary = work.mp if work.mp else None

    fin_result = fin_engine.run_financial_anomaly_engine(
        work, peers, work_payments, agency_payments, mp_summary
    )

    # Duplicate/Ghost (peer works in same constituency)
    same_constituency_works = (
        db.query(Work)
        .filter(
            Work.constituency == work.constituency,
            Work.id != work.id,
        )
        .limit(20)
        .all()
    ) if work.constituency else []
    dup_result = dup_engine.run_duplicate_ghost_engine(work, same_constituency_works, db)

    # Vendor Network
    vnet_result = vnet_engine.run_vendor_network_engine(
        work,
        work_payments,
        graph_cache=graph_cache,
    )

    # Predictive Delay
    if delay_model is not None:
        on_time = 0.75
        delay_result = delay_engine.run_predictive_delay_engine(
            work, work_payments, delay_model, on_time
        )
    else:
        delay_result = {"engine": "predictive_delay", "score": 0, "findings": [], "finding_count": 0, "delay_probability": 0}

    engine_results = {
        "compliance": comp_result,
        "financial_anomaly": fin_result,
        "duplicate_ghost": dup_result,
        "vendor_network": vnet_result,
        "predictive_delay": delay_result,
    }

    combined_score, breakdown = combine_scores(engine_results)
    reasons, confidence_by_irregularity, top_clause = generate_shap_reasons(
        work, engine_results, model=delay_model
    )

    # Persist
    existing = db.query(RiskScore).filter(RiskScore.work_id == work.id).first()
    if existing:
        rs = existing
    else:
        rs = RiskScore(work_id=work.id)
        db.add(rs)

    rs.score_0_100 = combined_score
    rs.engine_breakdown_json = json.dumps(breakdown)
    rs.shap_reasons_json = json.dumps(reasons)
    rs.confidence_by_irregularity_json = json.dumps(confidence_by_irregularity)
    rs.guideline_clause = top_clause
    from datetime import datetime
    rs.computed_at = datetime.utcnow()

    return engine_results, combined_score, reasons
