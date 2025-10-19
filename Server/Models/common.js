// Server/Models/common.js
// Common utilities and validators for all models

const SALT_ROUNDS = 10;

// Common schema options
const commonOptions = {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  minimize: false // keep empty objects instead of removing them
};

// Email validator
const emailValidator = {
  validator: function (v) {
    if (v === null || v === undefined || v === '') return true; // allow null/empty for optional emails
    // basic email regex - good enough for early validation
    return /^\S+@\S+\.\S+$/.test(v);
  },
  message: props => `${props.value} is not a valid email`
};

// Phone validator
const phoneValidator = {
  validator: function (v) {
    if (v === null || v === undefined || v === '') return true; // allow null/empty for optional phones
    // allow optional leading + and 7-15 digits
    return /^\+?[0-9]{7,15}$/.test(v);
  },
  message: props => `${props.value} is not a valid phone number`
};

module.exports = {
  SALT_ROUNDS,
  commonOptions,
  emailValidator,
  phoneValidator
};
