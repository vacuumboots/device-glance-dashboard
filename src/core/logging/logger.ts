/*
 Lightweight logger usable in both renderer and main (Node) contexts.
 - Levels: debug < info < warn < error
 - Default threshold: 
   - 'debug' in development
   - 'info' in production
   - 'warn' in test (to keep output quiet)
 - Safe JSON serialization for objects
*/

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function detectThreshold(): LogLevel {
  const env = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';
  // Vitest/JSDOM test runs: keep quiet unless warn/error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTest = (typeof process !== 'undefined' && (process as any).env && (process as any).env.VITEST) || env === 'test';
  if (isTest) return 'warn';
  if (env === 'production') return 'info';
  return 'debug';
}

const threshold: LogLevel = detectThreshold();

function isEnabled(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[threshold];
}

function safeSerialize(value: unknown): string {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, (_k, v) => (v instanceof Error ? { message: v.message, stack: v.stack, name: v.name } : v));
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

export interface Logger {
  level(): LogLevel;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (context: Record<string, unknown>) => Logger;
}

function baseLog(prefix: string | undefined, level: LogLevel, args: unknown[]) {
  if (!isEnabled(level)) return;
  const tag = prefix ? `[${prefix}]` : '';
  const message = args
    .map((a) => (typeof a === 'string' ? a : safeSerialize(a)))
    .join(' ');
  // Use console methods which exist in both Node and browser
  // eslint-disable-next-line no-console
  (console[level] || console.log)(tag ? `${tag} ${message}` : message);
}

export function createLogger(prefix?: string): Logger {
  const childFactory = (ctx: Record<string, unknown>) => {
    const ctxStr = safeSerialize(ctx);
    const p = prefix ? `${prefix} ${ctxStr}` : ctxStr;
    return createLogger(p);
  };
  return {
    level: () => threshold,
    debug: (...args: unknown[]) => baseLog(prefix, 'debug', args),
    info: (...args: unknown[]) => baseLog(prefix, 'info', args),
    warn: (...args: unknown[]) => baseLog(prefix, 'warn', args),
    error: (...args: unknown[]) => baseLog(prefix, 'error', args),
    child: childFactory,
  };
}

const logger = createLogger('app');
export default logger;
