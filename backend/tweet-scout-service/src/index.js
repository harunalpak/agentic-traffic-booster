import dotenv from 'dotenv';
import logger from './utils/logger.js';
import './scheduler/scoutScheduler.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'KAFKA_BROKERS',
  'CAMPAIGN_SERVICE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Log startup
logger.info('========================================');
logger.info('🚀 Tweet Scout Service Starting');
logger.info('========================================');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Kafka Brokers: ${process.env.KAFKA_BROKERS}`);
logger.info(`Campaign Service: ${process.env.CAMPAIGN_SERVICE_URL}`);
logger.info(`Scrape Interval: ${process.env.SCRAPE_INTERVAL_MINUTES || 30} minutes`);
logger.info('========================================');

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

logger.info('✅ Tweet Scout Service is running');
logger.info('📡 Scheduler is active - waiting for next execution');
