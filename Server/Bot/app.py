"""
Doctor Chatbot service wrapper (FastAPI).
- Keeps original process_query logic
- Adds conversation endpoints used by the Node gateway:
    POST  /chat
    POST  /conversations
    GET   /conversations
    GET   /conversations/{id}/messages

Environment:
  LOG_TO_FILE=1           -> enables file logging under ./logs/chatbot.log
  SPACY_TRANSFORMER=0     -> set to "1" to try downloading and loading en_core_web_trf (heavy)
  USE_MONGO_FOR_CONV=1    -> if "1", will attempt to call persistence helpers from mongo module
  (PYTHON service will still run fine without mongo persistence)
"""

import os
import logging
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import dateparser

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# local imports (nlp/rag/mongo). We'll attempt them and raise helpful errors if missing.
try:
    from nlp import detect_intent_and_entity
except Exception as e:
    raise RuntimeError(f"Failed to import nlp.detect_intent_and_entity: {e}")

try:
    # The project already had many helpers in mongo. We'll import module and use safe getattr() later.
    import mongo
except Exception as e:
    # allow missing mongo — we will fallback to in-memory store
    mongo = None

try:
    # RAG response generator (existing)
    from rag import generate_response
except Exception as e:
    # If rag missing we still proceed but generate_response calls will raise if used.
    generate_response = None

# =========================
# Paths & directories
# =========================
BASE = Path(__file__).parent
LOG_DIR = BASE / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR = BASE / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# =========================
# Logger
# =========================
logger = logging.getLogger("chatbot")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(ch)

    if os.getenv("LOG_TO_FILE", "0") == "1":
        fh = logging.FileHandler(LOG_DIR / "chatbot.log", encoding="utf-8")
        fh.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
        logger.addHandler(fh)

# =========================
# spaCy model handling (light)
# =========================
def safe_download_spacy_model(model_name: str, output_dir: Path):
    try:
        import spacy.cli
        target = output_dir / model_name
        # Many deployments will install models via requirements or container build.
        # If the model isn't present, try to download it (best-effort).
        if not target.exists():
            logger.info("Attempting to download spaCy model: %s", model_name)
            spacy.cli.download(model_name)
        else:
            logger.debug("spaCy model %s already present", model_name)
    except Exception as e:
        logger.warning("Could not download spaCy model %s: %s", model_name, str(e))

# Only download lightweight model by default. Enable transformer via SPACY_TRANSFORMER=1
safe_download_spacy_model("en_core_web_sm", MODEL_DIR)
if os.getenv("SPACY_TRANSFORMER", "0") == "1":
    safe_download_spacy_model("en_core_web_trf", MODEL_DIR)

# =========================
# FastAPI app
# =========================
app = FastAPI(title="Doctor Chatbot API", version="1.1")

# allow requests from your frontend / node (set origins appropriately in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to specific origins in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Config
# =========================
USE_MONGO_FOR_CONV = os.getenv("USE_MONGO_FOR_CONV", "0") == "1"
PYTHON_CONV_ENDPOINT_PREFIX = os.getenv("PYTHON_CONV_PREFIX", "/conversations")

# =========================
# In-memory conversation store (dev fallback)
# Thread-safe via asyncio.Lock
# =========================
_IN_MEMORY_CONV: Dict[str, Dict[str, Any]] = {}
_store_lock = asyncio.Lock()

def make_cid() -> str:
    return "cid_" + os.urandom(6).hex() + "_" + str(int(datetime.utcnow().timestamp() * 1000))

def _now_ts() -> str:
    return datetime.utcnow().isoformat()

async def create_local_conversation(user: Optional[dict], title: Optional[str] = None) -> Dict[str, Any]:
    async with _store_lock:
        cid = make_cid()
        convo = {
            "id": cid,
            "title": title or "Conversation",
            "createdAt": _now_ts(),
            "createdBy": user.get("id") if user else "anonymous",
            "messages": [],  # list of { id, sender, text, ts }
        }
        _IN_MEMORY_CONV[cid] = convo
        return convo

async def append_local_message(convo_id: str, sender: str, text: str) -> Optional[Dict[str, Any]]:
    async with _store_lock:
        convo = _IN_MEMORY_CONV.get(convo_id)
        if not convo:
            return None
        mid = make_cid()
        msg = {"id": mid, "sender": sender, "text": text, "ts": _now_ts()}
        convo["messages"].append(msg)
        return msg

async def list_local_conversations() -> List[Dict[str, Any]]:
    async with _store_lock:
        return [
            {
                "id": c["id"],
                "title": c["title"],
                "createdAt": c["createdAt"],
                "createdBy": c["createdBy"],
                "messageCount": len(c.get("messages", [])),
            }
            for c in _IN_MEMORY_CONV.values()
        ]

async def get_local_messages(convo_id: str) -> Optional[List[Dict[str, Any]]]:
    async with _store_lock:
        convo = _IN_MEMORY_CONV.get(convo_id)
        if not convo:
            return None
        return convo.get("messages", []).copy()

