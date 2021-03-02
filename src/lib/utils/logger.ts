import { PRODUCTION } from '#lib/setup/config';

import pino from 'pino';

const logLevel = PRODUCTION ? 'info' : 'debug';
export const logger = pino({ level: logLevel, enabled: !process.env.TESTING });
