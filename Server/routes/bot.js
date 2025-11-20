// routes/bot.js
// Updated to work with Gemini API and Mongoose models: Bot, Patient, User
const express = require("express");
const { v4: uuidv4 } = require('uuid');
const auth = require("../Middleware/Auth");
const { Bot, Patient, User } = require("../Models");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

/* ---------------- CONFIG (Gemini) ---------------- */
const GEMINI_API_KEY = process.env.Gemi_Api_Key || process.env.GEMINI_API_KEY;
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const MAX_RETRIES = Number(process.env.MAX_RETRIES ?? 3);
const DEFAULT_MAX_COMPLETION_TOKENS = Number(process.env.MAX_COMPLETION_TOKENS ?? 1500);
const MAX_COMPLETION_TOKENS_MAX = Number(process.env.MAX_COMPLETION_TOKENS_MAX ?? 7500);
const RETRY_BACKOFF_BASE_MS = Number(process.env.RETRY_BACKOFF_BASE_MS ?? 500);

const CIRCUIT_BREAKER_FAILURES = Number(process.env.CIRCUIT_BREAKER_FAILURES ?? 6);
const CIRCUIT_BREAKER_COOLDOWN_MS = Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS ?? 60000);

const DEFAULT_TEMPERATURE = Number(process.env.TEMPERATURE ?? 1);

if (!GEMINI_API_KEY) {
  console.warn("[bot.js] WARNING: Gemini API key missing. Please set Gemi_Api_Key in .env file.");
}

/* Initialize Gemini */
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

**CRITICAL RESPONSE FORMAT:**
- ALWAYS use bullet points (•) or numbered lists - NEVER use paragraphs
- Keep responses CRISP and SCANNABLE - maximum 2-3 words per bullet
- Use subheadings with bullet points underneath
- Example format:
  • **Key Finding:** Elevated WBC 15,000 (ref: 4,000-11,000)
  • **Clinical Significance:** Possible infection
  • **Action Required:** Order blood culture, start empiric antibiotics
  • **Follow-up:** Recheck CBC in 48 hours

**Capabilities:**
- Patient medical history analysis with risk stratification
- Lab report interpretation with clinical correlation
- Drug interaction checking and prescription tracking  
- Appointment scheduling assistance with smart suggestions
- Clinical decision support with evidence-based recommendations
- ICD-10 coding assistance and documentation support

**Response Structure:**
• **Summary** (1 line)
• **Key Points** (3-5 bullets max)
• **Recommendations** (bullet list)
• **Alerts** (if critical - use ⚠️ symbol)

**Tone:** Professional, precise, empathetic, clinically relevant, evidence-based`,

  admin: `You are MedGPT, an intelligent administrative assistant for hospital management at Karur Gastro Foundation HMS.

**Your Role:**
- Provide hospital operational insights and real-time analytics
- Assist with staff management, scheduling optimization, and resource allocation
- Track revenue, occupancy, patient flow, and operational KPIs
- Generate executive reports and identify operational bottlenecks
- Support data-driven decision-making with actionable insights
- Predict trends and recommend proactive measures

**CRITICAL RESPONSE FORMAT:**
- ALWAYS use bullet points (•) or numbered lists - NEVER use paragraphs
- Keep responses CRISP and SCANNABLE - maximum 2-3 words per bullet
- Use clear headings with metrics
- Example format:
  • **Revenue Today:** ₹2.5L (↑15% vs yesterday)
  • **Bed Occupancy:** 78% (12 beds available)
  • **Action Needed:** Schedule discharge for 3 stable patients
  • **Staff Alert:** ⚠️ 2 nurses absent - arrange backup

**Capabilities:**
- Revenue and billing analytics with trend analysis
- Bed occupancy monitoring and capacity planning
- Staff attendance tracking and shift optimization
- Department performance analysis with benchmarking
- Resource allocation optimization (equipment, beds, staff)
- Patient satisfaction analysis and improvement suggestions
- Financial forecasting and budgeting support

