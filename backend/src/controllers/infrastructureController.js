const { getAllQueues } = require('../config/queues');
const redisConfig = require('../config/redis');
const mongoose = require('mongoose');

// Extremely basic mock for cache hits/misses, as real tracking requires a Redis wrapper or proxy
// In a production system, we'd query Redis info stats
const getCacheStats = async () => {
  if (!redisConfig.getIsRedisAvailable() || !redisConfig.getClient()) {
    return { hits: 0, misses: 0, hitRate: 0 };
  }
  
  try {
    const info = await redisConfig.getClient().info('stats');
    // Parse Redis INFO output
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    
    const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    return { hits, misses, hitRate: hitRate.toFixed(2) };
  } catch (err) {
    return { hits: 0, misses: 0, hitRate: 0 };
  }
};

const getInfrastructureMetrics = async (req, res) => {
  try {
    const queues = getAllQueues();
    const queueMetrics = {};

    for (const [name, queue] of Object.entries(queues)) {
      if (queue && typeof queue.getJobCounts === 'function') {
        const counts = await queue.getJobCounts();
        queueMetrics[name] = counts;
      } else {
        queueMetrics[name] = { status: 'unmanaged_fallback' };
      }
    }

    const cacheStats = await getCacheStats();

    res.status(200).json({
      success: true,
      data: {
        redis: {
          status: redisConfig.getIsRedisAvailable() ? 'connected' : 'disconnected_fallback',
          cacheStats
        },
        queues: queueMetrics,
        database: {
          // As we use a Single Mongo Cluster for now, there's only one connection state
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          host: mongoose.connection.host,
          name: mongoose.connection.name
        },
        workers: {
          aiWorker: redisConfig.getIsRedisAvailable() ? 'active' : 'fallback'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch infrastructure metrics',
      error: error.message
    });
  }
};

module.exports = {
  getInfrastructureMetrics
};
