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
    // Remove spaces, dashes, and parentheses for validation
    const cleaned = v.replace(/[\s\-()]/g, '');
    // allow optional leading + and 7-15 digits
    // Also allow 0000... patterns for testing (will be cleaned by pre-save)
    return /^\+?[0-9]{7,15}$/.test(cleaned);
  },
  message: props => {
    const cleaned = (props.value || '').replace(/[\s\-()]/g, '');
    return `${props.value} is not a valid phone number (cleaned: ${cleaned})`;
  }
};

module.exports = {
  SALT_ROUNDS,
  commonOptions,
  emailValidator,
  phoneValidator
};
