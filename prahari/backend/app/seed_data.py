"""
Real MPLADS data ingestion pipeline — §5 of the build spec.

Load order:
  1. MP allocation files (Lok Sabha + Rajya Sabha)
  2. MP Summary rollup
  3. Recommended + Completed works
  4. Expenditures (joined to works via exact then semantic match)
  5. Synthetic augmentation (GPS, sample photos, demo labels)
  6. Seed demo users
"""

import csv
import json
import math
import os
import re
import random
import hashlib
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
BACKEND_DIR = Path(__file__).parent.parent

# ---------------------------------------------------------------------------
# Constituency → (lat, lng) centroids — enough for a national heatmap
# ---------------------------------------------------------------------------
CONSTITUENCY_COORDS = {
    "CHITTOOR": (13.2172, 79.1003), "GHAZIABAD": (28.6692, 77.4538),
    "MUMBAI NORTH": (19.2403, 72.8777), "DELHI": (28.6139, 77.2090),
    "BENGALURU NORTH": (13.0827, 77.5877), "CHENNAI NORTH": (13.0827, 80.2707),
    "KOLKATA NORTH": (22.5726, 88.3639), "HYDERABAD": (17.3850, 78.4867),
    "PUNE": (18.5204, 73.8567), "AHMEDABAD EAST": (23.0225, 72.5714),
    "JAIPUR": (26.9124, 75.7873), "LUCKNOW": (26.8467, 80.9462),
    "PATNA SAHIB": (25.5941, 85.1376), "BHOPAL": (23.2599, 77.4126),
    "SHILLONG": (25.5788, 91.8933), "BARAMULLAH": (34.1977, 74.3636),
    "HINGOLI": (19.7178, 77.1494), "UDALGURI": (26.7527, 92.1020),
}

CATEGORY_MEDIANS = {
    "Normal/Others": 1500000, "Road": 2500000, "Drinking Water": 1200000,
    "Education": 800000, "Health": 1000000, "Sanitation": 900000,
    "Irrigation": 2000000, "Sports": 600000,
}

INELIGIBLE_CATEGORIES = {
    "land acquisition", "religious structures", "private property",
    "monuments", "statues", "memorials",
}


# ---------------------------------------------------------------------------
# Name normalization  (§5.2 — the single shared utility)
# ---------------------------------------------------------------------------
HONORIFICS_RE = re.compile(
    r"^(Dr\.?|Shri\.?|Smt\.?|Kumari\.?|Prof\.?|Er\.?|Adv\.?|Maj\.?|"
    r"Col\.?|Brig\.?|Gen\.?|Lt\.?|Capt\.?|Mr\.?|Mrs\.?|Ms\.?)\s+",
    re.IGNORECASE,
)
TERM_YEAR_RE = re.compile(r"\s*\(\d{4}[-–]\d{2,4}\).*$")


def normalize_mp_name(raw: str) -> str:
    """Strip honorifics, term years, extra whitespace; return UPPERCASE."""
    if not raw:
        return ""
    s = raw.strip()
    # Remove all trailing term-year patterns like (2026-32) (2026-2032)
    s = TERM_YEAR_RE.sub("", s)
    # Remove leading honorific(s)
    for _ in range(3):
        s = HONORIFICS_RE.sub("", s).strip()
    # Normalize unicode → ASCII where possible
    s = unicodedata.normalize("NFKD", s)
    # Upper-case and collapse spaces
    s = " ".join(s.upper().split())
    return s


def _parse_amount(val: str) -> float:
    if not val:
        return 0.0
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


def _parse_date(val: str) -> datetime | None:
    if not val:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val.strip(), fmt)
        except ValueError:
            continue
    return None


def _extract_qty_unit(description: str):
    """Regex-extract quantity and unit from work description (§10)."""
    patterns = [
        (r"(\d+(?:\.\d+)?)\s*(km|kms|kilometre|kilometer)", "km"),
        (r"(\d+(?:\.\d+)?)\s*(m\b|metre|meter|mtr)", "m"),
        (r"(\d+(?:\.\d+)?)\s*(sq\.?\s*m|sqm|square\s+met)", "sqm"),
        (r"(\d+(?:\.\d+)?)\s*(nos?|number|units?)", "nos"),
        (r"(\d+(?:\.\d+)?)\s*(ltr|litre|liter|kl|kilolitre)", "ltr"),
    ]
    d = description.lower()
    for pattern, unit in patterns:
        m = re.search(pattern, d)
        if m:
            try:
                return float(m.group(1)), unit
            except ValueError:
                pass
    return None, None


