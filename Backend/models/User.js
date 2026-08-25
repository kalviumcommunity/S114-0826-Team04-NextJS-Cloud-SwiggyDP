const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['customer', 'delivery_partner'], required: true },
  phoneNumber: String,
  vehicleType: String,
  availability: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
  location: { latitude: Number, longitude: Number },
  currentBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }
}, { timestamps: true });
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function comparePassword(value) { return bcrypt.compare(value, this.password); };
module.exports = mongoose.model('User', userSchema);