# =========================
# NLP / Business logic
# =========================
EXTRA_INTENTS = [
    "get_patient_dob",
    "get_patient_contact",
    "admissions_for_patient",
    "lab_applications_for_patient",
    "lab_items_list",
    "diagnosis_for_admission",
    "prescriptions_for_admission",
    "notes_for_admission",
]

async def process_query(user_query: str) -> str:
    logger.debug("[MAIN] Query: %s", user_query)
    intent, entity = detect_intent_and_entity(user_query)
    logger.debug("[MAIN] NLP → intent: %s, entity: %s", intent, entity)

    try:
        data = None
        if intent in ("appointments_today", "appointments"):
            data = await mongo.get_todays_appointments() if mongo and hasattr(mongo, "get_todays_appointments") else None
        elif intent == "appointments_on_date":
            if not entity:
                return "⚠️ Please mention a specific date (e.g., 'on June 21st')."
            ent = entity.lower()
            parsed_date = (
                datetime.today() + timedelta(days=1)
                if ent == "tomorrow"
                else datetime.today()
                if ent == "today"
                else dateparser.parse(entity)
            )
            if not parsed_date:
                return "⚠️ Couldn't parse the date."
            if mongo and hasattr(mongo, "get_appointments_on_date"):
                data = await mongo.get_appointments_on_date(parsed_date.strftime("%Y-%m-%d"))
            else:
                data = None
        elif intent in ("staff", "staff_info"):
            data = await mongo.get_all_staff() if mongo and hasattr(mongo, "get_all_staff") else None
        elif intent == "patient_info":
            if not entity:
                return "⚠️ Please specify a patient name."
            data = await mongo.get_patient_history(entity) if mongo and hasattr(mongo, "get_patient_history") else None
        elif intent == "get_patient_dob":
            if not entity:
                return "⚠️ Please specify a patient."
            data = await mongo.get_patient_dob(entity) if mongo and hasattr(mongo, "get_patient_dob") else None
        elif intent == "get_patient_contact":
            if not entity:
                return "⚠️ Please specify a patient."
            data = await mongo.get_patient_contact(entity) if mongo and hasattr(mongo, "get_patient_contact") else None
        elif intent == "admissions_for_patient":
            if not entity:
                return "⚠️ Need patient ID."
            data = await mongo.get_admissions_for_patient(entity) if mongo and hasattr(mongo, "get_admissions_for_patient") else None
        elif intent == "lab_applications_for_patient":
            if not entity:
                return "⚠️ Need patient ID."
            data = await mongo.get_lab_applications_for_patient(entity) if mongo and hasattr(mongo, "get_lab_applications_for_patient") else None
        elif intent == "lab_items_list":
            data = await mongo.get_lab_items_list() if mongo and hasattr(mongo, "get_lab_items_list") else None
        elif intent == "diagnosis_for_admission":
            if not entity:
                return "⚠️ Need admission ID."
            data = await mongo.get_diagnosis_for_admission(entity) if mongo and hasattr(mongo, "get_diagnosis_for_admission") else None
        elif intent == "prescriptions_for_admission":
            if not entity:
                return "⚠️ Need admission ID."
            data = await mongo.get_prescriptions_for_admission(entity) if mongo and hasattr(mongo, "get_prescriptions_for_admission") else None
        elif intent == "notes_for_admission":
            if not entity:
                return "⚠️ Need admission ID."
            data = await mongo.get_notes_for_admission(entity) if mongo and hasattr(mongo, "get_notes_for_admission") else None
        else:
            # fallback to a generic RAG response if available
            if generate_response:
                return generate_response(user_query, None)
            return "🤖 Sorry, I didn’t understand. Ask about appointments, staff, or patient records."

        # generate_response may be sync or async in your project — keep existing call style
        if generate_response:
            # If generate_response is asyncable, detect and await (best-effort)
            try:
                result = generate_response(user_query, data)
                if callable(getattr(result, "then", None)):  # not perfect but safe fallback
                    # some libs return awaitable-like objects; attempt await
                    result = await result
                return result
            except TypeError:
                # generate_response is likely synchronous
                return generate_response(user_query, data)
        else:
            # If rag missing, fallback to simple JSON summary
            return f"Result for intent '{intent}': {data if data is not None else 'no data available'}"

    except Exception as e:
        logger.exception("[MAIN] Error processing %s: %s", intent, e)
        return "❌ Internal error, please try again later."

# =========================
# Pydantic models
# =========================
class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None
    conversationId: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    conversationId: Optional[str] = None
    meta: Optional[dict] = None

class CreateConversationRequest(BaseModel):
    title: Optional[str] = None
    metadata: Optional[dict] = None

# =========================
# Helper: normalize python response (same shape Node expects)
# =========================
def _normalize_reply(reply_text: str, cid: str) -> Dict[str, Any]:
    return {"reply": reply_text, "meta": {"cid": cid, "ts": _now_ts()}}

