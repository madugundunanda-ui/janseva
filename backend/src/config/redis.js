const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisAvailable = false;
let useMemoryFallback = process.env.CACHE_PROVIDER === 'memory';

// Simple in-memory map for fallback
const memoryCache = new Map();

const initRedis = () => {
  if (useMemoryFallback) {
    logger.info('[Redis Config] CACHE_PROVIDER is set to memory. Using Memory Cache Service.');
    return;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('[Redis Config] Max connection retries reached. Switching to Memory Fallback.');
          isRedisAvailable = false;
          useMemoryFallback = true;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('[Redis Config] Successfully connected to Redis');
      isRedisAvailable = true;
      useMemoryFallback = false;
    });

    redisClient.on('error', (err) => {
      if (isRedisAvailable) {
        logger.error('[Redis Config] Connection error', { error: err.message });
        isRedisAvailable = false;
      }
    });

    redisClient.on('end', () => {
      logger.warn('[Redis Config] Connection closed');
      isRedisAvailable = false;
    });

  } catch (err) {
    logger.error('[Redis Config] Initialization failed, using Memory Fallback', { error: err.message });
    useMemoryFallback = true;
    isRedisAvailable = false;
  }
};

const getClient = () => redisClient;

const getIsRedisAvailable = () => isRedisAvailable && !useMemoryFallback;

// Wrapper methods
const get = async (key) => {
  if (getIsRedisAvailable() && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      logger.warn('[Redis Config] get operation failed, falling back to memory', { key });
    }
  }
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const set = async (key, value, ttlSeconds) => {
  if (getIsRedisAvailable() && redisClient) {
    try {
      if (ttlSeconds) {
        await redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, value);
      }
      return;
    } catch (err) {
      logger.warn('[Redis Config] set operation failed, falling back to memory', { key });
    }
  }
  
  const entry = { value };
  if (ttlSeconds) {
    entry.expiresAt = Date.now() + (ttlSeconds * 1000);
  }
  memoryCache.set(key, entry);
};

const del = async (key) => {
  if (getIsRedisAvailable() && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      logger.warn('[Redis Config] del operation failed, falling back to memory', { key });
    }
  }
  memoryCache.delete(key);
};

const scanAndDelete = async (pattern) => {
  if (getIsRedisAvailable() && redisClient) {
    try {
      let cursor = '0';
      do {
        const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
      return;
    } catch (err) {
      logger.warn('[Redis Config] scanAndDelete operation failed, falling back to memory', { pattern });
    }
  }
  
  // Memory cache fallback deletion by pattern
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};

module.exports = {
  initRedis,
  getClient,
  getIsRedisAvailable,
  get,
  set,
  del,
  scanAndDelete
};
