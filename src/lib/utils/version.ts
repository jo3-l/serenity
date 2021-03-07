import { readFileSync } from 'fs';
import { join } from 'path';

const packageJsonPath = join(__dirname, '..', '..', '..', 'package.json');

function getVersion(): string {
	const fileContents = readFileSync(packageJsonPath, { encoding: 'utf8' });
	return JSON.parse(fileContents).version;
}

/**
 * Current version of the bot, as defined in `package.json`.
 */
export const VERSION = getVersion();
