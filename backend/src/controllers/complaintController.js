const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Complaint, User, Department } = require('../models');
const assignmentService = require('../services/assignmentService');
const { resolveDepartmentId } = require('../services/dashboardService');
const aiService = require('../services/aiService');
const { sendSuccess } = require('../utils/apiResponse');
const { extractDepartmentInfo } = require('../services/aiService');
const { enqueueAiJob } = require('../utils/aiJobManager');
const eventBus = require('../services/eventBus');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const civicIntelligenceService = require('../services/civicIntelligenceService');

function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

const parseJsonField = (value, fieldName) => {
  if (!value || typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new AppError(`${fieldName} must be valid JSON`, 400);
  }
};

const getComplaints = asyncHandler(async (req, res) => {
  const filter = {};

  const tenantId = req.user.tenantId || 'default-municipality';
  filter.tenantId = tenantId;

  if (req.user.role === 'citizen') filter.citizen = req.user._id;
  if (req.user.role === 'officer') filter.assignedOfficer = req.user._id;
  if (req.user.role === 'supervisor' && req.user.department) filter.department = req.user.department;

  const rawComplaints = await Complaint.find(filter)
    .populate('citizen', 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber')
    .populate('assignedOfficer', 'name email')
    .populate('assignedSupervisor', 'name email')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  const host = req.get('host');
  const protocol = req.protocol;

  let complaints = rawComplaints.map(complaint => {
    const cObj = complaint.toObject();
    if (cObj.image) {
      const imagePath = cObj.image.startsWith('/') ? cObj.image.slice(1) : cObj.image;
      cObj.imageUrl = `${protocol}://${host}/${imagePath}`;
    } else {
      cObj.imageUrl = '';
    }
    if (cObj.beforeImage) {
      const beforeImagePath = cObj.beforeImage.startsWith('/') ? cObj.beforeImage.slice(1) : cObj.beforeImage;
      cObj.beforeImageUrl = `${protocol}://${host}/${beforeImagePath}`;
    } else {
      cObj.beforeImageUrl = cObj.imageUrl;
    }
    if (cObj.afterImage) {
      const afterImagePath = cObj.afterImage.startsWith('/') ? cObj.afterImage.slice(1) : cObj.afterImage;
      cObj.afterImageUrl = `${protocol}://${host}/${afterImagePath}`;
    } else {
      cObj.afterImageUrl = '';
    }
    return cObj;
  });

  // Route Optimization if requested
  if (req.query.optimize === 'true' && req.query.lat && req.query.lng) {
    const geoUtilityService = require('../services/geoUtilityService');
    complaints = geoUtilityService.optimizeRoute(req.query.lat, req.query.lng, complaints);
  }

  sendSuccess(res, 200, 'Complaints fetched successfully', {
    count: complaints.length,
    complaints,
  });
});

const createComplaint = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    department: departmentInput,
    priority,
    voiceTranscription,
    aiIssue,
    severityScore,
    severityReason,
  } = req.body;

  if (!title || !description || !departmentInput) {
    throw new AppError('title, description, and department are required', 400);
  }

  const departmentId = await resolveDepartmentId(departmentInput);
  if (!departmentId) {
    throw new AppError('Invalid department. Please select a valid department.', 400);
  }

  if (!req.file) {
    throw new AppError('Complaint image is required', 400);
  }

  const image = `/uploads/complaints/${req.file.filename}`;

  const parsedLocation = parseJsonField(req.body.location, 'location') || {};
  const latitude = parseFloat(parsedLocation.latitude || parsedLocation.coordinates?.lat || 0);
  const longitude = parseFloat(parsedLocation.longitude || parsedLocation.coordinates?.lng || 0);
  const address = parsedLocation.address || '';
  const city = parsedLocation.city || 'Bengaluru';
  const state = parsedLocation.state || 'Karnataka';
  const ward = parsedLocation.ward || '';

  const finalLocation = {
    address,
    city,
    state,
    latitude,
    longitude,
    ward,
    coordinates: {
      lat: latitude,
      lng: longitude
    }
  };

  let finalSeverityReason = [];
  if (severityReason) {
    if (typeof severityReason === 'string') {
      try {
        finalSeverityReason = JSON.parse(severityReason);
      } catch (e) {
        finalSeverityReason = severityReason.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(severityReason)) {
      finalSeverityReason = severityReason;
    }
  }

  // Trigger AI Spam & Abuse Detection
  let spamScore = 15;
  let trustScore = req.user.trustScore ?? 100;
  let risk = 'Low';
  const spamReasons = [];
  let isSpam = false;
  let spamStatus = 'active';

  try {
    const imgStr = String(image || '').toLowerCase();
    const titleStr = String(title || '').toLowerCase();
    const descStr = String(description || '').toLowerCase();
    const voiceStr = String(voiceTranscription || '').toLowerCase();

    const spamImageKeywords = ['cat', 'dog', 'pet', 'selfie', 'meme', 'screenshot', 'blank', 'placeholder', 'random', 'dummy', 'asdf'];
    let hasIrrelevantImage = false;
    for (const kw of spamImageKeywords) {
      if (imgStr.includes(kw)) {
        hasIrrelevantImage = true;
        break;
      }
    }

    const civicKeywords = ['road', 'pothole', 'street', 'light', 'garbage', 'waste', 'water', 'leak', 'drain', 'pipe', 'wire', 'electricity', 'power', 'encroachment', 'traffic'];
    const hasCivicKeywords = civicKeywords.some(kw => titleStr.includes(kw) || descStr.includes(kw));
    if (imgStr && !hasCivicKeywords && !imgStr.includes('uploads/complaints')) {
      hasIrrelevantImage = true;
    }

    if (hasIrrelevantImage) {
      spamReasons.push('Irrelevant image');
      spamScore += 25;
    }

    const abusiveWords = ['abuse', 'idiot', 'stupid', 'fake', 'shit', 'bastard', 'crap', 'fuck', 'asshole', 'damn'];
    let hasAbusive = false;
    for (const word of abusiveWords) {
      if (titleStr.includes(word) || descStr.includes(word) || voiceStr.includes(word)) {
        hasAbusive = true;
        break;
      }
    }

    if (hasAbusive) {
      spamReasons.push('Abusive or hostile language detected');
      spamScore += 30;
    }

    const keyboardSmashRegex = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
    const isNonsense = keyboardSmashRegex.test(titleStr) || keyboardSmashRegex.test(descStr) || descStr.length < 5;
    if (isNonsense) {
      spamReasons.push('Suspicious description text (keyboard smash or too short)');
      spamScore += 20;
    }

    const words = descStr.split(/\s+/);
    let hasRepeated = false;
    if (words.length > 2) {
      for (let i = 0; i < words.length - 2; i++) {
        if (words[i] === words[i + 1] && words[i] === words[i + 2]) {
          hasRepeated = true;
          break;
        }
      }
    }
    if (hasRepeated) {
      spamReasons.push('Repetitive words in text');
      spamScore += 15;
    }

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const duplicate = await Complaint.findOne({
      citizen: req.user._id,
      createdAt: { $gte: fifteenMinsAgo },
      $or: [
        { title: title },
        { description: description }
      ]
    });

    if (duplicate) {
      spamReasons.push('Repeated submissions within short time period');
      spamScore += 25;
    }

    spamScore = Math.max(12, Math.min(98, spamScore));

    if (hasIrrelevantImage) trustScore -= 15;
    if (hasAbusive) trustScore -= 20;
    if (duplicate) trustScore -= 15;
    if (isNonsense) trustScore -= 10;
    trustScore = Math.max(0, Math.min(100, trustScore));

    const user = await User.findById(req.user._id);
    if (user) {
      user.trustScore = trustScore;
      if (trustScore >= 95) user.trustLevel = 'Trusted';
      else if (trustScore >= 70) user.trustLevel = 'Normal';
      else if (trustScore >= 40) user.trustLevel = 'Warning';
      else {
        user.trustLevel = 'Restricted';
        user.restricted = true;
      }
      await user.save();
    }

    if (spamScore >= 75) {
      risk = 'High';
      isSpam = true;
    } else if (spamScore >= 40) {
      risk = 'Medium';
    }

    if (spamScore >= 80 || trustScore < 40) {
      spamStatus = 'held';
    }
  } catch (spamErr) {
    logger.error('Spam analysis failed', { message: spamErr.message, stack: spamErr.stack });
  }

  const complaint = await Complaint.create({
    title,
    description,
    department: departmentId,
    priority: priority || 'medium',
    voiceTranscription,
    aiIssue,
    severityScore: Number(severityScore || 0),
    severityReason: finalSeverityReason,
    location: finalLocation,
    citizen: req.user._id,
    image,
    spamAnalysis: {
      spamScore,
      trustScore,
      risk,
      reasons: spamReasons,
      isSpam,
      status: spamStatus
    },
    status: spamStatus === 'held' ? 'under_review' : 'submitted',
    aiVerification: {
      verificationStatus: 'Pending',
      predictedDepartment: '',
      confidenceScore: 0
    },
    tenantId: req.user.tenantId || 'default-municipality'
  });

  logger.info('Complaint created', {
    complaintId: complaint._id.toString(),
    citizenId: req.user._id.toString(),
    departmentId: String(departmentId),
    imagePath: complaint.image,
    spamScore,
    trustScore,
    spamRisk: risk,
  });

  const host = req.get('host');
  const protocol = req.protocol;
  const cObj = complaint.toObject();
  if (cObj.image) {
    const imagePath = cObj.image.startsWith('/') ? cObj.image.slice(1) : cObj.image;
    cObj.imageUrl = `${protocol}://${host}/${imagePath}`;
  } else {
    cObj.imageUrl = '';
  }

  const savedFileContext = req.file;

  res.status(202).json({
    success: true,
    message: "Complaint tokens received. Advanced automated metadata classification has been delegated in the background.",
    status: "Pending",
    complaint: cObj,
    data: {
      complaint: cObj,
    }
  });

  // Instead of synchronous heavy lifting for Civic Intelligence, Hotspots, and Notifications,
  // we emit a standard domain event to the EventBus.
  eventBus.publish('ComplaintCreated', {
    complaintId: complaint._id,
    citizenId: complaint.citizen,
    title: complaint.title,
    category: complaint.category,
    department: complaint.department,
    originalDepartmentId: departmentId,
    priority: complaint.priority,
    location: complaint.location,
    file: savedFileContext,
    spamStatus: spamStatus
  });
});