# ---------------------------------------------------------------------------
# Constituency centroid lookup (best-effort)
# ---------------------------------------------------------------------------
def _get_coords(constituency: str, state: str) -> tuple[float | None, float | None]:
    c = constituency.upper().strip() if constituency else ""
    for key, coords in CONSTITUENCY_COORDS.items():
        if key in c or c in key:
            return coords
    # Jitter by state for heatmap spread
    state_offsets = {
        "Andhra Pradesh": (15.9, 79.7), "Assam": (26.2, 92.9),
        "Bihar": (25.1, 85.3), "Delhi": (28.6, 77.2),
        "Gujarat": (22.3, 72.6), "Karnataka": (15.3, 75.7),
        "Kerala": (10.8, 76.3), "Madhya Pradesh": (23.5, 77.4),
        "Maharashtra": (19.7, 75.7), "Rajasthan": (27.0, 74.2),
        "Tamil Nadu": (11.1, 78.7), "Telangana": (17.8, 79.5),
        "Uttar Pradesh": (26.9, 80.9), "West Bengal": (22.9, 87.9),
        "Meghalaya": (25.6, 91.9), "Jammu And Kashmir": (34.1, 74.8),
    }
    base = state_offsets.get(state, (20.5, 78.9))
    jitter_lat = random.uniform(-1.5, 1.5)
    jitter_lng = random.uniform(-1.5, 1.5)
    return base[0] + jitter_lat, base[1] + jitter_lng


