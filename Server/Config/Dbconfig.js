// Server/Config/db.js
// MongoDB-only Mongoose config for HMS (UUID _id model setup).
// Exports: mongoose, mongooseConnection, connectMongo, startSession

const mongoose = require('mongoose');
require('dotenv').config();


const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL || null;

if (!mongoUrl) {
  throw new Error('MONGODB_URL is not defined in the .env file');
}

// Default Mongoose options (tune via env)
const defaultOpts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '10', 10),
  minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '0', 10),
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '30000', 10),
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '45000', 10),
};

// Allow extra options via env var (JSON string)
let mongooseOpts = Object.assign({}, defaultOpts);
if (process.env.MONGOOSE_OPTIONS_JSON) {
  try {
    const extra = JSON.parse(process.env.MONGOOSE_OPTIONS_JSON);
    mongooseOpts = Object.assign(mongooseOpts, extra);
  } catch (err) {
    console.warn('⚠️  Failed to parse MONGOOSE_OPTIONS_JSON — ignoring it. Error:', err.message);
  }
}

/**
 * connectMongo - connect to MongoDB with simple retry logic
 * Env vars:
 *  - MONGO_CONNECT_RETRIES (default 3)
 *  - MONGO_CONNECT_RETRY_DELAY_MS (default 2000)
 */
const connectMongo = async () => {
  const maxRetries = parseInt(process.env.MONGO_CONNECT_RETRIES || '3', 10);
  const retryDelayMs = parseInt(process.env.MONGO_CONNECT_RETRY_DELAY_MS || '2000', 10);

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      attempt++;
      await mongoose.connect(mongoUrl, mongooseOpts);
      console.log('✅ Mongoose: Connected to MongoDB successfully');
      // optional: set mongoose debug from env
      if (process.env.MONGOOSE_DEBUG === 'true') mongoose.set('debug', true);
      return;
    } catch (err) {
      console.error(`❌ Mongoose: Connection attempt ${attempt} failed:`, err.message);
      if (attempt >= maxRetries) {
        console.error('❌ Mongoose: All connection attempts failed.');
        throw err;
      }
      console.log(`⏳ Retrying Mongo connection in ${retryDelayMs}ms...`);
      await new Promise(r => setTimeout(r, retryDelayMs));
    }
  }
};

// Helper to create a session for transactions
const startSession = () => mongoose.startSession();

// Exports
module.exports = {
  mongoose,
  mongooseConnection: mongoose.connection,
  connectMongo,
  startSession
};
