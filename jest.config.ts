import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest/utils';

// TODO: Investigate why this happens.
// Jest throws 'Error: Jest: Failed to parse the TypeScript config file [...]'
// if we use `import` directly.

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { compilerOptions } = require('./src/tsconfig.json');

const config: Config.InitialOptions = {
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'src/Serenity.ts',
		'src/core/SerenityClient.ts',
		'src/lib/setup/*',
		'src/lib/utils/decorators.ts',
		'src/lib/utils/version.ts',
		'src/lib/utils/logger.ts',
		'src/core/components/*',
	],
	displayName: 'unit test',
	preset: 'ts-jest',
	testEnvironment: 'node',
	testRunner: 'jest-circus/runner',
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' }),
	globals: {
		'ts-jest': { tsconfig: '<rootDir>/tests/tsconfig.json' },
	},
};

export default config;
