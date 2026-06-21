require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(helmet());

// Detailed CORS policy for production
const allowedOrigins = [
  'http://localhost:4200', // local dev
  'http://citizen.janseva.in',
  'http://officer.janseva.in',
  'http://supervisor.janseva.in',
  'http://admin.janseva.in'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request Logging
app.use(morgan('combined'));

// Backend Target (Docker Compose network or localhost for dev)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// API Gateway Proxy Configuration
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    return '/api' + path;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom gateway headers if needed
    proxyReq.setHeader('X-Gateway-Trace-Id', `req-${Date.now()}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(502).json({
      success: false,
      message: 'Gateway Error: Backend service unreachable.'
    });
  }
}));

// Gateway Health Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔄 Proxying /api requests to ${BACKEND_URL}`);
});
