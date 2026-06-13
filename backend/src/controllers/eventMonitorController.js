const asyncHandler = require('../utils/asyncHandler');
const { EventAuditLog, DeadLetterQueue } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const getEventMetrics = asyncHandler(async (req, res) => {
  const totalPublished = await EventAuditLog.countDocuments({ status: 'Pending' }); // Or all events depending on how you count it. Actually we count Pending as published initially.
  const totalConsumed = await EventAuditLog.countDocuments({ status: 'Consumed' });
  const totalFailed = await EventAuditLog.countDocuments({ status: 'Failed' });
  const dlqSize = await DeadLetterQueue.countDocuments({ status: 'PendingReview' });

  const recentEvents = await EventAuditLog.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const processingTimes = await EventAuditLog.aggregate([
    { $match: { status: 'Consumed', processingTimeMs: { $exists: true } } },
    { $group: { _id: null, avgTime: { $avg: '$processingTimeMs' }, maxTime: { $max: '$processingTimeMs' } } }
  ]);

  const avgProcessingTime = processingTimes.length > 0 ? processingTimes[0].avgTime : 0;

  // Simple health check: if we have more than 100 pending events older than 1 minute, queue is backing up
  const oneMinAgo = new Date(Date.now() - 60000);
  const backedUp = await EventAuditLog.countDocuments({ status: 'Pending', createdAt: { $lte: oneMinAgo } });
  
  const consumerHealth = backedUp > 100 ? 'Degraded' : 'Healthy';

  sendSuccess(res, 200, 'Event Metrics Fetched', {
    metrics: {
      published: totalPublished + totalConsumed + totalFailed, // total events created
      consumed: totalConsumed,
      failed: totalFailed,
      dlq: dlqSize,
      avgProcessingTimeMs: Math.round(avgProcessingTime),
      consumerHealth
    },
    recentEvents
  });
});

module.exports = { getEventMetrics };