const uploadComplaintImages = asyncHandler(async (req, res) => {
  // Support both upload.single (req.file) and upload.array (req.files)
  const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);

  if (files.length === 0) {
    throw new AppError('Please upload at least one image', 400);
  }

  const images = files.map((file) => ({
    url: `/uploads/complaints/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));

  sendSuccess(res, 201, 'Images uploaded successfully', {
    count: images.length,
    images,
  });
});

const getAssignmentOptions = asyncHandler(async (req, res) => {
  const data = await assignmentService.getDepartmentTeamForComplaint(req.params.id, req.user);

  sendSuccess(res, 200, 'Assignment options fetched successfully', data);
});

const assignOfficer = asyncHandler(async (req, res) => {
  if (!req.body.officerId) {
    throw new AppError('officerId is required', 400);
  }

  const complaint = await assignmentService.assignOfficerToComplaint({
    complaintId: req.params.id,
    officerId: req.body.officerId,
    actor: req.user,
  });
  logger.info(`Complaint ${complaint._id} assigned to Officer ${req.body.officerId}`, {
    complaintId: complaint._id.toString(),
    officerId: req.body.officerId,
    actorId: req.user._id.toString(),
  });

  // Publish Domain Event
  eventBus.publish('ComplaintAssigned', {
    complaintId: complaint._id,
    officerId: req.body.officerId,
    actorId: req.user._id,
    departmentId: complaint.department
  });

  sendSuccess(res, 200, 'Officer assigned successfully', {
    complaint,
  });
});

const assignSupervisor = asyncHandler(async (req, res) => {
  if (!req.body.supervisorId) {
    throw new AppError('supervisorId is required', 400);
  }

  const complaint = await assignmentService.assignSupervisorToComplaint({
    complaintId: req.params.id,
    supervisorId: req.body.supervisorId,
    actor: req.user,
    note: req.body.note,
  });
  logger.info('Supervisor assigned to complaint', {
    complaintId: complaint._id.toString(),
    supervisorId: req.body.supervisorId,
    actorId: req.user._id.toString(),
  });

  sendSuccess(res, 200, 'Supervisor assigned successfully', {
    complaint,
  });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint not found', 404);

  const tenantId = req.user.tenantId || 'default-municipality';
  if (complaint.tenantId !== tenantId) {
    throw new AppError('Not authorized to update this complaint (tenant mismatch)', 403);
  }

  const previousStatus = complaint.status;

  const allowedFields = ['status', 'priority', 'resolutionNote', 'slaDeadline'];
  const updateData = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) updateData[key] = req.body[key];
  });
  
  if (req.body.status === 'resolved' || req.body.status === 'rejected') {
    if (req.body.resolutionNote) updateData.resolutionNote = req.body.resolutionNote;
  }

  // Run AI Verification if changing status to resolved and an afterImage file is uploaded
  if (req.body.status === 'resolved' && req.file) {
    const afterImageUrl = `/uploads/complaints/${req.file.filename}`;
    updateData.afterImage = afterImageUrl;
    updateData.beforeImage = complaint.image;

    const { verifyResolutionProof } = require('../services/aiService');
    const verificationResult = await verifyResolutionProof(complaint.image, req.file);

    updateData.verification = {
      status: verificationResult.status,
      confidence: verificationResult.confidence,
      differenceScore: verificationResult.differenceScore,
      result: verificationResult.result,
      reasons: verificationResult.reasons
    };
  }

  const rawComplaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    .populate('citizen', 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber')
    .populate('assignedOfficer', 'name email')
    .populate('assignedSupervisor', 'name email')
    .populate('department', 'name');

  if (!rawComplaint) throw new AppError('Complaint not found', 404);
  if (updateData.status && updateData.status !== previousStatus) {
    logger.info('Complaint status changed', {
      complaintId: rawComplaint._id.toString(),
      fromStatus: previousStatus,
      toStatus: updateData.status,
      actorId: req.user._id.toString(),
    });
    if (updateData.status === 'resolved') {
      logger.info('Complaint resolved', {
        complaintId: rawComplaint._id.toString(),
        actorId: req.user._id.toString(),
      });
    }
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const cObj = rawComplaint.toObject();
  if (cObj.image) {
    const imagePath = cObj.image.startsWith('/') ? cObj.image.slice(1) : cObj.image;
    cObj.imageUrl = `${protocol}://${host}/${imagePath}`;
  } else {
    cObj.imageUrl = '';
  }

  if (cObj.beforeImage) {
    const beforeImagePath = cObj.beforeImage.startsWith('/') ? cObj.beforeImage.slice(1) : cObj.beforeImage;
    cObj.beforeImageUrl = `${protocol}://${host}/${beforeImagePath}`;
  } else {
    cObj.beforeImageUrl = cObj.imageUrl;
  }

  if (cObj.afterImage) {
    const afterImagePath = cObj.afterImage.startsWith('/') ? cObj.afterImage.slice(1) : cObj.afterImage;
    cObj.afterImageUrl = `${protocol}://${host}/${afterImagePath}`;
  } else {
    cObj.afterImageUrl = '';
  }

  if (rawComplaint.status === 'resolved') {
    eventBus.publish('ComplaintResolved', {
      complaintId: rawComplaint._id,
      citizenId: rawComplaint.citizen,
      departmentId: rawComplaint.department,
      status: rawComplaint.status
    });
  } else {
    eventBus.publish('ComplaintStatusUpdated', {
      complaintId: rawComplaint._id,
      citizenId: rawComplaint.citizen,
      departmentId: rawComplaint.department,
      status: rawComplaint.status
    });
  }

  sendSuccess(res, 200, 'Complaint updated successfully', { complaint: cObj });
});

const checkDuplicate = asyncHandler(async (req, res) => {
  const { title, description, department: departmentInput, location } = req.body;

  if (!title || !description || !departmentInput) {
    throw new AppError('title, description, and department are required', 400);
  }

  const departmentId = await resolveDepartmentId(departmentInput);
  if (!departmentId) {
    throw new AppError('Invalid department. Please select a valid department.', 400);
  }

  // Parse location and coordinates
  let parsedLocation = null;
  const locationObj = parseJsonField(location, 'location');
  if (locationObj && locationObj.coordinates) {
    parsedLocation = locationObj;
  }

  // Save the uploaded image path if file exists
  let newImageRelativePath = '';
  if (req.file) {
    newImageRelativePath = `/uploads/complaints/${req.file.filename}`;
  }

  const departmentObj = await Department.findById(departmentId);
  
  // Call Civic Intelligence Service instead of AI Python API
  const duplicateResult = await civicIntelligenceService.detectDuplicates({
    title,
    description,
    category: departmentObj ? departmentObj.name : departmentInput,
    location: parsedLocation
  });

  if (duplicateResult.duplicatesFound && duplicateResult.similarComplaints.length > 0) {
    const bestMatchInternal = duplicateResult.similarComplaints[0];
    const matchedComplaint = await Complaint.findById(bestMatchInternal.complaintId);
    
    let bestMatch = null;
    if (matchedComplaint) {
      bestMatch = {
        id: matchedComplaint._id.toString(),
        title: matchedComplaint.title,
        description: matchedComplaint.description,
        status: matchedComplaint.status,
        affected_count: matchedComplaint.affectedCitizens || 1,
        confidence: bestMatchInternal.combinedScore
      };
      
      if (matchedComplaint.image) {
        const host = req.get('host');
        const protocol = req.protocol;
        const imagePath = matchedComplaint.image.startsWith('/') ? matchedComplaint.image.slice(1) : matchedComplaint.image;
        bestMatch.imageUrl = `${protocol}://${host}/${imagePath}`;
      }
    }

    sendSuccess(res, 200, 'Duplicate check completed', {
      duplicateDetected: true,
      bestMatch,
      tempImageRelativePath: newImageRelativePath,
    });
  } else {
    sendSuccess(res, 200, 'Duplicate check completed', {
      duplicateDetected: false,
      bestMatch: null,
      tempImageRelativePath: newImageRelativePath,
    });
  }
});

const joinComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const citizenId = req.user._id;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  // Check if citizen has already joined this complaint
  const isCreator = complaint.citizen.toString() === citizenId.toString();
  const alreadyJoined = complaint.joinedCitizens.includes(citizenId);
  
  if (isCreator || alreadyJoined) {
    return sendSuccess(res, 200, 'You have already registered for this complaint', { complaint });
  }

  complaint.joinedCitizens.push(citizenId);
  complaint.affectedCitizens = (complaint.affectedCitizens || 1) + 1;
  await complaint.save();

  sendSuccess(res, 200, 'Successfully joined the existing complaint', {
    complaint,
  });
});

