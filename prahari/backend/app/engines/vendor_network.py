"""
Engine 4 — Vendor Network Intelligence (§7.4)
- NetworkX graph: MP → District → Agency → Vendor edges
- Louvain community detection for collusion rings
- Vendor concentration metric (% share of district/agency spend)
Confidence: vendor % share IS the confidence (§8).
"""

import json
from collections import defaultdict
from typing import Any

import networkx as nx
import community as community_louvain  # python-louvain


def build_vendor_graph(payments: list, mps: list) -> dict[str, Any]:
    """
    Build the full vendor network graph from all payments in the DB.
    Returns:
      - nodes: list of node dicts (id, label, type, total_value, community)
      - edges: list of edge dicts (from, to, weight)
      - clusters: list of cluster dicts with vendor names
      - concentration_flags: vendors with >30% share of their agency
    """
    G = nx.Graph()

    # Aggregate payment values by (mp_name, constituency, agency, vendor)
    edge_weights: dict[tuple, float] = defaultdict(float)
    agency_total: dict[str, float] = defaultdict(float)
    vendor_per_agency: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    mp_id_to_name: dict[int, str] = {m.id: m.name for m in mps}

    for p in payments:
        vendor_name = p.vendor.name if p.vendor else "UNKNOWN"
        mp_name = mp_id_to_name.get(
            p.work.mp_id if p.work else None, p.mp_name_raw or "UNKNOWN"
        ) if p.work else (p.mp_name_raw or "UNKNOWN")
        constituency = (p.work.constituency if p.work else p.constituency_raw) or "UNKNOWN"
        agency = (p.work.implementing_agency if p.work else p.ida_raw) or "UNKNOWN"
        amount = p.amount or 0.0

        # MP → Agency edge
        edge_weights[("mp:" + mp_name, "agency:" + agency)] += amount
        # Agency → Vendor edge
        edge_weights[("agency:" + agency, "vendor:" + vendor_name)] += amount

        agency_total[agency] += amount
        vendor_per_agency[agency][vendor_name] += amount

    # Build NetworkX graph
    node_totals: dict[str, float] = defaultdict(float)
    for (src, dst), w in edge_weights.items():
        G.add_edge(src, dst, weight=w)
        node_totals[src] += w
        node_totals[dst] += w

    # Louvain community detection
    if len(G.nodes) > 0:
        try:
            partition = community_louvain.best_partition(G, weight="weight", random_state=42)
        except Exception:
            partition = {n: 0 for n in G.nodes}
    else:
        partition = {}

    # Build output nodes
    type_map = {
        "mp:": "mp", "agency:": "agency", "vendor:": "vendor", "district:": "district"
    }
    nodes = []
    for node_id in G.nodes:
        node_type = "unknown"
        for prefix, t in type_map.items():
            if node_id.startswith(prefix):
                node_type = t
                break
        label = node_id.split(":", 1)[1] if ":" in node_id else node_id
        nodes.append({
            "id": node_id,
            "label": label,
            "type": node_type,
            "total_value": round(node_totals.get(node_id, 0)),
            "community": partition.get(node_id, 0),
        })

    # Build output edges
    edges = []
    for (src, dst), w in edge_weights.items():
        edges.append({
            "from": src,
            "to": dst,
            "weight": round(w),
        })

    # Cluster summary: which communities have the same 2-3 vendors across ≥3 agencies
    community_members: dict[int, list[str]] = defaultdict(list)
    for node_id, comm in partition.items():
        community_members[comm].append(node_id)

    clusters = []
    for comm_id, members in community_members.items():
        vendors_in_cluster = [m.split(":", 1)[1] for m in members if m.startswith("vendor:")]
        agencies_in_cluster = [m.split(":", 1)[1] for m in members if m.startswith("agency:")]
        if vendors_in_cluster and len(agencies_in_cluster) >= 2:
            cluster_value = sum(node_totals.get(m, 0) for m in members)
            clusters.append({
                "community_id": comm_id,
                "vendors": vendors_in_cluster[:10],
                "agencies": agencies_in_cluster[:10],
                "member_count": len(members),
                "total_value": round(cluster_value),
                "collusion_risk": len(agencies_in_cluster) >= 3 and len(vendors_in_cluster) >= 2,
            })

    # Concentration flags: vendors with >30% of their agency's spend
    concentration_flags = []
    CONCENTRATION_THRESHOLD = 0.30
    for agency, vendor_dict in vendor_per_agency.items():
        total = agency_total.get(agency, 0)
        if total <= 0:
            continue
        for vendor, amount in vendor_dict.items():
            pct = amount / total
            if pct >= CONCENTRATION_THRESHOLD:
                confidence = round(pct * 100, 1)
                concentration_flags.append({
                    "vendor": vendor,
                    "agency": agency,
                    "spend_pct": confidence,
                    "vendor_amount": round(amount),
                    "agency_total": round(total),
                    "confidence": confidence,
                    "confidence_method": "Vendor % share of agency total spend (§8)",
                    "note": f"{vendor} holds {confidence:.0f}% of {agency}'s total expenditure",
                })

    return {
        "nodes": nodes,
        "edges": edges,
        "clusters": sorted(clusters, key=lambda c: -c["total_value"]),
        "concentration_flags": sorted(concentration_flags, key=lambda f: -f["spend_pct"]),
        "node_count": len(nodes),
        "edge_count": len(edges),
        "cluster_count": len(clusters),
        "collusion_ring_count": sum(1 for c in clusters if c["collusion_risk"]),
    }


def run_vendor_network_engine(work, all_payments: list, graph_cache: dict | None = None) -> dict[str, Any]:
    """
    Score a single work based on its vendor network context.
    graph_cache: if pre-computed, pass it in to avoid re-running Louvain.
    """
    findings = []
    score = 0

    # Find payments for this work
    work_payments = [p for p in all_payments if p.work_id == work.id]
    if not work_payments:
        return {"engine": "vendor_network", "score": 0, "findings": [], "finding_count": 0}

    # Get vendor names for this work
    work_vendors = set()
    for p in work_payments:
        if p.vendor:
            work_vendors.add(p.vendor.name)

    work_agency = work.implementing_agency or ""

    if graph_cache:
        # Check concentration flags for this work's agency/vendors
        for flag in graph_cache.get("concentration_flags", []):
            if flag["vendor"] in work_vendors and flag["agency"] == work_agency:
                contrib = min(int(flag["spend_pct"] * 0.15), 10)
                findings.append({
                    "check": "Vendor concentration",
                    "detail": flag["note"],
                    "confidence": flag["confidence"],
                    "confidence_method": flag["confidence_method"],
                    "score_contribution": contrib,
                })
                score += contrib

        # Check if any vendor from this work is in a collusion-risk cluster
        for cluster in graph_cache.get("clusters", []):
            if cluster["collusion_risk"]:
                if any(v in cluster["vendors"] for v in work_vendors):
                    findings.append({
                        "check": "Vendor in collusion cluster",
                        "detail": (
                            f"Vendor(s) {list(work_vendors)[:2]} appear in a Louvain-detected "
                            f"community spanning {len(cluster['agencies'])} agencies"
                        ),
                        "confidence": 70,
                        "confidence_method": "Louvain community detection — vendor appears in high-risk cluster",
                        "score_contribution": 8,
                    })
                    score += 8

    score = min(score, 15)
    return {
        "engine": "vendor_network",
        "score": score,
        "findings": findings,
        "finding_count": len(findings),
    }
