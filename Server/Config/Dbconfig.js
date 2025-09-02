// ===============================
// Database Config (Postgres + MongoDB)
// ===============================

// Import libraries
const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
require('dotenv').config();

// --- ENV Variables ---
const pgUrl = process.env.POSTGRES_URL;
const mongoUrl = process.env.MANGODB_URL;

if (!pgUrl) throw new Error('POSTGRES_URL is not defined in the .env file');
if (!mongoUrl) throw new Error('MONGODB_URL is not defined in the .env file');

// ===============================
// Sequelize (Postgres) Setup
// ===============================
const sequelize = new Sequelize(pgUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for cloud providers like Neon
    },
  },
  logging: false, // disable SQL logs in console
});

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize: Connected to PostgreSQL successfully');
  } catch (err) {
    console.error('❌ Sequelize: Connection failed:', err.stack);
    process.exit(1);
  }
};

// ===============================
// Mongoose (MongoDB) Setup
// ===============================
const connectMongo = async () => {
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Mongoose: Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ Mongoose: Connection failed:', err.message);
    process.exit(1);
  }
};

// ===============================
// Unified Connect Function
// ===============================
const connectDBs = async () => {
  console.log('🌍 Starting database connections...');
  await connectPostgres();
  await connectMongo();
  console.log('🚀 All databases connected successfully');
};

// ===============================
// Exports
// ===============================
module.exports = { sequelize, connectDBs, connectPostgres, connectMongo };
