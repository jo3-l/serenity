import { POSTGRES_DB, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_USER } from './src/lib/setup/config';

import type { Config } from 'knex';
import { extname } from 'path';

// If the Knex configuration file used had a `.js` extension, then that implies
// we've likely transpiled the migration files to JavaScript as well, so attempt
// to run JavaScript migration files. Otherwise, default to running TypeScript
// migration files with `ts-node`.
const migrationsExt = extname(__dirname) === 'js' ? '.js' : '.ts';

const config: Config = {
	client: 'postgresql',
	// TODO
	connection: {
		user: POSTGRES_USER,
		database: POSTGRES_DB,
		password: POSTGRES_PASSWORD,
		port: POSTGRES_PORT,
		host: POSTGRES_HOST,
	},
	migrations: {
		stub: 'migrations/migration.stub',
		extension: 'ts',
		directory: 'migrations',
		loadExtensions: [migrationsExt],
	},
};

export default config;
