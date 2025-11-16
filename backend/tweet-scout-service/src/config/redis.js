import Redis from 'ioredis';
import logger from '../utils/logger.js';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;

/**
 * Redis client instance
 */
let redisClient = null;

/**
 * Initialize Redis client
 * @returns {Promise<Redis>}
 */
export async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    logger.info(`📡 Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);
    
    redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready');
    });

    redisClient.on('error', (error) => {
      logger.error({ error: error.message }, '❌ Redis error');
    });

    redisClient.on('close', () => {
      logger.warn('⚠️  Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
    
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to connect to Redis');
    throw error;
  }
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
  process.exit(0);
});

export default { getRedisClient, disconnectRedis };

