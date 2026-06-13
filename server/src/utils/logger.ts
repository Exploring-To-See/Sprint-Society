import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  redact: {
    paths: ['req.headers.authorization', 'password', 'password_hash', 'token', 'credential'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      requestId: req.id,
    }),
    err: pino.stdSerializers.err,
  },
});

export function createRequestLogger() {
  let counter = 0;
  return (req: any, _res: any, next: any) => {
    req.id = `req-${Date.now().toString(36)}-${(++counter).toString(36)}`;
    req.log = logger.child({ requestId: req.id });
    next();
  };
}

export default logger;
