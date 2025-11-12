import { Kafka, logLevel } from 'kafkajs';
import logger from '../utils/logger.js';

// Parse Kafka brokers from environment
const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

// Create Kafka instance
export const kafka = new Kafka({
  clientId: 'tweet-scout-service',
  brokers: brokers,
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 5
  }
});

// Kafka topics
export const TOPICS = {
  NEW_TWEETS: 'new_tweets',
  DEAD_LETTER: 'dead_letter'
};

// Create producer
let producer = null;

export async function getProducer() {
  if (!producer) {
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });
    
    await producer.connect();
    logger.info('✅ Kafka producer connected');
  }
  
  return producer;
}

// Graceful shutdown
export async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  }
}

// Handle process termination
process.on('SIGTERM', disconnectProducer);
process.on('SIGINT', disconnectProducer);
