const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const getAdminLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const type = req.query.type === 'error' ? 'error' : 'combined';
  const logsDir = path.join(__dirname, '../../logs');

  if (!fs.existsSync(logsDir)) {
    throw new AppError('Logs directory not found', 404);
  }

  const filePrefix = `${type}-`;
  const files = fs.readdirSync(logsDir)
    .filter((name) => name.startsWith(filePrefix) && name.endsWith('.log'))
    .sort((a, b) => b.localeCompare(a));

  if (files.length === 0) {
    return sendSuccess(res, 200, 'No logs found', {
      type,
      page,
      limit,
      total: 0,
      logs: [],
    });
  }

  const rawLines = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
    const lines = content.split('\n').filter(Boolean).reverse();
    for (const line of lines) {
      rawLines.push(line);
      if (rawLines.length >= page * limit) break;
    }
    if (rawLines.length >= page * limit) break;
  }

  const start = (page - 1) * limit;
  const pageLines = rawLines.slice(start, start + limit);
  const logs = pageLines.map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      return { message: line };
    }
  });

  return sendSuccess(res, 200, 'Logs fetched successfully', {
    type,
    page,
    limit,
    total: rawLines.length,
    logs,
  });
});

module.exports = {
  getAdminLogs,
};
