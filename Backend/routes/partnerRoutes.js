const router = require('express').Router();
const User = require('../models/User');
const Batch = require('../models/Batch');
const { protect, roles } = require('../middleware/auth');
router.use(protect, roles('delivery_partner'));
router.get('/profile', (req, res) => res.json({ user: req.user }));
router.patch('/availability', async (req, res, next) => { try { const availability = ['available', 'busy', 'offline'].includes(req.body.availability) ? req.body.availability : 'offline'; res.json(await User.findByIdAndUpdate(req.user._id, { availability }, { new: true }).select('-password')); } catch (error) { next(error); } });
router.get('/current-batch', async (req, res, next) => { try { res.json(await Batch.findOne({ assignedPartner: req.user._id, status: { $nin: ['completed', 'rejected'] } }).populate('orders assignedPartner', '-password')); } catch (error) { next(error); } });
module.exports = router;
