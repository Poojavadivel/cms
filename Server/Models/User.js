// Server/Models/User.js
// User model (admins, doctors, pharmacists, pathologists, reception, superadmin)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { SALT_ROUNDS, commonOptions, emailValidator, phoneValidator } = require('./common');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  role: { type: String, enum: ['superadmin', 'admin', 'doctor', 'pharmacist', 'pathologist', 'reception'], required: true, index: true },
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, index: true, validate: emailValidator },
  phone: { type: String, index: true, validate: phoneValidator },
  password: { type: String, required: true, select: false },
  is_active: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

UserSchema.index({ role: 1 });

// virtual fullName
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''}${this.lastName ? ' ' + this.lastName : ''}`.trim();
});

// Hash password before save (only if modified)
UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hash password if using findOneAndUpdate with password in update
UserSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    if (!update) return next();
    const pwd = update.password || (update.$set && update.$set.password);
    if (!pwd) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(pwd, salt);
    if (update.password) update.password = hashed;
    if (update.$set && update.$set.password) update.$set.password = hashed;
    this.setUpdate(update);
    return next();
  } catch (err) {
    return next(err);
  }
});

// comparePassword method (call after selecting +password)
UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