# ---------------------------------------------------------------------------
# Main ingestion
# ---------------------------------------------------------------------------
def seed_database(db, force_reseed: bool = False):
    """
    Entry point called from main.py on startup (only runs if DB is empty).
    Returns a summary dict for the admin console log.
    """
    from . import models  # local import to avoid circular at module level

    if not force_reseed and db.query(models.MP).count() > 0:
        return {"status": "skipped", "reason": "DB already seeded"}

    log = []
    log.append("🔄 Starting real MPLADS data ingestion...")

    # -----------------------------------------------------------------------
    # Step 1 — MP allocation files
    # -----------------------------------------------------------------------
    mp_map: dict[str, models.MP] = {}   # normalized_name → MP ORM object

    def _ingest_mp_file(filepath: Path, house: str, name_col: str):
        if not filepath.exists():
            log.append(f"⚠️  File not found: {filepath.name}")
            return
        with open(filepath, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                raw_name = row.get(name_col, "").strip()
                norm_name = normalize_mp_name(raw_name)
                if not norm_name:
                    continue
                if norm_name in mp_map:
                    continue   # already loaded from the other house file
                state = row.get("State", "").strip()
                constituency = row.get("Constituency", row.get("Elected/Nominated", "")).strip()
                amount = _parse_amount(row.get("Allocated AMOUNT ( ₹ )", "0"))
                mp = models.MP(
                    name=norm_name,
                    name_raw=raw_name,
                    house=house,
                    state=state,
                    constituency=constituency if house == "Lok Sabha" else "",
                    entitlement_total=amount,
                    allocated_amount=amount,
                )
                db.add(mp)
                mp_map[norm_name] = mp
                count += 1
        db.flush()
        log.append(f"  ✅ {house}: loaded {count} MPs")

    _ingest_mp_file(
        DATA_DIR / "Allocated Limit for Honble MPs _Loksabha(1).csv",
        "Lok Sabha", "Hon'ble Members of Parliaments"
    )
    _ingest_mp_file(
        DATA_DIR / "Allocated Limit for Honble MPs_Rajya_sabha.csv",
        "Rajya Sabha", "Hon'ble Members of Parliament"
    )

    # -----------------------------------------------------------------------
    # Step 2 — MP Summary rollup (§5.6)
    # -----------------------------------------------------------------------
    summary_file = DATA_DIR / "mplads_mp_summary_2026-09-22.csv"
    summary_map: dict[str, dict] = {}
    if summary_file.exists():
        with open(summary_file, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                norm = normalize_mp_name(row.get("MP Name", ""))
                if norm:
                    summary_map[norm] = row
        # Apply to MP objects already in mp_map; also create MPs that appear
        # only in summary (edge case)
        for norm_name, row in summary_map.items():
            mp = mp_map.get(norm_name)
            if not mp:
                # Create from summary (some Rajya Sabha MPs not in allocation file edge case)
                house = row.get("House", "Lok Sabha").strip()
                mp = models.MP(
                    name=norm_name,
                    name_raw=row.get("MP Name", ""),
                    house=house,
                    state=row.get("State", "").strip(),
                    constituency=row.get("Constituency", "").strip(),
                )
                db.add(mp)
                mp_map[norm_name] = mp
            mp.state = mp.state or row.get("State", "").strip()
            mp.constituency = mp.constituency or row.get("Constituency", "").strip()
            mp.allocated_amount = _parse_amount(row.get("Allocated Amount (₹)", "0"))
            mp.amount_recommended = _parse_amount(row.get("Amount Recommended (₹)", "0"))
            mp.total_expenditure = _parse_amount(row.get("Total Expenditure (₹)", "0"))
            mp.utilization_pct = _parse_amount(row.get("Utilization %", "0"))
            mp.completed_works_count = int(_parse_amount(row.get("Completed Works", "0")))
            mp.recommended_works_count = int(_parse_amount(row.get("Recommended Works", "0")))
            mp.completion_rate_pct = _parse_amount(row.get("Completion Rate %", "0"))
            mp.balance_unpaid = _parse_amount(row.get("Balance Not Yet Paid to Vendors (₹)", "0"))
            mp.transaction_count = int(_parse_amount(row.get("Transaction Count", "0")))
            mp.successful_payments = int(_parse_amount(row.get("Successful Payments", "0")))
            mp.pending_payments = int(_parse_amount(row.get("Pending Payments", "0")))
            mp.avg_rating = row.get("Average Rating", "N/A")
            if not mp.entitlement_total:
                mp.entitlement_total = mp.allocated_amount
        db.flush()
        log.append(f"  ✅ MP Summary: updated {len(summary_map)} MPs")

    # -----------------------------------------------------------------------
    # Step 3 — Works (Recommended + Completed)
    # -----------------------------------------------------------------------
    work_map: dict[str, models.Work] = {}   # work_id_source → Work ORM object

    # We need MP id lookup by normalized name
    db.flush()  # ensure IDs assigned
    mp_by_norm: dict[str, models.MP] = {m.name: m for m in db.query(models.MP).all()}

    random.seed(42)  # reproducible synthetic augmentation

    def _ingest_works_file(filepath: Path, status: str):
        if not filepath.exists():
            log.append(f"⚠️  File not found: {filepath.name}")
            return 0
        count = 0
        with open(filepath, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                work_id_src = row.get("Work ID", "").strip()
                title = row.get("Work Description", "").strip()
                if not title:
                    continue

                mp_name_raw = row.get("MP Name", "").strip()
                mp_norm = normalize_mp_name(mp_name_raw)
                mp_obj = mp_by_norm.get(mp_norm)
                mp_id = mp_obj.id if mp_obj else None

                constituency = row.get("Constituency", "").strip()
                state = row.get("State", "").strip()
                category = row.get("Category", "Normal/Others").strip()
                agency = row.get("IDA", "").strip()
                has_img_str = row.get("Has Images", "false").strip().lower()
                has_images = has_img_str in ("true", "1", "yes")

                if status == "Recommended":
                    amount = _parse_amount(row.get("Recommended Amount (₹)", "0"))
                    sanc_date = _parse_date(row.get("Recommendation Date", ""))
                    comp_date = None
                    final_amount = 0.0
                    avg_rating = None
                else:
                    amount = _parse_amount(row.get("Final Amount (₹)", "0"))
                    sanc_date = None
                    comp_date = _parse_date(row.get("Completed Date", ""))
                    final_amount = amount
                    try:
                        avg_rating = float(row.get("Average Rating", "") or 0)
                    except ValueError:
                        avg_rating = None

                lat, lng = _get_coords(constituency, state)
                qty, unit = _extract_qty_unit(title)

                w = models.Work(
                    work_id_source=work_id_src,
                    title=title,
                    category=category,
                    mp_id=mp_id,
                    state=state,
                    constituency=constituency,
                    implementing_agency=agency,
                    sanctioned_amount=amount,
                    final_amount=final_amount,
                    sanctioned_date=sanc_date,
                    completion_date=comp_date,
                    status=status,
                    has_images=has_images,
                    avg_rating=avg_rating,
                    lat=lat,
                    lng=lng,
                    unit_quantity=qty,
                    unit_type=unit,
                )
                db.add(w)
                work_map[work_id_src] = w
                count += 1

                if count % 5000 == 0:
                    db.flush()
        db.flush()
        log.append(f"  ✅ Works ({status}): loaded {count} rows")
        return count

    _ingest_works_file(DATA_DIR / "mplads_recommended_works_2026-09-22.csv", "Recommended")
    _ingest_works_file(DATA_DIR / "mplads_completed_works_2026-09-22.csv", "Completed")

    # Rebuild mp_by_norm after any new MPs created from summary
    all_mps = db.query(models.MP).all()
    mp_by_norm = {m.name: m for m in all_mps}

    # -----------------------------------------------------------------------
    # Step 4 — Expenditures (§5.5 — fuzzy join)
    # NOTE: Full semantic join is deferred to the engine run to keep seed fast.
    # We do exact match here and flag the rest as unmatched for later.
    # -----------------------------------------------------------------------
    exp_file = DATA_DIR / "mplads_expenditures_2026-09-22.csv"
    vendor_map: dict[str, models.Vendor] = {}

    def _get_or_create_vendor(name: str) -> models.Vendor | None:
        if not name:
            return None
        n = name.strip().upper()
        if n not in vendor_map:
            v = models.Vendor(name=n)
            db.add(v)
            vendor_map[n] = v
        return vendor_map[n]

    # Build an exact-match lookup: (norm_mp_name, constituency, description_lower) → work_id
    db.flush()
    all_works = db.query(models.Work).all()
    exact_lookup: dict[tuple, int] = {}
    for w in all_works:
        if w.mp_id:
            mp_obj = mp_by_norm.get(
                next((m.name for m in all_mps if m.id == w.mp_id), ""), None
            )
            if mp_obj:
                key = (mp_obj.name, w.constituency.upper().strip(), w.title.lower().strip())
                exact_lookup[key] = w.id

    if exp_file.exists():
        matched = unmatched = 0
        with open(exp_file, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                mp_norm = normalize_mp_name(row.get("MP Name", ""))
                constituency = row.get("Constituency", "").strip().upper()
                desc = row.get("Work Description", "").strip()
                vendor_name = row.get("Vendor", "").strip()
                amount = _parse_amount(row.get("Expenditure Amount (₹)", "0"))
                exp_date = _parse_date(row.get("Expenditure Date", ""))
                pay_status = row.get("Payment Status", "").strip()
                ida = row.get("IDA", "").strip()

                vendor = _get_or_create_vendor(vendor_name)
                work_id_found = None
                match_conf = 0.0
                match_method = "unmatched"

                # Exact match
                key = (mp_norm, constituency, desc.lower().strip())
                if key in exact_lookup:
                    work_id_found = exact_lookup[key]
                    match_conf = 1.0
                    match_method = "exact"
                    matched += 1
                else:
                    # Store as unmatched — semantic join runs in engine phase
                    unmatched += 1
                    match_conf = 0.0
                    match_method = "unmatched"

                p = models.Payment(
                    work_id=work_id_found,
                    vendor_id=vendor.id if vendor else None,
                    amount=amount,
                    payment_date=exp_date,
                    payment_status=pay_status,
                    match_confidence=match_conf,
                    match_method=match_method,
                    mp_name_raw=row.get("MP Name", "").strip(),
                    constituency_raw=constituency,
                    state_raw=row.get("State", "").strip(),
                    work_description_raw=desc,
                    ida_raw=ida,
                )
                db.add(p)

                if i % 10000 == 0:
                    db.flush()

        db.flush()
        log.append(f"  ✅ Expenditures: {matched} exact-matched, {unmatched} queued for semantic join")

    # -----------------------------------------------------------------------
    # Step 5 — Synthetic augmentation (§5.8)
    # Attach sample photos to ~50 completed works for demo
    # -----------------------------------------------------------------------
    sample_completed = (
        db.query(models.Work)
        .filter(models.Work.status == "Completed", models.Work.has_images == True)
        .limit(50)
        .all()
    )

    assets_dir = Path(__file__).parent.parent.parent / "frontend" / "public" / "assets"
    for w in sample_completed:
        # Attach a synthetic before/after photo pair
        for prog_pct, fname, is_before in [
            (0, "sample-construction-before.jpg", True),
            (100, "sample-construction-after.jpg", False),
        ]:
            file_path = str(assets_dir / fname)
            # Fake EXIF: GPS near work centroid, timestamp plausible
            gps_lat = (w.lat or 20.5) + random.uniform(-0.01, 0.01)
            gps_lng = (w.lng or 78.9) + random.uniform(-0.01, 0.01)
            ts = (w.completion_date or datetime(2025, 6, 1)) - timedelta(days=90 if is_before else 0)

            # Generate a deterministic phash placeholder (hex string)
            hash_input = f"{w.id}-{fname}".encode()
            phash_val = hashlib.md5(hash_input).hexdigest()[:16]

            photo = models.Photo(
                work_id=w.id,
                file_path=file_path,
                gps_lat=gps_lat,
                gps_lng=gps_lng,
                timestamp=ts,
                phash=phash_val,
                is_synthetic_sample=True,
                progress_pct_claimed=prog_pct,
            )
            db.add(photo)

    db.flush()
    log.append(f"  ✅ Synthetic photos attached to {len(sample_completed)} demo works")

    # -----------------------------------------------------------------------
    # Step 6 — Seed demo users (§18.2)
    # -----------------------------------------------------------------------
    import bcrypt as _bcrypt

    def _hash_pwd(password: str) -> str:
        return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

    def _get_mp_id_by_norm(norm_name: str) -> int | None:
        mp = mp_by_norm.get(norm_name)
        return mp.id if mp else None

    singhvi_id = _get_mp_id_by_norm("ABHISHEK MANU SINGHVI")
    # Pick 2 more real MPs with varied completion rates
    # Sudha Murty was seeded from Rajya Sabha file if present
    sudha_id = _get_mp_id_by_norm("SUDHA MURTY")
    # Andrew from summary
    andrew_id = _get_mp_id_by_norm("ANDREW J. SYNGKON")

    demo_users = [
        {
            "username": "admin",
            "password": "admin123",
            "role": "admin",
            "linked_mp_id": None,
            "linked_constituency": None,
            "linked_state": None,
        },
        {
            "username": "mp.singhvi",
            "password": "mp2026",
            "role": "mp_user",
            "linked_mp_id": singhvi_id,
            "linked_constituency": None,
            "linked_state": None,
        },
        {
            "username": "mp.sudha",
            "password": "mp2026",
            "role": "mp_user",
            "linked_mp_id": sudha_id,
            "linked_constituency": None,
            "linked_state": None,
        },
        {
            "username": "mp.syngkon",
            "password": "mp2026",
            "role": "mp_user",
            "linked_mp_id": andrew_id,
            "linked_constituency": None,
            "linked_state": None,
        },
        {
            "username": "district.chittoor",
            "password": "district123",
            "role": "district_user",
            "linked_mp_id": None,
            "linked_constituency": "CHITTOOR",
            "linked_state": "Andhra Pradesh",
        },
    ]

    for u in demo_users:
        existing = db.query(models.User).filter_by(username=u["username"]).first()
        if not existing:
            user_obj = models.User(
                username=u["username"],
                password_hash=_hash_pwd(u["password"]),
                role=u["role"],
                linked_mp_id=u["linked_mp_id"],
                linked_constituency=u["linked_constituency"],
                linked_state=u["linked_state"],
            )
            db.add(user_obj)

    db.commit()
    log.append(f"  ✅ Demo users seeded: {[u['username'] for u in demo_users]}")
    log.append("✅ Ingestion complete — DB ready for engine run")

    return {"status": "done", "log": log}


if __name__ == "__main__":
    # Allow running standalone: python -m app.seed_data
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from app.database import SessionLocal, engine, Base
    from app import models as _models
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    result = seed_database(db, force_reseed=True)
    for line in result.get("log", []):
        print(line)
    db.close()
