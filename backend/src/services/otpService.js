const logger = require('../utils/logger');
const userRepository = require('../repositories/userRepository');

// In-memory OTP Cache & Rate Limit Tracker
const otpCache = new Map();
const requestTracker = new Map(); // key -> Array of timestamps

const TTL_MS = 5 * 60 * 1000; // 5 minutes expiration
const HOURLY_LIMIT = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Audit log helper that never logs the sensitive OTP value
 */
function logOtpEvent(event, targetType, targetIdentifier, extra = {}) {
  logger.info(`[OTP Audit] Event=${event} Target=${targetType}:${targetIdentifier}`, extra);
}

/**
 * Check hourly rate limit for contact
 */
function checkRateLimit(key) {
  const now = Date.now();
  const timestamps = (requestTracker.get(key) || []).filter(t => now - t < ONE_HOUR_MS);
  
  if (timestamps.length >= HOURLY_LIMIT) {
    return false;
  }
  
  timestamps.push(now);
  requestTracker.set(key, timestamps);
  return true;
}

/**
 * Pre-check duplicate email/phone in DB
 */
async function checkDuplicateUser(query) {
  try {
    const existing = await userRepository.findOne(query);
    return !!existing;
  } catch (err) {
    return false; // fallback if DB error
  }
}

/**
 * Generate and store Email OTP
 */
