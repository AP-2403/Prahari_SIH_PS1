"""
AI Assistant — POST /api/assistant/chat, /api/assistant/query (§11).
Claude-powered RAG-lite over MPLADS guidelines + text-to-SQL.
"""
import os
import re
import json
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")
load_dotenv()

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


def _resolve_llm_service():
    """Check if environment variables for Gemini or Claude exist."""
    gemini_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
    if gemini_key:
        return "gemini", gemini_key

    anthropic_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if anthropic_key:
        return "claude", anthropic_key

    return "none", None


def _call_gemini(system_prompt: str, user_message: str, api_key: str, history: list[dict] | None = None) -> str:
    """Call Google Gemini generateContent endpoint via standard library urllib with multi-turn history and candidate fallback."""
    candidate_models = [
        "models/gemini-flash-lite-latest",
        "models/gemini-3-flash-preview",
        "models/gemini-2.5-flash",
        "models/gemini-1.5-flash",
        "gemini-1.5-flash"
    ]

    contents = []
    # Add previous chat history turns if provided
    if history:
        for turn in history[-8:]:
            r = "user" if turn.get("role") in ["user", "human"] else "model"
            txt = (turn.get("text") or "").strip()
            if txt:
                if contents and contents[-1]["role"] == r:
                    contents[-1]["parts"][0]["text"] += f"\n{txt}"
                else:
                    contents.append({"role": r, "parts": [{"text": txt}]})

    # Add current user message turn
    if contents and contents[-1]["role"] == "user":
        contents[-1]["parts"][0]["text"] += f"\n{user_message}"
    else:
        contents.append({"role": "user", "parts": [{"text": user_message}]})

    # Inject system instruction into the first user turn for full context
    if contents and contents[0]["role"] == "user":
        orig_first = contents[0]["parts"][0]["text"]
        contents[0]["parts"][0]["text"] = f"[SYSTEM INSTRUCTION: {system_prompt}]\n\n{orig_first}"
    else:
        contents.insert(0, {"role": "user", "parts": [{"text": f"[SYSTEM INSTRUCTION: {system_prompt}]\n\nHello."}]})
        contents.insert(1, {"role": "model", "parts": [{"text": "Hello! I am PRAHARI audit assistant."}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024
        }
    }
    data = json.dumps(payload).encode("utf-8")

    last_err = None
    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/{m}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception as e:
            last_err = e
            continue

    if last_err:
        raise last_err
    raise ValueError("No response generated by Gemini model.")


def _get_claude_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=api_key)
    except ImportError:
        return None


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

Answer questions helpfully, concisely, and factually. Support follow-up questions naturally based on conversation history. Support both English and Hindi questions naturally. Cite specific guideline clauses where relevant.
"""

SYSTEM_PROMPT_SQL = f"""You are a SQL query generator for PRAHARI's SQLite database. 
Generate ONLY a valid SQL SELECT statement. Do not include markdown formatting or explanations.
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
    """Provide a helpful response without external LLM (when API key is not set or unusable)."""
    msg_lower = message.lower()

    if "overdue" in msg_lower or "deadline" in msg_lower or "देरी" in msg_lower or "समय सीमा" in msg_lower:
        return ("Based on PRAHARI analysis: works with status 'Recommended' that were sanctioned "
                "more than 365 days ago are flagged as overdue. MPLADS Guideline §7.4 mandates "
                "1-year completion. Check the Risk Distribution chart to see deadline-breach counts.")

    if "duplicate" in msg_lower or "ghost" in msg_lower or "डुप्लिकेट" in msg_lower:
        return ("The Duplicate & Ghost-Work Detector uses sentence-transformers cosine similarity "
                "(threshold: 85%) to flag near-identical work descriptions. Works with >85% text "
                "match and the same MP/constituency are flagged as potential split works, which "
                "may indicate an attempt to split one large work into smaller pieces to avoid "
                "approval thresholds (MPLADS §6.2).")

    if "sc" in msg_lower or "st" in msg_lower or "earmark" in msg_lower or "आरक्षण" in msg_lower:
        return ("MPLADS Guidelines §10.1: An MP must earmark at least 15% of their annual "
                "entitlement for works in SC (Scheduled Caste) areas and 7.5% in ST (Scheduled "
                "Tribe) areas. PRAHARI checks cumulative spend against these thresholds and flags "
                "MPs who are below the minimum requirement.")

    if "vendor" in msg_lower or "collusion" in msg_lower or "विक्रेता" in msg_lower:
        return ("PRAHARI's Vendor Network Engine uses NetworkX + Louvain community detection to "
                "identify vendor clusters where the same 2-3 vendors appear across ≥3 agencies. "
                "A vendor holding >30% of an agency's total spend is also flagged. See the Vendor "
                "Network view for the full interactive graph.")

    if "mplads" in msg_lower or "guideline" in msg_lower or "योजना" in msg_lower or "क्या है" in msg_lower or "what is" in msg_lower:
        return ("MPLADS (Members of Parliament Local Area Development Scheme) enables Members of Parliament to recommend "
                "development works in their constituencies with emphasis on durable community infrastructure (drinking water, "
                "education, public health, roads, and sanitation). The annual allocation is ₹5 Crore per MP. "
                "PRAHARI continuously audits all sanctioned projects for guideline compliance, physical milestones, "
                "and financial anomalies.")

    return ("I'm PRAHARI Assistant. I can help you with MPLADS compliance questions, work status, "
            "anomaly explanations, and data queries.")


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatMessage, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    provider, key = _resolve_llm_service()

    # Scope hint for the assistant
    scope_note = ""
    if req.mp_scope_id or current_user.linked_mp_id:
        mp_id = req.mp_scope_id or current_user.linked_mp_id
        scope_note = f"\n[User scope: MP ID {mp_id} — only discuss works related to this MP]"

    # Prepare history list
    history_dicts = []
    if req.history:
        for item in req.history:
            history_dicts.append({"role": item.role, "text": item.text})

    # If Gemini key exists in env, test if it is usable
    if provider == "gemini":
        try:
            reply = _call_gemini(
                system_prompt=SYSTEM_PROMPT_CHAT + scope_note,
                user_message=req.message,
                api_key=key,
                history=history_dicts,
            )
            if reply:
                return ChatResponse(response=reply, source="gemini")
        except Exception:
            pass  # Key not usable or errored, silently proceed to fallback

    elif provider == "claude":
        client = _get_claude_client()
        if client:
            try:
                claude_messages = []
                for turn in history_dicts[-6:]:
                    r = "user" if turn.get("role") in ["user", "human"] else "assistant"
                    txt = (turn.get("text") or "").strip()
                    if txt:
                        if claude_messages and claude_messages[-1]["role"] == r:
                            claude_messages[-1]["content"] += f"\n{txt}"
                        else:
                            claude_messages.append({"role": r, "content": txt})

                if claude_messages and claude_messages[-1]["role"] == "user":
                    claude_messages[-1]["content"] += f"\n{req.message}"
                else:
                    claude_messages.append({"role": "user", "content": req.message})

                response = client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    max_tokens=1024,
                    system=SYSTEM_PROMPT_CHAT + scope_note,
                    messages=claude_messages,
                )
                if response.content and response.content[0].text:
                    return ChatResponse(response=response.content[0].text, source="claude")
            except Exception:
                pass  # Key not usable or errored, silently proceed to fallback

    # Default: keep bot working as before using built-in knowledge
    return ChatResponse(response=_fallback_response(req.message, req.mp_scope_id), source="fallback")


