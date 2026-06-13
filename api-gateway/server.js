require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Global Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for local dev; can tighten for prod
  credentials: true
}));
app.use(morgan('dev'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Proxy Rules
// Route all /api traffic to the Monolithic Backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Can attach additional headers or logic here if needed
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(502).json({ error: 'Gateway Error: Unable to reach backend service.' });
  }
}));

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested gateway route does not exist.' });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
  console.log(`[API Gateway] Routing /api to ${BACKEND_URL}`);
});
