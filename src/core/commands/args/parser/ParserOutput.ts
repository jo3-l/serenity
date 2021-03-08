/**
 * The code here is heavily inspired by 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */

import type { Token } from '../tokens';

/**
 * Output of the parser.
 */
export interface ParserOutput {
	/**
	 * A list of ordered arguments, in the order they were provided.
	 */
	ordered: Token[];

	/**
	 * The parsed options.
	 */
	flags: Set<string>;

	/**
	 * The parsed options mapped to their value.
	 */
	options: Map<string, string[]>;
}

/**
 * Creates an empty parser output.
 */
export const emptyOutput = (): ParserOutput => ({ ordered: [], flags: new Set(), options: new Map() });
