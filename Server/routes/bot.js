/**
 * Server/Routes/bot.js
 *
 * Enterprise-hardened chatbot router for Azure OpenAI (Chat Completions).
 * Uses your Server/Models/models.js (Patient, Staff, Bot).
 */

const express = require("express");
const axios = require("axios");
const auth = require("../Middleware/Auth");
const { Bot, Patient, Staff } = require("../Models/models");
const mongoose = require("mongoose");

const router = express.Router();

/* ---------------- CONFIG ---------------- */
const _AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "<YOUR_AZURE_OPENAI_API_KEY>";
const _AZURE_OPENAI_ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "") || "https://mobye-mg2e55bd-eastus2.cognitiveservices.azure.com";
const _AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "o4-mini";
const _AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

const DEFAULT_MAX_COMPLETION_TOKENS = Number(process.env.MAX_COMPLETION_TOKENS ?? 700);
const MAX_COMPLETION_TOKENS_MAX = Number(process.env.MAX_COMPLETION_TOKENS_MAX ?? 1500);
const MAX_RETRIES = Number(process.env.MAX_RETRIES ?? 3);
const RETRY_BACKOFF_BASE_MS = Number(process.env.RETRY_BACKOFF_BASE_MS ?? 500);
const AZURE_OPENAI_TIMEOUT_MS = Number(process.env.AZURE_OPENAI_TIMEOUT_MS ?? 20000);

const CIRCUIT_BREAKER_FAILURES = Number(process.env.CIRCUIT_BREAKER_FAILURES ?? 6);
const CIRCUIT_BREAKER_COOLDOWN_MS = Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS ?? 60000);

// Keep temperature default at 1 unless you really need otherwise
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
const circuitBreaker = {
  failures: 0,
  state: "CLOSED", // CLOSED | OPEN
  openedAt: null,
};

const metrics = {
  calls: 0,
  successes: 0,
  failures: 0,
  emptyResponses: 0,
  retries: 0,
  circuitBreakersTripped: 0,
};

/* ---------------- Helpers ---------------- */
function makeCid() {
  return "cid_" + Math.random().toString(36).slice(2, 8) + "_" + Date.now().toString(36);
}
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

/* Extractors for chat completions shapes */
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
      if (Array.isArray(c.parts)) {
        const j = c.parts.join("");
        if (j.trim()) return j.trim();
      }
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

/* Circuit breaker helpers */
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

