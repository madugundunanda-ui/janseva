const app = require('./src/app');
const logger = require('./src/utils/logger');
const WebSocket = require('ws');
const { Announcement, Complaint } = require('./src/models');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Citizen Grievance Backend running on port ${PORT}`);
});

// Set up WebSocket server
const wss = new WebSocket.Server({ server });
const clients = new Set();

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

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info('WebSocket client connected');

  sendInitialUpdates(ws);

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('WebSocket client disconnected');
  });
});

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

app.set('wssBroadcast', broadcast);

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { message: error.message, stack: error.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});
