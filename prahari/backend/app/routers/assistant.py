"""
AI Assistant — POST /api/assistant/chat, /api/assistant/query (§11).
Claude-powered RAG-lite over MPLADS guidelines + text-to-SQL.
"""
import os
import re
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db, engine
from ..schemas import ChatMessage, ChatResponse, QueryRequest, QueryResponse
from .auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# Load guidelines into memory (RAG-lite)
GUIDELINES_PATH = Path(__file__).parent.parent.parent / "data" / "mplads_guidelines.md"
_guidelines_text = ""
if GUIDELINES_PATH.exists():
    _guidelines_text = GUIDELINES_PATH.read_text(encoding="utf-8")

# DB schema for text-to-SQL
DB_SCHEMA = """
Tables and columns (SQLite):
- mps: id, name, house, state, constituency, entitlement_total, allocated_amount, total_expenditure, 
       utilization_pct, completed_works_count, recommended_works_count, completion_rate_pct, balance_unpaid
- works: id, work_id_source, title, category, mp_id (FK→mps.id), state, constituency, 
         implementing_agency, sanctioned_amount, final_amount, sanctioned_date, completion_date,
         status ('Recommended'|'Completed'), has_images, avg_rating, lat, lng
- vendors: id, name
- payments: id, work_id (FK→works.id), vendor_id (FK→vendors.id), amount, payment_date, 
            payment_status, match_confidence, match_method, mp_name_raw, constituency_raw
- risk_scores: id, work_id (FK→works.id), score_0_100, engine_breakdown_json, 
               shap_reasons_json, confidence_by_irregularity_json, guideline_clause, computed_at
- officer_feedback: id, work_id, flag_true_or_false, note, officer_role, created_at
"""


def _get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    import anthropic
    return anthropic.Anthropic(api_key=api_key)


SYSTEM_PROMPT_CHAT = f"""You are PRAHARI Assistant — an AI audit assistant for MPLADS (Members of Parliament Local Area Development Scheme) anomaly detection. 
You help MPs, district officers, and ministry staff understand flagged works, compliance requirements, and fund utilization patterns.

MPLADS Guidelines context:
{_guidelines_text[:6000]}

Key MPLADS rules to remember:
- SC/ST earmarking: minimum 15% in SC areas, 7.5% in ST areas
- 1-year completion norm (§7.4 of guidelines)
- Trust/society funding cap: ₹1 crore per institution
- Ineligible categories: land acquisition, religious structures, private property
- All works must be within the constituency (Lok Sabha) or state (Rajya Sabha)

You answer questions in English. Be concise, factual, and cite specific guideline clauses where relevant.
If asked about specific data (works, MPs, amounts), acknowledge you are referring to the PRAHARI database results.
"""

SYSTEM_PROMPT_SQL = f"""You are a SQL query generator for PRAHARI's SQLite database. 
Generate only a valid SQL SELECT statement. Do not include any other text, explanation, or markdown.
The query will be executed read-only against the PRAHARI SQLite database.

Database schema:
{DB_SCHEMA}

Rules:
- Only generate SELECT statements
- Always use proper SQL syntax for SQLite
- Use JOINs as needed
- Limit results to 100 rows unless the user asks for all
- If the user asks about "overdue works", filter works WHERE status='Recommended' AND sanctioned_date < date('now', '-365 days')
- If asked about "high risk works", JOIN risk_scores and filter WHERE score_0_100 >= 70
"""


