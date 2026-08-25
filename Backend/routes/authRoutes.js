const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
const signup = (role) => async (req, res, next) => { try {
  const { name, email, password, phoneNumber, vehicleType } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password, role, phoneNumber, vehicleType });
  res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
} catch (error) { next(error); } };
const login = (role) => async (req, res, next) => { try {
  const user = await User.findOne({ email: req.body.email, role });
  if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
} catch (error) { next(error); } };
router.post('/customer/signup', signup('customer')); router.post('/partner/signup', signup('delivery_partner'));
router.post('/customer/login', login('customer')); router.post('/partner/login', login('delivery_partner'));
router.get('/me', protect, (req, res) => res.json({ user: req.user }));
module.exports = router;
