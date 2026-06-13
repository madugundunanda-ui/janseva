const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisConfig = require('../config/redis');
const logger = require('../utils/logger');

// Global rate limiter (Before Authentication)
// 200 requests per minute
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
  store: {
    // Dynamic store getter to support fallback
    get client() { return redisConfig.getClient() },
    prefix: 'rl:global:',
    // We implement a custom wrapper because the rate-limit-redis module requires a redis client.
    // However, if we want a memory fallback, rateLimit has an internal MemoryStore we could use.
    // Instead of completely customizing, we'll initialize rate-limit-redis if redis is available.
  }
});

// To properly support the fallback requirement, we define stores dynamically
const getStore = (prefix) => {
  if (redisConfig.getIsRedisAvailable() && redisConfig.getClient()) {
    return new RedisStore({
      sendCommand: (...args) => redisConfig.getClient().call(...args),
      prefix: prefix
    });
  }
  // Returns undefined to fall back to express-rate-limit's default memory store
  return undefined; 
};

const createGlobalLimiter = () => rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
  store: getStore('rl:global:')
});

const createAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Protect login endpoints from brute force
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
  store: getStore('rl:auth:')
});

// Role-based limits per minute (After Authentication)
const roleLimits = {
  citizen: 100,
  officer: 300,
  supervisor: 500,
  admin: 1000,
  default: 100
};

const roleBasedLimiter = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();

  const role = req.user?.role || 'default';
  const limit = roleLimits[role] || roleLimits.default;
  const ip = req.ip || req.connection.remoteAddress;
  const key = `rl:role:${role}:${ip}`;

  if (redisConfig.getIsRedisAvailable() && redisConfig.getClient()) {
    try {
      const client = redisConfig.getClient();
      const current = await client.incr(key);
      if (current === 1) {
        await client.expire(key, 60); // 1 minute window
      }

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));

      if (current > limit) {
        logger.warn(`Role-based rate limit exceeded for ${role} (IP: ${ip})`);
        return res.status(429).json({
          success: false,
          message: `Too many requests for role ${role}. Limit is ${limit} per minute.`
        });
      }
      return next();
    } catch (err) {
      // Fallback to in-memory check (very basic)
      logger.error('Redis rate limit failed, allowing request', { error: err.message });
      return next();
    }
  } else {
    // Memory fallback logic (rudimentary)
    const store = global.memoryRoleLimits || new Map();
    global.memoryRoleLimits = store;
    
    let record = store.get(key);
    const now = Date.now();
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + 60000 };
    }
    
    record.count++;
    store.set(key, record);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));

    if (record.count > limit) {
      logger.warn(`[Memory] Role-based rate limit exceeded for ${role} (IP: ${ip})`);
      return res.status(429).json({
        success: false,
        message: `Too many requests for role ${role}. Limit is ${limit} per minute.`
      });
    }

    // cleanup map periodically
    if (Math.random() < 0.05) {
      for (const [k, v] of store.entries()) {
        if (now > v.resetTime) store.delete(k);
      }
    }

    return next();
  }
};

module.exports = {
  createGlobalLimiter,
  createAuthLimiter,
  roleBasedLimiter
};
