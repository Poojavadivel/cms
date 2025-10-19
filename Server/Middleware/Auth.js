// Middleware/Auth.full.js
const jwt = require('jsonwebtoken');
const { User } = require('../Models'); // Mongoose User model

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'please-set-a-secret';

module.exports = async function authFull(req, res, next) {
  try {
    // Accept standard Authorization header or legacy x-auth-token
    const header = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;

    if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    } else if (req.header && req.header('x-auth-token')) {
      token = req.header('x-auth-token');
    }

    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach minimal info
    req.user = { id: payload.id, role: payload.role };

    // Load fresh user from DB (exclude password)
    const userDoc = await User.findById(payload.id).select('-password').lean();
    if (!userDoc) return res.status(401).json({ message: 'User not found or deactivated' });

    // Attach full user doc and convenience fields
    req.userDoc = userDoc;
    // keep req.user for lightweight checks too
    req.user = { id: userDoc._id, role: userDoc.role, email: userDoc.email };

    return next();
  } catch (err) {
    console.error('Auth (full) middleware error', err);
    return res.status(500).json({ message: 'Server error in auth middleware' });
  }
};
