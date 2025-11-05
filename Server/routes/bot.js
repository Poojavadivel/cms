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
const _AZURE_OPENAI_DEPLOYMENT =  "o4-mini";
const _AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";


const MAX_RETRIES = Number(process.env.MAX_RETRIES ?? 3);
const DEFAULT_MAX_COMPLETION_TOKENS = Number(process.env.MAX_COMPLETION_TOKENS ?? 1500);
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

/* ---------------- ENTERPRISE: Enhanced Role-Based System Prompts ---------------- */
const ENTERPRISE_SYSTEM_PROMPTS = {
  doctor: `You are MedGPT, an intelligent medical assistant for doctors at Karur Gastro Foundation HMS.

**Your Role:**
- Assist doctors with patient information, medical histories, lab reports, and prescriptions
- Provide clinical insights based on patient data with evidence-based recommendations
- Help manage appointments, treatment plans, and follow-up care
- Support differential diagnosis with relevant medical literature references
- Maintain professional medical terminology while ensuring clarity

**Guidelines:**
- Always prioritize patient safety and accuracy - flag critical values immediately
- If unsure about medical data or diagnosis, acknowledge the limitation clearly
- Present lab results with reference ranges and interpret abnormalities
- Suggest follow-ups when patterns indicate medical attention needed
- Keep responses concise but comprehensive (2-4 paragraphs max)
- Use bullet points for lists (medications, symptoms, etc.)
- Cite medical guidelines when making recommendations (e.g., "Per AHA guidelines...")

**Capabilities:**
- Patient medical history analysis with risk stratification
- Lab report interpretation with clinical correlation
- Drug interaction checking and prescription tracking  
- Appointment scheduling assistance with smart suggestions
- Clinical decision support with evidence-based recommendations
- ICD-10 coding assistance and documentation support

**Response Format:**
For medical queries:
1. **Summary**: Quick overview (1-2 sentences)
2. **Analysis**: Detailed breakdown with clinical reasoning
3. **Recommendations**: Clear, actionable next steps
4. **Alerts**: Any red flags or urgent concerns (if applicable)

**Tone:** Professional, precise, empathetic, clinically relevant, evidence-based`,

  admin: `You are MedGPT, an intelligent administrative assistant for hospital management at Karur Gastro Foundation HMS.

**Your Role:**
- Provide hospital operational insights and real-time analytics
- Assist with staff management, scheduling optimization, and resource allocation
- Track revenue, occupancy, patient flow, and operational KPIs
- Generate executive reports and identify operational bottlenecks
- Support data-driven decision-making with actionable insights
- Predict trends and recommend proactive measures

**Guidelines:**
- Focus on metrics, KPIs, and operational efficiency with data visualization suggestions
- Present data in business-friendly format (tables, charts descriptions)
- Highlight areas needing attention (low revenue, understaffing, bottlenecks)
- Suggest actionable improvements with ROI estimates when possible
- Keep responses data-driven, concise, and executive-ready
- Use percentage changes, trends, and comparative analysis
- Include both quantitative metrics and qualitative insights

**Capabilities:**
- Revenue and billing analytics with trend analysis
- Bed occupancy monitoring and capacity planning
- Staff attendance tracking and shift optimization
- Department performance analysis with benchmarking
- Resource allocation optimization (equipment, beds, staff)
- Patient satisfaction analysis and improvement suggestions
- Financial forecasting and budgeting support

**Response Format:**
For analytical queries:
1. **Key Metrics**: Headline numbers with context
2. **Trends**: Up/down arrows with percentage changes
3. **Insights**: What the data means for operations
4. **Actions**: Specific recommendations prioritized by impact

**Tone:** Business-focused, analytical, solution-oriented, strategic, results-driven`,

  pharmacist: `You are MedGPT, an intelligent pharmacy assistant for pharmacists at Karur Gastro Foundation HMS.

**Your Role:**
- Assist with medication inventory management and stock optimization
- Track prescription fulfillment and dispensing accuracy
- Monitor drug expiry dates and stock levels with smart alerts
- Provide comprehensive drug interaction information
- Support pharmacy operations with workflow optimization
- Ensure medication safety and regulatory compliance

**Guidelines:**
- Prioritize patient safety with drug-drug, drug-food, drug-disease interactions
- Alert for low stock and expiring medications with reorder suggestions
- Validate prescription authenticity and dosage appropriateness
- Provide detailed dosage, administration guidance, and patient counseling points
- Keep responses practical, actionable, and safety-focused
- Include generic alternatives when relevant
- Flag controlled substances and special storage requirements

**Capabilities:**
- Medicine inventory tracking with ABC/VED analysis
- Prescription processing with error detection
- Stock alerts (low/expired) with demand forecasting
- Comprehensive drug interaction checks (drug-drug, drug-food)
- Supplier management and ordering assistance
- Medication therapy management support
- Adverse drug reaction monitoring

**Response Format:**
For medication queries:
1. **Medication Info**: Name, strength, form, therapeutic class
2. **Interactions**: Critical alerts (if any)
3. **Administration**: Dosing, timing, special instructions
4. **Counseling Points**: What to tell patients
5. **Inventory Status**: Current stock level (if relevant)

**Tone:** Precise, safety-focused, practical, detail-oriented, patient-centered`,

  pathologist: `You are MedGPT, an intelligent laboratory assistant for pathologists at Karur Gastro Foundation HMS.

**Your Role:**
- Assist with lab test management and quality-assured reporting
- Track sample processing, results, and turnaround times
- Provide reference ranges with age/gender-specific adjustments
- Monitor equipment status, calibration, and quality control
- Support accurate result interpretation with clinical correlation
- Ensure laboratory compliance and quality standards

**Guidelines:**
- Maintain high accuracy standards - double-check critical values
- Present test results with appropriate reference ranges and units
- Flag abnormal values requiring immediate attention (critical alerts)
- Track pending tests and turnaround times with bottleneck identification
- Keep responses technically accurate with clinical context
- Include quality control status when relevant
- Suggest reflex testing when initial results are abnormal

**Capabilities:**
- Test report generation with automated QC checks
- Sample tracking with barcode/RFID integration
- Result interpretation with delta checking
- Equipment monitoring and calibration tracking
- Quality control assistance with Westgard rules
- Reference range management (age, gender, population-specific)
- Turnaround time analysis and workflow optimization

**Response Format:**
For lab queries:
1. **Test Details**: Name, specimen type, method
2. **Results**: Values with reference ranges and units
3. **Interpretation**: Normal/Abnormal with severity
4. **Clinical Correlation**: What it might indicate
5. **Recommendations**: Repeat testing, additional tests, or urgent referral

**Tone:** Technical, precise, analytical, quality-focused, scientifically rigorous`,

  default: `You are MedGPT, a professional hospital assistant at Karur Gastro Foundation HMS.

**Your Role:**
- Assist with general hospital information and navigation
- Provide basic patient and staff information
- Answer operational and administrative queries
- Guide users to appropriate departments or specialists
- Maintain professional healthcare standards

**Guidelines:**
- Be helpful, accurate, and courteous
- Acknowledge limitations when appropriate - don't speculate
- Maintain patient confidentiality and HIPAA compliance
- Keep responses clear, concise, and actionable
- Direct complex medical queries to appropriate healthcare professionals

**Tone:** Professional, helpful, courteous, informative, trustworthy`
};

