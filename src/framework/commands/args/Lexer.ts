/**
 * The code here is heavily inspired by 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */
import type { Token } from './Token';

import { getCode, isWhiteSpace } from '@skyra/char';

/**
 * Parses input into lists of tokens.
 */
export class Lexer implements IterableIterator<Token> {
	private input = '';
	private position = 0;
	private readonly quotes = new Map<string, string>();

	/**
	 * Sets the input to use. This will reset the lexer.
	 *
	 * @param input - Input to use.
	 * @returns The lexer.
	 */
	public setInput(input: string) {
		this.input = input.trimLeft();
		this.reset();
		return this;
	}

	/**
	 * Sets the quotes to use.
	 *
	 * @remarks
	 * This can be done in the middle of lexing.
	 *
	 * @param quotes - List of pairs of open and close quotes.
	 * @returns The lexer.
	 */
	public setQuotes(quotes: QuotePair[]) {
		for (const [open, close] of quotes) this.quotes.set(open, close);
		return this;
	}

	/**
	 * Resets the position of the lexer.
	 *
	 * @returns The lexer.
	 */
	public reset() {
		this.position = 0;
		return this;
	}

	/**
	 * Whether the lexer is at the end of input.
	 */
	public get done() {
		return this.position >= this.input.length;
	}

	public lex() {
		return [...this];
	}

	public [Symbol.iterator]() {
		return this;
	}

	public next() {
		if (this.done) return { done: true as const, value: undefined };

		const char = this.input[this.position];
		const isMaybeQuoted =
			this.quotes.size && // Has quotes registered
			this.position !== this.input.length - 1 && // Not the last character
			this.quotes.has(char); // Current character is an open quote.

		if (isMaybeQuoted) {
			const startPosition = this.position;
			const closeQuote = this.quotes.get(char)!;

			// Skip past the open quote.
			this.advance(1);
			const result = this.consumeWhile((c) => c !== closeQuote, true);

			if (result) {
				const closeQuote = this.input[this.position];
				// Skip past the close quote.
				this.advance(1);
				const trailing = this.consumeWhile((c) => isWhiteSpace(getCode(c))).value;
				const token = { raw: char + result.raw + closeQuote, value: result.value, trailing };
				return { done: false, value: token };
			}

			// Backtrack to the start position, as we were unable to match a
			// quoted string.
			this.position = startPosition;
		}

		const result = this.consumeWhile((c) => !isWhiteSpace(getCode(c)));
		const trailing = this.consumeWhile((c) => isWhiteSpace(getCode(c))).value;
		const token = { ...result, trailing: trailing };
		return { done: false, value: token };
	}

	private consumeWhile(
		f: (char: string) => boolean,
		returnUndefinedOnEof: true,
	): { raw: string; value: string } | undefined;
	private consumeWhile(f: (char: string) => boolean, returnUndefinedOnEof?: false): { raw: string; value: string };
	private consumeWhile(f: (char: string) => boolean, returnUndefinedOnEof = false) {
		let raw = '';
		let value = '';
		while (!this.done) {
			const char = this.input[this.position];
			const ok = f(char);

			if (!ok) return { raw, value };

			const hasNext = this.position + 1 < this.input.length;
			if (char === '\\' && hasNext) {
				const nextChar = this.input[this.position + 1];

				// '\c' -> 'c' for any character 'c'.
				value += nextChar;
				raw += `\\${nextChar}`;

				this.advance(2);
				continue;
			}

			value += char;
			raw += char;
			this.advance(1);
		}

		if (returnUndefinedOnEof) return undefined;
		return { raw, value };
	}

	private advance(n: number) {
		this.position += n;
	}
}

/**
 * A pair of open and close quotes.
 *
 * @remarks
 * It is expected that the open and close quotes are both one UTF-16 code unit
 * in length and are not whitespace characters or the backslash character (`\`).
 */
export type QuotePair = [open: string, close: string];
