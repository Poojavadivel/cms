// routes/bot.js
// Updated to work with models_core (Mongoose): Bot, Patient, User
const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');
const auth = require("../Middleware/Auth");
const { Bot, Patient, User } = require("../Models");
const mongoose = require("mongoose");

const router = express.Router();

/* ---------------- CONFIG (unchanged) ---------------- */
const _AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "<YOUR_AZURE_OPENAI_API_KEY>";
const _AZURE_OPENAI_ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "") || "https://mobye-mg2e55bd-eastus2.cognitiveservices.azure.com";
const _AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "o4-mini";
const _AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";


const MAX_RETRIES = Number(process.env.MAX_RETRIES ?? 3);const DEFAULT_MAX_COMPLETION_TOKENS = Number(process.env.MAX_COMPLETION_TOKENS ?? 700);
const MAX_COMPLETION_TOKENS_MAX = Number(process.env.MAX_COMPLETION_TOKENS_MAX ?? 7500);
const RETRY_BACKOFF_BASE_MS = Number(process.env.RETRY_BACKOFF_BASE_MS ?? 500);
const AZURE_OPENAI_TIMEOUT_MS = Number(process.env.AZURE_OPENAI_TIMEOUT_MS ?? 20000);

const CIRCUIT_BREAKER_FAILURES = Number(process.env.CIRCUIT_BREAKER_FAILURES ?? 6);
const CIRCUIT_BREAKER_COOLDOWN_MS = Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS ?? 60000);

const DEFAULT_TEMPERATURE = Number(process.env.TEMPERATURE ?? 1);

const CHAT_COMPLETIONS_URL = `${_AZURE_OPENAI_ENDPOINT}/openai/deployments/${encodeURIComponent(_AZURE_OPENAI_DEPLOYMENT)}/chat/completions?api-version=${encodeURIComponent(_AZURE_OPENAI_API_VERSION)}`;

if (!_AZURE_OPENAI_API_KEY || _AZURE_OPENAI_ENDPOINT.includes("<YOUR_")) {
  console.warn("[bot.js] WARNING: Azure OpenAI config missing or contains placeholders.");
}

/* Axios client */
const azureClient = axios.create({
  headers: {
    "Content-Type": "application/json",
    "api-key": _AZURE_OPENAI_API_KEY,
  },
  timeout: AZURE_OPENAI_TIMEOUT_MS,
});

/* ---------------- In-memory circuit breaker & metrics ---------------- */
const circuitBreaker = { failures: 0, state: "CLOSED", openedAt: null };
const metrics = { calls: 0, successes: 0, failures: 0, emptyResponses: 0, retries: 0, circuitBreakersTripped: 0 };

/* ---------------- Helpers ---------------- */
function makeCid() { return "cid_" + Math.random().toString(36).slice(2, 8) + "_" + Date.now().toString(36); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function safeParseJsonLike(text) {
  if (!text || typeof text !== "string") return null;
  try { return JSON.parse(text); } catch (e) {
    const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) {
      try { return JSON.parse(m[0]); } catch (e2) {
        const tryFix = m[0].replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":').replace(/'/g, '"');
        try { return JSON.parse(tryFix); } catch (e3) { return null; }
      }
    }
    return null;
  }
}

function extractTextFromChoice(choice) {
  if (!choice) return "";
  if (choice.message) {
    const c = choice.message.content;
    if (typeof c === "string" && c.trim()) return c.trim();
    if (Array.isArray(c)) {
      const joined = c.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("");
      if (joined.trim()) return joined.trim();
    }
    if (typeof c === "object" && c !== null) {
      if (Array.isArray(c.parts)) { const j = c.parts.join(""); if (j.trim()) return j.trim(); }
      if (typeof c.text === "string" && c.text.trim()) return c.text.trim();
    }
  }
  if (typeof choice.text === "string" && choice.text.trim()) return choice.text.trim();
  if (choice.delta) {
    if (typeof choice.delta === "string" && choice.delta.trim()) return choice.delta.trim();
    if (typeof choice.delta.content === "string" && choice.delta.content.trim()) return choice.delta.content.trim();
  }
  if (choice.output_text && typeof choice.output_text === "string" && choice.output_text.trim()) return choice.output_text.trim();
  if (choice.response && typeof choice.response === "string" && choice.response.trim()) return choice.response.trim();
  return "";
}

