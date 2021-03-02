import { getConfigOrThrow } from './get-config';

const config = getConfigOrThrow();

/**
 * Whether the bot is running in production.
 */
export const PRODUCTION = config.production;

/**
 * Postgres user to connect with.
 */
export const POSTGRES_USER = config.postgres_user;

/**
 * Password of the Postgres user to connect with.
 */
export const POSTGRES_PASSWORD = config.postgres_password;

/**
 * Postgres database name to use.
 */
export const POSTGRES_DB = config.postgres_db;

/**
 * Postgres hostname to use.
 */
export const POSTGRES_HOST = config.postgres_host;

/**
 * Postgres port number to use.
 */
export const POSTGRES_PORT = config.postgres_port;

/**
 * List of owner IDs.
 */
export const OWNER_IDS = config.owner_ids;

/**
 * List of prefixes that will trigger the bot.
 */
export const PREFIXES = config.prefixes;

/**
 * List of natural language prefixes for the bot.
 */
export const NLP_PREFIXES = config.nlp_prefixes;

/**
 * Discord token to connect with.
 */
export const DISCORD_TOKEN = config.discord_token;

/**
 * A list of activity entries to rotate through at different times of the day.
 */
export const ACTIVITY_ROTATION = config.activity_rotation;

/**
 * The interval at which new activities will be polled for the activity rotation.
 *
 * @default 300_000 // 5 minutes
 */
export const ACTIVITY_ROTATION_INTERVAL = config.activity_rotation_interval;
