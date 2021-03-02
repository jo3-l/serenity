import type { Token } from '../Lexer';
import type { ParserOutput } from './ParserOutput';

/**
 * Separates a list of tokens into flags, option flags, and unordered arguments.
 */
export interface Parser {
	/**
	 * Separates a list of tokens into flags, option flags, and unordered
	 * arguments.
	 *
	 * @param tokens - Tokens to parse.
	 * @returns The parser output.
	 */
	parse(tokens: Token[]): ParserOutput;
}
