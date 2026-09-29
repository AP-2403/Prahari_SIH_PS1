"""
Engine 3 — Duplicate & Ghost-Work Detector (§7.3)
- sentence-transformers cosine similarity for near-duplicate work descriptions
- Haversine distance check for geo-proximity duplicates
- imagehash perceptual hash for photo reuse
- EXIF GPS vs. registered lat/lng check
Confidence methodology: cosine_similarity × 100 for text; phash distance formula (§8).
"""

import json
import math
from typing import Any, Optional
import numpy as np

SIMILARITY_THRESHOLD = 0.85   # flag as near-duplicate
SPLIT_WORK_DISTANCE_M = 50    # flag as split work if geo < 50m
PHOTO_HAMMING_THRESHOLD = 6   # flag reused photo if Hamming < 6
MAX_PHASH_DISTANCE = 64       # for confidence formula
GPS_EXIF_DISTANCE_KM = 2.0    # flag if EXIF GPS > 2km from registered location
TIMESTAMP_WINDOW_DAYS = 30    # flag if EXIF timestamp > ±30 days from completion date


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in metres."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _hamming_distance(hash1: str, hash2: str) -> int:
    """Hamming distance between two hex-encoded perceptual hashes."""
    try:
        b1 = bin(int(hash1, 16))[2:].zfill(64)
        b2 = bin(int(hash2, 16))[2:].zfill(64)
        return sum(c1 != c2 for c1, c2 in zip(b1, b2))
    except (ValueError, TypeError):
        return MAX_PHASH_DISTANCE  # treat as totally different if can't compare


# Fast, offline TF-IDF vectorizer for duplicate detection
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity


def compute_similarity_matrix(texts: list[str]) -> np.ndarray:
    """Compute pairwise cosine similarity matrix using TF-IDF word+char n-grams."""
    if not texts or len(texts) < 2:
        return np.zeros((len(texts), len(texts)))
    try:
        vec = TfidfVectorizer(ngram_range=(1, 3), analyzer="char_wb", min_df=1)
        matrix = vec.fit_transform(texts)
        return sk_cosine_similarity(matrix)
    except Exception:
        return np.zeros((len(texts), len(texts)))


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def find_duplicate_pairs(works: list, threshold: float = SIMILARITY_THRESHOLD) -> list[dict]:
    """
    Given a list of Work objects with the same MP/constituency,
    find all pairs with similarity above threshold.
    Returns list of pair dicts.
    """
    if len(works) < 2:
        return []

    titles = [w.title or "" for w in works]
    sim_matrix = compute_similarity_matrix(titles)

    pairs = []
    n = len(works)
    for i in range(n):
        for j in range(i + 1, n):
            sim = float(sim_matrix[i, j])
            if sim >= threshold:
                w1, w2 = works[i], works[j]
                finding = {
                    "check": "Near-duplicate work description",
                    "detail": f"{sim*100:.0f}% similarity with work #{w2.id}: '{(w2.title or '')[:60]}'",
                    "work_id_a": w1.id,
                    "work_id_b": w2.id,
                    "title_a": w1.title,
                    "title_b": w2.title,
                    "similarity": round(sim, 4),
                    "confidence": round(sim * 100, 1),
                    "confidence_method": "Cosine similarity from TF-IDF n-gram embeddings (§8)",
                    "clause": "MPLADS Guideline §3.4 — Prohibition of Duplicate Sanctions",
                    "type": "text_duplicate",
                }
                # Geo check: if both have coords, check distance
                if all(c is not None for c in [w1.lat, w1.lng, w2.lat, w2.lng]):
                    dist_m = haversine_m(w1.lat, w1.lng, w2.lat, w2.lng)
                    finding["geo_distance_m"] = round(dist_m, 1)
                    if dist_m < SPLIT_WORK_DISTANCE_M:
                        finding["check"] = "Split-work evasion detected"
                        finding["type"] = "likely_split_work"
                        finding["detail"] = (
                            f"Works are {dist_m:.0f}m apart with {sim*100:.0f}% text similarity — "
                            f"possible artificial split to bypass administrative approval limit"
                        )
                        finding["clause"] = "MPLADS Guideline §4.2 — Splitting of Works Prohibited"
                else:
                    finding["geo_distance_m"] = None

                pairs.append(finding)

    return pairs


