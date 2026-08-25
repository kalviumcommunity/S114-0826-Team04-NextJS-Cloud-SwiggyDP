const Batch = require('../models/Batch');
const Order = require('../models/Order');
const User = require('../models/User');

async function assignNextPartner(batch) {
  const partner = await User.findOne({ role: 'delivery_partner', availability: 'available', _id: { $nin: batch.rejectionHistory } });
  if (!partner) { batch.status = 'pending'; batch.assignedPartner = null; await batch.save(); return null; }
  batch.assignedPartner = partner._id; batch.status = 'assigned'; await batch.save();
  partner.availability = 'busy'; partner.currentBatch = batch._id; await partner.save();
  return partner;
}
async function createSmartBatch() {
  const orders = await Order.find({ status: 'pending' }).limit(3);
  if (!orders.length) return null;
  const batch = await Batch.create({ batchId: `BATCH-${Date.now().toString().slice(-6)}`, orders: orders.map((order) => order._id), restaurants: [...new Set(orders.map((order) => order.restaurantName))] });
  await Promise.all(orders.map((order, index) => Order.findByIdAndUpdate(order._id, { batch: batch._id, deliveryPosition: index + 1, status: 'batched', estimatedDeliveryTime: new Date(Date.now() + (index + 1) * 20 * 60000) })));
  await assignNextPartner(batch);
  return Batch.findById(batch._id).populate('orders assignedPartner', '-password');
}
module.exports = { assignNextPartner, createSmartBatch };
