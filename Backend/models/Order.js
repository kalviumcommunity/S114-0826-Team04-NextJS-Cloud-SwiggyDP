const mongoose = require('mongoose');
const location = { latitude: Number, longitude: Number };
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true }, customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantName: { type: String, required: true }, restaurantLocation: location, customerLocation: location,
  items: [String], status: { type: String, enum: ['pending', 'batched', 'delivering', 'delivered'], default: 'pending' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }, deliveryPosition: Number, estimatedDeliveryTime: Date
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