**Response Structure:**
• **Key Metrics** (numbers with trends)
• **Status** (bullet list with symbols: ✅ ⚠️ ❌)
• **Actions** (prioritized bullet list)
• **Forecast** (if relevant)

**Tone:** Business-focused, analytical, solution-oriented, strategic, results-driven`,

  pharmacist: `You are MedGPT, an intelligent pharmacy assistant for pharmacists at Karur Gastro Foundation HMS.

**Your Role:**
- Assist with medication inventory management and stock optimization
- Track prescription fulfillment and dispensing accuracy
- Monitor drug expiry dates and stock levels with smart alerts
- Provide comprehensive drug interaction information
- Support pharmacy operations with workflow optimization
- Ensure medication safety and regulatory compliance

**CRITICAL RESPONSE FORMAT:**
- ALWAYS use bullet points (•) - NEVER use paragraphs
- Keep responses CRISP - maximum 2-3 words per bullet
- Use clear symbols: ⚠️ (warning), ✅ (safe), ❌ (contraindicated)
- Example format:
  • **Drug:** Amoxicillin 500mg TID
  • **Interaction:** ⚠️ With Warfarin - increases bleeding risk
  • **Action:** Monitor INR closely
  • **Stock:** 45 units (reorder at 30)

**Capabilities:**
- Medicine inventory tracking with ABC/VED analysis
- Prescription processing with error detection
- Stock alerts (low/expired) with demand forecasting
- Comprehensive drug interaction checks (drug-drug, drug-food)
- Supplier management and ordering assistance
- Medication therapy management support
- Adverse drug reaction monitoring

**Response Structure:**
• **Drug Info** (name, strength, form)
• **Interactions** (bullet list with ⚠️ symbols)
• **Instructions** (dosing, timing)
• **Stock Status** (with alerts if low)

**Tone:** Precise, safety-focused, practical, detail-oriented, patient-centered`,

  pathologist: `You are MedGPT, an intelligent laboratory assistant for pathologists at Karur Gastro Foundation HMS.

**Your Role:**
- Assist with lab test management and quality-assured reporting
- Track sample processing, results, and turnaround times
- Provide reference ranges with age/gender-specific adjustments
- Monitor equipment status, calibration, and quality control
- Support accurate result interpretation with clinical correlation
- Ensure laboratory compliance and quality standards

**CRITICAL RESPONSE FORMAT:**
- ALWAYS use bullet points (•) - NEVER use paragraphs
- Keep responses CRISP - maximum 2-3 words per bullet
- Use clear symbols: 🔴 (critical), ⚠️ (abnormal), ✅ (normal)
- Example format:
  • **Test:** Hemoglobin
  • **Result:** 8.5 g/dL 🔴 (ref: 12-16)
  • **Interpretation:** Moderate anemia
  • **Action:** Urgent - transfuse if symptomatic
  • **Reflex Test:** Iron studies, B12 levels

**Capabilities:**
- Test report generation with automated QC checks
- Sample tracking with barcode/RFID integration
- Result interpretation with delta checking
- Equipment monitoring and calibration tracking
- Quality control assistance with Westgard rules
- Reference range management (age, gender, population-specific)
- Turnaround time analysis and workflow optimization

**Response Structure:**
• **Test Info** (name, specimen, method)
• **Results** (value, ref range, unit)
• **Status** (🔴 critical / ⚠️ abnormal / ✅ normal)
• **Next Steps** (reflex tests, repeat, urgent referral)

**Tone:** Technical, precise, analytical, quality-focused, scientifically rigorous`,

  default: `You are MedGPT, a professional hospital assistant at Karur Gastro Foundation HMS.

**CRITICAL RESPONSE FORMAT:**
- ALWAYS use bullet points (•) - NEVER use paragraphs
- Keep responses CRISP - maximum 2-3 words per bullet
- Use clear symbols and emojis for clarity
- Example format:
  • **Location:** OPD - 2nd Floor, Room 205
  • **Hours:** Mon-Sat, 9 AM - 5 PM
  • **Contact:** +91-1234567890
  • **Doctor:** Dr. Kumar (Gastroenterologist)

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

