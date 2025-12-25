/**
 * Simple Express server for serving React production build
 * Handles SPA routing by redirecting all routes to index.html
 * Production-ready configuration for HMS React app
 */

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Try to use compression if available
try {
  const compression = require('compression');
  app.use(compression());
  console.log('✓ Compression enabled');
} catch (e) {
  console.log('! Compression not available (install with: npm install compression)');
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React routing - return all requests to React app
// This is critical for BrowserRouter to work on page refresh
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 HMS Server is running on port ${PORT}`);
  console.log(`📱 Access the app at http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
