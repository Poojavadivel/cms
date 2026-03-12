const mongoose = require('mongoose');

/**
 * Helper: atomically increment and return next sequence for given key.
 */
async function getNextSequence(key) {
    const col = mongoose.connection.collection('counters');

    // Try atomic increment with upsert
    const result = await col.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true }
    );

    // Modern MongoDB driver returns result.value
    if (result && result.value && typeof result.value.seq === 'number') {
        return result.value.seq;
    }

    // Fallback for some driver versions
    if (result && typeof result.seq === 'number') {
        return result.seq;
    }

    // Last fallback: find the document
    const doc = await col.findOne({ _id: key });
    if (doc && typeof doc.seq === 'number') {
        return doc.seq;
    }

    // If still missing (should not happen with upsert), return 1
    return 1;
}

/**
 * Format sequence into a code (e.g., PAT-001)
 */
function formatCode(prefix, seq, width = 5) {
    return `${prefix}-${String(seq).padStart(width, '0')}`;
}

module.exports = {
    getNextSequence,
    formatCode
};
