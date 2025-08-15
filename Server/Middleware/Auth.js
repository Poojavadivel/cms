const jwt = require('jsonwebtoken');

/**
 * This middleware function acts as a guard for protected API routes.
 * It checks for a valid JSON Web Token (JWT) in the request headers.
 */
const auth = (req, res, next) => {
  // 1. Get the token from the 'x-auth-token' header.
  const token = req.header('x-auth-token');

  // 2. Check if no token is provided.
  if (!token) {
    // If there's no token, the user is unauthorized.
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // 3. Verify the token using the secret key from your .env file.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. If the token is valid, the 'decoded' payload will contain the user's id.
    // We attach this id to the request object so that subsequent route handlers can use it.
    req.user = decoded.id;

    // 5. Call next() to pass control to the next middleware function or the route handler.
    next();
  } catch (error) {
    // If jwt.verify fails (e.g., token is expired or invalid), it will throw an error.
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
