/**
 * Centralized Joi Validation Schemas
 *
 * All API request validation schemas in one place.
 */

const Joi = require('joi');

// ─── Auth ───────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('citizen', 'officer', 'supervisor', 'admin').default('citizen'),
  phone: Joi.string().trim().allow('').optional(),
  aadhaarNumber: Joi.string().trim().allow('').optional(),
  firstName: Joi.string().trim().allow('').optional(),
  lastName: Joi.string().trim().allow('').optional(),
  currentAddress: Joi.string().trim().allow('').optional(),
  permanentAddress: Joi.string().trim().allow('').optional(),
  age: Joi.number().integer().min(1).max(150).allow(null).optional(),
  gender: Joi.string().trim().allow('').optional(),
  occupation: Joi.string().trim().allow('').optional(),
  ward: Joi.string().trim().allow('').optional(),
  district: Joi.string().trim().allow('').optional(),
  department: Joi.string().allow('', null).optional(),
  employeeId: Joi.string().trim().allow('').optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('citizen', 'officer', 'supervisor', 'admin').optional(),
});

// ─── Complaints ─────────────────────────────────────────────────
const createComplaintSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required(),
  description: Joi.string().trim().min(5).required(),
  department: Joi.string().trim().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'critical').default('medium'),
  voiceTranscription: Joi.string().allow('', null).optional(),
  aiIssue: Joi.string().allow('', null).optional(),
  severityScore: Joi.number().min(0).max(100).allow(null).optional(),
  severityReason: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).allow(null).optional(),
  location: Joi.alternatives().try(
    Joi.object().unknown(true),
    Joi.string()
  ).allow(null, '').optional(),
});

const updateComplaintSchema = Joi.object({
  status: Joi.string().valid(
    'submitted', 'under_review', 'assigned', 'in_progress',
    'escalated', 'resolved', 'rejected', 'closed'
  ).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'critical').optional(),
  resolutionNote: Joi.string().trim().allow('').optional(),
  slaDeadline: Joi.date().iso().allow(null).optional(),
});

const validateComplaintSchema = Joi.object({
  voteType: Joi.string().valid('confirm', 'reject', 'worse').required(),
  comment: Joi.string().trim().max(500).allow('').optional(),
});

// ─── AI ─────────────────────────────────────────────────────────
const recommendOfficerSchema = Joi.object({
  complaintId: Joi.string().required(),
});

const detectSpamSchema = Joi.object({
  citizenId: Joi.string().required(),
  title: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  image: Joi.string().allow('').optional(),
  voiceTranscription: Joi.string().allow('').optional(),
});

const spamActionSchema = Joi.object({
  complaintId: Joi.string().required(),
  action: Joi.string().valid('approve', 'reject', 'warn', 'block').required(),
});

const severitySchema = Joi.object({
  title: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  department: Joi.string().allow('').optional(),
  peopleAffected: Joi.number().integer().min(0).optional(),
  image: Joi.string().allow('').optional(),
});

// ─── Feedback ───────────────────────────────────────────────────
const submitFeedbackSchema = Joi.object({
  complaintId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('').optional(),
  responseTime: Joi.string().valid('fast', 'moderate', 'slow').optional(),
  resolved: Joi.boolean().optional(),
});

// ─── Geo ────────────────────────────────────────────────────────
const reverseGeocodeSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

const nearbyQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
}).unknown(true);

// ─── Announcements ──────────────────────────────────────────────
const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(5).required(),
  department: Joi.string().trim().allow('').optional(),
  priority: Joi.string().valid('normal', 'important', 'critical', 'emergency').default('normal'),
  isPublished: Joi.boolean().default(true),
});

// ─── Assignment ─────────────────────────────────────────────────
const assignOfficerSchema = Joi.object({
  officerId: Joi.string().required(),
});

const assignSupervisorSchema = Joi.object({
  supervisorId: Joi.string().required(),
  note: Joi.string().trim().max(500).allow('').optional(),
});

// ─── Settings ───────────────────────────────────────────────────
const updateSettingsSchema = Joi.object({
  autoAssign: Joi.boolean().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createComplaintSchema,
  updateComplaintSchema,
  validateComplaintSchema,
  recommendOfficerSchema,
  detectSpamSchema,
  spamActionSchema,
  severitySchema,
  submitFeedbackSchema,
  reverseGeocodeSchema,
  nearbyQuerySchema,
  createAnnouncementSchema,
  assignOfficerSchema,
  assignSupervisorSchema,
  updateSettingsSchema,
};
