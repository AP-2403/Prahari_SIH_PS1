"""Vendors graph endpoint — GET /api/vendors/graph, /clusters (§11)."""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Payment, MP
from ..schemas import VendorGraphOut
from .auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

# Cached graph — rebuilt on engine run
_graph_cache: dict | None = None


def set_graph_cache(cache: dict):
    global _graph_cache
    _graph_cache = cache


def get_graph_cache() -> dict | None:
    return _graph_cache


@router.get("/graph", response_model=VendorGraphOut)
def get_vendor_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    global _graph_cache
    if _graph_cache is None:
        # Build on demand if not cached
        from ..engines.vendor_network import build_vendor_graph
        all_mps = db.query(MP).all()
        payments = db.query(Payment).filter(Payment.vendor_id.isnot(None)).limit(10000).all()
        _graph_cache = build_vendor_graph(payments, all_mps)

    return VendorGraphOut(
        nodes=_graph_cache.get("nodes", [])[:500],
        edges=_graph_cache.get("edges", [])[:1000],
        clusters=_graph_cache.get("clusters", [])[:50],
        concentration_flags=_graph_cache.get("concentration_flags", [])[:50],
        node_count=_graph_cache.get("node_count", 0),
        edge_count=_graph_cache.get("edge_count", 0),
        collusion_ring_count=_graph_cache.get("collusion_ring_count", 0),
    )


@router.get("/clusters")
def get_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    global _graph_cache
    if _graph_cache is None:
        from ..engines.vendor_network import build_vendor_graph
        all_mps = db.query(MP).all()
        payments = db.query(Payment).filter(Payment.vendor_id.isnot(None)).limit(10000).all()
        _graph_cache = build_vendor_graph(payments, all_mps)

    return {
        "clusters": _graph_cache.get("clusters", [])[:50],
        "concentration_flags": _graph_cache.get("concentration_flags", [])[:50],
        "collusion_ring_count": _graph_cache.get("collusion_ring_count", 0),
    }
