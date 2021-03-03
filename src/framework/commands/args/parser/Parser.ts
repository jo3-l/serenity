import type { Token } from '../Token';
import type { ParserOutput } from './ParserOutput';

/**
 * Separates a list of tokens into flags, option flags, and positional
 * arguments.
 */
export interface Parser {
	/**
	 * Separates a list of tokens into flags, option flags, and positional
	 * arguments.
	 *
	 * @param tokens - Tokens to parse.
	 * @returns The parser output.
	 */
	parse(tokens: Token[]): ParserOutput;
}
