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

// ─── WebSocket Server with JWT Authentication ───────────────────
const wss = new WebSocket.Server({
  server,
  verifyClient: (info, callback) => {
    // Extract token from query string: ws://host?token=xxx
    try {
      const reqUrl = info.req.url || '';
      const parsedUrl = new URL(reqUrl, `http://${info.req.headers.host || 'localhost'}`);
      const token = parsedUrl.searchParams.get('token');

      if (!token) {
        logger.warn('WebSocket connection rejected: no token provided', {
          ip: info.req.socket.remoteAddress,
        });
        callback(false, 401, 'Authentication required');
        return;
      }

      if (!process.env.JWT_SECRET) {
        logger.error('WebSocket JWT_SECRET not configured');
        callback(false, 500, 'Server configuration error');
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      callback(true);
    } catch (error) {
      const reason = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      logger.warn(`WebSocket connection rejected: ${reason}`, {
        error: error.message,
        ip: info.req.socket.remoteAddress,
      });
      callback(false, 401, reason);
    }
  },
});

const clients = new Map(); // Map<WebSocket, { userId, role, connectedAt, messageCount }>

// ─── WebSocket Rate Limiting ────────────────────────────────────
const WS_RATE_LIMIT = 30; // messages per minute
const WS_RATE_WINDOW = 60 * 1000;

const sendInitialUpdates = async (ws) => {
  try {
    const [announcements, complaints] = await Promise.all([
      Announcement.find({ isPublished: true }).sort({ publishedDate: -1, createdAt: -1 }).limit(10),
      Complaint.find().sort({ createdAt: -1 }).limit(10).populate('department', 'name')
    ]);

    const items = [];
    announcements.forEach((a) => {
      items.push({
        id: a._id.toString(),
        timestamp: a.publishedDate || a.createdAt,
        department: a.department || 'General Governance',
        message: `${a.title}: ${a.description}`,
        severity: a.priority.toLowerCase() === 'critical' || a.priority.toLowerCase() === 'emergency' 
          ? 'critical' 
          : (a.priority.toLowerCase() === 'important' ? 'warning' : 'info'),
        source: 'announcements'
      });
    });

    complaints.forEach((c) => {
      const deptName = typeof c.department === 'object' && c.department ? c.department.name : (c.department || 'General');
      items.push({
        id: c._id.toString(),
        timestamp: c.createdAt,
        department: deptName,
        message: `Grievance filed: "${c.title}" at ${c.location?.address || 'Ward ' + (c.location?.ward || 'Unknown')}`,
        severity: c.priority === 'critical' || c.priority === 'urgent' ? 'warning' : 'info',
        ward: c.location?.ward,
        source: 'complaints'
      });
    });

    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    ws.send(JSON.stringify(items.slice(0, 15)));
  } catch (error) {
    logger.error('Failed to send initial WS updates', { message: error.message });
  }
};

wss.on('connection', (ws, req) => {
  const user = req.user || {};
  const clientInfo = {
    userId: user.id,
    role: user.role,
    connectedAt: Date.now(),
    messageCount: 0,
    lastReset: Date.now(),
  };
  clients.set(ws, clientInfo);

  logger.info('WebSocket client connected', {
    userId: user.id,
    role: user.role,
  });

  sendInitialUpdates(ws);

  ws.on('message', (data) => {
    const info = clients.get(ws);
    if (!info) return;

    // Rate limiting: reset counter each window
    const now = Date.now();
    if (now - info.lastReset > WS_RATE_WINDOW) {
      info.messageCount = 0;
      info.lastReset = now;
    }

    info.messageCount++;
    if (info.messageCount > WS_RATE_LIMIT) {
      logger.warn('WebSocket rate limit exceeded', {
        userId: info.userId,
        messageCount: info.messageCount,
      });
      ws.send(JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }));
      return;
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('WebSocket client disconnected', {
      userId: user.id,
      role: user.role,
    });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', { message: error.message, userId: user.id });
    clients.delete(ws);
  });
});

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  clients.forEach((clientInfo, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

app.set('wssBroadcast', broadcast);

// ─── Graceful Shutdown ──────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Close WebSocket connections
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
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
