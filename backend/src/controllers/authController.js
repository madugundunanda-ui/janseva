const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { User } = require('../models');

const register = asyncHandler(async (req, res) => {
  const normalizedEmail =
    typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : req.body.email;
  const normalizedAadhaarNumber =
    typeof req.body.aadhaarNumber === 'string'
      ? req.body.aadhaarNumber.trim()
      : req.body.aadhaarNumber;
  const normalizedRole =
    typeof req.body.role === 'string' ? req.body.role.toLowerCase().trim() : 'citizen';

  if (normalizedRole === 'admin' && !normalizedEmail.endsWith('@janseva.gov.in')) {
    return res.status(400).json({
      success: false,
      message: 'Admin email must end with @janseva.gov.in',
    });
  }

  if (normalizedRole === 'supervisor' && !normalizedEmail.endsWith('@works.janseva.gov.in')) {
    return res.status(400).json({
      success: false,
      message: 'Supervisor email must end with @works.janseva.gov.in',
    });
  }

  if (normalizedRole === 'officer') {
    const emailParts = String(normalizedEmail || '').split('@');
    const officerDomain = emailParts[1] || '';
    const domainParts = officerDomain.split('.');
    const hasDepartmentSubdomain =
      domainParts.length === 4 &&
      domainParts[0] &&
      domainParts[1] === 'janseva' &&
      domainParts[2] === 'gov' &&
      domainParts[3] === 'in';

    if (!hasDepartmentSubdomain) {
      return res.status(400).json({
        success: false,
        message: 'Officer email must follow format: <name>@<department>.janseva.gov.in',
      });
    }
  }

  const orConditions = [{ email: normalizedEmail }];
  if (normalizedAadhaarNumber) {
    orConditions.push({ aadhaarNumber: normalizedAadhaarNumber });
  }

  const existingUser = await User.findOne({
    $or: orConditions,
  });

  if (existingUser) {
    if (normalizedEmail && existingUser.email === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    if (
      normalizedAadhaarNumber &&
      existingUser.aadhaarNumber &&
      existingUser.aadhaarNumber === normalizedAadhaarNumber
    ) {
      return res.status(400).json({
        success: false,
        message: 'A citizen with this Aadhaar number is already registered.',
      });
    }
  }

  const result = await authService.registerUser(req.body);

  sendSuccess(res, 201, 'Registration successful', result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  const role = result?.user?.role || 'unknown';
  const email = result?.user?.email || 'unknown';

  if (role === 'admin') {
    logger.info(`Admin logged in: ${email}`, { email, role });
  } else {
    logger.info('User login success', { email, role });
  }

  sendSuccess(res, 200, 'Login successful', result);
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Authenticated user fetched successfully', {
    user: req.user,
  });
});

module.exports = {
  register,
  login,
  me,
};
