/**
 * The code here is heavily inspired by 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */

/**
 * Output from the parser. Includes several convenience methods for accessing
 * data from it.
 */
export class ParserOutput {
	/**
	 * A set of flag names in the input.
	 */
	public readonly flags = new Set<string>();

	/**
	 * A map of option flag name to its values.
	 */
	public readonly optionFlags = new Map<string, string[]>();

	/**
	 * A list of positional arguments, in the order they were provided.
	 */
	public readonly unordered: string[] = [];
}
