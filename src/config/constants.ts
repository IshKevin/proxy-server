export const APP_NAME = 'PostgreSQL IPv6 Proxy';
export const APP_VERSION = '1.0.0';

export const HEALTH_CHECK_PATHS = {
  ROOT: '/',
  HEALTH: '/health',
  METRICS: '/metrics',
  READY: '/ready',
  LIVE: '/live',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const CONNECTION_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  CLOSED: 'closed',
  ERROR: 'error',
} as const;