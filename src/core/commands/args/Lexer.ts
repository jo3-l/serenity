import type { Token } from './tokens';

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

	public next(): IteratorResult<Token> {
		if (this.done) return { done: true, value: undefined };

		const char = this.input[this.position];
		const isMaybeQuoted =
			this.quotes.size && // Has quotes registered
			!this.isLastCharacter && // Not the last character
			this.quotes.has(char); // Current character is an open quote.

		if (isMaybeQuoted) {
			const startPosition = this.position;
			const closeQuote = this.quotes.get(char)!;

			// Skip past the open quote.
			this.advance(1);

			const token = this.nextQuoted(char, closeQuote);
			if (token) return { done: false, value: token };

			// Backtrack to the start position, as we were unable to match a
			// quoted string.
			this.position = startPosition;
		}

		return { done: false, value: this.nextWord() };
	}

	private nextQuoted(openQuote: string, closeQuote: string) {
		let raw = '';
		let value = '';
		while (!this.done) {
			const char = this.input[this.position];
			if (char === closeQuote) {
				// Skip past the close quote.
				this.advance(1);
				const trailing = this.consumingLeadingWhiteSpace();
				return { value, raw: openQuote + raw + closeQuote, trailing };
			}

			if (char === '\\' && !this.isLastCharacter) {
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

		return undefined;
	}

	private nextWord() {
		let raw = '';
		let value = '';
		while (!this.done) {
			const char = this.input[this.position];
			if (isWhiteSpace(getCode(char))) {
				const trailing = this.consumingLeadingWhiteSpace();
				return { value, raw, trailing };
			}

			if (char === '\\' && !this.isLastCharacter) {
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

		return { value, raw, trailing: '' };
	}

	private consumingLeadingWhiteSpace() {
		let result = '';
		while (!this.done) {
			const char = this.input[this.position];
			if (!isWhiteSpace(getCode(char))) return result;

			result += char;
			this.advance(1);
		}

		return result;
	}

	private advance(n: number) {
		this.position += n;
	}

	private get isLastCharacter() {
		return this.position === this.input.length - 1;
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