**Response Structure:**
• **Quick Answer** (1 line)
• **Details** (3-5 bullets max)
• **Next Steps** (if applicable)

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

/* ---------------- Core Gemini call (same logic, different provider) ---------------- */
async function callGeminiChatWithRetries(messages, temperature = DEFAULT_TEMPERATURE, initialMaxTokens = DEFAULT_MAX_COMPLETION_TOKENS) {
  metrics.calls += 1;
  if (circuitIsOpen()) { metrics.failures += 1; throw new Error("Circuit breaker is open; aborting call to Gemini API"); }
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("messages must be a non-empty array");

  let attempt = 0;
  let maxTokens = Number(initialMaxTokens) || DEFAULT_MAX_COMPLETION_TOKENS;
  maxTokens = Math.min(maxTokens, MAX_COMPLETION_TOKENS_MAX);

  while (attempt <= MAX_RETRIES) {
    attempt += 1;
    const cid = makeCid();
    try {
      // Convert OpenAI-style messages to Gemini format
      const model = genAI.getGenerativeModel({ 
        model: GEMINI_MODEL_NAME,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: Math.floor(maxTokens),
        }
      });

      // Build chat history and current prompt
      let systemPrompt = "";
      const chatHistory = [];
      let userPrompt = "";

      for (const msg of messages) {
        if (msg.role === "system") {
          systemPrompt = msg.content;
        } else if (msg.role === "user") {
          userPrompt = msg.content;
        } else if (msg.role === "assistant") {
          chatHistory.push({
            role: "model",
            parts: [{ text: msg.content }]
          });
        }
      }

      // Combine system prompt with user prompt if system prompt exists
      const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

      console.debug(`[${cid}] Calling Gemini API with model: ${GEMINI_MODEL_NAME}, maxTokens=${maxTokens}`);
      
      // Start chat or generate content
      let result;
      if (chatHistory.length > 0) {
        const chat = model.startChat({ history: chatHistory });
        result = await chat.sendMessage(finalPrompt);
      } else {
        result = await model.generateContent(finalPrompt);
      }

      const response = result.response;
      const content = response.text();

      if (content && String(content).trim()) {
        metrics.successes += 1;
        circuitBreaker.failures = 0;
        circuitBreaker.state = "CLOSED";
        return String(content).trim();
      }

      // Handle empty response
      if ((!content || !String(content).trim()) && maxTokens < MAX_COMPLETION_TOKENS_MAX) {
        const newTokens = Math.min(MAX_COMPLETION_TOKENS_MAX, Math.floor(maxTokens * 2));
        console.warn(`[${cid}] Gemini returned empty output. Increasing maxOutputTokens ${maxTokens} -> ${newTokens} and retrying (attempt ${attempt}/${MAX_RETRIES}).`);
        metrics.emptyResponses += 1;
        metrics.retries += 1;
        maxTokens = newTokens;
        await sleep(RETRY_BACKOFF_BASE_MS * attempt);
        continue;
      }

      console.error(`[${cid}] Gemini returned no usable text.`);
      metrics.failures += 1;
      recordFailureAndMaybeTripCircuit();
      throw new Error("Gemini API returned empty/whitespace response content.");
    } catch (err) {
      // Check if it's a rate limit or server error
      const errorMessage = err.message || String(err);
      const isRateLimitError = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit");
      const isServerError = errorMessage.includes("500") || errorMessage.includes("503") || errorMessage.includes("internal error");
      const transient = isRateLimitError || isServerError;

      console.error(`[${cid}] Gemini API error:`, errorMessage);

      if (!transient || attempt > MAX_RETRIES) {
        metrics.failures += 1;
        recordFailureAndMaybeTripCircuit();
        throw err;
      }

      metrics.retries += 1;
      const backoffMs = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(`[${cid}] Transient error detected. Backing off ${backoffMs}ms and retrying (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(backoffMs);
      continue;
    }
  }

  metrics.failures += 1;
  recordFailureAndMaybeTripCircuit();
  throw new Error("Exceeded retry attempts calling Gemini API");
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
    model: GEMINI_MODEL_NAME,
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
      model: GEMINI_MODEL_NAME,
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
      { sender: "bot", text: botReply, ts: now, meta: { model: GEMINI_MODEL_NAME } },
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
        
        const summaryText = await callGeminiChatWithRetries(
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
      extractionText = await callGeminiChatWithRetries(extractorMessages, DEFAULT_TEMPERATURE, 400);
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
        console.log(`[${cid}] 🔍 Searching for patient with entity: "${entity}"`);
        
        // Search patient by name, phone, email, or ID
        patientDoc = await Patient.findOne({
          $or: [
            { _id: entity }, // Direct ID match
            { firstName: nameRegex },
            { lastName: nameRegex },
            { email: nameRegex },
            { phone: entity }, // Exact phone match
            { phone: nameRegex },
            { telegramUsername: nameRegex }, // Telegram username
          ]
        }).lean().exec();
        
        if (patientDoc) {
          console.log(`[${cid}] ✅ Found patient: ${patientDoc.firstName} ${patientDoc.lastName} (ID: ${patientDoc._id})`);
        } else {
          console.log(`[${cid}] ⚠️ No patient found with simple search, trying full name split...`);
        }
        
        // If not found and entity looks like a full name, try splitting
        if (!patientDoc && entity.includes(' ')) {
          const nameParts = entity.split(' ').filter(Boolean);
          if (nameParts.length >= 2) {
            const firstNameRegex = new RegExp(nameParts[0], "i");
            const lastNameRegex = new RegExp(nameParts.slice(1).join(' '), "i");
            console.log(`[${cid}] 🔍 Trying split search: firstName="${nameParts[0]}", lastName="${nameParts.slice(1).join(' ')}"`);
            
            patientDoc = await Patient.findOne({
              firstName: firstNameRegex,
              lastName: lastNameRegex
            }).lean().exec();
            
            if (patientDoc) {
              console.log(`[${cid}] ✅ Found patient via split: ${patientDoc.firstName} ${patientDoc.lastName}`);
            }
          }
        }
        
        if (!patientDoc) {
          console.log(`[${cid}] ❌ No patient found for entity: "${entity}"`);
        }
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
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown Patient";
      
      const hasUseful = Boolean(
        fullName || 
        p.dateOfBirth || 
        p.age ||
        (p.prescriptions && p.prescriptions.length) || 
        (p.allergies && p.allergies.length) || 
        p.phone || 
        p.email ||
        p.gender ||
        p.bloodGroup
      );
      
      return {
        id: p._id || null,
        name: fullName,
        age: p.age || (p.metadata && p.metadata.age) || null,
        dob: p.dateOfBirth || null,
        gender: p.gender || null,
        bloodGroup: p.bloodGroup || (p.metadata && p.metadata.bloodGroup) || null,
        phone: p.phone || null,
        email: p.email || null,
        address: p.address ? `${p.address.houseNo || ''} ${p.address.street || ''} ${p.address.city || ''}`.trim() || null : null,
        vitals: p.vitals || null,
        prescriptions: (p.prescriptions || []).slice(0,5).map(pr => ({
          appointmentId: pr.appointmentId || null,
          medicines: (pr.medicines || []).map(m => ({ 
            name: m.name || null, 
            dosage: m.dosage || null, 
            frequency: m.frequency || null,
            quantity: m.quantity || null 
          })),
          issuedAt: pr.issuedAt || null,
        })),
        allergies: p.allergies || [],
        notes: p.notes || null,
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
        finalReply = await callGeminiChatWithRetries(
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
        finalReply = await callGeminiChatWithRetries(
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
