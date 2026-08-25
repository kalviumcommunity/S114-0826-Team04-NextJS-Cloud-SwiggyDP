const mongoose = require('mongoose');
const batchSchema = new mongoose.Schema({
  batchId: { type: String, unique: true }, orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  restaurants: [String], assignedPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'assigned', 'accepted', 'rejected', 'delivering', 'completed'], default: 'pending' },
  progressStep: { type: Number, default: 0 }, rejectionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  acceptedAt: Date
}, { timestamps: true });
module.exports = mongoose.model('Batch', batchSchema);
