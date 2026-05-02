require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const authRoutes    = require('./routes/auth');
const orderRoutes   = require('./routes/orders');
const vehicleRoutes = require('./routes/vehicles');
const adminRoutes   = require('./routes/admin');
const trackRoutes   = require('./routes/track');
const mapsRoutes    = require('./routes/maps');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/track',    trackRoutes);
app.use('/api/maps',     mapsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'HaulGo API v1.0' }));

app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚛 HaulGo API running → http://localhost:${PORT}`);
  console.log(`📡 Health check    → http://localhost:${PORT}/health\n`);
});

module.exports = app;
