const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { analyzeComplaintImage, predictResolution, calculateSeverity } = require('../services/aiService');
const { Complaint, Department } = require('../models');
const logger = require('./logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIJobManager extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.predictionCache = new Map(); // SHA256 -> prediction results
    this.maxCacheSize = 200;
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  // Calculate SHA256 of a file
  getFileHash(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      return hash;
    } catch (err) {
      logger.error('Failed to calculate file hash', { filePath, error: err.message });
      return null;
    }
  }

  // Add items to prediction cache with basic eviction policy
  cachePrediction(hash, results) {
    if (!hash) return;
    if (this.predictionCache.size >= this.maxCacheSize) {
      const oldestKey = this.predictionCache.keys().next().value;
      this.predictionCache.delete(oldestKey);
    }
    this.predictionCache.set(hash, results);
    logger.info('Cached AI predictions for hash', { hash: hash.substring(0, 10) });
  }

  createJob(file, locationStr = '', lat = null, lng = null) {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const hash = this.getFileHash(file.path);
    
    const job = {
      id: jobId,
      hash,
      status: 'queued',
      progress: 0,
      results: {},
      error: null,
      file,
      locationStr,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      createdAt: Date.now()
    };

    this.jobs.set(jobId, job);

    // If cache hit, complete immediately
    if (hash && this.predictionCache.has(hash)) {
      logger.info('AI prediction cache HIT!', { jobId, hash: hash.substring(0, 10) });
      const cached = this.predictionCache.get(hash);
      job.status = 'completed';
      job.progress = 100;
      job.results = { ...cached };
      
      // Defer execution slightly to allow EventSource subscription
      setTimeout(() => {
        this.emit(jobId, { status: 'upload_complete', progress: 10, ...job.results });
        this.emit(jobId, { status: 'detecting_issue', progress: 40, ...job.results });
        this.emit(jobId, { status: 'estimating_severity', progress: 70, ...job.results });
        this.emit(jobId, { status: 'generating_recommendations', progress: 90, ...job.results });
        this.emit(jobId, { status: 'duplicate_checked', progress: 100, ...job.results });
        this.emit(jobId, { status: 'completed', progress: 100, ...job.results });
      }, 100);

      return jobId;
    }

    // Start background processing
    this._runInference(jobId);
    return jobId;
  }

  async _runInference(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.progress = 10;
      this.emit(jobId, { status: 'upload_complete', progress: 10, message: 'Image uploaded successfully' });

      // Step 1: Run Category and Department Classification (sequential prerequisite for title/description)
      logger.info('Starting Category Classification (ViT)', { jobId });
      const prediction = await analyzeComplaintImage(job.file);
      
      // Merge results
      job.results = {
        title: prediction.title || 'Civic Issue',
        description: prediction.description || `AI detected a ${prediction.title || 'civic'} issue.`,
        department: prediction.department || 'General Inquiry',
        confidence: prediction.confidence || 75
      };
      
      job.progress = 40;
      this.emit(jobId, { 
        status: 'detecting_issue', 
        progress: 40, 
        title: job.results.title,
        department: job.results.department,
        confidence: job.results.confidence
      });

      // Step 2: Execute remaining AI endpoints in parallel
      logger.info('Executing parallel inference calls...', { jobId });

      const severityPromise = calculateSeverity({
        title: job.results.title,
        description: job.results.description,
        location: job.locationStr,
        department: job.results.department,
        activeComplaints: 0,
        areaComplaints: 0,
        peopleAffected: 1,
        image: job.file.filename
      }).then(severity => {
        job.results.severityScore = severity.severityScore || 50;
        job.results.priority = severity.priority || 'medium';
        job.results.reasons = severity.reason || ['Standard analysis completed'];
        
        this.emit(jobId, {
          status: 'estimating_severity',
          progress: 70,
          severityScore: job.results.severityScore,
          priority: job.results.priority,
          reasons: job.results.reasons
        });
      }).catch(err => {
        logger.error('Parallel severity check failed', { jobId, error: err.message });
      });

      const resolutionPromise = predictResolution({
        department: job.results.department,
        priority: 'medium',
        activeComplaints: Math.floor(Math.random() * 8) + 1,
        areaComplaints: Math.floor(Math.random() * 12) + 2
      }).then(resPrediction => {
        job.results.estimatedDays = resPrediction.estimatedDays || 4;
        job.results.delayRisk = resPrediction.delayRisk || 'Medium';
        job.results.escalationProbability = resPrediction.escalationProbability || 35;
        
        this.emit(jobId, {
          status: 'generating_recommendations',
          progress: 90,
          estimatedDays: job.results.estimatedDays,
          delayRisk: job.results.delayRisk
        });
      }).catch(err => {
        logger.error('Parallel resolution prediction failed', { jobId, error: err.message });
      });

      const duplicatePromise = this._checkDuplicatesInternal(job)
        .then(dupResult => {
          job.results.duplicateDetected = dupResult.duplicateDetected;
          job.results.bestMatch = dupResult.bestMatch;
          
          this.emit(jobId, {
            status: 'duplicate_checked',
            progress: 100,
            duplicateDetected: job.results.duplicateDetected,
            bestMatch: job.results.bestMatch
          });
        }).catch(err => {
          logger.error('Parallel duplicate check failed', { jobId, error: err.message });
        });

      // Wait for all parallel promises to finish
      await Promise.all([severityPromise, resolutionPromise, duplicatePromise]);

      job.status = 'completed';
      job.progress = 100;
      
      // Cache results
      if (job.hash) {
        this.cachePrediction(job.hash, job.results);
      }

      this.emit(jobId, { status: 'completed', progress: 100, ...job.results });
      logger.info('Background AI job completed successfully', { jobId });
    } catch (err) {
      logger.error('AI background job processing failed', { jobId, error: err.message });
      job.status = 'failed';
      job.error = err.message;
      this.emit(jobId, { status: 'failed', message: 'Inference pipeline encountered an error' });
    }
  }

  // Internal helper to query complaints and check duplicate
  async _checkDuplicatesInternal(job) {
    try {
      // Find department ID from name
      let departmentId = null;
      const dept = await Department.findOne({ name: { $regex: new RegExp(job.results.department, 'i') } });
      if (dept) departmentId = dept._id;

      if (!departmentId) {
        return { duplicateDetected: false, bestMatch: null };
      }

      // Query active complaints
      const activeComplaints = await Complaint.find({
        department: departmentId,
        status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
      }).populate('department', 'name');

      if (activeComplaints.length === 0) {
        return { duplicateDetected: false, bestMatch: null };
      }

      // Map to payload structure
      const existingPayload = activeComplaints.map(c => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        image_path: c.image ? path.join(__dirname, '..', c.image.startsWith('/') ? c.image.slice(1) : c.image) : '',
        lat: c.location?.coordinates?.lat || null,
        lng: c.location?.coordinates?.lng || null,
        department_name: c.department?.name || 'General',
        status: c.status,
        affected_count: c.affectedCitizens || 1
      }));

      // Call Python duplicate detection endpoint
      const response = await fetch(`${AI_SERVICE_URL}/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.results.title,
          description: job.results.description,
          image_path: job.file.path,
          lat: job.lat,
          lng: job.lng,
          existing_complaints: existingPayload
        })
      });

      if (!response.ok) {
        return { duplicateDetected: false, bestMatch: null };
      }

      const data = await response.json();
      return {
        duplicateDetected: !!data.duplicate_detected,
        bestMatch: data.best_match || null
      };
    } catch (err) {
      logger.error('Failed checking duplicates in background job', { error: err.message });
      return { duplicateDetected: false, bestMatch: null };
    }
  }
}

// Singleton instance
module.exports = new AIJobManager();
