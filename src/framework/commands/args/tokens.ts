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
 * Joins a list of tokens together, keeping the original raw values and trailing
 * spaces.
 *
 * @param tokens - List of tokens to join.
 * @returns The resulting string.
 */
export function joinTokens(tokens: Token[]) {
	let str = '';
	for (const token of tokens) {
		str += token.raw;
		str += token.trailing;
	}

	return str;
}