def _fallback_response(message: str, mp_scope_id: int | None) -> str:
    """Provide a helpful response without Claude (when API key is not set)."""
    msg_lower = message.lower()
    
    if "overdue" in msg_lower or "deadline" in msg_lower or "देरी" in msg_lower:
        return ("Based on PRAHARI analysis: works with status 'Recommended' that were sanctioned "
                "more than 365 days ago are flagged as overdue. MPLADS Guideline §7.4 mandates "
                "1-year completion. Check the Risk Distribution chart to see deadline-breach counts.")
    
    if "duplicate" in msg_lower or "ghost" in msg_lower:
        return ("The Duplicate & Ghost-Work Detector uses sentence-transformers cosine similarity "
                "(threshold: 85%) to flag near-identical work descriptions. Works with >85% text "
                "match and the same MP/constituency are flagged as potential split works, which "
                "may indicate an attempt to split one large work into smaller pieces to avoid "
                "approval thresholds (MPLADS §6.2).")
    
    if "sc" in msg_lower or "st" in msg_lower or "earmark" in msg_lower:
        return ("MPLADS Guidelines §10.1: An MP must earmark at least 15% of their annual "
                "entitlement for works in SC (Scheduled Caste) areas and 7.5% in ST (Scheduled "
                "Tribe) areas. PRAHARI checks cumulative spend against these thresholds and flags "
                "MPs who are below the minimum requirement.")
    
    if "vendor" in msg_lower or "collusion" in msg_lower:
        return ("PRAHARI's Vendor Network Engine uses NetworkX + Louvain community detection to "
                "identify vendor clusters where the same 2-3 vendors appear across ≥3 agencies. "
                "A vendor holding >30% of an agency's total spend is also flagged. See the Vendor "
                "Network view for the full interactive graph.")
    
    return ("I'm PRAHARI Assistant. I can help you with MPLADS compliance questions, work status, "
            "anomaly explanations, and data queries. Note: The AI assistant requires an "
            "ANTHROPIC_API_KEY environment variable for full Claude-powered responses. "
            "Currently running in fallback mode.")


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatMessage, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = _get_client()
    
    # Scope hint for the assistant
    scope_note = ""
    if req.mp_scope_id or current_user.linked_mp_id:
        mp_id = req.mp_scope_id or current_user.linked_mp_id
        scope_note = f"\n[User scope: MP ID {mp_id} — only discuss works related to this MP]"
    
    if not client:
        return ChatResponse(response=_fallback_response(req.message, req.mp_scope_id), source="fallback")

    try:
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1024,
            system=SYSTEM_PROMPT_CHAT + scope_note,
            messages=[{"role": "user", "content": req.message}],
        )
        return ChatResponse(response=response.content[0].text, source="claude")
    except Exception as e:
        return ChatResponse(response=f"Assistant error: {str(e)[:200]}", source="error")


@router.post("/query", response_model=QueryResponse)
async def text_to_sql(
    req: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = _get_client()
    
    if not client:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured for SQL generation")

    # Build scope constraint
    scope_filter = ""
    if current_user.role == "mp_user" and current_user.linked_mp_id:
        scope_filter = f"\nIMPORTANT: Always add WHERE works.mp_id = {current_user.linked_mp_id} (or JOIN works to apply this filter). The user must not see data outside their scope."
    elif current_user.role == "district_user" and current_user.linked_constituency:
        scope_filter = f"\nIMPORTANT: Always add WHERE works.constituency = '{current_user.linked_constituency}' filter."

    try:
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=512,
            system=SYSTEM_PROMPT_SQL + scope_filter,
            messages=[{"role": "user", "content": req.message}],
        )
        sql = response.content[0].text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation error: {str(e)[:200]}")

    # Safety check — only allow SELECT
    sql_clean = sql.strip().rstrip(";")
    if not re.match(r"^\s*SELECT\b", sql_clean, re.IGNORECASE):
        raise HTTPException(status_code=400, detail=f"Generated query is not a SELECT statement: {sql_clean[:100]}")

    # Execute
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql_clean))
            columns = list(result.keys())
            rows_raw = result.fetchmany(100)
            rows = [dict(zip(columns, row)) for row in rows_raw]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL execution error: {str(e)[:200]}")

    return QueryResponse(sql=sql_clean, results=rows, row_count=len(rows))
