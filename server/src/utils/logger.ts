import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
// On Vercel the function is bundled, and pino's worker-thread transports
// (pino-pretty) don't survive bundling — they throw at init. Always log plain
// JSON to stdout there; Vercel captures it. pretty output stays for local dev.
const isServerless = !!process.env.VERCEL;
const usePretty = !isProduction && !isServerless;

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: usePretty ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
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
