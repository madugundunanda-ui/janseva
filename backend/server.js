const app = require('./src/app');
const logger = require('./src/utils/logger');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const { Announcement, Complaint } = require('./src/models');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Citizen Grievance Backend running on port ${PORT}`);
});

// ─── Socket.IO Server with JWT Authentication ───────────────────
const { Server } = require('socket.io');
const { setupWebSocketHandlers } = require('./src/websocket/aiAssistantWebSocket');
const notificationService = require('./src/services/notificationService');
const AnalyticsCronManager = require('./src/services/analyticsCronManager');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
io.use((socket, next) => {
  try {
    const token = socket.handshake.query.token || socket.handshake.auth.token;
    
    if (!token) {
      logger.warn('Socket.IO connection rejected: no token provided', {
        ip: socket.handshake.address,
      });
      return next(new Error('Authentication required'));
    }

    if (!process.env.JWT_SECRET) {
      logger.error('Socket.IO JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    const reason = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    logger.warn(`Socket.IO connection rejected: ${reason}`, {
      error: error.message,
      ip: socket.handshake.address,
    });
    next(new Error(reason));
  }
});

// Setup subsystems
if (!process.env.SERVICE_NAME || process.env.SERVICE_NAME === 'api') {
  setupWebSocketHandlers(io);
  notificationService.setSocketIoInstance(io);
}

// Start analytics cron jobs
if (!process.env.SERVICE_NAME || process.env.SERVICE_NAME === 'worker') {
  AnalyticsCronManager.startCron();
}

io.on('connection', (socket) => {
  const user = socket.user || {};
  
  logger.info('Socket.IO client connected', {
    userId: user.id,
    role: user.role,
  });

  // Join personal room for targeted notifications
  socket.join(`user_${user.id}`);
  
  // Join role-based room
  if (user.role) {
    socket.join(`role_${user.role}`);
  }

  // Rate limiting map
  socket.messageCount = 0;
  socket.lastReset = Date.now();

  socket.on('disconnect', () => {
    logger.info('Socket.IO client disconnected', {
      userId: user.id,
      role: user.role,
    });
  });

  socket.on('error', (error) => {
    logger.error('Socket.IO error', { message: error.message, userId: user.id });
  });
});

const broadcast = (data) => {
  io.emit('notification', data);
};

app.set('wssBroadcast', broadcast);

// ─── Graceful Shutdown ──────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Close Socket.IO connections
  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { message: error.message, stack: error.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});
