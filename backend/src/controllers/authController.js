const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const userRepository = require('../repositories/userRepository');
const eventBus = require('../services/eventBus');

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: process.env.NODE_ENV === 'production' ? '.janseva.gov.in' : 'localhost'
  });
};

const register = asyncHandler(async (req, res) => {
  const normalizedEmail =
    typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : req.body.email;
  const normalizedAadhaarLast4 =
    typeof req.body.aadhaarNumber === 'string'
      ? req.body.aadhaarNumber.slice(-4)
      : null;
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
  if (normalizedAadhaarLast4) {
    orConditions.push({ 'aadhaar.last4Digits': normalizedAadhaarLast4 });
  }

  const existingUser = await userRepository.findOne({
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
      normalizedAadhaarLast4 &&
      existingUser.aadhaar?.last4Digits &&
      existingUser.aadhaar.last4Digits === normalizedAadhaarLast4
    ) {
      return res.status(400).json({
        success: false,
        message: 'A citizen with this Aadhaar is already registered.',
      });
    }
  }

  const result = await authService.registerUser(req.body);

  if (result.token) {
    setAuthCookie(res, result.token);
  }

  // Publish domain event
  eventBus.publish('UserRegistered', {
    userId: result.user._id,
    role: result.user.role,
    name: result.user.name,
    email: result.user.email
  });

  sendSuccess(res, 201, 'Registration successful', { user: result.user });
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

  if (result.token) {
    setAuthCookie(res, result.token);
  }

  sendSuccess(res, 200, 'Login successful', { user: result.user });
});

const logout = asyncHandler(async (req, res) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (req.user && token) {
    await authService.revokeSession(req.user._id.toString(), token);
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    domain: process.env.NODE_ENV === 'production' ? '.janseva.gov.in' : 'localhost'
  });
  sendSuccess(res, 200, 'Logout successful', {});
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Authenticated user fetched successfully', {
    user: req.user,
  });
});

module.exports = {
  register,
  login,
  logout,
  me,
};
