import pino from 'pino';

// Check if emojis should be disabled (useful for Windows PowerShell)
const DISABLE_EMOJIS = process.env.DISABLE_EMOJIS === 'true';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// Emoji regex to strip emojis if needed
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

function stripEmojis(text) {
  if (!DISABLE_EMOJIS) return text;
  return text.replace(emojiRegex, '').replace(/\s+/g, ' ').trim();
}

// Wrap logger methods to strip emojis if needed
const logger = {
  info: (msg, ...args) => baseLogger.info(typeof msg === 'string' ? stripEmojis(msg) : msg, ...args),
  warn: (msg, ...args) => baseLogger.warn(typeof msg === 'string' ? stripEmojis(msg) : msg, ...args),
  error: (msg, ...args) => baseLogger.error(typeof msg === 'string' ? stripEmojis(msg) : msg, ...args),
  debug: (msg, ...args) => baseLogger.debug(typeof msg === 'string' ? stripEmojis(msg) : msg, ...args),
  trace: (msg, ...args) => baseLogger.trace(typeof msg === 'string' ? stripEmojis(msg) : msg, ...args),
  fatal: (msg, ...args) => baseLogger.fatal(typeof msg === 'string' ? stripEmojis(msg) : msg, ...args)
};

export default logger;
