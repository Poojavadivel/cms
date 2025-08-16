// Import the Sequelize instance from our config file and the DataTypes utility.
const { sequelize } = require('../Config/Dbconfig'); // Assuming dbconfig is in a 'config' folder
const { DataTypes } = require('sequelize');

/**
 * Defines the comprehensive User model using Sequelize.
 * This single model contains all possible fields for any user role (Admin, Doctor, etc.).
 * Fields specific to certain roles (like specialization for doctors) are optional.
 */
const User = sequelize.define('User', {
  // --- Core Attributes ---
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'doctor'), // Simplified to match our current app roles
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name',
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    field: 'date_of_birth',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Add validation for email format
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
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

  // --- Doctor-Specific Attributes ---
  // These fields will be null for users who are not doctors.
  specialization: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field
    field: 'license_number',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field
  },
}, {
  // --- Model Options ---
  tableName: 'users',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
});

// Export the defined User model.
module.exports = User;