/* ---------------- Core Azure call with retries, backoff, and auto token increase ---------------- */
async function callAzureChatWithRetries(messages, temperature = DEFAULT_TEMPERATURE, initialMaxTokens = DEFAULT_MAX_COMPLETION_TOKENS) {
  metrics.calls += 1;

  if (circuitIsOpen()) {
    metrics.failures += 1;
    throw new Error("Circuit breaker is open; aborting call to Azure OpenAI");
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array");
  }

  let attempt = 0;
  let maxTokens = Number(initialMaxTokens) || DEFAULT_MAX_COMPLETION_TOKENS;
  maxTokens = Math.min(maxTokens, MAX_COMPLETION_TOKENS_MAX);

  let sawLengthFinish = false;

  while (attempt <= MAX_RETRIES) {
    attempt += 1;
    const cid = makeCid();
    try {
      const payload = {
        messages,
        max_completion_tokens: Math.floor(maxTokens),
      };

      // Temperature: many Azure reasoning models expect default; omit if not exactly 1
      if (typeof temperature === "number" && Number.isFinite(temperature) && temperature !== 1) {
        console.warn(`[${cid}] Omitting unsupported temperature=${temperature}; using model default (1).`);
      }

      console.debug(`[${cid}] POST ${CHAT_COMPLETIONS_URL} payload: max_completion_tokens=${payload.max_completion_tokens}`);
      const resp = await azureClient.post(CHAT_COMPLETIONS_URL, payload);

      try { console.debug(`[${cid}] Azure response: ${JSON.stringify(resp.data, null, 2)}`); } catch (e) { console.debug(`[${cid}] Azure response (raw):`, resp.data); }

      if (!resp || !resp.data) {
        throw new Error("Azure returned empty body");
      }
      const data = resp.data;

      // Pull content from first available choice
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

      // If truncated due to token limit or empty, and we can increase tokens, do it and retry
      if ((sawLengthFinish || !content || !String(content).trim()) && maxTokens < MAX_COMPLETION_TOKENS_MAX) {
        const newTokens = Math.min(MAX_COMPLETION_TOKENS_MAX, Math.floor(maxTokens * 2));
        console.warn(`[${cid}] Azure returned empty/truncated output (finish_reason=${finishReason}). Increasing max_completion_tokens ${maxTokens} -> ${newTokens} and retrying (attempt ${attempt}/${MAX_RETRIES}).`);
        metrics.emptyResponses += 1;
        metrics.retries += 1;
        maxTokens = newTokens;
        await sleep(RETRY_BACKOFF_BASE_MS * attempt);
        continue;
      }

      console.error(`[${cid}] Azure returned no usable text. Full response:`);
      try { console.error(JSON.stringify(data, null, 2)); } catch (e) { console.error(data); }
      metrics.failures += 1;
      recordFailureAndMaybeTripCircuit();
      throw new Error("Azure Chat Completions returned empty/whitespace response content (possible token limit). Try increasing max_completion_tokens or using a different deployment.");
    } catch (err) {
      const isHttpErr = err && err.response;
      const status = isHttpErr ? (err.response && err.response.status) : null;
      const transient = isHttpErr ? (status >= 500 || status === 429) : true;

      if (isHttpErr) {
        try { console.error(`[${cid}] Azure HTTP error ${status}:`, JSON.stringify(err.response.data, null, 2)); } catch (e) { console.error(`[${cid}] Azure HTTP error ${status} (raw):`, err.response.data); }
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

/* ---------------- Universal Chat Saving Function ---------------- */
async function saveAndReturnChat(cid, tStart, chatId, user, userMessage, botReply, res) {
  try {
    console.log(`[${cid}] Step D: Saving chat to Bot collection (userId from token)`);
    let botDoc;
    if (chatId) {
      botDoc = await Bot.findOne({ _id: chatId, userId: user.id });
      if (!botDoc) {
        console.warn(`[${cid}] Provided chatId not found/owned by user — creating new chat doc`);
        botDoc = new Bot({ userId: user.id, data: {} });
      }
    } else {
      botDoc = new Bot({ userId: user.id, data: {} });
    }

    botDoc.data = botDoc.data || {};
    botDoc.data.messages = botDoc.data.messages || [];

    botDoc.data.messages.push({
      sender: "user",
      text: userMessage,
      ts: new Date().toISOString(),
    });
    botDoc.data.messages.push({
      sender: "bot",
      text: botReply,
      ts: new Date().toISOString(),
      meta: { model: _AZURE_OPENAI_DEPLOYMENT },
    });

    botDoc.model = _AZURE_OPENAI_DEPLOYMENT;
    botDoc.updatedAt = new Date();
    await botDoc.save();

    console.log(`[${cid}] Saved bot doc id=${botDoc._id}`);
    const latency = Date.now() - tStart;
    console.log(`--- BOT CHAT END [${cid}] latency=${latency}ms ---`);

    return res.json({ success: true, reply: botReply, chatId: botDoc._id, meta: { latencyMs: latency } });
  } catch (saveErr) {
    console.error(`[${cid}] Failed to save bot doc:`, saveErr);
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

/**
 * GET /api/bot/health
 */
router.get("/health", (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/health`);
  return res.json({ success: true, message: "bot route healthy", cid });
});

/**
 * GET /api/bot/metrics
 */
router.get("/metrics", (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/metrics`);
  return res.json({ success: true, metrics, circuit: circuitBreaker });
});

/**
 * POST /api/bot/chat
 * Body: { message: string, chatId?: string, title?: string }
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
      console.warn(`[${cid}] Unauthorized: missing req.user`);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Handle new chat creation request (no message, but title present)
    if (!message && title) {
      console.log(`[${cid}] Handling new chat creation request (no message, title provided).`);
      try {
        const newChatDoc = new Bot({
          userId: user.id,
          data: { title: String(title), messages: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await newChatDoc.save();
        console.log(`[${cid}] Created new empty chat doc id=${newChatDoc._id}`);
        return res.json({
          success: true,
          chat: newChatDoc.toObject(),
          message: "New chat created successfully."
        });
      } catch (err) {
        console.error(`[${cid}] Failed to create empty chat doc:`, err);
        return res.status(500).json({ success: false, message: "Failed to create new chat session." });
      }
    }

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      console.warn(`[${cid}] Bad request: empty message`);
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const trimmed = message.trim();
    console.log(`[${cid}] user=${user.id} message="${trimmed}"`);

    // STEP 0: Greeting detection
    const lowerMessage = trimmed.toLowerCase();
    const isGreeting = lowerMessage.match(/\b(hi|hello|hey|greetings|thanks|thank you)\b/);

    if (isGreeting) {
      console.log(`[${cid}] Step 0: Detected greeting/general chat. Skipping DB extraction.`);
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
        console.log(`[${cid}] Greeting output:`, finalReply);
      } catch (summErr) {
        console.error(`[${cid}] Greeting call failed:`, summErr);
        finalReply = "Hello! How can I help you with the patient records today?";
      }

      return saveAndReturnChat(cid, tStart, chatId, user, trimmed, finalReply, res);
    }

    // ---------- Step A: Extract intent & entity using GPT ----------
    console.log(`[${cid}] Step A: calling GPT for extraction (JSON)`);
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
      console.log(`[${cid}] Extraction raw text:`, extractionText);
    } catch (err) {
      console.error(`[${cid}] Extraction call failed:`, err.message || err);
      extractionText = null;
    }

    let extraction = safeParseJsonLike(extractionText);
    if (!extraction) {
      console.warn(`[${cid}] Extraction JSON parse failed. Falling back to heuristic extraction.`);
      const lower = trimmed.toLowerCase();
      const fallback = { intent: "unknown", entity: null, date: null };
      if (lower.includes("patient") || lower.includes("show me the details") || lower.includes("details of")) fallback.intent = "patient_info";
      if (lower.includes("doctor") || lower.includes("staff") || lower.includes("nurse")) fallback.intent = "staff_info";
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length <= 4) fallback.entity = trimmed;
      extraction = fallback;
      console.log(`[${cid}] Fallback extraction =`, extraction);
    } else {
      console.log(`[${cid}] Parsed extraction =`, extraction);
      extraction.intent = extraction.intent || "unknown";
      extraction.entity = extraction.entity || null;
      extraction.date = extraction.date || null;
    }

    // ---------- Step B: Query DB (NAME-ONLY search, safe — no ObjectId casting) ----------
    console.log(`[${cid}] Step B: Querying DB for entity/${extraction.entity} (intent=${extraction.intent})`);
    let patientDoc = null;
    let staffDoc = null;
    const entityRaw = extraction.entity;
    const entity = entityRaw && String(entityRaw).trim();
    try {
      if (entity) {
        // Build safe regex for case-insensitive partial match
        const safe = entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const nameRegex = new RegExp(safe, "i");

        // Patients: firstName OR lastName OR email OR phone OR fullName (if present)
        patientDoc = await Patient.findOne({
          $or: [
            { firstName: nameRegex },
            { lastName: nameRegex },
            { email: nameRegex },
            { phone: nameRegex },
            // Some records might store combined name in other fields
            { fullName: nameRegex },
            { name: nameRegex },
          ]
        }).lean().exec().catch(err => {
          console.error(`[${cid}] Patient name search error:`, err && err.message ? err.message : err);
          return null;
        });

        // Staff: match against name, phone, email
        staffDoc = await Staff.findOne({
          $or: [
            { name: nameRegex },
            { email: nameRegex },
            { phone: nameRegex },
          ]
        }).lean().exec().catch(err => {
          console.error(`[${cid}] Staff name search error:`, err && err.message ? err.message : err);
          return null;
        });
      } else {
        console.log(`[${cid}] No entity provided; skipping name search.`);
      }
    } catch (dbErr) {
      console.error(`[${cid}] DB query error (name-only search):`, dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    console.log(`[${cid}] DB results — patient: ${patientDoc ? "FOUND" : "NOT FOUND"}, staff: ${staffDoc ? "FOUND" : "NOT FOUND"}`);

    const isDataMissing = !patientDoc && !staffDoc;
    let finalReply;

    // ---------- Build safe contexts (defensive) ----------
    function buildPatientContext(p) {
      if (!p) return null;
      const firstName = p.firstName || p.first_name || "";
      const lastName = p.lastName || p.last_name || "";
      const fullName = p.fullName || p.name || `${firstName} ${lastName}`.trim() || null;
      const name = fullName || null;
      const hasUseful = Boolean(name || p.dateOfBirth || (p.prescriptions && p.prescriptions.length) || (p.allergies && p.allergies.length) || p.phone || p.email);

      return {
        id: p._id || null,
        name: name,
        dob: p.dateOfBirth || p.dob || null,
        phone: p.phone || p.contact || null,
        email: p.email || null,
        prescriptions: (p.prescriptions || []).slice(0, 5).map(pr => ({
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
      const firstName = s.firstName || s.first_name || "";
      const lastName = s.lastName || s.last_name || "";
      const fullName = s.fullName || s.name || `${firstName} ${lastName}`.trim() || null;
      const name = fullName || null;
      const hasUseful = Boolean(name || s.designation || s.department || s.phone || s.email);

      return {
        id: s._id || null,
        name: name,
        designation: s.designation || null,
        department: s.department || null,
        contact: s.contact || s.phone || null,
        email: s.email || null,
        _hasUsefulFields: hasUseful,
      };
    }

    if (isDataMissing) {
      // --- FINAL FIX: Use simple fallback prompt when data is missing to avoid 400 errors ---
      console.log(`[${cid}] Step C: Data missing. Calling GPT with safe fallback prompt.`);
      try {
        const summarizerFallbackSystem = `You are MedGPT, a professional assistant. The user searched for data (patient or staff) that was not found in the database. Reply ONLY with a single, concise sentence confirming that no relevant records were found for their query.`;
        finalReply = await callAzureChatWithRetries(
          [
            { role: "system", content: summarizerFallbackSystem },
            { role: "user", content: `Original Query: ${trimmed}` },
          ],
          DEFAULT_TEMPERATURE,
          150
        );
        finalReply = String(finalReply).trim();
        console.log(`[${cid}] Summarizer (Fallback) output:`, finalReply);
      } catch (summErr) {
        console.error(`[${cid}] Summarizer (Fallback) call failed:`, summErr);
        finalReply = "No relevant records were found for this query.";
      }
    } else {
      // Data found: build safe context and call summarizer
      console.log(`[${cid}] Step C: Data found. Calling GPT for detailed summarization.`);
      // Defensive debug logs to see exactly what we pass to the LLM
      console.log(`[${cid}] Raw patientDoc:`, patientDoc ? JSON.stringify(patientDoc, null, 2) : "null");
      console.log(`[${cid}] Raw staffDoc:`, staffDoc ? JSON.stringify(staffDoc, null, 2) : "null");

      const safePatient = buildPatientContext(patientDoc);
      const safeStaff = buildStaffContext(staffDoc);

      console.log(`[${cid}] safePatient:`, JSON.stringify(safePatient, null, 2));
      console.log(`[${cid}] safeStaff:`, JSON.stringify(safeStaff, null, 2));

      // If a record exists but has no useful fields, send a minimal hint so LLM knows it's not an absent record
      if (patientDoc && !safePatient._hasUsefulFields) {
        safePatient.name = safePatient.name || "<patient record exists but fields are unavailable>";
      }
      if (staffDoc && !safeStaff._hasUsefulFields) {
        safeStaff.name = safeStaff.name || "<staff record exists but fields are unavailable>";
      }

      // remove internal flags
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
        console.log(`[${cid}] Summarizer output:`, finalReply);
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
    const latency = Date.now() - tStart;
    return res.status(500).json({ success: false, message: "Internal server error", error: outerErr.message, meta: { latencyMs: latency } });
  }
});

/* ---------------- Chats listing/get/get/delete ---------------- */

router.get("/chats", auth, async (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/chats by user=${req.user?.id}`);

  try {
    const userId = req.user.id;
    const docs = await Bot.find({ userId, archived: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const list = (docs || []).map((d) => ({
      id: d._id,
      title: d.data?.title || (d.data?.messages && d.data.messages.length ? d.data.messages[0].text.slice(0, 80) : "Chat"),
      snippet: (d.data?.messages && d.data.messages.length) ? d.data.messages[d.data.messages.length - 1].text.slice(0, 200) : "",
      patientId: d.patientId || null,
      staffId: d.staffId || null,
      updatedAt: d.updatedAt || d.createdAt,
      model: d.model || null,
    }));

    console.log(`[${cid}] returning ${list.length} chats`);
    return res.json({ success: true, chats: list });
  } catch (err) {
    console.error(`[${cid}] Error listing chats:`, err);
    return res.status(500).json({ success: false, message: "Failed to list chats", error: err.message });
  }
});

router.get("/chats/:id", auth, async (req, res) => {
  const cid = makeCid();
  const chatId = req.params.id;
  console.log(`[${cid}] GET /api/bot/chats/${chatId} by user=${req.user?.id}`);

  if (!chatId) return res.status(400).json({ success: false, message: "Chat ID required" });

  try {
    const userId = req.user.id;
    const doc = await Bot.findOne({ _id: chatId, userId, archived: { $ne: true } }).lean();
    if (!doc) {
      console.warn(`[${cid}] Chat not found or not owned by user: ${chatId}`);
      return res.status(404).json({ success: false, message: "Chat not found" });
    }
    console.log(`[${cid}] Returning chat document: ${chatId}`);
    return res.json({ success: true, chat: doc, messages: doc.data?.messages || [] });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: "Invalid chat ID format" });
    }
    console.error(`[${cid}] Error fetching chat:`, err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

router.delete("/chats/:id", auth, async (req, res) => {
  const cid = makeCid();
  const chatId = req.params.id;
  console.log(`[${cid}] DELETE /api/bot/chats/${chatId} by user=${req.user?.id}`);

  if (!chatId) return res.status(400).json({ success: false, message: "chat id required" });

  try {
    const userId = req.user.id;
    const updated = await Bot.findOneAndUpdate({ _id: chatId, userId }, { $set: { archived: true, updatedAt: new Date() } }, { new: true });
    if (!updated) {
      console.warn(`[${cid}] Chat not found or not owned by user`);
      return res.status(404).json({ success: false, message: "Chat not found" });
    }
    console.log(`[${cid}] Chat archived id=${chatId}`);
    return res.json({ success: true, chatId });
  } catch (err) {
    console.error(`[${cid}] Error archiving chat:`, err);
    return res.status(500).json({ success: false, message: "Failed to delete chat", error: err.message });
  }
});

module.exports = router;
