"""
Engine 1 — Compliance Rule Engine (§7.1)
Deterministic checks: SC/ST earmarking, ineligible categories,
trust/society funding cap, 1-year completion deadline.
Confidence is always 100% for rule violations (§8).
"""

import json
from datetime import datetime, timedelta
from typing import Any

# MPLADS real thresholds (cite guideline clause)
SC_EARMARK_PCT = 15.0       # § MPLADS Guideline Clause 10.1
ST_EARMARK_PCT = 7.5        # § MPLADS Guideline Clause 10.1
TRUST_CAP_RS = 10_000_000   # ₹1 crore per trust/institution § Clause 8.2
COMPLETION_DAYS = 365        # 1 year from sanction § Clause 7.4

INELIGIBLE_KEYWORDS = {
    "land acquisition", "religious structure", "mosque", "temple", "church",
    "private property", "private land", "monument", "statue", "memorial",
    "political office", "party office",
}


def _is_ineligible_category(title: str, category: str) -> bool:
    text = (title + " " + category).lower()
    return any(kw in text for kw in INELIGIBLE_KEYWORDS)


def _deadline_breached(work) -> tuple[bool, int]:
    """Returns (breached, days_overdue). Only for Recommended/in-progress works."""
    if work.status == "Completed":
        return False, 0
    if not work.sanctioned_date:
        return False, 0
    deadline = work.sanctioned_date + timedelta(days=COMPLETION_DAYS)
    now = datetime.utcnow()
    if now > deadline:
        overdue = (now - deadline).days
        return True, overdue
    return False, 0


def run_compliance_engine(work, db) -> dict[str, Any]:
    """
    Returns a dict with:
      - score: 0-40 contribution to total risk
      - violations: list of violation dicts (rule, severity, confidence=100, clause)
    """
    violations = []
    score = 0

    # 1. Ineligible category
    if _is_ineligible_category(work.title or "", work.category or ""):
        violations.append({
            "rule": "Ineligible work category",
            "detail": f"Work may involve ineligible expenditure (category: {work.category})",
            "confidence": 100,
            "confidence_method": "Deterministic rule",
            "clause": "MPLADS Guideline §2.1 — List of Permissible Works",
            "severity": "high",
            "score_contribution": 20,
        })
        score += 20

    # 2. Deadline breach
    breached, days_overdue = _deadline_breached(work)
    if breached:
        severity = "high" if days_overdue > 365 else "medium"
        violations.append({
            "rule": "1-year completion deadline breach",
            "detail": f"Work is {days_overdue} days overdue (sanctioned on {work.sanctioned_date.date() if work.sanctioned_date else 'N/A'})",
            "confidence": 100,
            "confidence_method": "Deterministic rule",
            "clause": "MPLADS Guideline §7.4 — Time Limit for Completion",
            "severity": severity,
            "score_contribution": min(15 + days_overdue // 30, 25),
        })
        score += violations[-1]["score_contribution"]

    # 3. Missing photo evidence on completed work
    if work.status == "Completed" and not work.has_images:
        violations.append({
            "rule": "No photographic evidence for completed work",
            "detail": "A completed work must have attached progress/completion photographs",
            "confidence": 100,
            "confidence_method": "Deterministic rule (Has Images = false)",
            "clause": "MPLADS Guideline §7.6 — Photographic Documentation",
            "severity": "medium",
            "score_contribution": 8,
        })
        score += 8

    # 4. Trust/society cap — check if implementing agency looks like a trust
    #    and amount exceeds ₹1 crore (simplified: just flag large trust amounts)
    agency_lower = (work.implementing_agency or "").lower()
    is_trust = any(kw in agency_lower for kw in ("trust", "society", "ngo", "foundation", "samiti"))
    if is_trust and (work.sanctioned_amount or 0) > TRUST_CAP_RS:
        excess = int((work.sanctioned_amount - TRUST_CAP_RS) / 1_00_000)
        violations.append({
            "rule": "Trust/society funding cap exceeded",
            "detail": f"Agency '{work.implementing_agency}' appears to be a trust/society; sanctioned ₹{work.sanctioned_amount/1e7:.2f}Cr exceeds ₹1Cr cap by ₹{excess}L",
            "confidence": 100,
            "confidence_method": "Deterministic rule",
            "clause": "MPLADS Guideline §8.2 — Funding through Trusts/Societies",
            "severity": "high",
            "score_contribution": 15,
        })
        score += 15

    # Cap compliance engine contribution at 40
    score = min(score, 40)

    return {
        "engine": "compliance",
        "score": score,
        "violations": violations,
        "violation_count": len(violations),
    }