/* ---------------- ENTERPRISE: Enhanced Context Builder ---------------- */
async function buildEnhancedContext(entity, userRole, intent, userId) {
  const context = {
    role: userRole,
    intent: intent,
    data: {},
    summary: []
  };

  try {
    // For doctors: fetch appointments, labs, prescriptions
    if (userRole === 'doctor' && entity) {
      const Appointment = require('../Models').Appointment;
      const appointments = await Appointment.find({
        $or: [
          { patientName: new RegExp(entity, 'i') },
          { patientCode: new RegExp(entity, 'i') }
        ]
      }).limit(5).sort({ date: -1 }).lean();
      
      if (appointments && appointments.length > 0) {
        context.data.recentAppointments = appointments.map(a => ({
          date: a.date,
          time: a.time,
          reason: a.reason,
          status: a.status,
          diagnosis: a.diagnosis
        }));
        context.summary.push(`Found ${appointments.length} recent appointment(s)`);
      }
    }

    // For admin: fetch staff metrics, revenue
    if (userRole === 'admin') {
      const User = require('../Models').User;
      const staffCount = await User.countDocuments({ role: 'staff' });
      const doctorCount = await User.countDocuments({ role: 'doctor' });
      
      context.data.staffMetrics = {
        totalStaff: staffCount,
        totalDoctors: doctorCount
      };
      context.summary.push(`Hospital has ${doctorCount} doctor(s) and ${staffCount} staff member(s)`);
    }

    // For pharmacist: check medicine stock
    if (userRole === 'pharmacist' && entity) {
      const Medicine = require('../Models').Medicine;
      const medicine = await Medicine.findOne({
        name: new RegExp(entity, 'i')
      }).lean();
      
      if (medicine) {
        context.data.medicineInfo = {
          name: medicine.name,
          stock: medicine.stock || medicine.quantity,
          expiryDate: medicine.expiryDate,
          supplier: medicine.supplier
        };
        context.summary.push(`Medicine "${medicine.name}" found in inventory`);
      }
    }

    // For pathologist: fetch recent lab reports
    if (userRole === 'pathologist' && entity) {
      const Report = require('../Models').Report;
      const reports = await Report.find({
        $or: [
          { patientName: new RegExp(entity, 'i') },
          { patientCode: new RegExp(entity, 'i') }
        ]
      }).limit(3).sort({ createdAt: -1 }).lean();
      
      if (reports && reports.length > 0) {
        context.data.recentReports = reports.map(r => ({
          testName: r.testName,
          result: r.result,
          date: r.createdAt,
          status: r.status
        }));
        context.summary.push(`Found ${reports.length} recent lab report(s)`);
      }
    }

  } catch (err) {
    console.error('[buildEnhancedContext] Error:', err);
    context.error = 'Some context data unavailable';
  }

  return context;
}

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
 * Body: { message: string, chatId?: string(sessionId), title?: string, metadata?: { userRole: string } }
 */
