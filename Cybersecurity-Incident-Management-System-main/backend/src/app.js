require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiRateLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const assetRoutes = require('./routes/assetRoutes');
const remediationRoutes = require('./routes/remediationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const analystRoutes = require('./routes/analystRoutes');

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});


app.use('/api/auth', authRoutes);
app.use('/api/organizations', authenticate, apiRateLimiter, organizationRoutes);
app.use('/api/analysts', authenticate, apiRateLimiter, analystRoutes);
app.use('/api/incidents', authenticate, apiRateLimiter, incidentRoutes);
app.use('/api/assets', authenticate, apiRateLimiter, assetRoutes);
app.use('/api/remediation', authenticate, apiRateLimiter, remediationRoutes);
app.use('/api/reports', authenticate, apiRateLimiter, reportRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
