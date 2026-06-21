const crypto = require('crypto');
const { Announcement, UpdateSource, IntelligenceJob, IntelligenceAuditLog, Notification } = require('../models');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');
const aiController = require('../controllers/aiController'); // Or intelligenceAiService if we make one
const eventBus = require('../services/eventBus');

const generateFingerprint = (url, content) => {
  return crypto.createHash('sha256').update(`${url}:${content}`).digest('hex');
};

const MOCK_SCRAPE_DATA = [
  {
    title: 'New Water Supply Guidelines for Summer',
    description: 'The state has issued new guidelines restricting water usage during peak summer months.',
    department: 'Water Board',
    url: 'http://ap.gov.in/water-guidelines-2026',
    category: 'Water Supply',
    state: 'AP'
  },
  {
    title: 'Highway Road Maintenance Notice',
    description: 'Major repairs on National Highway 44. Expect delays.',
    department: 'Roads & Transport',
    url: 'http://tn.gov.in/nh44-repairs',
    category: 'Roads & Transport',
    state: 'TN'
  },
  {
    title: 'Emergency Flood Alert - Godavari Basin',
    description: 'Immediate evacuation order for low-lying areas near the Godavari river due to flash floods.',
    department: 'Disaster Management',
    url: 'http://ts.gov.in/godavari-flood-alert',
    category: 'Emergency Notice',
    state: 'TS'
  }
];

const processNewArticle = async (article, source, jobId) => {
  // 1. Deduplication (Fingerprint Hash)
  const fingerprint = generateFingerprint(article.url, article.description);
  const exists = await Announcement.findOne({ fingerprint });

  if (exists) {
    return { skipped: true, reason: 'Duplicate' };
  }

  // 2. AI Categorization & Summarization
  // We mock the AI call here for speed and stability, but in production it would call Gemini
  let severity = 'Medium';
  let shortSummary = article.title;
  let mediumSummary = article.description;
  let trustScore = source.trustScore || 90;
  
  if (article.category === 'Emergency Notice' || article.title.includes('Flood')) {
    severity = 'Critical';
    trustScore = 99;
  }

  const confidence = Math.min(100, trustScore + 5);

  // 3. Translation Cache (Generate initial translations)
  const translations = {
    'te-IN': { title: `[TE] ${article.title}`, summary: `[TE] ${shortSummary}` },
    'ta-IN': { title: `[TA] ${article.title}`, summary: `[TA] ${shortSummary}` },
    'kn-IN': { title: `[KN] ${article.title}`, summary: `[KN] ${shortSummary}` }
  };

  // 4. Save to Database
  const announcement = await Announcement.create({
    title: article.title,
    description: article.description,
    department: article.department,
    category: article.category,
    state: article.state,
    shortSummary,
    mediumSummary,
    trustScore,
    confidence,
    sourceCount: 1,
    verified: true,
    severity,
    translations,
    sourceUrl: article.url,
    sourceName: source.name,
    fingerprint,
    publishedDate: new Date()
  });

  // 5. Emergency Alert Routing
  if (severity === 'Critical') {
    eventBus.emit('EmergencyAlert', {
      recipientId: 'system_broadcast',
      referenceId: announcement._id,
      data: {
        title: `EMERGENCY: ${announcement.title}`,
        message: announcement.shortSummary
      }
    });
  }

  return { skipped: false, announcement };
};

const runIngestionJob = async () => {
  logger.info('[IntelligenceWorker] Starting ingestion job...');
  
  const job = await IntelligenceJob.create({
    status: 'running',
    startedAt: new Date()
  });

  try {
    const sources = await UpdateSource.find({ active: true });
    if (sources.length === 0) {
      logger.warn('[IntelligenceWorker] No active sources found.');
      job.status = 'completed';
      job.completedAt = new Date();
      await job.save();
      return;
    }

    let totalProcessed = 0;

    for (const source of sources) {
      const auditLog = await IntelligenceAuditLog.create({
        jobId: job._id,
        sourceId: source._id,
        sourceName: source.name,
        startedAt: new Date(),
        articlesFetched: MOCK_SCRAPE_DATA.length
      });

      let processed = 0;
      let duplicates = 0;
      let errors = [];

      try {
        // Scrape Logic would go here. We use MOCK_SCRAPE_DATA.
        const articles = MOCK_SCRAPE_DATA; 

        for (const article of articles) {
          try {
            const result = await processNewArticle(article, source, job._id);
            if (result.skipped) {
              duplicates++;
            } else {
              processed++;
              totalProcessed++;
            }
          } catch (err) {
            errors.push(`Error processing article ${article.url}: ${err.message}`);
          }
        }
        
        // Source Health Management
        source.status = 'healthy';
        source.failCount = 0;
        source.lastSync = new Date();
        await source.save();

      } catch (sourceErr) {
        // Failure Recovery
        errors.push(`Source failure: ${sourceErr.message}`);
        source.failCount += 1;
        if (source.failCount >= 3) {
          source.status = 'failed';
          source.active = false;
          // Trigger Admin Alert
          eventBus.emit('GovernanceInsightGenerated', {
            title: `Source Failed: ${source.name}`,
            description: `Source has failed 3 consecutive times and has been disabled.`,
            severity: 'High'
          });
        } else {
          source.status = 'degraded';
        }
        await source.save();
      }

      auditLog.articlesProcessed = processed;
      auditLog.duplicatesSkipped = duplicates;
      auditLog.errors = errors;
      auditLog.completedAt = new Date();
      await auditLog.save();
    }

    job.status = 'completed';
    job.articlesProcessed = totalProcessed;
    job.completedAt = new Date();
    await job.save();
    logger.info(`[IntelligenceWorker] Ingestion complete. Processed ${totalProcessed} new articles.`);

  } catch (globalErr) {
    logger.error(`[IntelligenceWorker] Fatal job error: ${globalErr.message}`);
    job.status = 'failed';
    job.errors.push(globalErr.message);
    job.completedAt = new Date();
    await job.save();
  }
};

module.exports = {
  runIngestionJob
};