router.post("/chat", auth, async (req, res) => {
  const cid = makeCid();
  console.log(`--- BOT CHAT START [${cid}] ---`);
  console.log(`[${cid}] body=`, req.body);

  const tStart = Date.now();
  try {
    const { message, chatId, title, metadata } = req.body || {};
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Extract user role from metadata or user object
    const userRole = (metadata && metadata.userRole) || user.role || 'default';
    console.log(`[${cid}] User role: ${userRole}`);

    // create empty chat session with title
    if (!message && title) {
      try {
        const { botDoc, session } = await findOrCreateSessionForUser(user.id, null);
        botDoc.sessions[botDoc.sessions.length - 1].metadata = botDoc.sessions[botDoc.sessions.length - 1].metadata || {};
        botDoc.sessions[botDoc.sessions.length - 1].metadata.title = String(title);
        botDoc.sessions[botDoc.sessions.length - 1].metadata.userRole = userRole;
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
    
    // Get role-specific system prompt
    const systemPrompt = ENTERPRISE_SYSTEM_PROMPTS[userRole] || ENTERPRISE_SYSTEM_PROMPTS.default;
    
    // greeting short-circuit with role awareness
    const lower = trimmed.toLowerCase();
    const isGreeting = lower.match(/\b(hi|hello|hey|greetings|thanks|thank you)\b/);
    if (isGreeting) {
      let finalReply;
      try {
        const greetingMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User sent a greeting: ${trimmed}. Reply warmly and professionally in 1-2 sentences.` },
        ];
        
        const summaryText = await callAzureChatWithRetries(
          greetingMessages,
          DEFAULT_TEMPERATURE,
          Math.max(150, Math.min(DEFAULT_MAX_COMPLETION_TOKENS, 300))
        );
        finalReply = String(summaryText).trim();
      } catch (summErr) {
        console.error(`[${cid}] Greeting call failed:`, summErr);
        finalReply = "Hello! How can I help you today?";
      }
      return saveAndReturnChat(cid, tStart, chatId, user, trimmed, finalReply, res);
    }

    // Step A: Extract intent/entity
    const extractorPromptSystem = `You are an extractor. Read the user's query and respond ONLY with a compact JSON object with keys:
- intent: one-word intent like "patient_info", "staff_info", "appointments", "medicines", "lab_reports", "analytics", "unknown"
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
      if (lowerMsg.includes("appointment")) fallback.intent = "appointments";
      if (lowerMsg.includes("medicine") || lowerMsg.includes("drug") || lowerMsg.includes("pharmacy")) fallback.intent = "medicines";
      if (lowerMsg.includes("lab") || lowerMsg.includes("test") || lowerMsg.includes("report")) fallback.intent = "lab_reports";
      if (lowerMsg.includes("revenue") || lowerMsg.includes("occupancy") || lowerMsg.includes("analytics")) fallback.intent = "analytics";
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length <= 4) fallback.entity = trimmed;
      extraction = fallback;
    } else {
      extraction.intent = extraction.intent || "unknown";
      extraction.entity = extraction.entity || null;
      extraction.date = extraction.date || null;
    }

    console.log(`[${cid}] Extracted intent: ${extraction.intent}, entity: ${extraction.entity}`);

    // Step B: Build enhanced context based on role and intent
    const enhancedContext = await buildEnhancedContext(extraction.entity, userRole, extraction.intent, user.id);
    console.log(`[${cid}] Enhanced context summary:`, enhancedContext.summary);

    // Step C: DB name-only search (Patient and User)
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

    const isDataMissing = !patientDoc && !staffDoc && (!enhancedContext.data || Object.keys(enhancedContext.data).length === 0);
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
      try {
        finalReply = await callAzureChatWithRetries(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: `User Query: ${trimmed}\n\nNo relevant records were found in the database. Please respond professionally acknowledging this.` },
          ],
          DEFAULT_TEMPERATURE,
          300
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

      // Combine all context
      const fullContext = {
        patient: safePatient,
        staff: safeStaff,
        enhanced: enhancedContext.data,
        contextSummary: enhancedContext.summary
      };

      const summarizerUser = `User Query: ${trimmed}

Available Context:
${JSON.stringify(fullContext, null, 2)}

Instructions:
- Use ONLY the provided context above
- If the query relates to your role (${userRole}), provide role-specific insights
- If data is incomplete, acknowledge what's available
- Keep response concise but informative (2-4 paragraphs max)
- Format medical/technical data clearly
- If no relevant data, state clearly`;

      try {
        finalReply = await callAzureChatWithRetries(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: summarizerUser },
          ],
          DEFAULT_TEMPERATURE,
          DEFAULT_MAX_COMPLETION_TOKENS
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

/**
 * POST /api/bot/feedback
 * Body: { messageId: string, type: 'helpful'|'not_helpful', conversationId: string }
 * Stores user feedback for bot responses
 */
router.post("/feedback", auth, async (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] POST /api/bot/feedback by user=${req.user?.id}`);
  
  try {
    const { messageId, type, conversationId } = req.body || {};
    const user = req.user;
    
    if (!messageId || !type || !conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: "messageId, type, and conversationId are required" 
      });
    }
    
    if (!['helpful', 'not_helpful'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "type must be 'helpful' or 'not_helpful'" 
      });
    }
    
    // Find the bot document and session
    const botDoc = await Bot.findOne({ 
      userId: user.id, 
      'sessions.sessionId': conversationId 
    });
    
    if (!botDoc) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    
    const session = botDoc.sessions.find(s => s.sessionId === conversationId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    
    // Add feedback to session metadata
    session.metadata = session.metadata || {};
    session.metadata.feedback = session.metadata.feedback || [];
    
    // Check if feedback already exists for this message
    const existingFeedbackIndex = session.metadata.feedback.findIndex(
      f => f.messageId === messageId
    );
    
    const feedbackEntry = {
      messageId,
      type,
      timestamp: new Date(),
      userId: user.id
    };
    
    if (existingFeedbackIndex >= 0) {
      // Update existing feedback
      session.metadata.feedback[existingFeedbackIndex] = feedbackEntry;
    } else {
      // Add new feedback
      session.metadata.feedback.push(feedbackEntry);
    }
    
    botDoc.updatedAt = new Date();
    await botDoc.save();
    
    console.log(`[${cid}] Feedback recorded: ${type} for message ${messageId}`);
    
    return res.json({ 
      success: true, 
      message: "Feedback recorded successfully",
      feedback: { messageId, type }
    });
    
  } catch (err) {
    console.error(`[${cid}] Error recording feedback:`, err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to record feedback", 
      error: err.message 
    });
  }
});

module.exports = router;
