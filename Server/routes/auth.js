// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { User, AuthSession } = require('../Models'); // Mongoose models (UUID _id)
const auth = require('../Middleware/Auth'); // full middleware that loads userDoc

const router = express.Router();

// Config / defaults
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'please-set-a-secret';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1005m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);
const REFRESH_TOKEN_SALT_ROUNDS = parseInt(process.env.REFRESH_TOKEN_SALT_ROUNDS || '10', 10);

/** Helper: generate a secure random refresh token */
function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex'); // 96 hex chars ~ 384 bits
}

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  console.log('LOGIN REQUEST BODY:', req.body);
  try {
    const { email, password, deviceId = null } = req.body;
    if (!email || !password) {
      console.warn('LOGIN FAILED: Missing email or password');
      return res.status(400).json({ message: 'Please enter email and password', errorCode: 1000 });
    }

    console.log('Looking up user:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.warn('LOGIN FAILED: User not found');
      return res.status(400).json({ message: 'Invalid credentials', errorCode: 1002 });
    }

    console.log('Checking password for user:', user._id);
    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      console.warn('LOGIN FAILED: Incorrect password for user:', user._id);
      return res.status(400).json({ message: 'Invalid credentials', errorCode: 1003 });
    }

    console.log('Generating access token...');
    const accessToken = jwt.sign({ id: user._id, role: user.role }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    console.log('Generating refresh token and session...');
    const refreshToken = generateRefreshToken();
    const refreshHash = await bcrypt.hash(refreshToken, REFRESH_TOKEN_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    const session = await AuthSession.create({
      userId: user._id,
      deviceId,
      refreshTokenHash: refreshHash,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      expiresAt,
    });

    console.log('LOGIN SUCCESS: user', user._id, 'session', session._id);
    return res.status(200).json({
      accessToken,
      refreshToken,
      sessionId: session._id,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Server error', errorCode: 5000 });
  }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  console.log('REFRESH REQUEST BODY:', req.body);
  try {
    const { refreshToken, sessionId, userId } = req.body;
    if (!refreshToken || (!sessionId && !userId)) {
      console.warn('REFRESH FAILED: Missing identifiers');
      return res.status(400).json({ message: 'Missing refresh token or identifiers', errorCode: 2000 });
    }

    let candidateSessions = [];

    if (sessionId) {
      console.log('Looking up session by sessionId:', sessionId);
      const s = await AuthSession.findById(sessionId);
      if (!s) {
        console.warn('REFRESH FAILED: Session not found');
        return res.status(401).json({ message: 'Session not found', errorCode: 2001 });
      }
      candidateSessions = [s];
    } else {
      console.log('Looking up recent sessions for user:', userId);
      candidateSessions = await AuthSession.find({ userId }).sort({ createdAt: -1 }).limit(50);
    }

    let matched = null;
    for (const s of candidateSessions) {
      console.log('Checking session', s._id);
      if (!s.refreshTokenHash) continue;
      if (s.expiresAt && s.expiresAt < new Date()) {
        console.log('Session expired:', s._id);
        continue;
      }
      const ok = await bcrypt.compare(refreshToken, s.refreshTokenHash);
      if (ok) {
        matched = s;
        console.log('Refresh token matched session:', s._id);
        break;
      }
    }

    if (!matched) {
      console.warn('REFRESH FAILED: Invalid refresh token');
      return res.status(401).json({ message: 'Invalid refresh token', errorCode: 2001 });
    }

    console.log('Rotating refresh token for session:', matched._id);
    const newRefreshToken = generateRefreshToken();
    const newRefreshHash = await bcrypt.hash(newRefreshToken, REFRESH_TOKEN_SALT_ROUNDS);
    matched.refreshTokenHash = newRefreshHash;
    matched.expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await matched.save();

    console.log('Fetching user:', matched.userId);
    const user = await User.findById(matched.userId).lean();
    if (!user) {
      console.warn('User not found for session:', matched._id);
      await AuthSession.deleteOne({ _id: matched._id });
      return res.status(404).json({ message: 'User not found', errorCode: 2002 });
    }

    const accessToken = jwt.sign({ id: user._id, role: user.role }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    console.log('REFRESH SUCCESS: session', matched._id, 'user', user._id);
    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: matched._id,
    });
  } catch (err) {
    console.error('REFRESH ERROR:', err);
    return res.status(500).json({ message: 'Server error', errorCode: 5000 });
  }
});

/**
 * POST /api/auth/validate-token
 */
router.post('/validate-token', auth, async (req, res) => {
  console.log('VALIDATE TOKEN REQUEST for user:', req.user && req.user.id);
  try {
    const userDoc = req.userDoc || (await User.findById(req.user.id).select('-password').lean());
    if (!userDoc) {
      console.warn('VALIDATE FAILED: User not found');
      return res.status(404).json({ message: 'User not found', errorCode: 1002 });
    }

    console.log('VALIDATE SUCCESS: user', userDoc._id);
    return res.status(200).json({
      id: userDoc._id,
      email: userDoc.email,
      role: userDoc.role,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
    });
  } catch (err) {
    console.error('VALIDATE TOKEN ERROR:', err);
    return res.status(500).json({ message: 'Server error', errorCode: 5000 });
  }
});

/**
 * POST /api/auth/signout
 */
router.post('/signout', auth, async (req, res) => {
  console.log('SIGNOUT REQUEST BODY:', req.body, 'user:', req.user && req.user.id);
  try {
    const { sessionId, refreshToken, userId } = req.body;

    if (sessionId) {
      console.log('Deleting session by ID:', sessionId);
      await AuthSession.deleteOne({ _id: sessionId });
      return res.status(200).json({ message: 'Signed out from session' });
    }

    if (refreshToken && userId) {
      console.log('Looking up sessions for user to match refreshToken:', userId);
      const sessions = await AuthSession.find({ userId }).limit(50);
      for (const s of sessions) {
        if (s.refreshTokenHash && await bcrypt.compare(refreshToken, s.refreshTokenHash)) {
          console.log('Deleting session by refreshToken match:', s._id);
          await AuthSession.deleteOne({ _id: s._id });
          return res.status(200).json({ message: 'Signed out successfully' });
        }
      }
      console.warn('SIGNOUT FAILED: No session found for token');
      return res.status(404).json({ message: 'Session not found', errorCode: 3001 });
    }

    const authUserId = req.user && req.user.id;
    if (authUserId) {
      console.log('Deleting all sessions for user:', authUserId);
      await AuthSession.deleteMany({ userId: authUserId });
      return res.status(200).json({ message: 'Signed out from all sessions' });
    }

    console.warn('SIGNOUT FAILED: No identifier provided');
    return res.status(400).json({ message: 'No session identifier provided', errorCode: 3000 });
  } catch (err) {
    console.error('SIGNOUT ERROR:', err);
    return res.status(500).json({ message: 'Server error', errorCode: 5000 });
  }
});

module.exports = router;
