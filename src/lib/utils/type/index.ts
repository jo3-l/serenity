import { getMetadata, unknownValueSymbol, ValueKind } from './metadata';

/**
 * Inspects the value and returns a stringified representation of its type.
 *
 * @param value - Value to inspect.
 * @param options - Options to use.
 * @returns The stringified type of the value.
 */
export function inspectTypeOf(
	value: unknown,
	{ depth, maxMapLikeSize = 200, maxSequenceLikeSize = 200, maxUnionConstituents = 3 }: TypeInspectionOptions,
): string {
	if (value === unknownValueSymbol) return 'unknown';

	const options = { depth: depth - 1, maxMapLikeSize, maxSequenceLikeSize, maxUnionConstituents };
	const metadata = getMetadata(value);

	if (metadata.kind === ValueKind.Simple) return metadata.typeName;
	if (metadata.kind === ValueKind.ContainerLike) {
		if (depth === 0) return `${metadata.typeName}<unknown>`;

		const valueType = inspectTypeOf(metadata.value, options);
		return `${metadata.typeName}<${valueType}>`;
	}
	if (metadata.kind === ValueKind.SequenceLike) {
		// If one of the following conditions hold:
		// 1) We're at the max depth
		// 2) The sequence's length is greater than the max number of elements we should iterate through
		// 3) The sequence is empty
		if (depth === 0 || metadata.size > maxSequenceLikeSize || metadata.size === 0) {
			// Then return a default type.
			return metadata.defaultType ?? `${metadata.typeName}<unknown>`;
		}

		const valueTypes = new Set<string>();
		for (const value of metadata.valueIterator) {
			const valueType = inspectTypeOf(value, options);
			valueTypes.add(valueType);

			if (valueTypes.size > maxUnionConstituents) break;
		}

		if (valueTypes.size > maxUnionConstituents) return metadata.defaultType ?? `${metadata.typeName}<unknown>`;

		const stringifiedValueTypes = [...valueTypes].sort().join(' | ');
		return `${metadata.typeName}<${stringifiedValueTypes}>`;
	}

	// If one of the following conditions hold:
	// 1) We're at the max depth
	// 2) The map's size is greater than the max number of elements we should iterate through
	// 3) The mpa is empty
	if (depth === 0 || metadata.size > maxMapLikeSize || metadata.size === 0) {
		// Then return a default type.
		return metadata.defaultType ?? `${metadata.typeName}<unknown, unknown>`;
	}

	const keyTypes = new Set<string>();
	const valueTypes = new Set<string>();

	let areKeyTypesValid = true;
	let areValueTypesValid = true;

	for (const [key, value] of metadata.entryIterator) {
		/* istanbul ignore else */
		if (areKeyTypesValid) {
			const keyType = inspectTypeOf(key, options);
			keyTypes.add(keyType);
		}
		/* istanbul ignore else */
		if (areValueTypesValid) {
			const valueType = inspectTypeOf(value, options);
			valueTypes.add(valueType);
		}

		// Check if the number of constituents of the key / value types
		// union is over the limit.
		if (areKeyTypesValid && keyTypes.size > maxUnionConstituents) areKeyTypesValid = false;
		if (areValueTypesValid && valueTypes.size > maxUnionConstituents) areValueTypesValid = false;

		// If both are invalid, return a default type.
		if (!areKeyTypesValid && !areValueTypesValid) {
			return metadata.defaultType ?? `${metadata.typeName}<unknown, unknown>`;
		}
	}

	const stringifiedKeyTypes = areKeyTypesValid ? [...keyTypes].sort().join(' | ') : 'unknown';
	const stringifiedValueTypes = areValueTypesValid ? [...valueTypes].sort().join(' | ') : 'unknown';
	return `${metadata.typeName}<${stringifiedKeyTypes}, ${stringifiedValueTypes}>`;
}

/**
 * Options for inspecting types.
 */
export interface TypeInspectionOptions {
	/**
	 * The maximum depth of recursion when inspecting types.
	 */
	depth: number;

	/**
	 * The maximum number of entries in a map-like value that will be considered
	 * before the types of its keys and values are truncated to `unknown`.
	 *
	 * @default 200
	 */
	maxMapLikeSize?: number;

	/**
	 * The maximum number of entries in a sequence-like value that will be
	 * considered before the types of its values are truncated to `unknown`.
	 *
	 * @default 200
	 */
	maxSequenceLikeSize?: number;

	/**
	 * The maximum constituents of a union that are permitted before its type is
	 * truncated to `unknown`.
	 *
	 * @default 3
	 */
	maxUnionConstituents?: number;
}