@router.post("/query", response_model=QueryResponse)
async def text_to_sql(
    req: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    provider, key = _resolve_llm_service()

    # Build scope constraint
    scope_filter = ""
    if current_user.role == "mp_user" and current_user.linked_mp_id:
        scope_filter = f"\nIMPORTANT: Always add WHERE works.mp_id = {current_user.linked_mp_id} (or JOIN works to apply this filter). The user must not see data outside their scope."
    elif current_user.role == "district_user" and current_user.linked_constituency:
        scope_filter = f"\nIMPORTANT: Always add WHERE works.constituency = '{current_user.linked_constituency}' filter."

    sql = ""
    if provider == "gemini":
        try:
            sql = _call_gemini(
                system_prompt=SYSTEM_PROMPT_SQL + scope_filter,
                user_message=req.message,
                api_key=key,
            )
        except Exception:
            sql = ""
    elif provider == "claude":
        client = _get_claude_client()
        if client:
            try:
                response = client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    max_tokens=512,
                    system=SYSTEM_PROMPT_SQL + scope_filter,
                    messages=[{"role": "user", "content": req.message}],
                )
                sql = response.content[0].text.strip()
            except Exception:
                sql = ""

    # Smart fallback query generator if env key is missing or unusable
    if not sql:
        msg_l = req.message.lower()
        if "overdue" in msg_l or "deadline" in msg_l or "विलंबित" in msg_l:
            sql = "SELECT id, work_id_source, title, category, constituency, sanctioned_amount, sanctioned_date FROM works WHERE status='Recommended' AND sanctioned_date < date('now', '-365 days') LIMIT 15"
        elif "70" in msg_l or "high risk" in msg_l or "जोखिम" in msg_l:
            sql = "SELECT w.id, w.title, w.constituency, w.sanctioned_amount, r.score_0_100 as risk_score FROM works w JOIN risk_scores r ON w.id = r.work_id WHERE r.score_0_100 >= 70 LIMIT 15"
        elif "mp" in msg_l or "expenditure" in msg_l or "व्यय" in msg_l:
            sql = "SELECT name, constituency, total_expenditure, utilization_pct, completed_works_count FROM mps ORDER BY total_expenditure DESC LIMIT 10"
        elif "photo" in msg_l or "image" in msg_l or "फोटो" in msg_l:
            sql = "SELECT id, work_id_source, title, category, constituency, sanctioned_amount, status FROM works WHERE has_images = 0 AND status = 'Completed' LIMIT 15"
        else:
            sql = "SELECT id, work_id_source, title, category, constituency, sanctioned_amount, status FROM works LIMIT 15"

    # Strip markdown formatting
    sql_clean = re.sub(r"^```(?:sql)?\s*", "", sql.strip(), flags=re.IGNORECASE)
    sql_clean = re.sub(r"\s*```$", "", sql_clean).strip().rstrip(";")

    # Safety check — only allow SELECT
    if not re.match(r"^\s*SELECT\b", sql_clean, re.IGNORECASE):
        sql_clean = "SELECT id, title, category, constituency, sanctioned_amount, status FROM works LIMIT 10"

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
