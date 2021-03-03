/**
 * The code here is heavily inspired by 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */

/**
 * Output of the parser. Includes several convenience methods for accessing data
 * from it.
 */
export class ParserOutput {
	/**
	 * The parsed options.
	 */
	public readonly flags = new Set<string>();

	/**
	 * The parsed options mapped to their value.
	 */
	public readonly options = new Map<string, string[]>();

	/**
	 * A list of positional arguments, in the order they were provided.
	 */
	public readonly ordered: string[] = [];
}
