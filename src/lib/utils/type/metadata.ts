import { types } from 'util';

// @ts-expect-error - `process.binding` exists.
const { getProxyDetails, getPromiseDetails, kPending } = process.binding('util');

/**
 * Symbol representing an unknown value.
 */
export const unknownValueSymbol: unique symbol = Symbol('UNKNOWN_VALUE');

/**
 * Gets the metadata of a value.
 *
 * @param value - Value to use.
 * @returns The metadata of the value.
 */
export function getMetadata(value: unknown): ValueMetadata {
	// We check for proxies first as their type may be anything (as they use the
	// same type as their target).
	if (types.isProxy(value)) {
		const [target] = getProxyDetails(value);
		return {
			kind: ValueKind.ContainerLike,
			value: target,
			typeName: 'Proxy',
		};
	}

	if (typeof value !== 'object') {
		const type = typeof value;
		return { kind: ValueKind.Simple, typeName: type === 'function' ? 'Function' : type };
	}

	if (value === null) return { kind: ValueKind.Simple, typeName: 'null' };
	if (value.constructor === Object) {
		const entries = Object.entries(value);
		return {
			kind: ValueKind.MapLike,
			entryIterator: entries[Symbol.iterator](),
			size: entries.length,
			typeName: 'Record',
			defaultType: 'object',
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- `constructor` may be overridden.
	const constructorName = value.constructor?.name as string | undefined;
	if (value instanceof Map) {
		return {
			kind: ValueKind.MapLike,
			entryIterator: value.entries(),
			size: value.size,
			typeName: constructorName ?? 'Map',
		};
	} else if (value instanceof Set) {
		return {
			kind: ValueKind.SequenceLike,
			valueIterator: value.values(),
			size: value.size,
			typeName: constructorName ?? 'Set',
		};
	} else if (Array.isArray(value)) {
		return {
			kind: ValueKind.SequenceLike,
			valueIterator: value.values(),
			size: value.length,
			typeName: constructorName ?? 'Array',
		};
	} else if (types.isPromise(value)) {
		const [state, result] = getPromiseDetails(value);
		return {
			kind: ValueKind.ContainerLike,
			value: state === kPending ? unknownValueSymbol : result,
			typeName: 'Promise',
		};
	}

	return {
		kind: ValueKind.Simple,
		typeName: constructorName ?? 'object',
	};
}

/**
 * The kind of a value.
 */
export const enum ValueKind {
	/**
	 * A basic value that is not generic.
	 */
	Simple,

	/**
	 * A container-like value with one type parameter (the type of its value).
	 */
	ContainerLike,

	/**
	 * A sequence-like value with one type parameter (the type of its values).
	 */
	SequenceLike,

	/**
	 * A map-like value with two type parameters (the type of its keys and
	 * values respectively).
	 */
	MapLike,
}

/**
 * Metadata for a value.
 */
export type ValueMetadata =
	| SimpleValueMetadata
	| ContainerLikeValueMetadata
	| SequenceLikeValueMetadata
	| MapLikeValueMetadata;

/**
 * Metadata for simple values.
 */
export interface SimpleValueMetadata {
	kind: ValueKind.Simple;
	typeName: string;
}

/**
 * Metadata for container-like values.
 */
export interface ContainerLikeValueMetadata {
	kind: ValueKind.ContainerLike;
	value: unknown;
	typeName: string;
	defaultType?: string;
}

/**
 * Metadata for sequence-like values.
 */
export interface SequenceLikeValueMetadata {
	kind: ValueKind.SequenceLike;
	valueIterator: IterableIterator<unknown>;
	size: number;
	typeName: string;
	defaultType?: string;
}

/**
 * Metadata for map-like values.
 */
export interface MapLikeValueMetadata {
	kind: ValueKind.MapLike;
	entryIterator: IterableIterator<[unknown, unknown]>;
	size: number;
	typeName: string;
	defaultType?: string;
}
