/**
 * bot/entitySearch.js
 * Database search for patients and staff entities
 */

const { Patient, User } = require('../../Models');
const { buildPatientContext, buildStaffContext } = require('./utils');

/**
 * Search for patient and staff based on entity
 * @param {string} entity - Entity name or identifier
 * @returns {Promise<object>} Object with patientDoc and staffDoc
 */
async function searchEntities(entity) {
  let patientDoc = null;
  let staffDoc = null;
  
  if (!entity || !String(entity).trim()) {
    return { patientDoc, staffDoc };
  }
  
  const entityStr = String(entity).trim();
  const safe = entityStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRegex = new RegExp(safe, "i");

  try {
    console.log(`[entitySearch] Searching for patient with entity: "${entityStr}"`);
    
    // Search patient by name, phone, email, or ID
    patientDoc = await Patient.findOne({
      $or: [
        { _id: entityStr },
        { firstName: nameRegex },
        { lastName: nameRegex },
        { email: nameRegex },
        { phone: entityStr },
        { phone: nameRegex },
        { telegramUsername: nameRegex },
      ]
    }).lean().exec();
    
    if (patientDoc) {
      console.log(`[entitySearch] Found patient: ${patientDoc.firstName} ${patientDoc.lastName}`);
    } else {
      console.log(`[entitySearch] No patient found, trying full name split...`);
    }
    
    // If not found and entity looks like a full name, try splitting
    if (!patientDoc && entityStr.includes(' ')) {
      const nameParts = entityStr.split(' ').filter(Boolean);
      if (nameParts.length >= 2) {
        const firstNameRegex = new RegExp(nameParts[0], "i");
        const lastNameRegex = new RegExp(nameParts.slice(1).join(' '), "i");
        
        patientDoc = await Patient.findOne({
          firstName: firstNameRegex,
          lastName: lastNameRegex
        }).lean().exec();
        
        if (patientDoc) {
          console.log(`[entitySearch] Found patient via split: ${patientDoc.firstName} ${patientDoc.lastName}`);
        }
      }
    }
    
    if (!patientDoc) {
      console.log(`[entitySearch] No patient found for entity: "${entityStr}"`);
    }
  } catch (e) {
    console.error(`[entitySearch] Patient search error:`, e && e.message ? e.message : e);
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
    
    if (staffDoc) {
      console.log(`[entitySearch] Found staff member`);
    }
  } catch (e) {
    console.error(`[entitySearch] Staff search error:`, e && e.message ? e.message : e);
  }

  return { patientDoc, staffDoc };
}

/**
 * Build context objects for patient and staff
 * @param {object} patientDoc - Patient document
 * @param {object} staffDoc - Staff document
 * @returns {object} Object with safePatient and safeStaff
 */
function buildEntityContexts(patientDoc, staffDoc) {
  const safePatient = buildPatientContext(patientDoc);
  const safeStaff = buildStaffContext(staffDoc);

  if (safePatient && !safePatient._hasUsefulFields) {
    safePatient.name = safePatient.name || "<patient record exists but fields are unavailable>";
  }
  if (safeStaff && !safeStaff._hasUsefulFields) {
    safeStaff.name = safeStaff.name || "<staff record exists but fields are unavailable>";
  }
  
  if (safePatient) delete safePatient._hasUsefulFields;
  if (safeStaff) delete safeStaff._hasUsefulFields;

  return { safePatient, safeStaff };
}

module.exports = {
  searchEntities,
  buildEntityContexts
};
