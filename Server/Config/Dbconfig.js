// Import the Sequelize class from the library.
const { Sequelize } = require('sequelize');
// Import dotenv to manage environment variables.
require('dotenv').config();

// Get the database connection URL from our .env file.
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  // If the connection string is not found, we cannot proceed.
  throw new Error('POSTGRES_URL is not defined in the .env file');
}

// Create a new Sequelize instance.
// This single instance will manage our database connection pool automatically.
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  // Configuration required for cloud providers like Neon.
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  // We can disable Sequelize's verbose logging in production.
  logging: false, 
});

/**
 * Checks the connection to the PostgreSQL database using Sequelize's
 * built-in authenticate method.
 */
const connectDB = async () => {
  try {
    // This function attempts to authenticate with the database.
    await sequelize.authenticate();
    console.log('Sequelize Connection Successful: The server is connected to the database.');
  } catch (err) {
    console.error('Sequelize Connection Failed:', err.stack);
    // Exit the process with failure if we cannot connect.
    process.exit(1);
  }
};

// We export the single sequelize instance and the connection checker.
// The instance will be used to define models and run queries.
module.exports = { sequelize, connectDB };
