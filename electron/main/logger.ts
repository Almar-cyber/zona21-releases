export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function getMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  const v = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  const min = getMinLevel();
  return levelOrder[level] >= levelOrder[min];
}

export function log(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (!shouldLog(level)) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level}] [${scope}]`;

  if (level === 'error') {
    console.error(prefix, message, data ?? '');
  } else if (level === 'warn') {
    console.warn(prefix, message, data ?? '');
  } else if (level === 'debug') {
    console.debug(prefix, message, data ?? '');
  } else {
    console.log(prefix, message, data ?? '');
  }
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) => log('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown) => log('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => log('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) => log('error', scope, message, data)
};