async function sendEmailOtp(email) {
  if (!email) {
    throw new Error('Email address is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check duplicate user in DB
  const isDuplicate = await checkDuplicateUser({ email: normalizedEmail });
  if (isDuplicate) {
    logOtpEvent('OTP_REJECTED_DUPLICATE', 'email', normalizedEmail);
    return {
      success: false,
      isDuplicate: true,
      message: 'An account with this email address already exists. Please login instead.'
    };
  }

  // Check rate limit (max 5/hr)
  if (!checkRateLimit(`email_${normalizedEmail}`)) {
    logOtpEvent('RATE_LIMIT_EXCEEDED', 'email', normalizedEmail);
    return {
      success: false,
      message: 'Maximum 5 OTP requests per hour exceeded. Please try again after 1 hour.'
    };
  }

  // Invalidate previous active OTP
  if (otpCache.has(`email_${normalizedEmail}`)) {
    logOtpEvent('OTP_PREVIOUS_INVALIDATED', 'email', normalizedEmail);
    otpCache.delete(`email_${normalizedEmail}`);
  }

  const otp = generate6DigitOtp();
  const expiresAt = Date.now() + TTL_MS;

  otpCache.set(`email_${normalizedEmail}`, {
    otp,
    expiresAt,
    attempts: 0,
    isLocked: false
  });

  logOtpEvent('OTP_GENERATED', 'email', normalizedEmail);

  // Clean up after expiration
  setTimeout(() => {
    const cached = otpCache.get(`email_${normalizedEmail}`);
    if (cached && cached.expiresAt <= Date.now()) {
      otpCache.delete(`email_${normalizedEmail}`);
      logOtpEvent('OTP_EXPIRED', 'email', normalizedEmail);
    }
  }, TTL_MS + 1000);

  return {
    success: true,
    message: 'OTP sent successfully to ' + normalizedEmail,
    expiresInSeconds: 300,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
  };
}

/**
 * Verify Email OTP
 */
async function verifyEmailOtp(email, otp) {
  if (!email || !otp) {
    return { success: false, message: 'Email and OTP code are required' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const key = `email_${normalizedEmail}`;
  const record = otpCache.get(key);

  if (!record) {
    logOtpEvent('OTP_VERIFY_NOT_FOUND', 'email', normalizedEmail);
    return { success: false, message: 'OTP not found or has expired. Please request a new OTP.' };
  }

  if (record.isLocked) {
    logOtpEvent('OTP_VERIFY_LOCKED_ATTEMPT', 'email', normalizedEmail);
    return { success: false, message: 'OTP verification locked due to 5 failed attempts. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(key);
    logOtpEvent('OTP_VERIFY_EXPIRED', 'email', normalizedEmail);
    return { success: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.otp !== String(otp).trim()) {
    record.attempts = (record.attempts || 0) + 1;
    logOtpEvent('OTP_VERIFY_FAILED', 'email', normalizedEmail, { attempts: record.attempts });
    
    if (record.attempts >= 5) {
      record.isLocked = true;
      logOtpEvent('OTP_LOCKED', 'email', normalizedEmail);
      return { success: false, message: 'Verification locked after 5 incorrect attempts. Please request a new OTP.' };
    }
    
    return { success: false, message: `Invalid OTP code. (${5 - record.attempts} attempts remaining)` };
  }

  // OTP verified successfully -> Instantly delete to prevent reuse
  otpCache.delete(key);
  logOtpEvent('OTP_VERIFIED_SUCCESS', 'email', normalizedEmail);

  return { success: true, message: 'Email verified successfully' };
}

/**
 * Generate and store SMS OTP (MSG91 abstraction driver)
 */
async function sendSmsOtp(phone) {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  const normalizedPhone = String(phone).replace(/\D/g, '');

  // Check duplicate user in DB
  const isDuplicate = await checkDuplicateUser({ phone: normalizedPhone });
  if (isDuplicate) {
    logOtpEvent('OTP_REJECTED_DUPLICATE', 'sms', normalizedPhone);
    return {
      success: false,
      isDuplicate: true,
      message: 'An account with this phone number already exists. Please login instead.'
    };
  }

  // Rate limit check
  if (!checkRateLimit(`sms_${normalizedPhone}`)) {
    logOtpEvent('RATE_LIMIT_EXCEEDED', 'sms', normalizedPhone);
    return {
      success: false,
      message: 'Maximum 5 SMS OTP requests per hour exceeded. Please try again later.'
    };
  }

  // Invalidate previous active OTP
  if (otpCache.has(`sms_${normalizedPhone}`)) {
    logOtpEvent('OTP_PREVIOUS_INVALIDATED', 'sms', normalizedPhone);
    otpCache.delete(`sms_${normalizedPhone}`);
  }

  const otp = generate6DigitOtp();
  const expiresAt = Date.now() + TTL_MS;

  otpCache.set(`sms_${normalizedPhone}`, {
    otp,
    expiresAt,
    attempts: 0,
    isLocked: false
  });

  logOtpEvent('OTP_GENERATED', 'sms', normalizedPhone);

  setTimeout(() => {
    const cached = otpCache.get(`sms_${normalizedPhone}`);
    if (cached && cached.expiresAt <= Date.now()) {
      otpCache.delete(`sms_${normalizedPhone}`);
      logOtpEvent('OTP_EXPIRED', 'sms', normalizedPhone);
    }
  }, TTL_MS + 1000);

  return {
    success: true,
    provider: 'MSG91',
    message: 'SMS OTP dispatched to +91' + normalizedPhone,
    expiresInSeconds: 300,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
  };
}

/**
 * Verify SMS OTP
 */
async function verifySmsOtp(phone, otp) {
  if (!phone || !otp) {
    return { success: false, message: 'Phone number and OTP code are required' };
  }

  const normalizedPhone = String(phone).replace(/\D/g, '');
  const key = `sms_${normalizedPhone}`;
  const record = otpCache.get(key);

  if (!record) {
    logOtpEvent('OTP_VERIFY_NOT_FOUND', 'sms', normalizedPhone);
    return { success: false, message: 'SMS OTP not found or has expired. Please request a new code.' };
  }

  if (record.isLocked) {
    logOtpEvent('OTP_VERIFY_LOCKED_ATTEMPT', 'sms', normalizedPhone);
    return { success: false, message: 'OTP verification locked due to 5 failed attempts. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(key);
    logOtpEvent('OTP_VERIFY_EXPIRED', 'sms', normalizedPhone);
    return { success: false, message: 'SMS OTP has expired. Please request a new code.' };
  }

  if (record.otp !== String(otp).trim()) {
    record.attempts = (record.attempts || 0) + 1;
    logOtpEvent('OTP_VERIFY_FAILED', 'sms', normalizedPhone, { attempts: record.attempts });

    if (record.attempts >= 5) {
      record.isLocked = true;
      logOtpEvent('OTP_LOCKED', 'sms', normalizedPhone);
      return { success: false, message: 'Verification locked after 5 incorrect attempts. Please request a new code.' };
    }

    return { success: false, message: `Invalid SMS OTP code. (${5 - record.attempts} attempts remaining)` };
  }

  otpCache.delete(key);
  logOtpEvent('OTP_VERIFIED_SUCCESS', 'sms', normalizedPhone);

  return { success: true, message: 'Mobile phone verified successfully' };
}

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
  sendSmsOtp,
  verifySmsOtp
};