/* Circuit breaker */
function circuitIsOpen() {
  if (circuitBreaker.state === "OPEN") {
    const now = Date.now();
    if (now - circuitBreaker.openedAt > CIRCUIT_BREAKER_COOLDOWN_MS) {
      circuitBreaker.state = "CLOSED";
      circuitBreaker.failures = 0;
      circuitBreaker.openedAt = null;
      console.warn("[circuit] Circuit breaker cooled down; moving to CLOSED.");
      return false;
    }
    return true;
  }
  return false;
}
function recordFailureAndMaybeTripCircuit() {
  circuitBreaker.failures += 1;
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_FAILURES) {
    circuitBreaker.state = "OPEN";
    circuitBreaker.openedAt = Date.now();
    metrics.circuitBreakersTripped += 1;
    console.error("[circuit] Circuit breaker TRIPPED due to repeated failures.");
  }
}

/* ---------------- Core Azure call (unchanged logic) ---------------- */
async function callAzureChatWithRetries(messages, temperature = DEFAULT_TEMPERATURE, initialMaxTokens = DEFAULT_MAX_COMPLETION_TOKENS) {
  metrics.calls += 1;
  if (circuitIsOpen()) { metrics.failures += 1; throw new Error("Circuit breaker is open; aborting call to Azure OpenAI"); }
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("messages must be a non-empty array");

  let attempt = 0;
  let maxTokens = Number(initialMaxTokens) || DEFAULT_MAX_COMPLETION_TOKENS;
  maxTokens = Math.min(maxTokens, MAX_COMPLETION_TOKENS_MAX);
  let sawLengthFinish = false;

  while (attempt <= MAX_RETRIES) {
    attempt += 1;
    const cid = makeCid();
    try {
      const payload = { messages, max_completion_tokens: Math.floor(maxTokens) };
      if (typeof temperature === "number" && Number.isFinite(temperature) && temperature !== 1) {
        console.warn(`[${cid}] Omitting unsupported temperature=${temperature}; using model default (1).`);
      }

      console.debug(`[${cid}] POST ${CHAT_COMPLETIONS_URL} payload: max_completion_tokens=${payload.max_completion_tokens}`);
      const resp = await azureClient.post(CHAT_COMPLETIONS_URL, payload);
      if (!resp || !resp.data) throw new Error("Azure returned empty body");
      const data = resp.data;

      let content = "";
      if (Array.isArray(data.choices) && data.choices.length > 0) {
        content = extractTextFromChoice(data.choices[0]) || "";
        if (!content.trim()) {
          for (let i = 1; i < data.choices.length; i++) {
            const alt = extractTextFromChoice(data.choices[i]);
            if (alt && alt.trim()) { content = alt; break; }
          }
        }
      }
      const finishReason = (data.choices && data.choices[0] && data.choices[0].finish_reason) || null;
      if (finishReason === "length") sawLengthFinish = true;

      if (content && String(content).trim()) {
        metrics.successes += 1;
        circuitBreaker.failures = 0;
        circuitBreaker.state = "CLOSED";
        return String(content).trim();
      }

      if ((sawLengthFinish || !content || !String(content).trim()) && maxTokens < MAX_COMPLETION_TOKENS_MAX) {
        const newTokens = Math.min(MAX_COMPLETION_TOKENS_MAX, Math.floor(maxTokens * 2));
        console.warn(`[${cid}] Azure returned empty/truncated output. Increasing max_completion_tokens ${maxTokens} -> ${newTokens} and retrying (attempt ${attempt}/${MAX_RETRIES}).`);
        metrics.emptyResponses += 1;
        metrics.retries += 1;
        maxTokens = newTokens;
        await sleep(RETRY_BACKOFF_BASE_MS * attempt);
        continue;
      }

      console.error(`[${cid}] Azure returned no usable text. Full response:`, data);
      metrics.failures += 1;
      recordFailureAndMaybeTripCircuit();
      throw new Error("Azure Chat Completions returned empty/whitespace response content.");
    } catch (err) {
      const isHttpErr = err && err.response;
      const status = isHttpErr ? (err.response && err.response.status) : null;
      const transient = isHttpErr ? (status >= 500 || status === 429) : true;

      if (isHttpErr) {
        console.error(`[${cid}] Azure HTTP error ${status}:`, err.response && err.response.data ? err.response.data : err.message);
      } else {
        console.error(`[${cid}] Azure request error:`, err.message || err);
      }

      if (!transient || attempt > MAX_RETRIES) {
        metrics.failures += 1;
        recordFailureAndMaybeTripCircuit();
        throw err;
      }

      metrics.retries += 1;
      const backoffMs = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(`[${cid}] Transient error detected (status=${status}). Backing off ${backoffMs}ms and retrying (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(backoffMs);
      continue;
    }
  }

  metrics.failures += 1;
  recordFailureAndMaybeTripCircuit();
  throw new Error("Exceeded retry attempts calling Azure OpenAI");
}

/* ---------------- Bot session helpers (adapted to new Bot schema) ---------------- */

/**
 * Ensure we have a Bot document for this user and a session inside it.
 * If sessionId provided and found → return { botDoc, session }.
 * If sessionId not found → create a new session inside existing botDoc (or new botDoc).
 */
async function findOrCreateSessionForUser(userId, sessionId = null) {
  // Try to find existing bot doc
  let botDoc = await Bot.findOne({ userId });
  if (!botDoc) {
    botDoc = new Bot({ userId, sessions: [], archived: false, metadata: {} });
  }

  // If sessionId supplied, try to find the session
  if (sessionId) {
    const s = (botDoc.sessions || []).find(sess => sess.sessionId === sessionId);
    if (s) return { botDoc, session: s };
    // If botDoc doesn't have that session, we will create below
  }

  // Create new session
  const newSession = {
    sessionId: sessionId || uuidv4(),
    model: _AZURE_OPENAI_DEPLOYMENT,
    messages: [], // messages are { sender, text, ts, meta? }
    metadata: {},
    createdAt: new Date(),
  };

  botDoc.sessions = botDoc.sessions || [];
  botDoc.sessions.push(newSession);
  await botDoc.save();
  // find the pushed session (fresh)
  const added = botDoc.sessions.find(s => s.sessionId === newSession.sessionId);
  return { botDoc, session: added };
}

/**
 * Append messages to session and save Bot doc
 */
async function appendMessagesToSession(botDoc, sessionId, newMessages = []) {
  // find session in botDoc (use Mongoose document)
  const session = (botDoc.sessions || []).find(s => s.sessionId === sessionId);
  if (!session) {
    // session missing — create it
    const sess = {
      sessionId,
      model: _AZURE_OPENAI_DEPLOYMENT,
      messages: newMessages,
      metadata: {},
      createdAt: new Date(),
    };
    botDoc.sessions = botDoc.sessions || [];
    botDoc.sessions.push(sess);
  } else {
    session.messages = session.messages || [];
    session.messages.push(...newMessages);
  }
  botDoc.updatedAt = new Date();
  await botDoc.save();
  return botDoc;
}

/* Save chat and return same behavior as previous API (reply and sessionId) */
async function saveAndReturnChat(cid, tStart, sessionId, user, userMessage, botReply, res) {
  try {
    // find or create session
    const { botDoc, session } = await findOrCreateSessionForUser(user.id, sessionId);
    const sessId = session.sessionId;

    // append two messages
    const now = new Date().toISOString();
    await appendMessagesToSession(botDoc, sessId, [
      { sender: "user", text: userMessage, ts: now },
      { sender: "bot", text: botReply, ts: now, meta: { model: _AZURE_OPENAI_DEPLOYMENT } },
    ]);

    const latency = Date.now() - tStart;
    console.log(`--- BOT CHAT END [${cid}] latency=${latency}ms session=${sessId} ---`);
    return res.json({ success: true, reply: botReply, chatId: sessId, meta: { latencyMs: latency } });
  } catch (saveErr) {
    console.error(`[${cid}] Failed to save bot session:`, saveErr);
    const latency = Date.now() - tStart;
    return res.status(500).json({
      success: false,
      reply: botReply,
      message: "Failed to persist chat history",
      error: saveErr.message,
      meta: { latencyMs: latency },
    });
  }
}

/* ---------------- Routes ---------------- */

/** GET /api/bot/health */
router.get("/health", (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/health`);
  return res.json({ success: true, message: "bot route healthy", cid });
});

/** GET /api/bot/metrics */
router.get("/metrics", (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/metrics`);
  return res.json({ success: true, metrics, circuit: circuitBreaker });
});

/**
 * POST /api/bot/chat
 * Body: { message: string, chatId?: string(sessionId), title?: string }
 */
router.post("/chat", auth, async (req, res) => {
  const cid = makeCid();
  console.log(`--- BOT CHAT START [${cid}] ---`);
  console.log(`[${cid}] body=`, req.body);

  const tStart = Date.now();
  try {
    const { message, chatId, title } = req.body || {};
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // create empty chat session with title
    if (!message && title) {
      try {
        const { botDoc, session } = await findOrCreateSessionForUser(user.id, null);
        botDoc.sessions[botDoc.sessions.length - 1].metadata = botDoc.sessions[botDoc.sessions.length - 1].metadata || {};
        botDoc.sessions[botDoc.sessions.length - 1].metadata.title = String(title);
        await botDoc.save();
        return res.json({ success: true, chat: { sessionId: botDoc.sessions[botDoc.sessions.length - 1].sessionId, title }, message: "New chat created successfully." });
      } catch (err) {
        console.error(`[${cid}] Failed to create empty chat doc:`, err);
        return res.status(500).json({ success: false, message: "Failed to create new chat session." });
      }
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const trimmed = message.trim();
    // greeting short-circuit
    const lower = trimmed.toLowerCase();
    const isGreeting = lower.match(/\b(hi|hello|hey|greetings|thanks|thank you)\b/);
    if (isGreeting) {
      let finalReply;
      try {
        const greetingSystem = `You are MedGPT, a warm, professional, and concise hospital assistant. Since the user sent a simple greeting, please reply with a polite, one-sentence welcoming remark. Do NOT mention any records or data.`;
        const summaryText = await callAzureChatWithRetries(
          [
            { role: "system", content: greetingSystem },
            { role: "user", content: `User message: ${trimmed}` },
          ],
          DEFAULT_TEMPERATURE,
          Math.max(150, Math.min(DEFAULT_MAX_COMPLETION_TOKENS, 300))
        );
        finalReply = String(summaryText).trim();
      } catch (summErr) {
        console.error(`[${cid}] Greeting call failed:`, summErr);
        finalReply = "Hello! How can I help you with the patient records today?";
      }
      return saveAndReturnChat(cid, tStart, chatId, user, trimmed, finalReply, res);
    }

    // Step A: Extract intent/entity
    const extractorPromptSystem = `You are an extractor. Read the user's query and respond ONLY with a compact JSON object with keys:
- intent: one-word intent like "patient_info", "staff_info", "appointments", "unknown"
- entity: the main entity name or id if present (e.g., "Sanjit" or "patient_id_123"), or null
- date: optional date string if the user mentioned one (e.g., "2025-09-01")
Return strictly valid JSON.`;

    const extractorMessages = [
      { role: "system", content: extractorPromptSystem },
      { role: "user", content: `Query: ${trimmed}` },
    ];

    let extractionText;
    try {
      extractionText = await callAzureChatWithRetries(extractorMessages, DEFAULT_TEMPERATURE, 400);
    } catch (err) {
      console.error(`[${cid}] Extraction call failed:`, err && err.message ? err.message : err);
      extractionText = null;
    }

    let extraction = safeParseJsonLike(extractionText);
    if (!extraction) {
      const lowerMsg = trimmed.toLowerCase();
      const fallback = { intent: "unknown", entity: null, date: null };
      if (lowerMsg.includes("patient") || lowerMsg.includes("show me the details") || lowerMsg.includes("details of")) fallback.intent = "patient_info";
      if (lowerMsg.includes("doctor") || lowerMsg.includes("staff") || lowerMsg.includes("nurse")) fallback.intent = "staff_info";
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length <= 4) fallback.entity = trimmed;
      extraction = fallback;
    } else {
      extraction.intent = extraction.intent || "unknown";
      extraction.entity = extraction.entity || null;
      extraction.date = extraction.date || null;
    }

    // Step B: DB name-only search (Patient and User)
    let patientDoc = null;
    let staffDoc = null;
    const entityRaw = extraction.entity;
    const entity = entityRaw && String(entityRaw).trim();
    if (entity) {
      const safe = entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(safe, "i");

      try {
        patientDoc = await Patient.findOne({
          $or: [
            { firstName: nameRegex },
            { lastName: nameRegex },
            { email: nameRegex },
            { phone: nameRegex },
            { 'metadata.fullName': nameRegex },
            { 'metadata.name': nameRegex },
          ]
        }).lean().exec();
      } catch (e) {
        console.error(`[${cid}] Patient name search error:`, e && e.message ? e.message : e);
        patientDoc = null;
      }

      try {
        staffDoc = await User.findOne({
          role: 'staff',
          $or: [
            { firstName: nameRegex },
            { lastName: nameRegex },
            { email: nameRegex },
            { phone: nameRegex },
            { 'metadata.name': nameRegex },
          ]
        }).lean().exec();
      } catch (e) {
        console.error(`[${cid}] Staff name search error:`, e && e.message ? e.message : e);
        staffDoc = null;
      }
    }

    const isDataMissing = !patientDoc && !staffDoc;
    let finalReply = "";

    function buildPatientContext(p) {
      if (!p) return null;
      const firstName = p.firstName || "";
      const lastName = p.lastName || "";
      const fullName = (p.metadata && (p.metadata.fullName || p.metadata.name)) || `${firstName} ${lastName}`.trim() || null;
      const hasUseful = Boolean(fullName || p.dateOfBirth || (p.prescriptions && p.prescriptions.length) || (p.allergies && p.allergies.length) || p.phone || p.email);
      return {
        id: p._id || null,
        name: fullName || null,
        dob: p.dateOfBirth || null,
        phone: p.phone || null,
        email: p.email || null,
        prescriptions: (p.prescriptions || []).slice(0,5).map(pr => ({
          appointmentId: pr.appointmentId || null,
          medicines: (pr.medicines || []).map(m => ({ name: m.name || null, dosage: m.dosage || null, quantity: m.quantity || null })),
          issuedAt: pr.issuedAt || null,
        })),
        allergies: p.allergies || [],
        _hasUsefulFields: hasUseful,
      };
    }

    function buildStaffContext(s) {
      if (!s) return null;
      const firstName = s.firstName || "";
      const lastName = s.lastName || "";
      const fullName = (s.metadata && (s.metadata.name || s.metadata.fullName)) || `${firstName} ${lastName}`.trim() || null;
      const hasUseful = Boolean(fullName || (s.metadata && s.metadata.designation) || s.phone || s.email);
      return {
        id: s._id || null,
        name: fullName || null,
        designation: s.metadata && s.metadata.designation ? s.metadata.designation : null,
        department: s.metadata && s.metadata.department ? s.metadata.department : null,
        contact: s.phone || null,
        email: s.email || null,
        _hasUsefulFields: hasUseful,
      };
    }

    if (isDataMissing) {
      const summarizerFallbackSystem = `You are MedGPT, a professional assistant. The user searched for data (patient or staff) that was not found in the database. Reply ONLY with a single, concise sentence confirming that no relevant records were found for their query.`;
      try {
        finalReply = await callAzureChatWithRetries(
          [
            { role: "system", content: summarizerFallbackSystem },
            { role: "user", content: `Original Query: ${trimmed}` },
          ],
          DEFAULT_TEMPERATURE,
          150
        );
        finalReply = String(finalReply).trim();
      } catch (summErr) {
        console.error(`[${cid}] Summarizer (Fallback) call failed:`, summErr);
        finalReply = "No relevant records were found for this query.";
      }
    } else {
      const safePatient = buildPatientContext(patientDoc);
      const safeStaff = buildStaffContext(staffDoc);

      if (safePatient && !safePatient._hasUsefulFields) safePatient.name = safePatient.name || "<patient record exists but fields are unavailable>";
      if (safeStaff && !safeStaff._hasUsefulFields) safeStaff.name = safeStaff.name || "<staff record exists but fields are unavailable>";
      if (safePatient) delete safePatient._hasUsefulFields;
      if (safeStaff) delete safeStaff._hasUsefulFields;

      const summarizerSystem = `You are MedGPT, a concise, factual assistant. Use ONLY the provided Context to answer. If no data is available, say "No relevant records were found for this query." Do NOT hallucinate. Keep the answer short and clinically neutral.`;
      const summarizerUser = `Question: ${trimmed}

Context:
${JSON.stringify({ patient: safePatient, staff: safeStaff }, null, 2)}

Instructions:
- Use only the Context above.
- If the user asked for a specific field and that field is present, answer it directly.
- If no relevant records, explicitly say: "No relevant records were found for this query."
- If multiple matching records exist, summarize the most relevant one and indicate there may be multiple matches.`;

      try {
        finalReply = await callAzureChatWithRetries(
          [
            { role: "system", content: summarizerSystem },
            { role: "user", content: summarizerUser },
          ],
          DEFAULT_TEMPERATURE,
          700
        );
        finalReply = String(finalReply).trim();
      } catch (summErr) {
        console.error(`[${cid}] Summarizer call failed:`, summErr);
        finalReply = "⚠️ A system error occurred while preparing the response. Please try again later.";
      }
    }

    return saveAndReturnChat(cid, tStart, chatId, user, trimmed, finalReply, res);

  } catch (outerErr) {
    const cid2 = makeCid();
    console.error(`[${cid2}] Unexpected error:`, outerErr);
    metrics.failures += 1;
    const latency = Date.now() - (outerErr && outerErr.tStart ? outerErr.tStart : Date.now());
    return res.status(500).json({ success: false, message: "Internal server error", error: outerErr.message, meta: { latencyMs: latency } });
  }
});

/* ---------------- Chats listing/get/get/delete (session-level) ---------------- */

/**
 * GET /api/bot/chats
 * returns flattened sessions for user
 */
router.get("/chats", auth, async (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/chats by user=${req.user?.id}`);
  try {
    const userId = req.user.id;
    // find bot doc for user
    const botDoc = await Bot.findOne({ userId, archived: { $ne: true } }).lean();
    if (!botDoc || !Array.isArray(botDoc.sessions)) {
      return res.json({ success: true, chats: [] });
    }

    const list = (botDoc.sessions || []).map((s) => {
      const lastMsg = s.messages && s.messages.length ? s.messages[s.messages.length - 1].text : "";
      const title = s.metadata && s.metadata.title ? s.metadata.title : (s.messages && s.messages.length ? s.messages[0].text.slice(0, 80) : "Chat");
      return {
        id: s.sessionId,
        title,
        snippet: lastMsg ? lastMsg.slice(0, 200) : "",
        updatedAt: s.updatedAt || s.createdAt || botDoc.updatedAt || botDoc.createdAt,
        model: s.model || botDoc.model || null,
      };
    });

    return res.json({ success: true, chats: list });
  } catch (err) {
    console.error(`[${cid}] Error listing chats:`, err);
    return res.status(500).json({ success: false, message: "Failed to list chats", error: err.message });
  }
});

