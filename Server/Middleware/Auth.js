// Middleware/Auth.full.js
const jwt = require('jsonwebtoken');
const { User } = require('../Models'); // Mongoose User model

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'please-set-a-secret';

module.exports = async function authFull(req, res, next) {
  try {
    // Accept standard Authorization header or legacy x-auth-token
    const header = req.headers['authorization'] || req.headers['Authorization'] || req.headers['x-auth-token'];
    console.log('🔐 [AUTH] Raw Header:', header);
    let token = null;

    if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    } else if (header && typeof header === 'string') {
      token = header;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    console.log('🔐 [AUTH] Extracted Token:', token ? (token.substring(0, 10) + '...') : 'NULL');

    if (!token) {
      console.warn('🔐 [AUTH] No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
      console.log('🔐 [AUTH] Payload verified:', payload);
    } catch (err) {
      console.error('🔐 [AUTH] Verification Error:', err.message);
      return res.status(401).json({ message: `Invalid or expired token: ${err.message}` });
    }

    // Attach minimal info
    req.user = { id: payload.id, role: payload.role };
    console.log('🔐 [AUTH] User attached to request:', req.user);

    // Load fresh user from DB (exclude password)
    const userDoc = await User.findById(payload.id).select('-password').lean();
    if (!userDoc) {
      console.warn('🔐 [AUTH] User not found in database:', payload.id);
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    // Attach full user doc and convenience fields
    req.userDoc = userDoc;
    // keep req.user for lightweight checks too
    req.user = { id: userDoc._id, role: userDoc.role, email: userDoc.email };

    return next();
  } catch (err) {
    console.error('❌ [AUTH] Middleware global error:', err);
    return res.status(500).json({ message: 'Server error in auth middleware', details: err.message });
  }
};
