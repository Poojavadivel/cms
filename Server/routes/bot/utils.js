/**
 * bot/utils.js
 * Utility functions for the chatbot system
 */

/**
 * Generate a unique conversation ID
 * @returns {string} Unique conversation ID
 */
function makeCid() {
  return "cid_" + Math.random().toString(36).slice(2, 8) + "_" + Date.now().toString(36);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Safely parse JSON-like text with fallback fixes
 * @param {string} text - Text to parse
 * @returns {object|null} Parsed object or null
 */
function safeParseJsonLike(text) {
  if (!text || typeof text !== "string") return null;
  
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from text
    const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch (e2) {
        // Try to fix common JSON issues
        const tryFix = m[0]
          .replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":')
          .replace(/'/g, '"');
        try {
          return JSON.parse(tryFix);
        } catch (e3) {
          return null;
        }
      }
    }
    return null;
  }
}

/**
 * Build patient context object for AI
 * @param {object} p - Patient document
 * @returns {object|null} Structured patient context
 */
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
    prescriptions: (p.prescriptions || []).slice(0, 5).map(pr => ({
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

/**
 * Build staff context object for AI
 * @param {object} s - Staff/User document
 * @returns {object|null} Structured staff context
 */
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

module.exports = {
  makeCid,
  sleep,
  safeParseJsonLike,
  buildPatientContext,
  buildStaffContext
};
