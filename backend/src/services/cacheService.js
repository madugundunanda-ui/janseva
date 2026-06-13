const redisConfig = require('../config/redis');

const TTL = {
  GOVERNMENT_UPDATE: 30 * 60, // 30 minutes
  ANALYTICS: 15 * 60,         // 15 minutes
  TRANSPARENCY: 10 * 60,      // 10 minutes
  HOTSPOTS: 15 * 60,          // 15 minutes
  AI_RESULTS: 24 * 60 * 60,   // 24 hours
};

const getCache = async (key) => {
  try {
    const data = await redisConfig.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
};

const setCache = async (key, data, ttlSeconds) => {
  try {
    const stringified = JSON.stringify(data);
    await redisConfig.set(key, stringified, ttlSeconds);
  } catch (err) {
    // Ignore cache write failures
  }
};

const invalidateCache = async (key) => {
  await redisConfig.del(key);
};

const invalidateByPattern = async (pattern) => {
  await redisConfig.scanAndDelete(pattern);
};

module.exports = {
  TTL,
  getCache,
  setCache,
  invalidateCache,
  invalidateByPattern
};
