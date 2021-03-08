/**
 * The code here is heavily inspired by 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */

import type { Token } from '../tokens';
import type { ParserOutput } from './ParserOutput';
import { emptyOutput } from './ParserOutput';

/**
 * Separates a list of tokens into flags, option flags, and ordered arguments.
 */
export abstract class Parser
	implements IterableIterator<ParserOutput>, Iterator<ParserOutput, undefined, ParserOutput | undefined> {
	protected input: Token[] = [];
	protected position = 0;

	/**
	 * Sets the input to use.
	 * This will reset the parser.
	 *
	 * @param input - Input to use.
	 * @returns The parser.
	 */
	public setInput(input: Token[]) {
		this.reset();
		this.input = input;
		return this;
	}

	/**
	 * Whether the parser is done with the input.
	 */
	public get done() {
		return this.position >= this.input.length;
	}

	/**
	 * Resets the parser position.
	 *
	 * @returns The parser.
	 */
	public reset() {
		this.position = 0;
	}

	/**
	 * Runs the parser.
	 *
	 * @returns The parser output.
	 */
	public parse() {
		const output = emptyOutput();
		let result = this.next(output);
		while (!result.done) result = this.next(output);

		return output;
	}

	/**
	 * Gets the next parsed output.
	 * If a parser output is passed in, it will be mutated, otherwise a new one is made.
	 *
	 * @param output - Output to mutate.
	 * @returns An iterator result containing parser output.
	 */
	public abstract next(output?: ParserOutput): IteratorResult<ParserOutput, undefined>;

	public [Symbol.iterator]() {
		return this;
	}

	/**
	 * Advances the parser position by some number.
	 *
	 * @param n - Number of positions to advance.
	 */
	protected advance(n: number) {
		this.position += n;
	}
}
