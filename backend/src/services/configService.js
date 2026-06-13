const { getCache, setCache, TTL } = require('./cacheService');

/**
 * Shared Configuration Service (platform-config)
 * Centralizes access to environment variables and dynamic feature flags.
 * Sets the stage for future centralized config management.
 */
class ConfigService {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
  }

  /**
   * Get an environment variable with an optional default fallback.
   */
  get(key, defaultValue = null) {
    return process.env[key] !== undefined ? process.env[key] : defaultValue;
  }

  /**
   * Get a feature flag. In the future this might query a database or Redis.
   * For now, it queries Redis cache or defaults to env vars/hardcoded defaults.
   */
  async getFeatureFlag(flagName, defaultValue = false) {
    const cacheKey = `ff:${flagName}`;
    const cachedFlag = await getCache(cacheKey);
    
    if (cachedFlag !== null) {
      return cachedFlag;
    }

    // Default flags mapped from env
    const flags = {
      'auto_assign': this.get('FEATURE_AUTO_ASSIGN', 'true') === 'true',
      'ai_vision_enabled': this.get('FEATURE_AI_VISION', 'true') === 'true',
      'public_transparency': this.get('FEATURE_TRANSPARENCY', 'true') === 'true'
    };

    const flagValue = flags[flagName] !== undefined ? flags[flagName] : defaultValue;
    
    // Cache the flag value for 15 minutes
    await setCache(cacheKey, flagValue, TTL.ANALYTICS);

    return flagValue;
  }

  isProduction() {
    return this.env === 'production';
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isTest() {
    return this.env === 'test';
  }
}

module.exports = new ConfigService();
