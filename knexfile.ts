import { POSTGRES_DB, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_USER } from '#lib/setup/config';

import type { Knex } from 'knex';

const config: Knex.Config = {
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
		loadExtensions: ['.js'],
	},
};

export default config;
