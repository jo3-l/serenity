import { isClass, isObject, isSubclassOf } from '#utils/predicates';

import type { Component } from '../Component';
import type { ComponentHandler } from '../ComponentHandler';
import type { LoaderStrategy } from './LoaderStrategy';

import { extname } from 'path';

/**
 * A loader strategy that uses the CommonJS module system, supporting multiple
 * default and named exports in addition to hot-reloading.
 */
export class CommonJsLoaderStrategy<T extends Component> implements LoaderStrategy<T> {
	private readonly supportedExtensions = new Set(['.js', '.ts']);

	public filter(filepath: string) {
		const extension = extname(filepath);
		return this.supportedExtensions.has(extension);
	}

	public load(filepath: string) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
		const mod = require(filepath);
		return mod;
	}

	public *resolve(handler: ComponentHandler<T>, value: unknown) {
		// Handle `module.exports` / `export =`.
		if (isClass(value) && isSubclassOf(value, handler.classType)) yield value;

		// Handle named exports, including default exports.
		if (!isObject(value)) return;
		for (const namedExport of Object.values(value)) {
			if (isClass(namedExport) && isSubclassOf(namedExport, handler.classType)) yield namedExport;
		}
	}

	public unload(filepath: string) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete require.cache[require.resolve(filepath)];
	}
}
