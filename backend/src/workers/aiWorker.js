const { Worker } = require('bullmq');
const redisConfig = require('../config/redis');
const aiService = require('../services/aiService');
const { Complaint, User } = require('../models');
const { resolveDepartmentId } = require('../services/dashboardService');
const eventBus = require('../services/eventBus');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const initAiWorker = () => {
  if (!redisConfig.getIsRedisAvailable() || !redisConfig.getClient()) {
    logger.warn('[AiWorker] Redis unavailable. Falling back to memory-based job execution.');
    return;
  }

  const worker = new Worker('ai-analysis-queue', async (job) => {
    logger.info(`[AiWorker] Processing job ${job.id}`);
    const { complaintId, file, originalDepartmentId, spamStatus } = job.data;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      logger.warn(`[AiWorker] Complaint ${complaintId} not found, skipping`);
      return;
    }

    try {
      const extraction = await aiService.analyzeComplaintImage(file);
      logger.info(`[AiWorker] Background AI image detection completed for ${complaintId}`);

      let resolvedDeptId = originalDepartmentId;
      if (extraction.department) {
        resolvedDeptId = await resolveDepartmentId(extraction.department);
        if (!resolvedDeptId) resolvedDeptId = originalDepartmentId;
      }

      complaint.aiVerification = {
        verificationStatus: 'Completed',
        predictedDepartment: extraction.department || 'General Inquiry',
        confidenceScore: extraction.confidence || 0
      };

      complaint.department = resolvedDeptId;
      if (extraction.priority) {
        complaint.priority = extraction.priority.toLowerCase();
      }
      
      await complaint.save();

      eventBus.publish('AIAnalysisCompleted', {
        complaintId,
        predictedDepartment: complaint.aiVerification.predictedDepartment,
        confidenceScore: complaint.aiVerification.confidenceScore,
        priority: complaint.priority
      });

      if (complaint.priority === 'critical' || extraction.emergency) {
        eventBus.publish('EmergencyDetected', {
          complaintId,
          departmentId: resolvedDeptId,
          location: complaint.location
        });
      }

      // Trigger AI Auto Assign if enabled
      const settingsPath = path.join(__dirname, '../../data/settings.json');
      let autoAssignEnabled = false;
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        autoAssignEnabled = !!settings.autoAssign;
      }

      if (autoAssignEnabled && spamStatus !== 'held') {
        logger.info(`[AiWorker] Attempting AI auto-assignment for ${complaintId}`);
        // Simplified auto-assign for worker
        const officers = await User.find({ role: 'officer', department: resolvedDeptId, activeStatus: true });
        if (officers.length > 0) {
          // just pick the first one for the simplified worker code, the full match logic can be restored later if needed
          // Actually, let's restore the full match logic
          const officerIds = officers.map(o => o._id);
          const activeStatuses = ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'];
          
          const statsAgg = await Complaint.aggregate([
            { $match: { assignedOfficer: { $in: officerIds } } },
            {
              $group: {
                _id: '$assignedOfficer',
                activeCount: { $sum: { $cond: [{ $in: ['$status', activeStatuses] }, 1, 0] } }
              }
            }
          ]);
          
          const statsMap = {};
          statsAgg.forEach(s => { statsMap[s._id.toString()] = s; });
          
          let bestOfficer = null;
          let bestScore = -1;
          
          for (const officer of officers) {
            const stats = statsMap[officer._id.toString()] || { activeCount: 0 };
            const activeCount = stats.activeCount;
            let workloadScore = activeCount === 0 ? 100 : activeCount < 3 ? 80 : activeCount < 5 ? 50 : 10;
            
            if (workloadScore > bestScore) {
              bestScore = workloadScore;
              bestOfficer = officer;
            }
          }
          
          if (bestOfficer) {
            complaint.assignedOfficer = bestOfficer._id;
            complaint.status = 'assigned';
            complaint.assignedAt = new Date();
            complaint.assignedByAI = true;
            await complaint.save();
            
            logger.info(`[AiWorker] Assigned Complaint ${complaintId} to Officer ${bestOfficer._id}`);
            
            eventBus.publish('ComplaintAssigned', {
              complaintId: complaint._id,
              officerId: bestOfficer._id,
              actorId: 'system-ai',
              departmentId: resolvedDeptId
            });
          }
        }
      }
    } catch (err) {
      logger.error(`[AiWorker] Error processing job ${job.id}`, err);
      eventBus.publish('AIAnalysisFailed', { complaintId, error: err.message });
      
      complaint.aiVerification = {
        verificationStatus: 'Failed',
        predictedDepartment: 'General Inquiry',
        confidenceScore: 0
      };
      await complaint.save();
      throw err; // throw to BullMQ for retries
    }
  }, { connection: redisConfig.getClient() });

  worker.on('failed', (job, err) => {
    logger.error(`[AiWorker] Job ${job?.id} failed with error ${err.message}`);
  });

  logger.info('[AiWorker] Initialized');
};

module.exports = { initAiWorker };
