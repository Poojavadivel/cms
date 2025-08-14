// Import the Sequelize instance from our config file and the DataTypes utility.
const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

/**
 * Defines the User model using Sequelize.
 * This object directly maps to the 'users' table in our database.
 * Sequelize will automatically manage the 'createdAt' and 'updatedAt' columns.
 */
const User = sequelize.define('User', {
  // The model's attributes are defined here.
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'doctor', 'patient', 'receptionist', 'unknown'),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    // We map this field to the 'first_name' column in the database for consistency.
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name',
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY, // DATEONLY stores 'YYYY-MM-DD' without time.
    field: 'date_of_birth',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensures no two users can have the same email.
  },
  phone: {
    type: DataTypes.STRING,
  },
  country: {
    type: DataTypes.STRING,
  },
  state: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
}, {
  // Model options
  tableName: 'users', // We explicitly tell Sequelize to use the table name 'users'.
  timestamps: true, // Sequelize will automatically add createdAt and updatedAt fields.
  updatedAt: 'updated_at', // Customize column names to use snake_case.
  createdAt: 'created_at',
});

// Export the defined User model.
module.exports = User;