/**
 * GET /api/bot/chats/:id
 * id is sessionId
 */
router.get("/chats/:id", auth, async (req, res) => {
  const cid = makeCid();
  const sessionId = req.params.id;
  console.log(`[${cid}] GET /api/bot/chats/${sessionId} by user=${req.user?.id}`);

  if (!sessionId) return res.status(400).json({ success: false, message: "Chat ID required" });

  try {
    const userId = req.user.id;
    // find Bot doc that contains this session
    const botDoc = await Bot.findOne({ userId, 'sessions.sessionId': sessionId }).lean();
    if (!botDoc) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const session = (botDoc.sessions || []).find(s => s.sessionId === sessionId);
    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });

    return res.json({ success: true, chatId: session.sessionId, messages: session.messages || [], meta: { model: session.model || botDoc.model } });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: "Invalid chat ID format" });
    }
    console.error(`[${cid}] Error fetching chat:`, err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

/**
 * DELETE (archive) session
 * sets metadata.archived = true for the session (keeps history)
 */
router.delete("/chats/:id", auth, async (req, res) => {
  const cid = makeCid();
  const sessionId = req.params.id;
  console.log(`[${cid}] DELETE /api/bot/chats/${sessionId} by user=${req.user?.id}`);

  if (!sessionId) return res.status(400).json({ success: false, message: "chat id required" });

  try {
    const userId = req.user.id;
    const botDoc = await Bot.findOne({ userId, 'sessions.sessionId': sessionId });
    if (!botDoc) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // mark session metadata.archived = true
    const session = botDoc.sessions.find(s => s.sessionId === sessionId);
    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });

    session.metadata = session.metadata || {};
    session.metadata.archived = true;
    botDoc.updatedAt = new Date();
    await botDoc.save();

    return res.json({ success: true, chatId: sessionId });
  } catch (err) {
    console.error(`[${cid}] Error archiving chat:`, err);
    return res.status(500).json({ success: false, message: "Failed to delete chat", error: err.message });
  }
});

module.exports = router;


