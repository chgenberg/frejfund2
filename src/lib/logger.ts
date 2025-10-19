type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function getRequestId(): string | undefined {
  if (typeof window === 'undefined') return (global as any).__ff_request_id;
  return (window as any).__ff_request_id;
}

export function setRequestId(id: string) {
  if (typeof window === 'undefined') (global as any).__ff_request_id = id;
  else (window as any).__ff_request_id = id;
}

export function log(level: LogLevel, message: string, extra?: Record<string, any>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: getRequestId(),
    ...extra,
  };
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  } catch {
    // fallback
    // eslint-disable-next-line no-console
    console.log(`[${level}] ${message}`);
  }
}

export const logger = {
  info: (message: string, extra?: Record<string, any>) => log('info', message, extra),
  warn: (message: string, extra?: Record<string, any>) => log('warn', message, extra),
  error: (message: string, extra?: Record<string, any>) => log('error', message, extra),
  debug: (message: string, extra?: Record<string, any>) => log('debug', message, extra),
};
