import cors from 'cors';
import { config } from '../config/environment';

export const corsMiddleware = cors({
  origin: config.nodeEnv === 'production' ? false : '*',
  credentials: true,
});