const getNearbyComplaints = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new AppError('Latitude and longitude parameters are required', 400);
  }

  const host = req.get('host');
  const protocol = req.protocol;

  // Use $geoNear aggregation for efficient 2dsphere-indexed proximity search
  const nearbyComplaints = await Complaint.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: 1000, // 1km in meters
        spherical: true,
        key: 'location.geoPoint',
        query: {
          status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
          citizen: { $ne: req.user._id },
          tenantId: req.user.tenantId || 'default-municipality'
        }
      }
    },
    { $sort: { distanceMeters: 1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentDoc'
      }
    },
    { $unwind: { path: '$departmentDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'citizen',
        foreignField: '_id',
        as: 'citizenDoc',
        pipeline: [
          { $project: { firstName: 1, lastName: 1, email: 1, phone: 1, currentAddress: 1, permanentAddress: 1, age: 1, gender: 1, occupation: 1, aadhaarNumber: 1 } }
        ]
      }
    },
    { $unwind: { path: '$citizenDoc', preserveNullAndEmptyArrays: true } }
  ]);

  const nearbyList = nearbyComplaints.map(c => {
    c.distance = Math.round(c.distanceMeters);
    c.department = c.departmentDoc || c.department;
    c.citizen = c.citizenDoc || c.citizen;
    delete c.departmentDoc;
    delete c.citizenDoc;
    delete c.distanceMeters;

    if (c.image) {
      const imagePath = c.image.startsWith('/') ? c.image.slice(1) : c.image;
      c.imageUrl = `${protocol}://${host}/${imagePath}`;
    } else {
      c.imageUrl = '';
    }

    const totalVotes = (c.communityVotes?.confirm || 0) + (c.communityVotes?.reject || 0) + (c.communityVotes?.worse || 0);
    c.validationScore = totalVotes > 0 
      ? Math.round(((c.communityVotes?.confirm || 0) + (c.communityVotes?.worse || 0)) / totalVotes * 100) 
      : 100;
    
    c.hasValidated = c.validators && c.validators.some(v => v.toString() === req.user._id.toString());

    return c;
  });

  sendSuccess(res, 200, 'Nearby complaints retrieved successfully', {
    count: nearbyList.length,
    complaints: nearbyList
  });
});

const validateComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { voteType, comment } = req.body;
  const citizenId = req.user._id;

  if (!voteType || !['confirm', 'reject', 'worse'].includes(voteType)) {
    throw new AppError('A valid voteType is required (confirm, reject, worse)', 400);
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  const alreadyValidated = complaint.validators && complaint.validators.some(
    v => v.toString() === citizenId.toString()
  );

  if (alreadyValidated) {
    throw new AppError('You have already validated this complaint.', 400);
  }

  if (!complaint.communityVotes) {
    complaint.communityVotes = { confirm: 0, reject: 0, worse: 0 };
  }

  complaint.communityVotes[voteType] = (complaint.communityVotes[voteType] || 0) + 1;
  complaint.validators.push(citizenId);
  
  complaint.validatorDetails.push({
    citizen: citizenId,
    voteType,
    createdAt: new Date()
  });

  if (req.file) {
    const photoUrl = `/uploads/complaints/${req.file.filename}`;
    complaint.supportingImages.push({
      url: photoUrl,
      uploadedBy: citizenId,
      createdAt: new Date()
    });
  }

  if (comment && comment.trim().length > 0) {
    complaint.comments.push({
      text: comment.trim(),
      citizenId,
      citizenName: req.user.name || 'Anonymous',
      createdAt: new Date()
    });
  }

  if (voteType === 'confirm' || voteType === 'worse') {
    complaint.affectedCitizens = (complaint.affectedCitizens || 1) + 1;
  }

  const confirmVotes = complaint.communityVotes.confirm || 0;
  const worseVotes = complaint.communityVotes.worse || 0;
  const photoCount = complaint.supportingImages?.length || 0;

  let bonusPoints = (confirmVotes * 4) + (worseVotes * 8) + (photoCount * 5);
  if (bonusPoints > 40) bonusPoints = 40;

  const baseScore = complaint.severityScore || 50;
  let finalScore = baseScore + bonusPoints;
  if (finalScore > 100) finalScore = 100;

  complaint.severityScore = finalScore;

  if (finalScore >= 81) {
    complaint.priority = 'critical';
  } else if (finalScore >= 61) {
    complaint.priority = 'high';
  } else if (finalScore >= 31 && complaint.priority === 'low') {
    complaint.priority = 'medium';
  }

  const reasonMsg = `Community validated: ${confirmVotes} confirms, ${worseVotes} worsens. Severity adjusted by +${bonusPoints} points.`;
  if (complaint.severityReason) {
    if (!complaint.severityReason.includes(reasonMsg)) {
      complaint.severityReason.push(reasonMsg);
    }
  }

  await complaint.save();

  sendSuccess(res, 200, 'Complaint validation recorded successfully', {
    complaint
  });
});

