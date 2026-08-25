const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'batchflow-api' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/partner', require('./routes/partnerRoutes'));
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ message: err.message || 'Server error' }));

const port = process.env.PORT || 5000;
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/batchflow')
    .then(() => app.listen(port, () => console.log(`API listening on ${port}`)))
    .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
}
module.exports = app;
