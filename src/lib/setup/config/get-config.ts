import { configSchema } from './schemas';

import { readFileSync } from 'fs';
import YAML from 'js-yaml';
import { join } from 'path';

/**
 * File path of the config file.
 */
export const configFilePath = join(__dirname, '..', '..', '..', 'config.yml');

/**
 * Retrieves and parses the YAML document from the config file path provided.
 *
 * @throws If there was an issue reading the file, parsing the YAML, or if the
 * object did not match the configuration schema.
 *
 * @param filepath - Filepath to read from. Uses `configFilePath` by
 * default.
 * @returns The parsed configuration.
 */
export function getConfigOrThrow(filepath = configFilePath) {
	let fileContent!: string;
	try {
		fileContent = readFileSync(filepath, { encoding: 'utf8' });
	} catch (error) {
		if (error.code === 'ENOENT') throw new Error('Could not find the configuration file.');
		throw new Error('Unknown error occurred when attempting to read the configuration file.');
	}

	let document!: unknown;
	try {
		document = YAML.load(fileContent);
	} catch (error) {
		throw new Error('Error parsing YAML file.');
	}

	return configSchema.collectErrors().parse(document);
}