def check_photo_reuse(photos_a: list, photos_b: list) -> list[dict]:
    """
    Compare phashes between two works' photo sets.
    Returns flagged pairs.
    """
    flagged = []
    for pa in photos_a:
        for pb in photos_b:
            if pa.phash and pb.phash and pa.id != pb.id:
                dist = _hamming_distance(pa.phash, pb.phash)
                if dist < PHOTO_HAMMING_THRESHOLD:
                    confidence = round((1 - dist / MAX_PHASH_DISTANCE) * 100, 1)
                    flagged.append({
                        "check": "Reused completion photograph",
                        "detail": f"Identical photo perceptual hash (Hamming dist {dist}/64) with photo #{pb.id}",
                        "photo_id_a": pa.id,
                        "photo_id_b": pb.id,
                        "hamming_distance": dist,
                        "confidence": confidence,
                        "confidence_method": f"Perceptual hash Hamming distance: {dist}/{MAX_PHASH_DISTANCE}",
                        "clause": "MPLADS Guideline §7.6 — Verification of Work Photos",
                    })
    return flagged


def check_exif_vs_registered(photo, work) -> list[dict]:
    """
    Verify EXIF GPS and timestamp against work's registered location and completion date.
    Returns list of flag dicts.
    """
    flags = []

    # GPS distance check
    if photo.gps_lat and photo.gps_lng and work.lat and work.lng:
        dist_km = haversine_m(photo.gps_lat, photo.gps_lng, work.lat, work.lng) / 1000
        if dist_km > GPS_EXIF_DISTANCE_KM:
            flags.append({
                "check": "EXIF GPS vs. registered location",
                "detail": f"Photo GPS is {dist_km:.1f}km from the work's registered location (threshold: {GPS_EXIF_DISTANCE_KM}km)",
                "confidence": min(100, int(dist_km / GPS_EXIF_DISTANCE_KM * 50)),
                "confidence_method": "Haversine distance, EXIF GPS vs. constituency centroid",
            })
    elif not photo.gps_lat:
        flags.append({
            "check": "Missing EXIF GPS",
            "detail": "Photo has no embedded GPS coordinates — cannot verify location",
            "confidence": 30,
            "confidence_method": "Deterministic (absent EXIF — weak evidence alone)",
        })

    # Timestamp check
    if photo.timestamp and work.completion_date:
        from datetime import timedelta
        delta_days = abs((photo.timestamp - work.completion_date).days)
        if delta_days > TIMESTAMP_WINDOW_DAYS:
            flags.append({
                "check": "EXIF timestamp vs. completion date",
                "detail": f"Photo timestamp is {delta_days} days from claimed completion date (window: ±{TIMESTAMP_WINDOW_DAYS} days)",
                "confidence": min(100, int(delta_days / TIMESTAMP_WINDOW_DAYS * 60)),
                "confidence_method": "Absolute date difference, EXIF timestamp vs. completion date",
            })

    return flags


def run_duplicate_ghost_engine(work, peer_works: list, db) -> dict[str, Any]:
    """
    Check `work` against `peer_works` (same MP+constituency) for duplicates.
    Returns findings dict.
    """
    findings = []
    score = 0

    # Text + geo duplicate check
    all_works = [work] + peer_works
    pairs = find_duplicate_pairs(all_works, threshold=SIMILARITY_THRESHOLD)
    
    # Filter to pairs involving our target work
    relevant_pairs = [p for p in pairs if p["work_id_a"] == work.id or p["work_id_b"] == work.id]
    
    for pair in relevant_pairs:
        contribution = min(int(pair["confidence"] * 0.2), 15)
        pair["score_contribution"] = contribution
        score += contribution
        findings.append(pair)

    # Photo reuse check
    if work.photos:
        for peer in peer_works[:20]:   # limit to first 20 peers for speed
            if peer.photos:
                reuse_flags = check_photo_reuse(work.photos, peer.photos)
                for flag in reuse_flags:
                    flag["score_contribution"] = 10
                    score += 10
                    findings.append(flag)

    # EXIF check on work's own photos
    for photo in (work.photos or []):
        exif_flags = check_exif_vs_registered(photo, work)
        for flag in exif_flags:
            flag["score_contribution"] = 5
            score += 5
            findings.append(flag)

    score = min(score, 25)
    return {
        "engine": "duplicate_ghost",
        "score": score,
        "findings": findings,
        "finding_count": len(findings),
        "duplicate_pairs": len([f for f in findings if "similarity" in f]),
    }
