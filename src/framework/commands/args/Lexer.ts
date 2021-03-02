/**
 * The code here is heavily inspired by 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */
import { getCode, isWhiteSpace } from '@skyra/char';

/**
 * Parses input into lists of tokens.
 */
export class Lexer implements IterableIterator<Token> {
	private input = '';
	private position = 0;
	private readonly quotes = new Map<string, string>();
	private readonly closeQuotes = new Set<string>();

	/**
	 * Sets the input to use. This will reset the lexer.
	 *
	 * @param input - Input to use.
	 * @returns The lexer.
	 */
	public setInput(input: string) {
		this.input = input.trimLeft();
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
		for (const [open, close] of quotes) {
			this.quotes.set(open, close);
			this.closeQuotes.add(close);
		}
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

	public next() {
		if (this.done) return { done: true as const, value: undefined };
		if (!this.quotes.size) return { done: false, value: this.nextTokenNoQuotes() };

		const firstChar = this.input[this.position];
		// If this is the last character, it cannot be a quoted phrase, so we
		// can simply construct a token with the value being the next character.
		if (this.position === this.input.length - 1) {
			this.advance(1);
			const token = { value: firstChar, raw: firstChar, trailing: '' };
			return { done: false, value: token };
		}

		// Store the initial position in case we need to backtrack later.
		const initialPosition = this.position;

		// See if the first character is an open quote.
		const closeQuote = this.quotes.get(firstChar);
		if (!closeQuote) return { done: false, value: this.nextTokenNoQuotes() };

		// Skip past the first quote.
		this.advance(1);

		let buffer = '';
		let raw = '';
		// Try parsing the next token as a quoted string.
		while (!this.done) {
			const char = this.input[this.position];
			// If the current character is the matching closing quote, end the
			// token here.
			if (char === closeQuote) {
				this.advance(1);
				const trailing = this.consumeLeadingSpaces();
				const token = { value: buffer, raw: firstChar + raw + closeQuote, trailing };
				return { done: false, value: token };
			}

			const nextChar = this.peek();
			if (char === '\\' && nextChar) {
				// A backslash + a close quote resolves to just the close quote.
				if (this.closeQuotes.has(nextChar)) buffer += nextChar;
				// Two backslashes in a row resolves to a single backslash.
				else if (nextChar === '\\') buffer += '\\';
				// Otherwise, the backslash is interpreted literally.
				else buffer += `\\${nextChar}`;

				raw += `\\${nextChar}`;
				// Skip past the backslash + next character.
				this.advance(2);
			} else {
				buffer += char;
				raw += char;
				this.advance(1);
			}
		}

		// If we reached the end of input without finding a close quote, this
		// isn't actually a valid quoted phrase, so we will have to backtrack to
		// the initial position and match a phrase ignoring quotes.
		this.position = initialPosition;
		return { done: false, value: this.nextTokenNoQuotes() };
	}

	public [Symbol.iterator]() {
		return this;
	}

	/**
	 * Runs the lexer.
	 *
	 * @returns All the tokens lexed.
	 */
	public lex() {
		return [...this];
	}

	private nextTokenNoQuotes(): Token {
		let buffer = '';
		let raw = '';
		while (!this.done) {
			const char = this.input[this.position];
			// If the current character is a whitespace character, end the token
			// here.
			if (isWhiteSpace(getCode(char))) {
				const trailing = this.consumeLeadingSpaces();
				return { value: buffer, raw, trailing };
			}

			const nextChar = this.peek();
			// If the current character is a backslash and there is a character
			// after it...
			if (char === '\\' && nextChar) {
				// A backslash + a close quote resolves to just the close quote.
				if (this.closeQuotes.has(nextChar)) buffer += nextChar;
				// Two backslashes in a row resolves to a single backslash.
				else if (nextChar === '\\') buffer += '\\';
				// Otherwise, the backslash is interpreted literally.
				else buffer += `\\${nextChar}`;

				raw += `\\${nextChar}`;
				// Skip past the backslash + current character.
				this.advance(2);
			} else {
				buffer += char;
				raw += char;
				this.advance(1);
			}
		}

		return { value: buffer, raw, trailing: '' };
	}

	private advance(n: number) {
		this.position += n;
	}

	private consumeLeadingSpaces() {
		let spaces = '';
		while (!this.done) {
			const char = this.input[this.position];
			if (!isWhiteSpace(getCode(char))) return spaces;
			spaces += char;

			this.advance(1);
		}

		return spaces;
	}

	private peek() {
		if (this.position + 1 >= this.input.length) return undefined;
		return this.input[this.position + 1];
	}
}

/**
 * A single token.
 */
export interface Token {
	/**
	 * Resolved value of the token.
	 *
	 * @remarks
	 * This will not contain trailing spaces. If the original value was wrapped
	 * in a set of quotes, and the quotes match those set in the Lexer, they
	 * will be stripped.
	 */
	value: string;

	/**
	 * Raw value of the token.
	 *
	 * @remarks
	 * This will not contain trailing spaces, but will contain quotes.
	 */
	raw: string;

	/**
	 * Trailing spaces after this token.
	 *
	 * @remarks
	 * This will be the empty string `''` if there were no trailing spaces.
	 */
	trailing: string;
}

/**
 * A pair of open and close quotes.
 *
 * @remarks
 * It is expected that the open and close quotes are both one UTF-16 code unit
 * in length and are not whitespace characters or the backslash character (`\`).
 */
export type QuotePair = [open: string, close: string];
