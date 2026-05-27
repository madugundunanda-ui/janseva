/**
 * Express validation middleware factory.
 *
 * Usage in routes:
 *   const { validate } = require('../middleware/validate');
 *   const { loginSchema } = require('../validators');
 *   router.post('/login', validate(loginSchema), controller.login);
 */

const AppError = require('../utils/AppError');

/**
 * Returns Express middleware that validates req[source] against a Joi schema.
 *
 * @param {Joi.ObjectSchema} schema  — Joi schema to validate against
 * @param {'body'|'query'|'params'} source — which part of the request to validate
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const data = req[source];
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: false,
    allowUnknown: source === 'query', // allow extra query params
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Replace source with validated (and optionally coerced) values
  req[source] = value;
  next();
};

module.exports = { validate };