# =========================
# Endpoints
# =========================
@app.get("/healthz")
async def healthz():
    try:
        return {"ok": True}
    except Exception as e:
        logger.exception("Health check failed: %s", e)
        return {"ok": False, "details": str(e)}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, x_correlation_id: Optional[str] = Header(None), request: Request = None):
    cid = x_correlation_id or make_cid()
    t0 = datetime.utcnow()
    logger.info("[%s] /chat called. user=%s", cid, getattr(request.state, "user", None) or "unknown")

    message = (req.message or "").strip()
    if not message:
        logger.warning("[%s] Empty message", cid)
        raise HTTPException(status_code=400, detail="`message` is required and must be non-empty")

    # Build a user object from request (if you populate request.state.user via middleware, prefer that)
    # For compatibility with Node gateway we expect a 'user' dict in request.state or fallback to headers (if any)
    user_info = {}
    try:
        # If you have authentication middleware that sets request.state.user, use it.
        # Otherwise Node gateway passes user info via the Auth header + Node does the auth check.
        user_obj = getattr(request.state, "user", None)
        if user_obj:
            # convert to plain dict (if it's an object)
            user_info = getattr(user_obj, "__dict__", user_obj)
    except Exception:
        user_info = {}

    # process the query
    try:
        # persist user message (mongo or local) if conversation present or create new conversation
        conversation_id = req.conversationId
        # If provided and using local fallback, append message
        if conversation_id and not USE_MONGO_FOR_CONV:
            await append_local_message(conversation_id, "user", message)

        reply = await process_query(message)

        # Persist bot reply
        if conversation_id and not USE_MONGO_FOR_CONV:
            await append_local_message(conversation_id, "bot", reply)

        # If mongo persistence is enabled & mongo provides helpers, call them (best-effort)
        if USE_MONGO_FOR_CONV and mongo is not None:
            try:
                if conversation_id and hasattr(mongo, "save_message"):
                    # expected: save_message(conversationId, sender, text, meta)
                    await mongo.save_message(conversation_id, "bot", reply, {"ts": _now_ts()})
            except Exception as e:
                logger.warning("[%s] mongo.save_message failed: %s", cid, e)

        latency_ms = int((datetime.utcnow() - t0).total_seconds() * 1000)
        meta = {"latencyMs": latency_ms}

        logger.info("[%s] reply ready (latency=%dms)", cid, latency_ms)

        return {"reply": reply, "conversationId": conversation_id, "meta": meta}
    except Exception as e:
        logger.exception("[%s] Error in /chat: %s", cid, e)
        raise HTTPException(status_code=500, detail="Internal error")

@app.post("/conversations")
async def create_conversation(req: CreateConversationRequest, x_correlation_id: Optional[str] = Header(None), request: Request = None):
    cid = x_correlation_id or make_cid()
    try:
        user_obj = getattr(request.state, "user", None)
        user_info = getattr(user_obj, "__dict__", user_obj) if user_obj else None
        title = req.title or "App Chat"

        # If mongo-backed conversations supported, call mongo.create_conversation
        if USE_MONGO_FOR_CONV and mongo is not None and hasattr(mongo, "create_conversation"):
            conv = await mongo.create_conversation(user_info, title, req.metadata)
            return {"success": True, "conversation": conv}

        # Local fallback
        convo = await create_local_conversation(user_info or {}, title)
        return {"success": True, "conversation": convo}
    except Exception as e:
        logger.exception("[%s] create_conversation failed: %s", cid, e)
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@app.get("/conversations")
async def list_conversations(x_correlation_id: Optional[str] = Header(None), request: Request = None):
    cid = x_correlation_id or make_cid()
    try:
        if USE_MONGO_FOR_CONV and mongo is not None and hasattr(mongo, "list_conversations"):
            convs = await mongo.list_conversations()
            return {"success": True, "conversations": convs}
        convs = await list_local_conversations()
        return {"success": True, "conversations": convs}
    except Exception as e:
        logger.exception("[%s] list_conversations failed: %s", cid, e)
        raise HTTPException(status_code=500, detail="Failed to list conversations")

@app.get("/conversations/{convo_id}/messages")
async def get_conversation_messages(convo_id: str, x_correlation_id: Optional[str] = Header(None), request: Request = None):
    cid = x_correlation_id or make_cid()
    try:
        if USE_MONGO_FOR_CONV and mongo is not None and hasattr(mongo, "get_conversation_messages"):
            msgs = await mongo.get_conversation_messages(convo_id)
            return {"success": True, "messages": msgs}
        msgs = await get_local_messages(convo_id)
        if msgs is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"success": True, "messages": msgs}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[%s] get_conversation_messages failed: %s", cid, e)
        raise HTTPException(status_code=500, detail="Failed to fetch conversation messages")

# =========================
# Startup / Shutdown hooks
# =========================
@app.on_event("startup")
async def on_startup():
    logger.info("Chatbot service starting up. CWD=%s", BASE)

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Chatbot service shutting down.")
