import type { Constructor } from '#lib/types/shared';

import type { Component } from '../Component';
import type { ComponentHandler } from '../ComponentHandler';

/**
 * A loader strategy interface.
 */
export interface LoaderStrategy<T extends Component> {
	/**
	 * Checks whether a certain file should be loaded.
	 *
	 * @param filepath - Filepath to check.
	 * @returns Whether the file should be loaded.
	 */
	filter(filepath: string): boolean;

	/**
	 * Loads a file. The return value of this function is then passed on to
	 * `resolve()`.
	 *
	 * @param filepath - File to load.
	 * @returns Either the loaded value, or a promise resolving to the loaded
	 * value.
	 */
	load(filepath: string): unknown;

	/**
	 * Resolves components from a value.
	 *
	 * @param handler - Handler which is loading this component.
	 * @param value - Value to resolve components from.
	 * @returns An iterator over the resolved components.
	 */
	resolve(handler: ComponentHandler<T>, value: unknown): IterableIterator<Constructor<T>>;

	/**
	 * Unloads a file.
	 *
	 * @param filepath - Filepath to unload.
	 */
	unload?(filepath: string): void;
}