const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizen', 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber')
    .populate('assignedOfficer', 'name email')
    .populate('assignedSupervisor', 'name email')
    .populate('department', 'name');

  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  const tenantId = req.user.tenantId || 'default-municipality';
  if (complaint.tenantId !== tenantId) {
    throw new AppError('Not authorized to view this complaint (tenant mismatch)', 403);
  }

  // Auth role restrictions
  if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this complaint', 403);
  }
  if (req.user.role === 'officer' && complaint.assignedOfficer?._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this complaint', 403);
  }
  if (req.user.role === 'supervisor' && req.user.department && complaint.department?._id.toString() !== req.user.department.toString()) {
    throw new AppError('Not authorized to view this complaint', 403);
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const cObj = complaint.toObject();
  if (cObj.image) {
    const imagePath = cObj.image.startsWith('/') ? cObj.image.slice(1) : cObj.image;
    cObj.imageUrl = `${protocol}://${host}/${imagePath}`;
  } else {
    cObj.imageUrl = '';
  }

  if (cObj.beforeImage) {
    const beforeImagePath = cObj.beforeImage.startsWith('/') ? cObj.beforeImage.slice(1) : cObj.beforeImage;
    cObj.beforeImageUrl = `${protocol}://${host}/${beforeImagePath}`;
  } else {
    cObj.beforeImageUrl = cObj.imageUrl;
  }

  if (cObj.afterImage) {
    const afterImagePath = cObj.afterImage.startsWith('/') ? cObj.afterImage.slice(1) : cObj.afterImage;
    cObj.afterImageUrl = `${protocol}://${host}/${afterImagePath}`;
  } else {
    cObj.afterImageUrl = '';
  }

  sendSuccess(res, 200, 'Complaint fetched successfully', { complaint: cObj });
});

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  uploadComplaintImages,
  getAssignmentOptions,
  assignOfficer,
  assignSupervisor,
  updateComplaint,
  checkDuplicate,
  joinComplaint,
  getNearbyComplaints,
  validateComplaint,
};
