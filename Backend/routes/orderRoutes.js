const router = require('express').Router();
const Order = require('../models/Order');
const { protect, roles } = require('../middleware/auth');
router.use(protect);
router.post('/', roles('customer'), async (req, res, next) => { try {
  const order = await Order.create({ ...req.body, customer: req.user._id, orderId: `ORD-${Date.now().toString().slice(-6)}` }); res.status(201).json(order);
} catch (error) { next(error); } });
router.get('/customer/my-orders', roles('customer'), async (req, res, next) => { try { res.json(await Order.find({ customer: req.user._id }).populate('batch')); } catch (error) { next(error); } });
router.get('/', async (_req, res, next) => { try { res.json(await Order.find().populate('customer', 'name email').populate('batch')); } catch (error) { next(error); } });
router.get('/:id', async (req, res, next) => { try { const order = await Order.findById(req.params.id).populate('batch customer', 'name email batchId status'); if (!order) return res.status(404).json({ message: 'Order not found' }); res.json(order); } catch (error) { next(error); } });
module.exports = router;
