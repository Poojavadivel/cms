/**
 * pharmacy/middleware.js
 * Middleware functions for pharmacy routes
 */

const config = require('./config');

/**
 * Require admin or pharmacist role
 */
function requireAdminOrPharmacist(req, res) {
  const role = req.user && req.user.role;
  if (!role || !config.AUTHORIZED_ROLES.includes(role)) {
    console.log('⛔ [AUTH] Access denied. Required role admin/pharmacist. User role:', role, 'userId:', req.user?.id);
    res.status(403).json({
      success: false,
      message: 'Forbidden: admin/pharmacist role required',
      errorCode: config.ERROR_CODES.AUTH_FORBIDDEN,
    });
    return false;
  }
  return true;
}

/**
 * Ensure model is available
 */
function ensureModel(model, name, res) {
  if (!model) {
    console.error(`❌ [MODEL MISSING] ${name} is undefined. Check exports in Models/models_core and require path.`);
    if (res) {
      res.status(500).json({ 
        success: false, 
        message: `Server misconfiguration: ${name} model not available`, 
        errorCode: config.ERROR_CODES.MODEL_MISSING 
      });
    }
    return false;
  }
  return true;
}

module.exports = {
  requireAdminOrPharmacist,
  ensureModel
};
