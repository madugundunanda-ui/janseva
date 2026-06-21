const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { UpdateSource, IntelligenceJob, IntelligenceAuditLog } = require('../models');
const { runIngestionJob } = require('../workers/intelligenceIngestionWorker');

exports.getSources = asyncHandler(async (req, res) => {
  const sources = await UpdateSource.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Sources retrieved successfully', { sources });
});

exports.createSource = asyncHandler(async (req, res) => {
  const source = await UpdateSource.create(req.body);
  sendSuccess(res, 201, 'Source created successfully', { source });
});

exports.triggerIngestion = asyncHandler(async (req, res) => {
  // Fire and forget
  runIngestionJob().catch(console.error);
  sendSuccess(res, 202, 'Ingestion job triggered successfully');
});

exports.getJobHistory = asyncHandler(async (req, res) => {
  const jobs = await IntelligenceJob.find().sort({ createdAt: -1 }).limit(20);
  sendSuccess(res, 200, 'Jobs retrieved successfully', { jobs });
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await IntelligenceAuditLog.find().sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, 200, 'Logs retrieved successfully', { logs });
});
