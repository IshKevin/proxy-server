import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).optional(),
  PROXY_PORT: z.string().transform(Number).default('5432'),
  HTTP_PORT: z.string().transform(Number).default('3000'),
  SUPABASE_HOST: z.string(),
  SUPABASE_PORT: z.string().transform(Number).default('6543'),
  CONNECTION_TIMEOUT: z.string().transform(Number).default('30000'),
  IDLE_TIMEOUT: z.string().transform(Number).default('300000'),
  MAX_CONNECTIONS: z.string().transform(Number).default('100'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('true'),
  METRICS_INTERVAL: z.string().transform(Number).default('60000'),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,

  proxy: {
    port: env.PORT || env.PROXY_PORT,
  },

  http: {
    port: env.PORT || env.HTTP_PORT,
  },

  supabase: {
    host: env.SUPABASE_HOST,
    port: env.SUPABASE_PORT,
  },

  connection: {
    timeout: env.CONNECTION_TIMEOUT,
    idleTimeout: env.IDLE_TIMEOUT,
    maxConnections: env.MAX_CONNECTIONS,
  },

  logging: {
    level: env.LOG_LEVEL,
  },

  metrics: {
    enabled: env.ENABLE_METRICS,
    interval: env.METRICS_INTERVAL,
  },
} as const;