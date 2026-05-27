/**
 * Centralized Environment Validation
 *
 * Validates all required environment variables at startup and enforces
 * security constraints in production mode.
 */

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(5000),

  MONGO_URI: Joi.string().required().messages({
    'any.required': 'MONGO_URI is required. Set it in your .env file.',
  }),

  JWT_SECRET: Joi.string().min(16).required().messages({
    'string.min': 'JWT_SECRET must be at least 16 characters. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
    'any.required': 'JWT_SECRET is required.',
  }),

  JWT_EXPIRE: Joi.string().default('7d'),

  AI_SERVICE_URL: Joi.string().uri().default('http://localhost:8000'),

  FRONTEND_URL: Joi.string().allow('').optional(),

  SENTRY_DSN: Joi.string().allow('').optional(),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default(Joi.ref('NODE_ENV', {
      adjust: (env) => (env === 'production' ? 'info' : 'debug'),
    })),

  BYPASS_AUTH: Joi.string().valid('true', 'false').optional(),

  ADMIN_NAME: Joi.string().default('System Admin'),
  ADMIN_EMAIL: Joi.string().email().default('admin@janseva.gov.in'),
  ADMIN_PASSWORD: Joi.string().min(6).optional(),
}).unknown(true); // Allow other env vars (PATH, etc.)

function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const messages = error.details.map((d) => `  ✗ ${d.message}`).join('\n');
    console.error(`\n[ENV VALIDATION FAILED]\n${messages}\n`);
    process.exit(1);
  }

  // Production-specific enforcement
  if (value.NODE_ENV === 'production') {
    const violations = [];

    if (value.JWT_SECRET.length < 32) {
      violations.push('JWT_SECRET must be at least 32 characters in production');
    }

    const weakSecrets = ['supersecretkey', 'secret', 'changeme', 'password', 'jwt_secret'];
    if (weakSecrets.some((w) => value.JWT_SECRET.toLowerCase().includes(w))) {
      violations.push('JWT_SECRET contains a weak/default value. Generate a cryptographically secure secret.');
    }

    if (value.BYPASS_AUTH === 'true') {
      violations.push('BYPASS_AUTH must not be "true" in production');
    }

    if (value.ADMIN_PASSWORD && ['admin123', 'password', '123456'].includes(value.ADMIN_PASSWORD)) {
      violations.push('ADMIN_PASSWORD contains a weak default value');
    }

    if (violations.length > 0) {
      const msgs = violations.map((v) => `  ✗ ${v}`).join('\n');
      console.error(`\n[PRODUCTION SECURITY VIOLATIONS]\n${msgs}\n`);
      process.exit(1);
    }
  }

  return value;
}

module.exports = validateEnv;
